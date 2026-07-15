# Adds the VOI contest format to Contest.format_name choices.
# Choices are generated dynamically from the contest_format registry, so this
# only updates the field's choices metadata (no schema/data change).

from django.db import migrations, models

import judge.contest_format


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0214_profile_site_palette'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contest',
            name='format_name',
            field=models.CharField(choices=judge.contest_format.choices(), default='default',
                                   help_text='The contest format module to use.', max_length=32,
                                   verbose_name='contest format'),
        ),
    ]
