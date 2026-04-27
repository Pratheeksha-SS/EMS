import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

print("=" * 50)
print("EMAIL CONFIGURATION:")
print("=" * 50)
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print("=" * 50)

try:
    print("\n📧 Sending test email...")
    sent = send_mail(
        'Test Email from ELOGIXA HRMS',
        'This is a test email to verify SMTP configuration is working correctly.',
        settings.DEFAULT_FROM_EMAIL,
        ['pratheeksha538@gmail.com'],
        fail_silently=False,
    )
    print(f"✅ SUCCESS! Email sent! Count: {sent}")
except Exception as e:
    print(f"❌ ERROR: {e}")
    print(f"Error type: {type(e).__name__}")