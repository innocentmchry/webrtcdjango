# Generated by Django 4.2.6 on 2023-10-27 03:48

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("base", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Admin",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("email", models.EmailField(max_length=254, unique=True)),
            ],
        ),
        migrations.AlterField(
            model_name="roommember",
            name="uid",
            field=models.CharField(max_length=1000),
        ),
    ]
