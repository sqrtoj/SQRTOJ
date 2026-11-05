from django.conf import settings

MARTOR_ENABLE_CONFIGS = getattr(
    settings,
    'MARTOR_ENABLE_CONFIGS',
    {
        'imgur': 'true',
        'mention': 'false',
        'living': 'false',
        'hljs': 'true',
    },
)

MARTOR_IMGUR_CLIENT_ID = getattr(settings, 'MARTOR_IMGUR_CLIENT_ID', '')
MARTOR_IMGUR_API_KEY = getattr(settings, 'MARTOR_IMGUR_API_KEY', '')

MARTOR_MARKDOWNIFY_URL = getattr(settings, 'MARTOR_MARKDOWNIFY_URL', '/martor/markdownify/')
MARTOR_UPLOAD_URL = getattr(settings, 'MARTOR_UPLOAD_URL', '/martor/uploader/')
MARTOR_SEARCH_USERS_URL = getattr(settings, 'MARTOR_SEARCH_USERS_URL', '/martor/search-user/')

MARTOR_MARKDOWN_BASE_MENTION_URL = getattr(
    settings,
    'MARTOR_MARKDOWN_BASE_MENTION_URL',
    'https://python.web.id/author/',
)
