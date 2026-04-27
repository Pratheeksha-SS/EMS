# hrms/utils/email_sender.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from ..models import Employee, HolidayNotification
import logging

logger = logging.getLogger(__name__)

def get_holiday_emoji(holiday_name):
    """Return appropriate emoji for holiday name"""
    emoji_map = {
        'Republic Day': '🇮🇳',
        'Independence Day': '🇮🇳',
        'Gandhi Jayanti': '🕊️',
        'Diwali': '🪔',
        'Holi': '🎨',
        'Christmas': '🎄',
        'Eid': '🌙',
        'Mahavir Jayanti': '🔱',
        'Good Friday': '✝️',
        'Buddha Purnima': '☸️',
        'Janmashtami': '🕉️',
        'Dussehra': '🏹',
        'Guru Nanak Jayanti': '🕊️',
        'Maha Shivaratri': '🔱',
        'New Year': '🎉',
    }
    
    for key, value in emoji_map.items():
        if key.lower() in holiday_name.lower():
            return value
    return '🎉'


def send_professional_holiday_wishes(holiday, test_email=None):
    """
    Send professional holiday wishes to all employees or a test email
    
    Args:
        holiday: Holiday object
        test_email: Optional single email for testing
    
    Returns:
        Number of emails sent successfully
    """
    try:
        # Determine recipients
        if test_email:
            # For testing - send to single email
            from ..models import User
            from datetime import date
            
            print(f"🔍 DEBUG: Looking for employee with email: {test_email}")
            
            # Try to find existing user with this email
            try:
                user = User.objects.get(email=test_email)
                print(f"✅ DEBUG: Found existing user: {user.username}")
                
                # Check if employee exists for this user
                try:
                    employee = Employee.objects.get(user=user)
                    print(f"✅ DEBUG: Found existing employee for user")
                    employees = [employee]
                except Employee.DoesNotExist:
                    print(f"⚠️ DEBUG: User exists but no employee profile")
                    employee = Employee.objects.create(
                        user=user,
                        first_name=user.first_name or "Test",
                        last_name=user.last_name or "User",
                        department="Testing",
                        designation="Tester",
                        phone="1234567890",
                        address="Test Address",
                        joining_date=date.today()
                    )
                    print(f"✅ DEBUG: Created employee for existing user")
                    employees = [employee]
                    
            except User.DoesNotExist:
                print(f"⚠️ DEBUG: No user found, creating new test user")
                # FIXED: Use datetime.now() instead of date.today().timestamp()
                import time
                user = User.objects.create_user(
                    username=f"test_user_{int(time.time())}",
                    email=test_email,
                    password="test123",
                    role="EMPLOYEE",
                    first_name="Test",
                    last_name="User"
                )
                print(f"✅ DEBUG: Created test user: {user.username}")
                
                employee = Employee.objects.create(
                    user=user,
                    first_name="Test",
                    last_name="User",
                    department="Testing",
                    designation="Tester",
                    phone="1234567890",
                    address="Test Address",
                    joining_date=date.today()
                )
                print(f"✅ DEBUG: Created employee for test user")
                employees = [employee]
            
            print(f"📋 DEBUG: Employees list length: {len(employees)}")
            
        else:
            # Get all active employees with email
            employees = Employee.objects.select_related('user').filter(
                user__isnull=False,
                user__email__isnull=False
            ).exclude(user__email='')
            print(f"📋 DEBUG: Found {employees.count()} employees in database")
        
        if not employees:
            logger.warning(f"No employees found for holiday {holiday.name}")
            return 0
        
        # Get emoji for the holiday
        emoji = get_holiday_emoji(holiday.name)
        
        success_count = 0
        failed_employees = []
        
        # Send personalized email to each employee
        for employee in employees:
            try:
                employee_name = f"{employee.first_name} {employee.last_name}".strip()
                if not employee_name:
                    employee_name = employee.user.username
                
                print(f"📧 DEBUG: Attempting to send to: {employee.user.email}")
                print(f"   Name: {employee_name}")
                
                context = {
                    'employee_name': employee_name,
                    'employee_id': employee.id,
                    'department': employee.department,
                    'holiday_name': holiday.name,
                    'emoji': emoji,
                }
                
                # Render HTML email
                html_content = render_to_string('emails/holiday_wish.html', context)
                text_content = strip_tags(html_content)
                
                subject = f"🌟 Happy {holiday.name}! | ELOGIXA"
                
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[employee.user.email],
                )
                email.attach_alternative(html_content, "text/html")
                
                email.send(fail_silently=False)
                success_count += 1
                print(f"✅ DEBUG: Email sent successfully!")
                logger.info(f"✅ Holiday wish sent to {employee_name} <{employee.user.email}>")
                
            except Exception as e:
                print(f"❌ DEBUG: Error sending: {str(e)}")
                logger.error(f"❌ Failed to send to {employee_name}: {str(e)}")
                failed_employees.append(employee_name)
                continue
        
        # Track in database (only for production sends, not tests)
        if not test_email:
            HolidayNotification.objects.create(
                holiday=holiday,
                recipient_count=success_count,
                sent_by=None
            )
        
        print(f"📊 DEBUG: Final count - Success: {success_count}, Failed: {len(failed_employees)}")
        
        logger.info(f"📊 Holiday wishes for {holiday.name}: {success_count}/{len(employees)} sent")
        if failed_employees:
            logger.warning(f"Failed for: {', '.join(failed_employees)}")
        
        return success_count
        
    except Exception as e:
        print(f"❌ DEBUG: Critical error: {str(e)}")
        logger.error(f"❌ Critical error in email sending: {str(e)}")
        return 0# hrms/utils/email_sender.py - FIXED VERSION

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from ..models import Employee, HolidayNotification
import logging

logger = logging.getLogger(__name__)

def get_holiday_emoji(holiday_name):
    """Return appropriate emoji for holiday name"""
    emoji_map = {
        'Republic Day': '🇮🇳',
        'Independence Day': '🇮🇳',
        'Gandhi Jayanti': '🕊️',
        'Diwali': '🪔',
        'Holi': '🎨',
        'Christmas': '🎄',
        'Eid': '🌙',
        'Mahavir Jayanti': '🔱',
        'Good Friday': '✝️',
        'Buddha Purnima': '☸️',
        'Janmashtami': '🕉️',
        'Dussehra': '🏹',
        'Guru Nanak Jayanti': '🕊️',
        'Maha Shivaratri': '🔱',
        'New Year': '🎉',
    }
    
    for key, value in emoji_map.items():
        if key.lower() in holiday_name.lower():
            return value
    return '🎉'


def send_professional_holiday_wishes(holiday, test_email=None):
    """
    Send professional holiday wishes to all employees or a test email
    
    Args:
        holiday: Holiday object
        test_email: Optional single email for testing
    
    Returns:
        Number of emails sent successfully
    """
    try:
        # Determine recipients
        if test_email:
            # For testing - send to single email
            from ..models import User
            from datetime import date
            import time
            
            print(f"🔍 DEBUG: Looking for employee with email: {test_email}")
            
            # Try to find existing user with this email
            try:
                user = User.objects.get(email=test_email)
                print(f"✅ DEBUG: Found existing user: {user.username}")
                
                try:
                    employee = Employee.objects.get(user=user)
                    print(f"✅ DEBUG: Found existing employee for user")
                    employees = [employee]
                except Employee.DoesNotExist:
                    print(f"⚠️ DEBUG: User exists but no employee profile")
                    employee = Employee.objects.create(
                        user=user,
                        first_name=user.first_name or "Test",
                        last_name=user.last_name or "User",
                        department="Testing",
                        designation="Tester",
                        phone="1234567890",
                        address="Test Address",
                        joining_date=date.today()
                    )
                    print(f"✅ DEBUG: Created employee for existing user")
                    employees = [employee]
                    
            except User.DoesNotExist:
                print(f"⚠️ DEBUG: No user found, creating new test user")
                user = User.objects.create_user(
                    username=f"test_user_{int(time.time())}",
                    email=test_email,
                    password="test123",
                    role="EMPLOYEE",
                    first_name="Test",
                    last_name="User"
                )
                print(f"✅ DEBUG: Created test user: {user.username}")
                
                employee = Employee.objects.create(
                    user=user,
                    first_name="Test",
                    last_name="User",
                    department="Testing",
                    designation="Tester",
                    phone="1234567890",
                    address="Test Address",
                    joining_date=date.today()
                )
                print(f"✅ DEBUG: Created employee for test user")
                employees = [employee]
            
            print(f"📋 DEBUG: Employees list length: {len(employees)}")
            
        else:
            # Get all active employees with email
            employees = Employee.objects.select_related('user').filter(
                user__isnull=False,
                user__email__isnull=False
            ).exclude(user__email='')
            print(f"📋 DEBUG: Found {employees.count()} employees in database")
        
        if not employees:
            logger.warning(f"No employees found for holiday {holiday.name}")
            return 0
        
        # Get emoji for the holiday
        emoji = get_holiday_emoji(holiday.name)
        
        success_count = 0
        failed_employees = []
        
        # Send personalized email to each employee
        for employee in employees:
            try:
                employee_name = f"{employee.first_name} {employee.last_name}".strip()
                if not employee_name:
                    employee_name = employee.user.username
                
                print(f"📧 DEBUG: Attempting to send to: {employee.user.email}")
                print(f"   Name: {employee_name}")
                
                context = {
                    'employee_name': employee_name,
                    'employee_id': employee.id,
                    'department': employee.department,
                    'holiday_name': holiday.name,
                    'emoji': emoji,
                }
                
                # Render HTML email
                html_content = render_to_string('emails/holiday_wish.html', context)
                text_content = strip_tags(html_content)
                
                subject = f"🌟 Happy {holiday.name}! | ELOGIXA"
                
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[employee.user.email],
                )
                email.attach_alternative(html_content, "text/html")
                
                email.send(fail_silently=False)
                success_count += 1
                print(f"✅ DEBUG: Email sent successfully!")
                logger.info(f"✅ Holiday wish sent to {employee_name} <{employee.user.email}>")
                
            except Exception as e:
                print(f"❌ DEBUG: Error sending: {str(e)}")
                logger.error(f"❌ Failed to send to {employee_name}: {str(e)}")
                failed_employees.append(employee_name)
                continue
        
        # ===== FIXED: Track in database with error handling =====
        if not test_email and success_count > 0:
            try:
                # Try to create notification record
                HolidayNotification.objects.create(
                    holiday=holiday,
                    recipient_count=success_count,
                    sent_by=None
                )
                print(f"📊 DEBUG: Tracking recorded: {success_count} notifications")
            except Exception as e:
                # If notification fails, just log it - emails were already sent
                print(f"⚠️ DEBUG: Tracking failed (but emails sent): {e}")
        # ===== END OF FIX =====
        
        print(f"📊 DEBUG: Final count - Success: {success_count}, Failed: {len(failed_employees)}")
        
        logger.info(f"📊 Holiday wishes for {holiday.name}: {success_count}/{len(employees)} sent")
        if failed_employees:
            logger.warning(f"Failed for: {', '.join(failed_employees)}")
        
        # Return the actual number of emails sent
        return success_count
        
    except Exception as e:
        print(f"❌ DEBUG: Critical error: {str(e)}")
        logger.error(f"❌ Critical error in email sending: {str(e)}")
        # Even if there's an error, return the success_count if we have it
        try:
            return success_count
        except:
            return 0