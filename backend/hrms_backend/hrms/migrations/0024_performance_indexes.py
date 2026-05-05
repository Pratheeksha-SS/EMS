from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hrms', '0023_alter_announcement_is_pinned_alter_employee_email_and_more'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role', 'managed_department'], name='hrms_user_role_dept_idx'),
        ),
        migrations.AddIndex(
            model_name='employee',
            index=models.Index(fields=['department'], name='hrms_emp_dept_idx'),
        ),
        migrations.AddIndex(
            model_name='employee',
            index=models.Index(fields=['department', 'designation'], name='hrms_emp_dept_desig_idx'),
        ),
        migrations.AddIndex(
            model_name='leave',
            index=models.Index(fields=['employee', 'status'], name='hrms_leave_emp_status_idx'),
        ),
        migrations.AddIndex(
            model_name='leave',
            index=models.Index(fields=['status', 'applied_at'], name='hrms_leave_status_applied_idx'),
        ),
    ]
