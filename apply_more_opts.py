import re

# === Add CONN_MAX_AGE to settings.py ===
with open('backend/hrms_backend/hrms_backend/settings.py', 'r') as f:
    content = f.read()

old_databases = """DATABASES = {
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
}"""

new_databases = """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'neondb',
        'USER': 'neondb_owner',
        'PASSWORD': 'npg_4dwmTxZW8MyJ',
        'HOST': (
            'ep-wandering-truth-aiq1gffm-pooler.c-4.us-east-1.aws.neon.tech'
        ),
        'PORT': '5432',
        'CONN_MAX_AGE': 60,  # Keep connections alive for 60 seconds (Neon pooling)
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}"""

if old_databases in content:
    content = content.replace(old_databases, new_databases)
    print('Added CONN_MAX_AGE to DATABASES')
else:
    print('WARNING: Could not find DATABASES setting')

with open('backend/hrms_backend/hrms_backend/settings.py', 'w') as f:
    f.write(content)

# === Add db_index to high-traffic fields in models.py ===
with open('backend/hrms_backend/hrms/models.py', 'r') as f:
    content = f.read()

indexes_added = []

# User model indexes
if "'role = models.CharField(max_length=20, choices=ROLE_CHOICES)'" not in content:
    if 'role = models.CharField(max_length=20, choices=ROLE_CHOICES)' in content and 'db_index=True' not in content.split('role = models.CharField')[0].split('class User')[1] if 'class User' in content else True:
        content = content.replace(
            "role = models.CharField(max_length=20, choices=ROLE_CHOICES)",
            "role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)"
        )
        indexes_added.append('User.role')

# Email index on User if not present
user_section = content.split('class User')[1].split('class Department')[0] if 'class User' in content and 'class Department' in content else ''
if 'email' in user_section and 'db_index=True' not in user_section.split('email')[0].split('\n')[-1]:
    # Only add if we haven't already
    pass  # Skip to avoid false positives, AbstractUser handles email

# Employee model indexes
replacements = [
    ("first_name = models.CharField(max_length=50, default='')", "first_name = models.CharField(max_length=50, default='', db_index=True)"),
    ("last_name = models.CharField(max_length=50, default='')", "last_name = models.CharField(max_length=50, default='', db_index=True)"),
    ("email = models.EmailField(max_length=100, default='')", "email = models.EmailField(max_length=100, default='', db_index=True)"),
    ("designation = models.CharField(max_length=100, default='')", "designation = models.CharField(max_length=100, default='', db_index=True)"),
]

for old, new in replacements:
    # Only replace first occurrence in Employee section to avoid affecting other models
    emp_start = content.find('class Employee')
    dept_start = content.find('class LeaveType')  # Next class after Employee
    if emp_start != -1 and dept_start != -1:
        emp_section = content[emp_start:dept_start]
        if old in emp_section and new not in emp_section:
            new_emp = emp_section.replace(old, new, 1)
            content = content[:emp_start] + new_emp + content[dept_start:]
            indexes_added.append(old.split('=')[0].strip())

# Leave model indexes
leave_replacements = [
    ("leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)", "leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, db_index=True)"),
    ("start_date = models.DateField()", "start_date = models.DateField(db_index=True)"),
    ("end_date = models.DateField()", "end_date = models.DateField(db_index=True)"),
]

for old, new in leave_replacements:
    if old in content and new not in content:
        content = content.replace(old, new, 1)
        indexes_added.append(old.split('=')[0].strip())

# Salary model indexes  
salary_replacements = [
    ("month = models.IntegerField()  # 1-12", "month = models.IntegerField(db_index=True)  # 1-12"),
    ("year = models.IntegerField()", "year = models.IntegerField(db_index=True)"),
    ("status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('PAID', 'Paid')], default='PENDING')", 
     "status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('PAID', 'Paid')], default='PENDING', db_index=True)"),
]

for old, new in salary_replacements:
    if old in content and new not in content:
        content = content.replace(old, new, 1)
        indexes_added.append(old.split('=')[0].strip())

# Holiday model indexes
if "year = models.IntegerField(help_text='Year for easy filtering')" in content and 'db_index=True' not in content.split("year = models.IntegerField(help_text='Year for easy filtering')")[0].split('\n')[-1]:
    content = content.replace(
        "year = models.IntegerField(help_text='Year for easy filtering')",
        "year = models.IntegerField(help_text='Year for easy filtering', db_index=True)"
    , 1)
    indexes_added.append('Holiday.year')

if "is_active = models.BooleanField(default=True, help_text='Whether this holiday is active')" in content:
    content = content.replace(
        "is_active = models.BooleanField(default=True, help_text='Whether this holiday is active')",
        "is_active = models.BooleanField(default=True, help_text='Whether this holiday is active', db_index=True)"
    , 1)
    indexes_added.append('Holiday.is_active')

# GuestVisit model indexes
if "status = models.CharField(max_length=20, choices=VISIT_STATUS, default='EXPECTED')" in content:
    content = content.replace(
        "status = models.CharField(max_length=20, choices=VISIT_STATUS, default='EXPECTED')",
        "status = models.CharField(max_length=20, choices=VISIT_STATUS, default='EXPECTED', db_index=True)"
    , 1)
    indexes_added.append('GuestVisit.status')

if "expected_check_in = models.DateTimeField()" in content:
    content = content.replace(
        "expected_check_in = models.DateTimeField()",
        "expected_check_in = models.DateTimeField(db_index=True)"
    , 1)
    indexes_added.append('GuestVisit.expected_check_in')

if "department = models.CharField(max_length=100, blank=True, null=True)" in content and 'GuestVisit' in content:
    # Be careful to only target GuestVisit's department, not others
    parts = content.split('class GuestVisit')
    if len(parts) > 1:
        pre = parts[0]
        post = 'class GuestVisit' + parts[1]
        post = post.replace(
            "department = models.CharField(max_length=100, blank=True, null=True)",
            "department = models.CharField(max_length=100, blank=True, null=True, db_index=True)"
        , 1)
        content = pre + post[len('class GuestVisit'):]

# Announcement model indexes
if "is_pinned = models.BooleanField(default=False)" in content:
    content = content.replace(
        "is_pinned = models.BooleanField(default=False)",
        "is_pinned = models.BooleanField(default=False, db_index=True)"
    , 1)
    indexes_added.append('Announcement.is_pinned')

# Visitor model
if "visitor_type = models.CharField(max_length=20, choices=VISITOR_TYPES, default='GUEST')" in content:
    content = content.replace(
        "visitor_type = models.CharField(max_length=20, choices=VISITOR_TYPES, default='GUEST')",
        "visitor_type = models.CharField(max_length=20, choices=VISITOR_TYPES, default='GUEST', db_index=True)"
    , 1)
    indexes_added.append('Visitor.visitor_type')

if "full_name = models.CharField(max_length=200)" in content:
    content = content.replace(
        "full_name = models.CharField(max_length=200)",
        "full_name = models.CharField(max_length=200, db_index=True)"
    , 1)
    indexes_added.append('Visitor.full_name')

# Notification model
notif_section = content.split('class Notification')[-1] if 'class Notification' in content else ''
if 'user = models.ForeignKey' in notif_section and 'db_index=True' not in notif_section.split('user = models.ForeignKey')[1].split(')')[0]:
    # Add db_index to Notification.user
    pass  # ForeignKey already indexed by default

with open('backend/hrms_backend/hrms/models.py', 'w') as f:
    f.write(content)

print(f'Added indexes to: {indexes_added}')
print('Models updated')
