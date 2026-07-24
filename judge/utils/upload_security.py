import logging
import os
import socket
import stat
import struct
import time
from pathlib import PurePosixPath
from zipfile import BadZipFile, ZIP_BZIP2, ZIP_DEFLATED, ZIP_LZMA, ZIP_STORED, ZipFile

from django.conf import settings
from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError
from django.utils.translation import gettext_lazy as _
from pypdf import PdfReader
from pypdf.errors import PyPdfError

logger = logging.getLogger('judge.security.upload')

_IMAGE_FORMATS = {
    '.gif': ('GIF', (b'GIF87a', b'GIF89a')),
    '.jpg': ('JPEG', (b'\xff\xd8\xff', )),
    '.jpeg': ('JPEG', (b'\xff\xd8\xff', )),
    '.png': ('PNG', (b'\x89PNG\r\n\x1a\n', )),
}
_CLAMAV_CHUNK_SIZE = 64 * 1024
_ZIP_EOCD_SIGNATURE = b'PK\x05\x06'
_ZIP64_EOCD_SIGNATURE = b'PK\x06\x06'
_ZIP64_LOCATOR_SIGNATURE = b'PK\x06\x07'
_ZIP_EOCD_SIZE = 22
_ZIP_MAX_COMMENT_SIZE = 65535


class MalwareFound(ValidationError):
    pass


class MalwareScannerUnavailable(Exception):
    pass


def _setting(name, default):
    return getattr(settings, name, default)


def _rewind(upload):
    upload.seek(0)


def _validate_size(upload, maximum_size):
    size = getattr(upload, 'size', None)
    if size is None:
        current_position = upload.tell()
        upload.seek(0, os.SEEK_END)
        size = upload.tell()
        upload.seek(current_position)
    if size > maximum_size:
        raise ValidationError(_('The uploaded file is too large.'))


def _set_socket_deadline(scanner_socket, deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise socket.timeout('ClamAV scan deadline exceeded')
    scanner_socket.settimeout(remaining)


def _clamav_scan(upload):
    socket_path = _setting('VNOJ_CLAMAV_SOCKET', '/run/clamav/clamd.ctl')
    timeout = _setting('VNOJ_CLAMAV_TIMEOUT', 10)
    deadline = time.monotonic() + timeout

    try:
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as scanner_socket:
            _set_socket_deadline(scanner_socket, deadline)
            scanner_socket.connect(socket_path)
            scanner_socket.sendall(b'zINSTREAM\0')
            while True:
                chunk = upload.read(_CLAMAV_CHUNK_SIZE)
                if not chunk:
                    break
                _set_socket_deadline(scanner_socket, deadline)
                scanner_socket.sendall(struct.pack('!I', len(chunk)) + chunk)
            _set_socket_deadline(scanner_socket, deadline)
            scanner_socket.sendall(struct.pack('!I', 0))

            response = bytearray()
            while not response.endswith(b'\0'):
                _set_socket_deadline(scanner_socket, deadline)
                chunk = scanner_socket.recv(4096)
                if not chunk:
                    break
                response.extend(chunk)
    except (OSError, socket.timeout) as error:
        raise MalwareScannerUnavailable(str(error))
    finally:
        _rewind(upload)

    result = bytes(response).rstrip(b'\0').decode('utf-8', 'replace')
    if result.endswith(' OK'):
        return
    if result.endswith(' FOUND'):
        signature = result.rsplit(': ', 1)[-1].rsplit(' FOUND', 1)[0]
        raise MalwareFound(_('The uploaded file was rejected by the malware scanner: %(signature)s.'),
                           params={'signature': signature})
    raise MalwareScannerUnavailable(result or 'empty response')


def scan_upload(upload, surface='upload', user_id=None):
    _rewind(upload)
    mode = _setting('VNOJ_UPLOAD_SCAN_MODE', 'disabled')
    if mode == 'disabled':
        return
    if mode not in {'permissive', 'required'}:
        raise ValueError('VNOJ_UPLOAD_SCAN_MODE must be disabled, permissive, or required')

    try:
        _clamav_scan(upload)
    except MalwareFound as error:
        logger.warning('Malware detected in upload surface=%s user_id=%s name=%r size=%s signature=%r',
                       surface, user_id, os.path.basename(upload.name), getattr(upload, 'size', None),
                       error.params.get('signature') if error.params else None)
        raise
    except MalwareScannerUnavailable as error:
        if mode == 'required':
            raise ValidationError(_('The malware scanner is temporarily unavailable.'))
        error_message = str(error)
        logger.warning('ClamAV scan unavailable; accepting upload surface=%s user_id=%s name=%r size=%s error=%r',
                       surface, user_id, os.path.basename(upload.name), getattr(upload, 'size', None), error_message)
    finally:
        _rewind(upload)


def validate_image_upload(upload, user_id=None):
    _rewind(upload)
    maximum_size = _setting('MARTOR_UPLOAD_MAX_FILE_SIZE', 10 * 1024 * 1024)
    maximum_pixels = _setting('MARTOR_UPLOAD_MAX_PIXELS', 25_000_000)
    extension = os.path.splitext(upload.name)[1].lower()
    expected = _IMAGE_FORMATS.get(extension)
    if expected is None or extension not in settings.MARTOR_UPLOAD_SAFE_EXTS:
        raise ValidationError(_('Unsupported image format.'))

    _validate_size(upload, maximum_size)
    _rewind(upload)
    header = upload.read(max(len(signature) for signature in expected[1]))
    if not any(header.startswith(signature) for signature in expected[1]):
        _rewind(upload)
        raise ValidationError(_('The file content does not match its image extension.'))

    _rewind(upload)
    try:
        with Image.open(upload) as image:
            if image.format != expected[0]:
                raise ValidationError(_('The file content does not match its image extension.'))
            image.verify()

        _rewind(upload)
        with Image.open(upload) as image:
            decoded_pixels = 0
            for frame in range(getattr(image, 'n_frames', 1)):
                image.seek(frame)
                decoded_pixels += image.width * image.height
                if decoded_pixels > maximum_pixels:
                    raise ValidationError(_('The image dimensions are too large.'))
                image.load()
    except (Image.DecompressionBombError, EOFError, UnidentifiedImageError, OSError, SyntaxError):
        raise ValidationError(_('The uploaded image is invalid.'))
    finally:
        _rewind(upload)

    scan_upload(upload, surface='martor-image', user_id=user_id)


def validate_pdf_upload(upload, user_id=None):
    _rewind(upload)
    extension = os.path.splitext(upload.name)[1].lower()
    if extension != '.pdf':
        raise ValidationError(_('Unsupported document format.'))

    _validate_size(upload, settings.PDF_STATEMENT_MAX_FILE_SIZE)
    _rewind(upload)
    try:
        reader = PdfReader(upload, strict=True)
        if not reader.pages:
            raise ValidationError(_('The uploaded PDF is invalid.'))
        for page in reader.pages:
            contents = page.get_contents()
            if contents is not None:
                contents.get_data()
    except (OSError, PyPdfError, TypeError, ValueError):
        raise ValidationError(_('The uploaded PDF is invalid.'))
    finally:
        _rewind(upload)

    scan_upload(upload, surface='problem-pdf', user_id=user_id)


def _read_zip64_entry_count(upload, eocd_offset):
    locator_offset = eocd_offset - 20
    if locator_offset < 0:
        raise BadZipFile('missing ZIP64 locator')
    upload.seek(locator_offset)
    locator = upload.read(20)
    if len(locator) != 20 or locator[:4] != _ZIP64_LOCATOR_SIGNATURE:
        raise BadZipFile('missing ZIP64 locator')
    _, disk_number, zip64_offset, total_disks = struct.unpack('<4sLQL', locator)
    if disk_number != 0 or total_disks != 1:
        raise BadZipFile('multi-disk ZIP files are not supported')

    upload.seek(zip64_offset)
    record = upload.read(56)
    if len(record) != 56 or record[:4] != _ZIP64_EOCD_SIGNATURE:
        raise BadZipFile('missing ZIP64 end record')
    values = struct.unpack('<4sQ2H2L4Q', record)
    _, record_size, _, _, record_disk, central_disk, entries_on_disk, entries, central_size, central_offset = values
    if record_size < 44 or record_disk != 0 or central_disk != 0 or entries_on_disk != entries:
        raise BadZipFile('invalid ZIP64 end record')
    if central_offset + central_size > zip64_offset:
        raise BadZipFile('invalid ZIP64 central directory')
    return entries, central_size


def _read_zip_metadata(upload):
    upload.seek(0, os.SEEK_END)
    file_size = upload.tell()
    search_size = min(file_size, _ZIP_EOCD_SIZE + _ZIP_MAX_COMMENT_SIZE)
    upload.seek(file_size - search_size)
    tail = upload.read(search_size)
    search_end = len(tail)
    while True:
        eocd_index = tail.rfind(_ZIP_EOCD_SIGNATURE, 0, search_end)
        if eocd_index < 0:
            raise BadZipFile('missing end record')
        if len(tail) - eocd_index >= _ZIP_EOCD_SIZE:
            values = struct.unpack('<4s4H2LH', tail[eocd_index:eocd_index + _ZIP_EOCD_SIZE])
            comment_size = values[-1]
            if eocd_index + _ZIP_EOCD_SIZE + comment_size == len(tail):
                break
        search_end = eocd_index

    eocd_offset = file_size - search_size + eocd_index
    _, disk_number, central_disk, entries_on_disk, entries, central_size, central_offset, _ = values
    if disk_number != 0 or central_disk != 0 or entries_on_disk != entries:
        raise BadZipFile('multi-disk ZIP files are not supported')
    if entries == 0xffff or central_size == 0xffffffff or central_offset == 0xffffffff:
        return _read_zip64_entry_count(upload, eocd_offset)
    if central_offset + central_size > eocd_offset:
        raise BadZipFile('invalid ZIP central directory')
    return entries, central_size


def _validate_zip_member(member, normalized_names):
    if member.flag_bits & 0x1:
        raise ValidationError(_('Encrypted ZIP files are not supported.'))
    raw_name = member.orig_filename
    if not raw_name or '\x00' in raw_name or '\\' in raw_name or raw_name.startswith('/'):
        raise ValidationError(_('The ZIP file contains an unsafe path.'))

    path_text = raw_name[:-1] if raw_name.endswith('/') else raw_name
    raw_parts = path_text.split('/')
    has_drive_prefix = bool(raw_parts and len(raw_parts[0]) >= 2 and raw_parts[0][1] == ':')
    if not path_text or has_drive_prefix or any(part in {'', '.', '..'} for part in raw_parts):
        raise ValidationError(_('The ZIP file contains an unsafe path.'))

    path = PurePosixPath(path_text)
    normalized_name = str(path)
    if normalized_name in normalized_names:
        raise ValidationError(_('The ZIP file contains duplicate paths.'))
    normalized_names.add(normalized_name)

    if member.compress_type not in {ZIP_STORED, ZIP_DEFLATED, ZIP_BZIP2, ZIP_LZMA}:
        raise ValidationError(_('The ZIP file uses an unsupported compression method.'))

    mode = member.external_attr >> 16
    file_type = stat.S_IFMT(mode)
    if file_type and not (stat.S_ISREG(mode) or stat.S_ISDIR(mode)):
        raise ValidationError(_('The ZIP file contains an unsupported file type.'))
    if file_type and member.is_dir() != stat.S_ISDIR(mode):
        raise ValidationError(_('The ZIP file contains an inconsistent file type.'))
    if member.is_dir() and member.file_size:
        raise ValidationError(_('The ZIP file contains an invalid directory entry.'))


def _verify_zip_members(archive, members):
    for member in members:
        if member.is_dir():
            continue
        with archive.open(member) as member_file:
            while member_file.read(_CLAMAV_CHUNK_SIZE):
                pass


def get_zip_names(upload):
    _rewind(upload)
    try:
        with ZipFile(upload) as archive:
            return archive.namelist()
    except (BadZipFile, EOFError, OSError, OverflowError, RuntimeError, ValueError):
        return []
    finally:
        _rewind(upload)


def validate_zip_upload(upload, scan=True, user_id=None):
    _rewind(upload)
    if os.path.splitext(upload.name)[1].lower() != '.zip':
        raise ValidationError(_('Unsupported archive format.'))
    maximum_file_size = _setting('VNOJ_PROBLEM_ARCHIVE_MAX_FILE_SIZE', 2 * 1024 * 1024 * 1024)
    maximum_metadata_size = _setting('VNOJ_PROBLEM_ARCHIVE_MAX_METADATA_SIZE', 64 * 1024 * 1024)
    maximum_entries = _setting('VNOJ_PROBLEM_ARCHIVE_MAX_ENTRIES', 20_000)
    maximum_member_size = _setting('VNOJ_PROBLEM_ARCHIVE_MAX_MEMBER_SIZE', 512 * 1024 * 1024)
    maximum_expanded_size = _setting('VNOJ_PROBLEM_ARCHIVE_MAX_EXPANDED_SIZE', 8 * 1024 * 1024 * 1024)
    maximum_compression_ratio = _setting('VNOJ_PROBLEM_ARCHIVE_MAX_COMPRESSION_RATIO', 1000)

    _validate_size(upload, maximum_file_size)
    _rewind(upload)
    try:
        entry_count, metadata_size = _read_zip_metadata(upload)
        if entry_count > maximum_entries:
            raise ValidationError(_('The ZIP file contains too many entries.'))
        if metadata_size > maximum_metadata_size:
            raise ValidationError(_('The ZIP file contains too much metadata.'))

        _rewind(upload)
        with ZipFile(upload) as archive:
            members = archive.infolist()
            if len(members) != entry_count:
                raise ValidationError(_('The ZIP file contains inconsistent metadata.'))

            expanded_size = 0
            normalized_names = set()
            for member in members:
                _validate_zip_member(member, normalized_names)
                if member.file_size > maximum_member_size:
                    raise ValidationError(_('A file in the ZIP archive is too large.'))
                expanded_size += member.file_size
                if expanded_size > maximum_expanded_size:
                    raise ValidationError(_('The expanded ZIP archive is too large.'))
                if member.file_size and member.compress_size == 0:
                    raise ValidationError(_('The ZIP file has an unsafe compression ratio.'))
                if member.compress_size and member.file_size / member.compress_size > maximum_compression_ratio:
                    raise ValidationError(_('The ZIP file has an unsafe compression ratio.'))
            _verify_zip_members(archive, members)
            names = [member.filename for member in members]
    except ValidationError:
        raise
    except (BadZipFile, EOFError, OSError, OverflowError, RuntimeError, struct.error, ValueError):
        raise ValidationError(_('The uploaded ZIP file is invalid.'))
    finally:
        _rewind(upload)

    if scan:
        scan_upload(upload, surface='problem-archive', user_id=user_id)
    return names
