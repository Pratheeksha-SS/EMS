"""
Django settings for hrms_backend project.
"""

from pathlib import Path
from datetime import timedelta
import logging
import os

try:
    from celery.schedules import crontab
    CELERY_AVAILABLE = True
except ModuleNotFoundError:
    crontab = None
    CELERY_AVAILABLE = False

# import dj_database_url

# ================= BASE ================= #

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = (
    'django-insecure-022rh0tk@yhwi@^ogz_lw7^txoa0hc7bk_g='
    '1-%bikv^ep8ls0'
)

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# ================= MEDIA FILES ================= #

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

os.makedirs(MEDIA_ROOT, exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'employee_images'), exist_ok=True)

# ================= INSTALLED APPS ================= #

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'hrms',
    'rest_framework',
    'django_filters',
    'corsheaders',
]

# ================= MIDDLEWARE ================= #

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = 'hrms_backend.urls'

# ================= TEMPLATES ================= #

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hrms_backend.wsgi.application'

# ================= DATABASE (PostgreSQL - NeonDB) ================= #

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'neondb',
        'USER': 'neondb_owner',
        'PASSWORD': 'npg_4dwmTxZW8MyJ',
        'HOST': (
            'ep-wandering-truth-aiq1gffm-pooler.c-4.us-east-1.aws.neon.tech'
        ),
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# ================= PASSWORD VALIDATION ================= #

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'UserAttributeSimilarityValidator'
        )
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'MinimumLengthValidator'
        )
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'CommonPasswordValidator'
        )
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'NumericPasswordValidator'
        )
    },
]

# ================= LOCALIZATION ================= #

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ================= STATIC FILES ================= #

STATIC_URL = 'static/'

# ================= MISC ================= #

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'hrms.User'

# ================= REST FRAMEWORK ================= #

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ================= CACHING ================= #

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ================= JWT CONFIGURATION ================= #

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),

    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'USER_AUTHENTICATION_RULE': (
        'rest_framework_simplejwt.authentication.'
        'default_user_authentication_rule'
    ),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',

    # Tells JWT to use the custom serializer
    'TOKEN_OBTAIN_SERIALIZER': 'hrms.serializers.MyTokenObtainPairSerializer',
}

# ================= CELERY CONFIGURATION ================= #

CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

CELERY_BEAT_SCHEDULE = {}

if CELERY_AVAILABLE:
    CELERY_BEAT_SCHEDULE = {
        'generate-next-year-holidays': {
            'task': 'hrms.tasks.generate_next_year_holidays',
            'schedule': crontab(
                minute=5,
                hour=0,
                day_of_month=30,
                month_of_year=12
            ),
        },
        'check-holidays-daily': {
            'task': 'hrms.tasks.check_tomorrow_holidays',
            'schedule': crontab(hour=9, minute=0),
        },
    }

# ================= EMAIL CONFIGURATION ================= #

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'hrmsadmin001@gmail.com'
EMAIL_HOST_PASSWORD = 'memuvntmagqnmwwb'
DEFAULT_FROM_EMAIL = 'HRMS Admin <hrmsadmin001@gmail.com>'

# ================= PASSWORD RESET ================= #

PASSWORD_RESET_TIMEOUT = 86400  # 24 hours

# ================= LOGGING ================= #

logging.getLogger('django.mail').setLevel(logging.DEBUG)
