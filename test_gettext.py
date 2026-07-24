import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sqrtojsite.settings')
django.setup()
from django.utils.translation import gettext as _
import datetime
td = datetime.timedelta(days=5, hours=21, minutes=47, seconds=46)
print(_('Contest ends in %(countdown)s.') % {'countdown': td})
