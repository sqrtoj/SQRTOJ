from django.db import migrations, models


def add_field_if_missing(apps, schema_editor):
    ContestProblem = apps.get_model('judge', 'ContestProblem')
    table_name = ContestProblem._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        description = schema_editor.connection.introspection.get_table_description(cursor, table_name)
    columns = [column.name for column in description]
    if 'frozen_subtasks' not in columns:
        field = models.CharField(blank=True, help_text='Only for format new IOI. Separated by commas, e.g: 2, 3', max_length=20, null=True, verbose_name='frozen subtasks')
        schema_editor.add_field(ContestProblem, field)


def remove_field_if_present(apps, schema_editor):
    ContestProblem = apps.get_model('judge', 'ContestProblem')
    table_name = ContestProblem._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        description = schema_editor.connection.introspection.get_table_description(cursor, table_name)
    columns = [column.name for column in description]
    if 'frozen_subtasks' in columns:
        field = ContestProblem._meta.get_field('frozen_subtasks')
        schema_editor.remove_field(ContestProblem, field)


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0211_auto_20260322_1925'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_field_if_missing, remove_field_if_present),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='contestproblem',
                    name='frozen_subtasks',
                    field=models.CharField(blank=True, help_text='Only for format new IOI. Separated by commas, e.g: 2, 3', max_length=20, null=True, verbose_name='frozen subtasks'),
                ),
            ],
        )
    ]
