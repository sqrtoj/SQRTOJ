import io
import stat
import struct
import warnings
from unittest.mock import patch
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile, ZipInfo

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from pypdf import PdfWriter

from judge.utils.upload_security import MalwareFound, MalwareScannerUnavailable, scan_upload, validate_image_upload, \
    validate_pdf_upload, validate_zip_upload


def make_image_upload(name='image.png', image_format='PNG', size=(2, 2)):
    output = io.BytesIO()
    Image.new('RGB', size, color='white').save(output, format=image_format)
    return SimpleUploadedFile(name, output.getvalue())


def make_pdf_upload(name='statement.pdf'):
    output = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(output)
    return SimpleUploadedFile(name, output.getvalue())


def make_zip_upload(members, compression=ZIP_DEFLATED):
    output = io.BytesIO()
    with ZipFile(output, 'w', compression=compression) as archive:
        for member in members:
            if len(member) == 2:
                name, content = member
                archive.writestr(name, content)
            else:
                name, content, external_attr = member
                info = ZipInfo(name)
                info.create_system = 3
                info.external_attr = external_attr
                archive.writestr(info, content)
    return SimpleUploadedFile('data.zip', output.getvalue())


def mutate_zip_headers(upload, local_offset, central_offset, value, value_format):
    data = bytearray(upload.read())
    local_header = data.index(b'PK\x03\x04')
    central_header = data.index(b'PK\x01\x02')
    struct.pack_into(value_format, data, local_header + local_offset, value)
    struct.pack_into(value_format, data, central_header + central_offset, value)
    return SimpleUploadedFile(upload.name, bytes(data))


@override_settings(
    MARTOR_UPLOAD_SAFE_EXTS={'.jpg', '.jpeg', '.png', '.gif'},
    MARTOR_UPLOAD_MAX_FILE_SIZE=1024 * 1024,
    MARTOR_UPLOAD_MAX_PIXELS=100,
    PDF_STATEMENT_MAX_FILE_SIZE=1024 * 1024,
    VNOJ_UPLOAD_SCAN_MODE='disabled',
)
class UploadValidationTest(SimpleTestCase):
    def assert_rejected_and_rewound(self, validator, upload):
        upload.seek(min(1, upload.size))
        with self.assertRaises(ValidationError):
            validator(upload)
        self.assertEqual(upload.tell(), 0)

    def test_valid_images_are_accepted_and_rewound(self):
        fixtures = (
            make_image_upload('image.jpg', 'JPEG'),
            make_image_upload('image.jpeg', 'JPEG'),
            make_image_upload('image.png', 'PNG'),
            make_image_upload('image.gif', 'GIF'),
        )
        for upload in fixtures:
            with self.subTest(name=upload.name):
                upload.seek(1)
                validate_image_upload(upload)
                self.assertEqual(upload.tell(), 0)

    def test_image_extension_must_match_content(self):
        self.assert_rejected_and_rewound(validate_image_upload, make_image_upload(name='image.jpg'))

    def test_html_named_png_is_rejected(self):
        self.assert_rejected_and_rewound(
            validate_image_upload,
            SimpleUploadedFile('image.png', b'<html>not an image</html>'),
        )

    def test_svg_and_unknown_image_extensions_are_rejected(self):
        for upload in (
                SimpleUploadedFile('image.svg', b'<svg xmlns="http://www.w3.org/2000/svg"/>'),
                SimpleUploadedFile('image.webp', b'RIFF'),
        ):
            with self.subTest(name=upload.name):
                self.assert_rejected_and_rewound(validate_image_upload, upload)

    @override_settings(MARTOR_UPLOAD_MAX_FILE_SIZE=10)
    def test_image_byte_limit_is_enforced(self):
        self.assert_rejected_and_rewound(validate_image_upload, make_image_upload())

    @override_settings(MARTOR_UPLOAD_MAX_PIXELS=3)
    def test_image_pixel_limit_is_enforced(self):
        self.assert_rejected_and_rewound(validate_image_upload, make_image_upload(size=(2, 2)))

    def test_truncated_images_are_rejected(self):
        for name, image_format in (('image.jpg', 'JPEG'), ('image.png', 'PNG'), ('image.gif', 'GIF')):
            upload = make_image_upload(name, image_format, size=(32, 32))
            data = upload.read()
            with self.subTest(name=name):
                self.assert_rejected_and_rewound(
                    validate_image_upload,
                    SimpleUploadedFile(upload.name, data[:max(20, len(data) // 2)]),
                )

    def test_valid_pdf_is_accepted_and_rewound(self):
        upload = make_pdf_upload('statement.PDF')
        upload.seek(1)
        validate_pdf_upload(upload)
        self.assertEqual(upload.tell(), 0)

    def test_pdf_extension_is_enforced(self):
        self.assert_rejected_and_rewound(validate_pdf_upload, make_pdf_upload('statement.txt'))

    def test_spoofed_and_truncated_pdfs_are_rejected(self):
        for upload in (
                SimpleUploadedFile('statement.pdf', b'<html>not a PDF</html>'),
                SimpleUploadedFile('statement.pdf', b'%PDF-1.7\nmissing trailer'),
                SimpleUploadedFile('statement.pdf', b'%PDF-1.7\n%%EOF'),
        ):
            with self.subTest(content=upload.read()):
                self.assert_rejected_and_rewound(validate_pdf_upload, upload)

    @override_settings(PDF_STATEMENT_MAX_FILE_SIZE=10)
    def test_pdf_byte_limit_is_enforced(self):
        self.assert_rejected_and_rewound(validate_pdf_upload, make_pdf_upload())

    def test_valid_zip_is_accepted_and_rewound(self):
        upload = make_zip_upload([('input/1.in', b'1\n'), ('output/1.out', b'1\n')])
        upload.seek(1)
        names = validate_zip_upload(upload)
        self.assertEqual(names, ['input/1.in', 'output/1.out'])
        self.assertEqual(upload.tell(), 0)

    def test_zip_extension_is_enforced(self):
        upload = make_zip_upload([('1.in', b'1')])
        upload.name = 'data.bin'
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    def test_malformed_zip_is_rejected(self):
        self.assert_rejected_and_rewound(
            validate_zip_upload,
            SimpleUploadedFile('data.zip', b'not a zip'),
        )

    def test_zip_unsafe_paths_are_rejected(self):
        names = ('../secret', '..\\secret', '/absolute', 'C:relative', 'a/./b', 'a//b')
        for name in names:
            with self.subTest(name=name):
                self.assert_rejected_and_rewound(validate_zip_upload, make_zip_upload([(name, b'data')]))

    def test_zip_nul_path_is_rejected(self):
        upload = make_zip_upload([('abc', b'data')], compression=ZIP_STORED)
        data = bytearray(upload.read())
        local_name = data.index(b'abc', data.index(b'PK\x03\x04'))
        central_name = data.index(b'abc', data.index(b'PK\x01\x02'))
        data[local_name + 1] = 0
        data[central_name + 1] = 0
        self.assert_rejected_and_rewound(
            validate_zip_upload,
            SimpleUploadedFile('data.zip', bytes(data)),
        )

    def test_zip_duplicate_paths_are_rejected(self):
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            upload = make_zip_upload([('same', b'1'), ('same', b'2')])
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    def test_zip_encryption_flag_is_rejected(self):
        upload = mutate_zip_headers(make_zip_upload([('file', b'data')]), 6, 8, 1, '<H')
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    def test_zip_symlink_and_special_file_are_rejected(self):
        for file_type in (stat.S_IFLNK, stat.S_IFIFO):
            with self.subTest(file_type=file_type):
                upload = make_zip_upload([('special', b'target', (file_type | 0o777) << 16)])
                self.assert_rejected_and_rewound(validate_zip_upload, upload)

    def test_zip_unsupported_compression_is_rejected(self):
        upload = mutate_zip_headers(make_zip_upload([('file', b'data')]), 8, 10, 99, '<H')
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    def test_zip_corrupt_member_is_rejected(self):
        upload = make_zip_upload([('file', b'unique-payload')], compression=ZIP_STORED)
        data = upload.read().replace(b'unique-payload', b'broken-payload')
        self.assert_rejected_and_rewound(
            validate_zip_upload,
            SimpleUploadedFile('data.zip', data),
        )

    @override_settings(VNOJ_PROBLEM_ARCHIVE_MAX_FILE_SIZE=10)
    def test_zip_byte_limit_is_enforced(self):
        self.assert_rejected_and_rewound(validate_zip_upload, make_zip_upload([('file', b'data')]))

    @override_settings(VNOJ_PROBLEM_ARCHIVE_MAX_METADATA_SIZE=1)
    def test_zip_metadata_limit_is_enforced(self):
        self.assert_rejected_and_rewound(validate_zip_upload, make_zip_upload([('file', b'data')]))

    @override_settings(VNOJ_PROBLEM_ARCHIVE_MAX_ENTRIES=1)
    def test_zip_entry_limit_is_enforced(self):
        upload = make_zip_upload([('1.in', b'1'), ('1.out', b'1')])
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    @override_settings(VNOJ_PROBLEM_ARCHIVE_MAX_MEMBER_SIZE=3)
    def test_zip_member_limit_is_enforced(self):
        self.assert_rejected_and_rewound(validate_zip_upload, make_zip_upload([('file', b'data')]))

    @override_settings(VNOJ_PROBLEM_ARCHIVE_MAX_EXPANDED_SIZE=5)
    def test_zip_expanded_size_limit_is_enforced(self):
        upload = make_zip_upload([('one', b'123'), ('two', b'456')])
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    @override_settings(VNOJ_PROBLEM_ARCHIVE_MAX_COMPRESSION_RATIO=2)
    def test_zip_compression_ratio_is_enforced(self):
        upload = make_zip_upload([('zeros', b'0' * 4096)])
        self.assert_rejected_and_rewound(validate_zip_upload, upload)

    @patch('judge.utils.upload_security._clamav_scan')
    def test_disabled_scanner_does_not_connect(self, scanner):
        upload = SimpleUploadedFile('file.txt', b'data')
        upload.seek(1)
        scan_upload(upload)
        scanner.assert_not_called()
        self.assertEqual(upload.tell(), 0)

    @override_settings(VNOJ_UPLOAD_SCAN_MODE='permissive')
    @patch('judge.utils.upload_security._clamav_scan', side_effect=MalwareScannerUnavailable('offline'))
    def test_permissive_scanner_mode_accepts_outage(self, scanner):
        upload = SimpleUploadedFile('file.txt', b'data')
        with self.assertLogs('judge.security.upload', level='WARNING') as logs:
            scan_upload(upload, surface='test', user_id=42)
        scanner.assert_called_once_with(upload)
        self.assertIn('surface=test user_id=42', logs.output[0])
        self.assertEqual(upload.tell(), 0)

    @override_settings(VNOJ_UPLOAD_SCAN_MODE='required')
    @patch('judge.utils.upload_security._clamav_scan', side_effect=MalwareScannerUnavailable('offline'))
    def test_required_scanner_mode_rejects_outage(self, scanner):
        upload = SimpleUploadedFile('file.txt', b'data')
        with self.assertRaises(ValidationError):
            scan_upload(upload)
        scanner.assert_called_once_with(upload)
        self.assertEqual(upload.tell(), 0)

    @override_settings(VNOJ_UPLOAD_SCAN_MODE='permissive')
    @patch('judge.utils.upload_security._clamav_scan')
    def test_malware_is_always_rejected_and_logged(self, scanner):
        scanner.side_effect = MalwareFound('infected', params={'signature': 'Eicar-Signature'})
        upload = SimpleUploadedFile('file.txt', b'data')
        with self.assertLogs('judge.security.upload', level='WARNING') as logs:
            with self.assertRaises(MalwareFound):
                scan_upload(upload, surface='test', user_id=42)
        self.assertIn('surface=test user_id=42', logs.output[0])
        self.assertIn('Eicar-Signature', logs.output[0])
        self.assertEqual(upload.tell(), 0)

    @override_settings(VNOJ_UPLOAD_SCAN_MODE='invalid')
    def test_invalid_scanner_mode_is_rejected(self):
        with self.assertRaises(ValueError):
            scan_upload(SimpleUploadedFile('file.txt', b'data'))
