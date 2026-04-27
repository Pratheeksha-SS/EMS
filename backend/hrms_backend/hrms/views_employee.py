# hrms/views_employee.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.core.mail import send_mail, BadHeaderError
from django.conf import settings
from .models import Holiday, Leave, Employee
from datetime import datetime, timedelta
from collections import defaultdict
import csv


# ================= EMPLOYEE HOLIDAY VIEWS ================= #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_holiday_calendar(request):

    today = timezone.now().date()
    current_year = today.year

    holidays = Holiday.objects.filter(
        date__year__gte=current_year,
        is_active=True
    ).order_by('date')

    upcoming_holidays = []
    past_holidays = []
    holidays_by_month = defaultdict(list)

    for holiday in holidays:
        month_key = holiday.date.strftime('%B %Y')

        holiday_data = {
            'id': holiday.id,
            'name': holiday.name,
            'date': holiday.date.strftime('%d %B %Y'),
            'day': holiday.date.strftime('%A'),
            'month': holiday.date.strftime('%B'),
            'year': holiday.date.year,
            'type': holiday.get_holiday_type_display(),
            'type_code': holiday.holiday_type,
            'is_weekend': holiday.date.weekday() in [5, 6],
            'description': holiday.description,
            'note': holiday.note if holiday.note else None
        }

        holidays_by_month[month_key].append(holiday_data)

        if holiday.date >= today:
            upcoming_holidays.append(holiday_data)
        else:
            past_holidays.append(holiday_data)

    next_holiday = upcoming_holidays[0] if upcoming_holidays else None

    holidays_by_year = {}
    for year in [current_year, current_year + 1, current_year + 2]:
        year_holidays = holidays.filter(date__year=year)

        holidays_by_year[year] = [
            {
                'name': h.name,
                'date': h.date.strftime('%d %B'),
                'day': h.date.strftime('%A'),
                'type': h.get_holiday_type_display()
            }
            for h in year_holidays
        ]

    return Response({
        'success': True,
        'current_date': today.strftime('%d %B %Y'),
        'current_day': today.strftime('%A'),
        'summary': {
            'total_holidays': holidays.count(),
            'upcoming_count': len(upcoming_holidays),
            'past_count': len(past_holidays),
            'next_holiday': next_holiday
        },
        'upcoming_holidays': upcoming_holidays[:10],
        'past_holidays': past_holidays[:5],
        'holidays_by_month': dict(holidays_by_month),
        'holidays_by_year': holidays_by_year,
        'calendar_years': [current_year, current_year + 1, current_year + 2]
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_holiday_detail(request, holiday_id):

    try:
        holiday = Holiday.objects.get(id=holiday_id, is_active=True)

        data = {
            'id': holiday.id,
            'name': holiday.name,
            'date': holiday.date.strftime('%d %B %Y'),
            'day': holiday.date.strftime('%A'),
            'type': holiday.get_holiday_type_display(),
            'description': holiday.description,
            'note': holiday.note,
            'is_weekend': holiday.date.weekday() in [5, 6],
            'days_remaining': (holiday.date - timezone.now().date()).days
        }

        if holiday.event_time:
            data['event_time'] = holiday.event_time.strftime('%I:%M %p')
        if holiday.event_location:
            data['event_location'] = holiday.event_location
        if holiday.event_duration:
            data['event_duration'] = f"{holiday.event_duration} hours"
        if holiday.requires_registration:
            data['requires_registration'] = True
            if holiday.registration_deadline:
                data['registration_deadline'] = (
                    holiday.registration_deadline.strftime('%d %B %Y')
                )

        return Response({'success': True, 'holiday': data})

    except Holiday.DoesNotExist:
        return Response(
            {'success': False, 'error': 'Holiday not found'},
            status=404
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_holiday_calendar(request, year=None):

    if not year:
        year = timezone.now().year

    holidays = Holiday.objects.filter(
        date__year=year,
        is_active=True
    ).order_by('date')

    months = []

    for month in range(1, 13):
        month_holidays = holidays.filter(date__month=month)

        if month_holidays.exists():
            months.append({
                'month': datetime(year, month, 1).strftime('%B'),
                'holidays': [
                    {
                        'name': h.name,
                        'date': h.date.strftime('%d %B'),
                        'day': h.date.strftime('%A'),
                        'type': h.get_holiday_type_display()
                    }
                    for h in month_holidays
                ]
            })

    return Response({
        'success': True,
        'year': year,
        'total_holidays': holidays.count(),
        'months': months,
        'download_url': f'/api/employee/holidays/export/{year}/'
    })


# ================= LEAVE DELETE VIEW ================= #

class LeaveDeleteView(generics.DestroyAPIView):
    queryset = Leave.objects.all()
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):

        leave_id = kwargs.get('pk')
        leave = get_object_or_404(Leave, id=leave_id)

        if leave.employee != request.user and request.user.role != 'ADMIN':
            return Response(
                {"error": "You don't have permission to delete this leave"},
                status=status.HTTP_403_FORBIDDEN
            )

        if leave.status != 'PENDING':
            return Response(
                {"error": f"Cannot delete leave with status '{leave.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.delete()

        return Response(
            {"message": "Leave request deleted successfully"},
            status=status.HTTP_200_OK
        )


# ================= DASHBOARD ================= #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_dashboard_stats(request):

    user = request.user

    total_leaves = Leave.objects.filter(employee=user).count()
    pending_leaves = Leave.objects.filter(
        employee=user,
        status='PENDING'
        ).count()
    approved_leaves = Leave.objects.filter(
        employee=user,
        status='APPROVED'
        ).count()
    rejected_leaves = Leave.objects.filter(
        employee=user,
        status='REJECTED'
        ).count()

    today = timezone.now().date()
    next_month = today + timedelta(days=30)

    upcoming_holidays = Holiday.objects.filter(
        date__gte=today,
        date__lte=next_month,
        is_active=True
    ).order_by('date')[:5]

    holiday_data = [
        {
            'id': h.id,
            'name': h.name,
            'date': h.date.strftime('%d %B %Y'),
            'day': h.date.strftime('%A'),
            'type': h.get_holiday_type_display()
        }
        for h in upcoming_holidays
    ]

    return Response({
        'success': True,
        'leave_stats': {
            'total': total_leaves,
            'pending': pending_leaves,
            'approved': approved_leaves,
            'rejected': rejected_leaves
        },
        'upcoming_holidays': holiday_data
    })


# ================= NOTIFICATION ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_holiday_notification(request):

    if request.user.role != 'ADMIN':
        return Response(
            {"success": False, "error": "Only admins can send notifications"},
            status=status.HTTP_403_FORBIDDEN
        )

    holiday_id = request.data.get('holiday_id')
    message = request.data.get('message', '')

    holiday = get_object_or_404(Holiday, id=holiday_id, is_active=True)

    employees = Employee.objects.filter(email__isnull=False).exclude(email='')

    subject = f"Holiday Notification: {holiday.name}"

    email_message = f"""
Dear Employee,

{message}

Holiday Details:
- Name: {holiday.name}
- Date: {holiday.date.strftime('%B %d, %Y')}
- Day: {holiday.date.strftime('%A')}

Regards,
HRMS Team
"""

    email_count = 0

    for employee in employees:
        try:
            send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                fail_silently=True
            )
            email_count += 1
        except BadHeaderError:
            pass

    return Response({
        "success": True,
        "message": f"Notification sent to {email_count} employees"
    })


# ================= EXPORT CSV ================= #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_holidays_csv(request, year=None):

    if not year:
        year = timezone.now().year

    holidays = Holiday.objects.filter(
        date__year=year,
        is_active=True
    ).order_by('date')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = (
        f'attachment; filename="holidays_{year}.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(['Date', 'Holiday Name', 'Day', 'Type', 'Description'])

    for holiday in holidays:
        writer.writerow([
            holiday.date.strftime('%Y-%m-%d'),
            holiday.name,
            holiday.date.strftime('%A'),
            holiday.get_holiday_type_display(),
            holiday.description or ''
        ])

    return response


# ================= CURRENT EMPLOYEE SALARY VIEW ================= #

class CurrentEmployeeSalaryView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        try:
            employee = Employee.objects.get(id=user.id)
        except Employee.DoesNotExist:
            return Response(
                {"success": False, "error": "Employee not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        salary_data = {
            "success": True,
            "employee_id": employee.id,
            "employee_name": getattr(employee, 'full_name', str(employee)),
            "basic_salary": getattr(employee, 'basic_salary', None),
            "gross_salary": getattr(employee, 'gross_salary', None),
            "net_salary": getattr(employee, 'net_salary', None),
            "currency": getattr(employee, 'currency', 'INR'),
        }

        return Response(salary_data, status=status.HTTP_200_OK)


# ================= EMPLOYEE SALARY DETAIL VIEW ================= #

class EmployeeSalaryDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        if request.user.role != 'ADMIN' and request.user.id != pk:
            return Response(
                {"success": False, "error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        employee = get_object_or_404(Employee, id=pk)

        salary_data = {
            "success": True,
            "employee_id": employee.id,
            "employee_name": getattr(employee, 'full_name', str(employee)),
            "basic_salary": getattr(employee, 'basic_salary', None),
            "gross_salary": getattr(employee, 'gross_salary', None),
            "net_salary": getattr(employee, 'net_salary', None),
            "currency": getattr(employee, 'currency', 'INR'),
        }

        return Response(salary_data, status=status.HTTP_200_OK)


# ================= EMPLOYEE SALARY MANAGE VIEW (CREATE) ================= #

class EmployeeSalaryManageView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response(
                {"success": False, "error": "Only admins can manage salaries"},
                status=status.HTTP_403_FORBIDDEN
            )

        employee_id = request.data.get('employee_id')
        employee = get_object_or_404(Employee, id=employee_id)

        basic_salary = request.data.get('basic_salary')
        gross_salary = request.data.get('gross_salary')
        net_salary = request.data.get('net_salary')
        currency = request.data.get('currency', 'INR')

        if basic_salary is not None:
            employee.basic_salary = basic_salary
        if gross_salary is not None:
            employee.gross_salary = gross_salary
        if net_salary is not None:
            employee.net_salary = net_salary
        if currency:
            employee.currency = currency

        employee.save()

        return Response({
            "success": True,
            "message": "Salary record created successfully",
            "employee_id": employee.id,
            "employee_name": getattr(employee, 'full_name', str(employee)),
            "basic_salary": getattr(employee, 'basic_salary', None),
            "gross_salary": getattr(employee, 'gross_salary', None),
            "net_salary": getattr(employee, 'net_salary', None),
            "currency": getattr(employee, 'currency', 'INR'),
        }, status=status.HTTP_201_CREATED)


# ================= EMPLOYEE SALARY UPDATE VIEW ================= #

class EmployeeSalaryUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response(
                {"success": False, "error": "Only admins can update salaries"},
                status=status.HTTP_403_FORBIDDEN
            )

        employee = get_object_or_404(Employee, id=pk)

        basic_salary = request.data.get('basic_salary')
        gross_salary = request.data.get('gross_salary')
        net_salary = request.data.get('net_salary')
        currency = request.data.get('currency')

        if basic_salary is not None:
            employee.basic_salary = basic_salary
        if gross_salary is not None:
            employee.gross_salary = gross_salary
        if net_salary is not None:
            employee.net_salary = net_salary
        if currency is not None:
            employee.currency = currency

        employee.save()

        return Response({
            "success": True,
            "message": "Salary updated successfully",
            "employee_id": employee.id,
            "employee_name": getattr(employee, 'full_name', str(employee)),
            "basic_salary": getattr(employee, 'basic_salary', None),
            "gross_salary": getattr(employee, 'gross_salary', None),
            "net_salary": getattr(employee, 'net_salary', None),
            "currency": getattr(employee, 'currency', 'INR'),
        }, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        return self.patch(request, pk, *args, **kwargs)


# ================= EMPLOYEE SALARY MARK PAID VIEW ================= #

class EmployeeSalaryMarkPaidView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response(
                {
                    "success": False,
                    "error": "Only admins can mark salary as paid"
                },
                status=status.HTTP_403_FORBIDDEN
            )

        employee = get_object_or_404(Employee, id=pk)

        if hasattr(employee, 'salary_paid'):
            employee.salary_paid = True
        if hasattr(employee, 'salary_paid_date'):
            employee.salary_paid_date = timezone.now().date()
        if hasattr(employee, 'last_salary_paid_at'):
            employee.last_salary_paid_at = timezone.now()

        employee.save()

        return Response({
            "success": True,
            "message": f"Salary marked as paid for employee {pk}",
            "employee_id": employee.id,
            "employee_name": getattr(employee, 'full_name', str(employee)),
            "paid_on": timezone.now().date().strftime('%d %B %Y'),
        }, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        return self.patch(request, pk, *args, **kwargs)


# ================= ALL SALARIES VIEW ================= #

class AllSalariesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response(
                {
                    "success": False,
                    "error": "Only admins can view all salaries"
                },
                status=status.HTTP_403_FORBIDDEN
            )

        employees = Employee.objects.all()

        salary_list = []
        for employee in employees:
            salary_list.append({
                "employee_id": employee.id,
                "employee_name": getattr(employee, 'full_name', str(employee)),
                "basic_salary": getattr(employee, 'basic_salary', None),
                "gross_salary": getattr(employee, 'gross_salary', None),
                "net_salary": getattr(employee, 'net_salary', None),
                "currency": getattr(employee, 'currency', 'INR'),
            })

        return Response({
            "success": True,
            "count": len(salary_list),
            "salaries": salary_list
        }, status=status.HTTP_200_OK)
