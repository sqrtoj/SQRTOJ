import base64
import json
import logging

import requests

from .settings import MARTOR_IMGUR_API_KEY, MARTOR_IMGUR_CLIENT_ID

logger = logging.getLogger(__name__)


def imgur_uploader(image) -> str:
    """Upload an image file to Imgur and return the result as a JSON string."""
    upload_url = 'https://api.imgur.com/3/upload.json'
    headers = {'Authorization': f'Client-ID {MARTOR_IMGUR_CLIENT_ID}'}

    try:
        response = requests.post(
            upload_url,
            headers=headers,
            data={
                'key': MARTOR_IMGUR_API_KEY,
                'image': base64.b64encode(image.read()),
                'type': 'base64',
                'name': image.name,
            },
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
                'name': data.get('name', image.name),
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

    error_detail = response.content.decode('utf-8', errors='replace')
    logger.warning('Imgur upload failed with HTTP %d: %s', response.status_code, error_detail)
    return json.dumps({
        'status': response.status_code,
        'error': error_detail,
    })
