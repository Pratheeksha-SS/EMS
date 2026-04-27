from django.core.management.base import BaseCommand
from hrms.models import User, Employee
from django.utils import timezone
from datetime import date

class Command(BaseCommand):
    help = 'Creates the employee1 user'

    def handle(self, *args, **options):
        # Check if employee1 already exists
        if User.objects.filter(username='employee1').exists():
            self.stdout.write(self.style.WARNING('User employee1 already exists'))
            return

        # Create the user
        user = User.objects.create_user(
            username='employee1',
            password='test123',
            email='employee1@example.com',
            role='EMPLOYEE'
        )
        
        # Create Employee profile
        Employee.objects.create(
            user=user,
            full_name='Employee One',
            department='IT',
            designation='Software Engineer',
            phone='1234567890',
            address='Some Address',
            joining_date=date.today()
        )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created user: employee1 with password: test123'))

