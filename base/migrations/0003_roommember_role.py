# Generated by Django 4.2.6 on 2023-10-27 04:06

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0002_admin_alter_roommember_uid"),
    ]

    operations = [
        migrations.AddField(
            model_name="roommember",
            name="role",
            field=models.CharField(default=0, max_length=200),
            preserve_default=False,
        ),
    ]
