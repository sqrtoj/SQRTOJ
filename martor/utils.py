from django.core.serializers.json import DjangoJSONEncoder
from django.utils.encoding import force_str
from django.utils.functional import Promise


class LazyEncoder(DjangoJSONEncoder):
    """Encodes django lazy translation strings (Promise)."""

    def default(self, obj):
        if isinstance(obj, Promise):
            return force_str(obj)
        return super().default(obj)
