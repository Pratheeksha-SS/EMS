from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "TEST COMMAND: Test holiday email notifications (can be deleted after testing)"

    def add_arguments(self, parser):
        parser.add_argument("--holiday-id", type=int, help="Test with specific holiday ID")
        parser.add_argument("--list", action="store_true", help="List all holidays")
        parser.add_argument("--quick", action="store_true", help="Quick test with first holiday")

    def handle(self, *args, **options):
        """
        This is just for TESTING. You can delete this file after confirming emails work.
        """
        from hrms.models import Employee, Holiday
        from hrms.utils.email_sender import send_personalized_holiday_emails

        self.stdout.write(self.style.WARNING("\nTEST MODE - Holiday Email Test"))
        self.stdout.write(self.style.WARNING("=" * 50))

        if options["list"]:
            holidays = Holiday.objects.all().order_by("date")[:10]
            self.stdout.write("\nFirst 10 holidays in database:")
            for holiday in holidays:
                self.stdout.write(f"  ID: {holiday.id} | {holiday.name} | {holiday.date}")
            return

        if options["quick"]:
            holiday = Holiday.objects.first()
            if not holiday:
                self.stdout.write(self.style.ERROR("No holidays found in database"))
                return

            self.stdout.write(f"\nTesting with: {holiday.name} (ID: {holiday.id})")
            self.stdout.write("-" * 50)

            emp_count = Employee.objects.count()
            self.stdout.write(f"Employees in database: {emp_count}")

            self.stdout.write("Sending test emails...")
            count = send_personalized_holiday_emails(holiday)

            self.stdout.write(self.style.SUCCESS(f"\nTest complete! Sent {count} emails"))
            return

        if options["holiday_id"]:
            try:
                holiday = Holiday.objects.get(id=options["holiday_id"])
                self.stdout.write(f"\nTesting with: {holiday.name} (ID: {holiday.id})")
                self.stdout.write("-" * 50)

                count = send_personalized_holiday_emails(holiday)
                self.stdout.write(self.style.SUCCESS(f"\nSent {count} test emails"))
            except Holiday.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Holiday with ID {options['holiday_id']} not found")
                )
            return

        self.stdout.write(self.style.WARNING("\nUSAGE:"))
        self.stdout.write("  python manage.py test_holiday_email --quick")
        self.stdout.write("  python manage.py test_holiday_email --list")
        self.stdout.write("  python manage.py test_holiday_email --holiday-id 64")
        self.stdout.write("\nThis is a TEST COMMAND only. Safe to delete after testing.")
