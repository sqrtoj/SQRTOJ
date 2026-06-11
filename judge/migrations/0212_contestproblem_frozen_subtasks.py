from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0211_auto_20260322_1925'),
    ]

    operations = [
        migrations.AddField(
            model_name='contestproblem',
            name='frozen_subtasks',
            field=models.CharField(blank=True, help_text='Only for format new IOI. Separated by commas, e.g: 2, 3', max_length=20, null=True, verbose_name='frozen subtasks'),
        ),
    ]
