from django.utils.timezone import now
import time
import functools


from judge.models import Profile


@functools.lru_cache(maxsize=2048)
def _log_user_access(user_pk, time_block, ip):
    updates = {'last_access': now()}
    if ip:
        updates['ip'] = ip
    Profile.objects.filter(user_id=user_pk).update(**updates)


class LogUserAccessMiddleware(object):
    # Throttle user access logging to avoid a DB UPDATE on every request.
    # Only updates once every THROTTLE_SECONDS per user.
    THROTTLE_SECONDS = 300  # 5 minutes

    def __init__(self, get_response=None):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (hasattr(request, 'user') and request.user.is_authenticated and
                not getattr(request, 'no_profile_update', False)):
            time_block = int(time.time()) // self.THROTTLE_SECONDS
            ip = request.META.get('REMOTE_ADDR')
            _log_user_access(request.user.pk, time_block, ip)

        return response
