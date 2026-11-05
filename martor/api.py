import base64
import json
import logging

import requests

from .settings import MARTOR_IMGUR_API_KEY, MARTOR_IMGUR_CLIENT_ID

logger = logging.getLogger(__name__)


def imgur_uploader(image) -> str:
    """Upload an image file to Imgur and return the result as a JSON string."""
    if not MARTOR_IMGUR_CLIENT_ID:
        logger.warning('Imgur upload attempted but MARTOR_IMGUR_CLIENT_ID is not configured')
        return json.dumps({
            'status': 400,
            'error': 'Imgur client ID is not configured.',
        })

    upload_url = 'https://api.imgur.com/3/upload.json'
    headers = {'Authorization': f'Client-ID {MARTOR_IMGUR_CLIENT_ID}'}

    try:
        if hasattr(image, 'seek') and callable(image.seek):
            image.seek(0)
        image_content = image.read()
        image_name = getattr(image, 'name', '') or ''
        post_data = {
            'image': base64.b64encode(image_content).decode('ascii'),
            'type': 'base64',
            'name': image_name,
        }
        if MARTOR_IMGUR_API_KEY:
            post_data['key'] = MARTOR_IMGUR_API_KEY

        response = requests.post(
            upload_url,
            headers=headers,
            data=post_data,
            timeout=30,
        )
    except requests.RequestException as exc:
        logger.exception('Imgur image upload request failed')
        return json.dumps({
            'status': 500,
            'error': f'Failed to connect to Imgur: {exc}',
        })

    if response.status_code == 200:
        try:
            payload = response.json()
            data = payload.get('data', {})
            return json.dumps({
                'status': payload.get('status', 200),
                'link': data.get('link', ''),
                'name': data.get('name', image_name),
            })
        except ValueError:
            logger.exception('Failed to parse Imgur response JSON')
            return json.dumps({
                'status': 500,
                'error': 'Invalid JSON response from Imgur.',
            })

    if response.status_code == 415:
        return json.dumps({
            'status': response.status_code,
            'error': response.reason or 'Unsupported file type.',
        })

    error_detail = ''
    try:
        error_payload = response.json()
        error_data = error_payload.get('data')
        if isinstance(error_data, dict):
            error_detail = error_data.get('error')
        elif isinstance(error_data, str):
            error_detail = error_data
        if not error_detail:
            error_detail = error_payload.get('error')
    except (ValueError, TypeError):
        pass

    if not error_detail:
        raw_content = response.content.decode('utf-8', errors='replace').strip()
        error_detail = raw_content or response.reason or 'Upload failed'

    logger.warning('Imgur upload failed with HTTP %d: %s', response.status_code, error_detail)
    return json.dumps({
        'status': response.status_code,
        'error': error_detail,
    })
