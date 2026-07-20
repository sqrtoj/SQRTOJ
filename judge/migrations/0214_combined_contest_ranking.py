from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('judge', '0213_auto_20260604_2127'),
    ]

    operations = [
        migrations.CreateModel(
            name='CombinedContestRanking',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=32, unique=True, validators=[
                    django.core.validators.RegexValidator('^[a-z0-9_]+$', 'Ranking id must be ^[a-z0-9_]+$'),
                ], verbose_name='ranking id')),
                ('name', models.CharField(max_length=100, verbose_name='ranking name')),
                ('is_visible', models.BooleanField(default=False, verbose_name='publicly visible')),
            ],
            options={
                'verbose_name': 'combined contest ranking',
                'verbose_name_plural': 'combined contest rankings',
            },
        ),
        migrations.AddField(
            model_name='combinedcontestranking',
            name='contests',
            field=models.ManyToManyField(help_text='Contests included in this combined ranking.',
                                         related_name='combined_rankings', to='judge.contest',
                                         verbose_name='contests'),
        ),
    ]
