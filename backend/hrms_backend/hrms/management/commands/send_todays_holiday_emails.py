# hrms/management/commands/send_todays_holiday_emails.py
from django.core.management.base import BaseCommand
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from hrms.models import Holiday, Employee


class Command(BaseCommand):
    help = 'Send holiday emails to employees for holidays happening today'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        self.stdout.write(f"\n{'='*50}")
        self.stdout.write(f"📅 Checking for holidays on {today}")
        self.stdout.write(f"{'='*50}\n")
        
        # Find holidays happening today
        holidays_today = Holiday.objects.filter(date=today, is_active=True)
        
        if not holidays_today.exists():
            self.stdout.write(f"✅ No holidays found for today ({today})")
            self.stdout.write(f"📧 No emails to send.\n")
            return
        
        # Emoji mapping for different holidays
        emoji_map = {
            'Republic Day': '🇮🇳',
            'Independence Day': '🇮🇳',
            'Gandhi Jayanti': '🕊️',
            'Diwali': '🪔',
            'Holi': '🎨',
            'Christmas': '🎄',
            'Eid': '🌙',
            'New Year': '🎉',
            'Good Friday': '✝️',
            'Maha Shivaratri': '🔱',
            'Janmashtami': '🕉️',
        }
        
        total_sent = 0
        
        for holiday in holidays_today:
            self.stdout.write(f"\n📧 Sending emails for: {holiday.name}")
            self.stdout.write(f"{'-'*40}")
            
            # Get all employees with email
            employees = Employee.objects.filter(email__isnull=False).exclude(email='')
            
            if employees.count() == 0:
                self.stdout.write(f"⚠️ No employees found with email addresses")
                continue
            
            # Get emoji for holiday
            emoji = '🎉'
            for key, value in emoji_map.items():
                if key.lower() in holiday.name.lower():
                    emoji = value
                    break
            
            success_count = 0
            failed_count = 0
            
            for employee in employees:
                try:
                    full_name = employee.get_full_name()
                    
                    # Render HTML email
                    html_content = render_to_string('email/holiday_wish.html', {
                        'employee_name': full_name,
                        'holiday_name': holiday.name,
                        'emoji': emoji,
                    })
                    
                    # Plain text version
                    text_content = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     E L O G I X A
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear {full_name},

Happy {holiday.name}! {emoji}

May this day fill your heart with pride and joy.
Take this time to rest, recharge, and celebrate.

Wishing you a wonderful day ahead!

Best regards,
HRMS Team
ELOGIXA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                    
                    # Send email
                    msg = EmailMultiAlternatives(
                        subject=f"🌟 Happy {holiday.name}! | ELOGIXA",
                        body=text_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[employee.email],
                    )
                    msg.attach_alternative(html_content, "text/html")
                    msg.send(fail_silently=False)
                    
                    success_count += 1
                    self.stdout.write(f"  ✅ Sent to {employee.email}")
                    
                except Exception as e:
                    failed_count += 1
                    self.stdout.write(f"  ❌ Failed to send to {employee.email}: {e}")
            
            total_sent += success_count
            self.stdout.write(f"\n📊 {holiday.name}: Sent {success_count}/{employees.count()} emails")
            if failed_count > 0:
                self.stdout.write(f"   ❌ Failed: {failed_count}")
        
        self.stdout.write(f"\n{'='*50}")
        self.stdout.write(f"🎉 TOTAL: {total_sent} emails sent successfully!")
        self.stdout.write(f"{'='*50}\n")