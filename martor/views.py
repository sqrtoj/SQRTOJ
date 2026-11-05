import json

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpRequest, HttpResponse
from django.utils.translation import gettext_lazy as _

from .utils import LazyEncoder


def _json_response(payload: dict) -> HttpResponse:
    return HttpResponse(
        json.dumps(payload, cls=LazyEncoder),
        content_type='application/json',
    )


@login_required
def markdown_search_user(request: HttpRequest) -> HttpResponse:
    """Return active usernames matching query for @mention."""
    query = (request.GET.get('username') or '').strip()

    if not query or ' ' in query:
        return _json_response({
            'status': 204,
            'error': _('Validation Failed for field `username`'),
        })

    matching_usernames = list(
        User.objects
        .filter(username__icontains=query, is_active=True)
        .values_list('username', flat=True)[:20],
    )

    if not matching_usernames:
        return _json_response({
            'status': 204,
            'error': _('No users registered as `%(username)s` or user is inactive.') % {'username': query},
        })

    return _json_response({
        'status': 200,
        'data': [{'username': username} for username in matching_usernames],
    })
