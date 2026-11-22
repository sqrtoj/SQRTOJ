from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0217_profile_quick_submit_enabled'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['contest_object', '-id'], name='judge_submi_contest_id_idx'),
        ),
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['contest_object', 'result'], name='judge_submi_contest_res_idx'),
        ),
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['user', '-id'], name='judge_submi_user_id_idx'),
        ),
        migrations.AddIndex(
            model_name='submission',
            index=models.Index(fields=['problem', '-id'], name='judge_submi_problem_id_idx'),
        ),
    ]
