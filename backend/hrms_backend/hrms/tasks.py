# hrms/tasks.py
from celery import shared_task
from celery.utils.log import get_task_logger
from datetime import date
from datetime import timedelta  # Separate import line
from django.contrib.auth.models import User

logger = get_task_logger(__name__)

# ... rest of your code ...


@shared_task
def generate_holidays_task(year, admin_id):
    """
    Background task to generate holidays for a specific year
    This runs without freezing your website!
    """
    try:
        from .utils.holiday_generator import IndianHolidayGenerator

        logger.info(f"Starting holiday generation for {year}")

        # Get admin user
        admin = User.objects.get(id=admin_id)

        # Generate holidays
        generator = IndianHolidayGenerator()
        count = generator.generate_holidays_for_year(year, admin)

        logger.info(f"✅ Successfully generated {count} holidays for {year}")

        return {
            "success": True,
            "year": year,
            "count": count,
            "message": f"Generated {count} holidays for {year}",
        }

    except Exception as e:
        logger.error(f"❌ Error generating holidays for {year}: {str(e)}")
        return {"success": False, "year": year, "error": str(e)}


@shared_task
def generate_next_year_holidays():
    """
    Automatically generates holidays for next year
    This runs on Dec 30 every year (configured in settings.py)
    """
    today = date.today()
    next_year = today.year + 1

    logger.info(f"🔄 Auto-generating holidays for {next_year}")

    try:
        from .models import User

        admin = User.objects.filter(role="ADMIN").first()

        if not admin:
            logger.error("No admin user found")
            return {"success": False, "error": "No admin user"}

        # Call the main task
        result = generate_holidays_task.delay(next_year, admin.id)

        logger.info(f"✅ Auto-generation started for {next_year}")
        return {"success": True, "year": next_year, "task_id": result.id}

    except Exception as e:
        logger.error(f"❌ Error in auto-generation: {str(e)}")
        return {"success": False, "error": str(e)}


@shared_task
def check_task_status(task_id):
    """
    Check the status of a background task
    Useful for showing progress to users
    """
    from celery.result import AsyncResult

    task = AsyncResult(task_id)

    if task.state == "PENDING":
        return {"state": "PENDING", "message": "Task is waiting..."}
    elif task.state == "SUCCESS":
        return {"state": "SUCCESS", "result": task.result}
    elif task.state == "FAILURE":
        return {"state": "FAILURE", "error": str(task.info)}
    else:
        return {"state": task.state, "info": str(task.info)}


# ===== HOLIDAY EMAIL FUNCTIONS =====


@shared_task
def send_holiday_email_task(holiday_id):
    """
    Background task to send holiday emails to all employees
    """
    try:
        from .models import Holiday
        from .utils.email_sender import send_personalized_holiday_emails

        holiday = Holiday.objects.get(id=holiday_id)
        logger.info(f"📧 Starting email task for holiday: {holiday.name}")

        count = send_personalized_holiday_emails(holiday)

        logger.info(
            f"✅ Completed email task for {holiday.name}: "
            f"{count} emails sent"
        )
        return {"success": True, "holiday": holiday.name, "emails_sent": count}

    except Exception as e:
        logger.error(f"❌ Email task failed: {str(e)}")
        return {"success": False, "error": str(e)}


@shared_task
def check_tomorrow_holidays():
    """
    Daily task to check if tomorrow is a holiday
    Runs every day at 9 AM
    """
    tomorrow = date.today() + timedelta(days=1)  # Now timedelta works!

    logger.info(f"🔍 Checking for holidays on {tomorrow}")

    try:
        from .models import Holiday

        # Find holidays tomorrow
        holidays = Holiday.objects.filter(date=tomorrow, is_active=True)

        if not holidays.exists():
            logger.info("No holidays tomorrow")
            return "No holidays tomorrow"

        results = []
        for holiday in holidays:
            # Trigger email task
            task = send_holiday_email_task.delay(holiday.id)
            results.append({"holiday": holiday.name, "task_id": task.id})
            logger.info(f"📧 Started email task for {holiday.name}")

        return {
            "message": f"Started email tasks for {len(holidays)} holidays",
            "results": results,
        }

    except Exception as e:
        logger.error(f"❌ Error checking holidays: {str(e)}")
        return {"success": False, "error": str(e)}
