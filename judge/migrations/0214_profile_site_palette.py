# Generated for the Warm Harvest UI overhaul.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0213_auto_20260604_2127'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='site_palette',
            field=models.CharField(choices=[('warm', 'Warm Harvest (autumn)'), ('summer', 'Summer (classic)')],
                                   default='warm', max_length=10, verbose_name='site palette'),
        ),
    ]
