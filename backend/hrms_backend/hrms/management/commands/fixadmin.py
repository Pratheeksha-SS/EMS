from django.core.management.base import BaseCommand
from hrms.models import User


class Command(BaseCommand):
    help = 'Fix admin user settings and reset the default admin password'

    def handle(self, *args, **options):
        try:
            admin_user = User.objects.get(username='admin')
            expected_password = 'hrms@123'
            changes = []

            self.stdout.write(
                f'Admin user found: {admin_user.username}, current role: {admin_user.role}'
            )

            if admin_user.role != 'ADMIN':
                admin_user.role = 'ADMIN'
                changes.append('role=ADMIN')

            if not admin_user.is_active:
                admin_user.is_active = True
                changes.append('is_active=True')

            if not admin_user.is_staff:
                admin_user.is_staff = True
                changes.append('is_staff=True')

            if not admin_user.is_superuser:
                admin_user.is_superuser = True
                changes.append('is_superuser=True')

            if not admin_user.check_password(expected_password):
                admin_user.set_password(expected_password)
                changes.append('password reset to hrms@123')

            if changes:
                admin_user.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Fixed admin user: {", ".join(changes)}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        'Admin user already has the expected role, permissions, and password.'
                    )
                )
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Admin user not found!'))
