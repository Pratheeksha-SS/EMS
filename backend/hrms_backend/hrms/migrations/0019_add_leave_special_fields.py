from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('hrms', '0018_leavetype_announcement_attachment_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='leave',
            name='child_number',
            field=models.IntegerField(blank=True, help_text='1st, 2nd, 3rd child', null=True),
        ),
        migrations.AddField(
            model_name='leave',
            name='is_adoption',
            field=models.BooleanField(default=False, help_text='For adoption cases'),
        ),
        migrations.AddField(
            model_name='leave',
            name='is_surrogacy',
            field=models.BooleanField(default=False, help_text='For surrogacy cases'),
        ),
        migrations.AddField(
            model_name='leave',
            name='marriage_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='leave',
            name='marriage_certificate',
            field=models.FileField(blank=True, null=True, upload_to='marriage_proofs/'),
        ),
        migrations.AddField(
            model_name='leave',
            name='is_first_marriage',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='leave',
            name='child_birth_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='leave',
            name='supporting_document',
            field=models.FileField(blank=True, null=True, upload_to='leave_documents/'),
        ),
        migrations.AlterField(
            model_name='leave',
            name='leave_type',
            field=models.CharField(choices=[('SICK', 'Sick Leave'), ('CASUAL', 'Casual Leave'), ('PAID', 'Paid Leave'), ('MATERNITY', 'Maternity Leave'), ('PATERNITY', 'Paternity Leave'), ('MARRIAGE', 'Marriage Leave')], max_length=20),
        ),
    ]