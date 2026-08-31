from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0216_alter_profile_site_theme'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='quick_submit_enabled',
            field=models.BooleanField(
                default=True,
                help_text='Check to enable quick submit widget during contests.',
                verbose_name='quick submit enabled',
            ),
        ),
    ]
