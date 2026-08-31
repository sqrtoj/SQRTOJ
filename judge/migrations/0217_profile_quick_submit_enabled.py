from django.db import migrations, models


def add_field_if_missing(apps, schema_editor):
    Profile = apps.get_model('judge', 'Profile')
    table_name = Profile._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        description = schema_editor.connection.introspection.get_table_description(cursor, table_name)
    columns = [column.name for column in description]
    if 'quick_submit_enabled' not in columns:
        field = models.BooleanField(
            default=True,
            help_text='Check to enable quick submit widget during contests.',
            verbose_name='quick submit enabled',
        )
        field.set_attributes_from_name('quick_submit_enabled')
        schema_editor.add_field(Profile, field)
    elif schema_editor.connection.vendor == 'mysql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(
                f'ALTER TABLE {table_name} MODIFY COLUMN quick_submit_enabled TINYINT(1) NOT NULL DEFAULT 1',
            )


def remove_field_if_present(apps, schema_editor):
    Profile = apps.get_model('judge', 'Profile')
    table_name = Profile._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        description = schema_editor.connection.introspection.get_table_description(cursor, table_name)
    columns = [column.name for column in description]
    if 'quick_submit_enabled' in columns:
        field = Profile._meta.get_field('quick_submit_enabled')
        schema_editor.remove_field(Profile, field)


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0216_alter_profile_site_theme'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_field_if_missing, remove_field_if_present),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='profile',
                    name='quick_submit_enabled',
                    field=models.BooleanField(
                        default=True,
                        help_text='Check to enable quick submit widget during contests.',
                        verbose_name='quick submit enabled',
                    ),
                ),
            ],
        ),
    ]
