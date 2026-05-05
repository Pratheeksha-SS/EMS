# Quick Reference: HR System API Endpoints

## Authentication
```
POST   /api/token/                  - Login (username/email + password)
POST   /api/admin-login/            - Legacy admin login
POST   /api/employee-login/         - Legacy employee login
GET    /api/current-user/           - Get logged-in user info
POST   /api/forgot-password/        - Request password reset
POST   /api/reset-password/         - Confirm password reset
```

## Employee Management
```
GET    /api/employees/              - List employees
POST   /api/employees/              - Create employee
GET    /api/employees/me/           - Current employee profile
PUT    /api/employees/me/update/    - Update profile
POST   /api/employees/me/set-password/ - Set password
GET    /api/employees/<id>/         - Get employee detail
PUT    /api/employees/<id>/         - Update employee
DELETE /api/employees/<id>/         - Delete employee
POST   /api/employees/create/       - Create with auto password
```

## Leave Management
```
GET    /api/leaves/                 - List leaves
POST   /api/leaves/apply/           - Apply new leave
PUT    /api/leaves/<id>/approve-reject/ - Manager approval
DELETE /api/leaves/<id>/            - Delete leave
GET    /api/manager/leaves/         - Manager's team leaves
GET    /api/reports/leaves/         - Leave report
```

## Holiday Management
```
GET    /api/holidays/               - List holidays
GET    /api/holidays/?year=2024     - By year
GET    /api/holidays/upcoming/      - Upcoming holidays
POST   /api/holidays/               - Create holiday
PUT    /api/holidays/<id>/          - Update holiday
DELETE /api/holidays/<id>/          - Delete holiday
GET    /api/send-holiday-wishes/    - Send emails
```

## Department & Manager
```
GET    /api/departments/            - List departments
POST   /api/departments/            - Create department
GET    /api/all-managers/           - List managers
POST   /api/promote-employee/       - Make manager
POST   /api/revoke-manager/         - Demote manager
POST   /api/assign-manager/         - Assign to dept
```

## Announcements
```
GET    /api/announcements/          - List announcements
POST   /api/announcements/          - Create
GET    /api/announcements/<id>/     - Detail
PUT    /api/announcements/<id>/     - Update
DELETE /api/announcements/<id>/     - Delete
GET    /api/announcements/pinned/   - Pinned only
GET    /api/announcements/history/  - Expired only
```

## Reports
```
GET    /api/reports/leaves/         - Leave report
GET    /api/reports/attendance/     - Attendance report
GET    /api/reports/employees/      - Employee report
GET    /api/dashboard-stats/        - Dashboard stats (cached)
```

## Visitor Management
```
GET    /api/visitors/               - List visitors
POST   /api/visitors/               - Create visitor
GET    /api/visitors/<id>/          - Detail
PUT    /api/visitors/<id>/          - Update
DELETE /api/visitors/<id>/          - Delete
POST   /api/visitors/check-in/      - Check in
POST   /api/visitors/check-out/     - Check out
GET    /api/visitor-reports/        - Visitor stats
```

## Query Parameters

### Report Filters
- `scope` - "all" | "individual"
- `date_mode` - "single" | "range"
- `date` - YYYY-MM-DD
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD
- `department` - department name
- `employee_id` - employee ID
- `frequency` - "daily" | "weekly"

### Holiday Filters
- `year` - year number
- `is_active` - true/false
- `holiday_type` - "GOVT" | "FESTIVAL" | "OPTIONAL" | "COMPANY"

### Pagination
- `page` - page number (default: 1)
- `limit` - records per page (default: 10, max: 100)

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Permission denied |
| 404 | Not found |
| 500 | Server error |

---

## Leave Types & Balances

| Type | Days/Year | Paid | Recurring |
|------|-----------|------|-----------|
| Sick | 12 | Yes | Yes |
| Casual | 10 | Yes | Yes |
| Paid | 15 | Yes | Yes |
| Maternity | Special | Yes | No |
| Paternity | Special | Yes | No |
| Marriage | Special | Yes | No |

---

## User Roles

| Role | Features |
|------|----------|
| **ADMIN** | Full system access, manage all data |
| **MANAGER** | Manage team (dept), approve leaves |
| **EMPLOYEE** | Apply leave, view own data, see announcements |

---

## Leave Status Workflow

```
PENDING → APPROVED → (employee takes leave)
       ↓
     REJECTED
```

---

## Frontend Directory Structure

```
frontend/
├── src/
│   ├── components/           # Reusable components
│   │   ├── ApplyLeave.jsx
│   │   ├── Dashboard.jsx
│   │   ├── HolidayCalendar.jsx
│   │   ├── Notification.jsx
│   │   ├── announcements/
│   │   └── reports/
│   ├── pages/               # Page components
│   │   ├── AdminDashboard.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── admin/
│   │   ├── departments/
│   │   └── visitor/
│   ├── services/            # API services
│   │   ├── announcementService.js
│   │   └── holidayService.js
│   ├── utils/               # Utilities
│   │   ├── axiosConfig.js
│   │   ├── extractListData.js
│   │   └── reportUtils.js
│   └── App.jsx
└── vite.config.js
```

---

## Backend Directory Structure

```
backend/hrms_backend/
├── hrms/
│   ├── models.py            # Database models
│   ├── views.py             # API endpoints
│   ├── urls.py              # URL routing
│   ├── serializers.py       # Data serialization
│   ├── tasks.py             # Celery tasks
│   ├── views_employee.py    # Employee endpoints
│   └── utils/
├── hrms_backend/
│   ├── settings.py          # Django settings
│   ├── urls.py              # URL config
│   ├── celery.py            # Celery config
│   └── wsgi.py              # WSGI entry
└── manage.py
```

---

## Common API Response Format

### Success
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  ...
}
```

### Error
```json
{
  "error": "Description of what went wrong"
}
```

### Paginated
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/employees/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Important Notes

1. **Token Storage**: Access token stored in localStorage as `access_token`
2. **Token Header**: All requests must include `Authorization: Bearer {token}`
3. **CORS**: Enabled for all origins in development
4. **Database**: PostgreSQL (NeonDB) with SSL required
5. **Caching**: In-memory cache with 2-5 minute TTLs
6. **Background Tasks**: Celery with Redis/RabbitMQ broker
7. **Email**: SMTP configured in settings (uses Django mail)

---

## Performance Tips

1. Use `limit` parameter to paginate large result sets
2. Cache GET responses on frontend (5 min)
3. Use `/api/reports/leaves/` for filtered reports (don't fetch all then filter)
4. Check `date_mode` parameter for date range queries
5. Avoid repeated calls to `/api/employees/me/` (cache it)

---

## Debugging

### Enable Request Logging
```python
# In settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'DEBUG'},
    },
}
```

### Check Celery Tasks
```bash
celery -A hrms_backend inspect active
celery -A hrms_backend inspect scheduled
```

### Database Queries
```python
from django.db import connection
from django.db import reset_queries
reset_queries()
# ... run code ...
print(connection.queries)  # All SQL executed
```

