from django.contrib import admin
from .models import (
    User,
    Employee,
    Leave,
    Department,
    Notification,
    Holiday,
    HolidayNotification,
    Meeting,
    Salary,
    Announcement,
)


# ===== USER ADMIN =====
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'managed_department', 'is_active']
    list_filter = ['role', 'is_active']
    list_display = ['username', 'email', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'email']
    fieldsets = (
        ('Personal Info', {
            'fields': (
                'username', 'password', 'email',
                'first_name', 'last_name'
            )
        }),
        ('Permissions', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            )
        }),
        ('HRMS Role', {
            'fields': (
                'role', 'must_change_password',
                'has_set_password'
            )
        }),
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title']
# ===== EMPLOYEE ADMIN =====
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        'get_full_name', 'employee_id', 'department',
        'designation', 'phone', 'joining_date'
    ]
    list_filter = [
        'department', 'designation', 'gender', 'marital_status'
    ]
    search_fields = [
        'first_name', 'last_name', 'middle_name',
        'phone', 'email', 'employee_id'
    ]
    date_hierarchy = 'joining_date'

    def get_full_name(self, obj):
        return obj.get_full_name()

    get_full_name.short_description = 'Full Name'
    get_full_name.admin_order_field = 'first_name'

    fieldsets = (
        ('User Account', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': (
                'first_name', 'middle_name', 'last_name',
                'gender', 'marital_status', 'education'
            )
        }),
        ('Contact Details', {
            'fields': ('phone', 'email', 'address')
        }),
        ('Employment Details', {
            'fields': (
                'employee_id', 'department',
                'designation', 'joining_date'
            )
        }),
        ('Leave Balances', {
            'fields': (
                'sick_leave_balance', 'casual_leave_balance',
                'paid_leave_balance', 'sick_leave_total',
                'casual_leave_total', 'paid_leave_total'
            ),
            'classes': ('collapse',)
        }),
    )


# ===== LEAVE ADMIN =====
@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = [
        'employee', 'leave_type', 'start_date',
        'end_date', 'leave_days', 'status', 'applied_at'
    ]
    list_filter = ['status', 'leave_type', 'start_date']

    search_fields = [
        'employee__username', 'employee__first_name',
        'employee__last_name', 'reason'
    ]

    date_hierarchy = 'start_date'
    readonly_fields = ['applied_at']

    fieldsets = (
        ('Employee Information', {
            'fields': ('employee', 'leave_type')
        }),
        ('Leave Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Details', {
            'fields': ('reason', 'status')
        }),
        ('System Info', {
            'fields': ('applied_at',),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_leaves', 'reject_leaves']

    def approve_leaves(self, request, queryset):
        updated = queryset.update(status='APPROVED')
        self.message_user(
            request,
            f"{updated} leave requests approved."
        )

    approve_leaves.short_description = "Approve selected leaves"

    def reject_leaves(self, request, queryset):
        updated = queryset.update(status='REJECTED')
        self.message_user(
            request,
            f"{updated} leave requests rejected."
        )

    reject_leaves.short_description = "Reject selected leaves"


# ===== HOLIDAY ADMIN =====
@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'date', 'holiday_type',
        'year', 'is_active', 'is_auto_generated'
    ]
    list_filter = [
        'holiday_type', 'year',
        'is_active', 'is_auto_generated'
    ]
    search_fields = [
        'name', 'description', 'note', 'event_location'
    ]
    date_hierarchy = 'date'
    readonly_fields = ['year', 'created_at', 'updated_at']

    fieldsets = (
        ('Holiday Information', {
            'fields': ('name', 'date', 'holiday_type', 'is_active')
        }),
        ('Event Details', {
            'fields': (
                'note', 'event_time',
                'event_location', 'event_duration'
            ),
            'classes': ('wide',),
            'description': (
                'Use Note for instructions, special timing, '
                'or employee information'
            )
        }),
        ('Additional Details', {
            'fields': ('description', 'is_auto_generated')
        }),
        ('Registration', {
            'fields': (
                'requires_registration',
                'registration_deadline'
            ),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': (
                'created_by', 'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'created_by'
        )

    actions = ['activate_holidays', 'deactivate_holidays']

    def activate_holidays(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f"{updated} holidays activated successfully."
        )

    activate_holidays.short_description = "Activate selected holidays"

    def deactivate_holidays(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f"{updated} holidays deactivated successfully."
        )

    deactivate_holidays.short_description = "Deactivate selected holidays"


# ===== HOLIDAY NOTIFICATION ADMIN =====
@admin.register(HolidayNotification)
class HolidayNotificationAdmin(admin.ModelAdmin):
    list_display = ['holiday', 'sent_at', 'recipient_count', 'sent_by']
    list_filter = ['sent_at']
    search_fields = ['holiday__name']
    readonly_fields = [
        'sent_at', 'holiday', 'sent_by', 'recipient_count'
    ]
    date_hierarchy = 'sent_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return True


# ===== MEETING ADMIN =====
@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):

    list_display = [
        'title', 'date', 'time',
        'created_by', 'status',
        'is_holiday', 'holiday_warning'
    ]
    list_filter = ['status', 'is_holiday', 'date']
    search_fields = ['title', 'description', 'location']
    date_hierarchy = 'date'
    readonly_fields = [
        'is_holiday', 'holiday_warning',
        'created_at', 'updated_at'
    ]
    filter_horizontal = ['attendees']

    fieldsets = (
        ('Meeting Details', {
            'fields': ('title', 'description', 'location')
        }),
        ('Schedule', {
            'fields': ('date', 'time', 'duration')
        }),
        ('Attendance', {
            'fields': ('attendees',)
        }),
        ('Status & Warnings', {
            'fields': (
                'status', 'is_holiday', 'holiday_warning'
            )
        }),
        ('System Info', {
            'fields': (
                'created_by', 'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'created_by'
        )


# ===== SALARY ADMIN =====
@admin.register(Salary)
class SalaryAdmin(admin.ModelAdmin):
    list_display = [
        'employee',
        'month',
        'year',
        'basic_salary',
        'get_net_salary',
        'status']
    list_filter = ['status', 'year', 'month']
    search_fields = ['employee__username', 'employee__email']

    def get_net_salary(self, obj):
        return obj.get_net_salary()

    get_net_salary.short_description = 'Net Salary'
    get_net_salary.admin_order_field = 'basic_salary'


# ===== ANNOUNCEMENT ADMIN =====
admin.site.register(Announcement)


# ===== ADMIN SITE CUSTOMIZATION =====
admin.site.site_header = "HRMS Administration"
admin.site.site_title = "HRMS Admin Portal"
admin.site.index_title = "Welcome to HRMS Administration"
