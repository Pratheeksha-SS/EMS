import re

# === Fix serializers.py ===
with open('backend/hrms_backend/hrms/serializers.py', 'r') as f:
    content = f.read()

# Fix SalarySerializer.get_employee_name which does Employee.objects.get() causing N+1
old_salary_name = '''    def get_employee_name(self, obj):
        try:
            employee = Employee.objects.get(user=obj.employee)
            return f"{employee.first_name} {employee.last_name}".strip()
        except Employee.DoesNotExist:
            return str(obj.employee)'''

new_salary_name = '''    def get_employee_name(self, obj):
        # Use select_related prefetched data instead of new query
        try:
            if hasattr(obj.employee, 'employee_profile'):
                emp = obj.employee.employee_profile
                return emp.get_full_name() if hasattr(emp, 'get_full_name') else f"{emp.first_name or ''} {emp.last_name or ''}".strip()
            return str(obj.employee)
        except Exception:
            return str(obj.employee)'''

if old_salary_name in content:
    content = content.replace(old_salary_name, new_salary_name)
    print('Fixed SalarySerializer.get_employee_name')
else:
    print('WARNING: Could not find SalarySerializer.get_employee_name')

with open('backend/hrms_backend/hrms/serializers.py', 'w') as f:
    f.write(content)

# === Fix views.py - remaining optimizations ===
with open('backend/hrms_backend/hrms/views.py', 'r') as f:
    content = f.read()

# Fix AllUsersView and AllManagersView to use select_related
old_allmanagers = '''class AllManagersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.filter(role='MANAGER')'''

new_allmanagers = '''class AllManagersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.filter(role='MANAGER').select_related('employee_profile')'''

if old_allmanagers in content:
    content = content.replace(old_allmanagers, new_allmanagers)
    print('Fixed AllManagersView')
else:
    print('WARNING: Could not find AllManagersView')

old_allusers = '''class AllUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.all()'''

new_allusers = '''class AllUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.all().select_related('employee_profile')'''

if old_allusers in content:
    content = content.replace(old_allusers, new_allusers)
    print('Fixed AllUsersView')
else:
    print('WARNING: Could not find AllUsersView')

# Fix DepartmentEmployeesView to use select_related
old_deptemp = '''class DepartmentEmployeesView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        department = self.request.query_params.get('department')

        if user.role == 'ADMIN':
            if department:
                return Employee.objects.filter(department__iexact=department)
            return Employee.objects.all()
        elif user.role == 'MANAGER' and user.managed_department:
            return Employee.objects.filter(department__iexact=user.managed_department)
        return Employee.objects.none()'''

new_deptemp = '''class DepartmentEmployeesView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        department = self.request.query_params.get('department')

        base_qs = Employee.objects.select_related('user')
        if user.role == 'ADMIN':
            if department:
                return base_qs.filter(department__iexact=department)
            return base_qs.all()
        elif user.role == 'MANAGER' and user.managed_department:
            return base_qs.filter(department__iexact=user.managed_department)
        return Employee.objects.none()'''

if old_deptemp in content:
    content = content.replace(old_deptemp, new_deptemp)
    print('Fixed DepartmentEmployeesView')
else:
    print('WARNING: Could not find DepartmentEmployeesView')

# Fix EmployeeDetailView to use select_related
old_empdetail = '''class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]'''

new_empdetail = '''class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related('user')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]'''

if old_empdetail in content:
    content = content.replace(old_empdetail, new_empdetail)
    print('Fixed EmployeeDetailView')
else:
    print('WARNING: Could not find EmployeeDetailView')

# Fix AllSalariesView to add select_related
old_allsal = '''class AllSalariesView(generics.ListAPIView):
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return Salary.objects.none()
        return Salary.objects.all().order_by('-year', '-month')'''

new_allsal = '''class AllSalariesView(generics.ListAPIView):
    serializer_class = SalarySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return Salary.objects.none()
        return Salary.objects.select_related('employee').order_by('-year', '-month')'''

if old_allsal in content:
    content = content.replace(old_allsal, new_allsal)
    print('Fixed AllSalariesView')
else:
    print('WARNING: Could not find AllSalariesView')

# Remove duplicate PageNumberPagination imports
content = content.replace(
    'from rest_framework.pagination import PageNumberPagination\nfrom rest_framework.pagination import PageNumberPagination\nfrom rest_framework.pagination import PageNumberPagination',
    'from rest_framework.pagination import PageNumberPagination'
)

with open('backend/hrms_backend/hrms/views.py', 'w') as f:
    f.write(content)

print('All view optimizations done')
