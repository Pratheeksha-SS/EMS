import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { extractListData } from '../utils/extractListData';
import AdminLeaveManagement from './AdminLeaveManagement';
import HolidayCalendar from '../components/HolidayCalendar';
import Notification from "../components/Notification";
import Departments from './departments/Departments';
import DepartmentDetails from './departments/DepartmentDetails';
import CreateDepartment from './departments/CreateDepartment';
import Employees from './Employees';
import AdminSalary from './admin/AdminSalary';
import ManagerManagement from './admin/ManagerManagement';
import AdminAnnouncements from './AdminAnnouncements';
import AnnouncementDetail from './AnnouncementDetail';
import NewAnnouncement from './NewAnnouncement';
import EditAnnouncement from './EditAnnouncement';
import HRReports from './admin/HRReports';
import ManagersList from './admin/ManagersList';
import AdminVisitor from './admin/AdminVisitor';

const AdminDashboard = ({ user, setUser, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState(() => activePage || 'dashboard');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [notification, setNotification] = useState(null);
  const [adminProfileImage, setAdminProfileImage] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departments: 0,
    successRate: 97.3,
    p95Latency: 234,
  });
  const [loading, setLoading] = useState(false);
  const [departmentCount, setDepartmentCount] = useState(0);
  const cancelRef = useRef(null);

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Employees', icon: '👥' },
    { name: 'Attendance', icon: '📅' },
    { name: 'Leave Management', icon: '📝' },
    { name: 'Departments', icon: '🏢' },
    { name: 'Salary', icon: '💰' },
    { name: 'Manager Management', icon: '👔' },
    { name: 'Announcement', icon: '📢' },
    { name: 'HR Reports', icon: '📊' },
    { name: 'Holiday Calender', icon: '📅' },
    { name: 'Visitor Management', icon: '🤵🏻' },
  ];

  const getAnnouncementId = () => {
    const pathParts = location.pathname.split('/');
    return pathParts[pathParts.length - 1];
  };

  // Fetch admin profile image
  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/employees/me/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.profile_image) {
        setAdminProfileImage(`http://localhost:8000/media/${response.data.profile_image}`);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  // Handle query parameters for navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch employees when activeSection is 'employees'
  useEffect(() => {
    if (activeSection === 'employees') {
      fetchEmployees();
    }
  }, [activeSection]);

  // Update active section when activePage prop changes
  useEffect(() => {
    if (activePage) setActiveSection(activePage);
  }, [activePage]);

  // Only fetch stats when on dashboard section
  useEffect(() => {
    if (activeSection === 'dashboard') fetchDashboardStats();
    return () => { if (cancelRef.current) cancelRef.current.abort(); };
  }, [activeSection]);

  // Fetch admin profile on mount
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/employees/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(extractListData(response.data));
      fetchStats();
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      const employeesRes = await axios.get('http://localhost:8000/api/employees/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const employeesData = extractListData(employeesRes.data);

      let deptCount = 0;
      try {
        const deptsRes = await axios.get('http://localhost:8000/api/departments/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        deptCount = deptsRes.data.length;
        setDepartmentCount(deptCount);
      } catch (error) {
        console.log('Departments API not ready yet, using employee departments');
        const departments = [...new Set(employeesData.map(emp => emp.department))];
        deptCount = departments.length;
        setDepartmentCount(deptCount);
      }

      setStats({
        totalEmployees: employeesData.length,
        departments: deptCount,
        successRate: 97.3,
        p95Latency: 234
      });

    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    if (cancelRef.current) cancelRef.current.abort();
    cancelRef.current = new AbortController();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/employees/', {
        headers: { Authorization: `Bearer ${token}` },
        signal: cancelRef.current.signal,
      });
      const employees = extractListData(res.data);
      if (!Array.isArray(employees)) {
        console.warn('Employees data is not an array:', employees);
        setStats({
          totalEmployees: 0,
          departments: 0,
          successRate: 97.3,
          p95Latency: 234,
        });
        return;
      }
      const uniqueDepts = new Set(employees.map(e => e.department).filter(Boolean));
      setStats({
        totalEmployees: employees.length,
        departments: uniqueDepts.size,
        successRate: 97.3,
        p95Latency: 234,
      });
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') return;
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeAdded = () => {
    fetchEmployees();
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditEmployee(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`http://localhost:8000/api/employees/${employeeId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotification({ message: "Employee deleted successfully!", type: "success" });
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        setNotification({ message: "Error deleting employee", type: "error" });
      }
    }
  };

  const handleEmployeeUpdated = () => {
    fetchEmployees();
    setShowEditEmployee(false);
    setEditingEmployee(null);
    setNotification({ message: "Employee updated successfully!", type: "success" });
  };

  const handleNavigation = (itemName) => {
    const sectionMap = {
      'Dashboard': 'dashboard',
      'Leave Management': 'leave-management',
      'Departments': 'departments',
      'Employees': 'employees',
      'Salary': 'salary',
      'Manager Management': 'manager-management',
      'Announcement': 'announcement',
      'Holiday Calender': 'holidays',
      'Visitor Management': 'visitors',
      'HR Reports': 'hr-reports',
    };
    const section = sectionMap[itemName] || itemName.toLowerCase();
    setActiveSection(section);

    if (itemName === 'Departments') {
      navigate('/departments');
    } else if (itemName === 'Leave Management') {
      navigate('/admin?section=leave-management');
    } else if (itemName === 'Employees') {
      navigate('/admin?section=employees');
    } else if (itemName === 'Dashboard') {
      navigate('/admin');
    } else if (itemName === 'Holiday Calender') {
      navigate('/admin?section=holidays');
    } else if (itemName === 'Salary') {
      navigate('/admin/salary');
    } else if (itemName === 'Manager Management') {
      navigate('/admin/manager-management');
    } else if (itemName === 'HR Reports') {
      navigate('/admin/hr-reports');
    }else if (itemName === 'Announcement') {
      navigate('/admin?section=announcement');
    }else if (itemName === 'Visitor Management') {
      navigate('/admin?section=visitors');
    } else {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Simplified - use routes instead of pathname matching
const renderAnnouncement = () => <AdminAnnouncements user={user} onViewDetail={(id) => navigate(`/admin/announcements/${id}`)} onEdit={(id) => navigate(`/admin/announcements/${id}/edit`)} />;
  const renderContent = () => {
    switch (activeSection) {
      case 'departments':        return <Departments />;
      case 'new-department':     return <CreateDepartment />;
      case 'department-details': return <DepartmentDetails />;
      case 'leave-management':   return <AdminLeaveManagement />;
      case 'employees':          return <Employees />;
      case 'holidays':           return (
        <div style={{ padding: '24px', height: '100%' }}>
          <HolidayCalendar />
        </div>
      );
      case 'salary':             return <AdminSalary />;
      case 'manager-management': return <ManagerManagement />;
      case 'announcement':       return <div style={{ padding: '24px' }}><AdminAnnouncements user={user} onViewDetail={(id) => navigate(`/admin/announcements/${id}`)} onEdit={(id) => navigate(`/admin/announcements/${id}/edit`)} /></div>;
      case 'new-announcement':   return <div style={{ padding: '24px' }}><NewAnnouncement /></div>;
      case 'announcement-detail': return <div style={{ padding: '24px' }}><AnnouncementDetail user={user} id={getAnnouncementId()} /></div>;
      case 'edit-announcement':  return <div style={{ padding: '24px' }}><EditAnnouncement id={getAnnouncementId()} /></div>;
      case 'visitors':           return <AdminVisitor user={user} />;
      case 'hr-reports':         return <div style={{ padding: '24px' }}><HRReports /></div>;
      case 'managers-list':      return <div style={{ padding: '24px' }}><ManagersList /></div>;
      default:                   return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#1a1a1a' }}>
          Hello, {user?.username || 'Admin'}!
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Welcome Back</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ width: '32px', height: '32px', margin: '0 auto 12px', border: '3px solid #f3f3f3', borderTop: '3px solid #4361ee', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading stats...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[
            { label: 'Total Employees', value: stats.totalEmployees, change: '~18%', color: '#10b981' },
            { label: 'Departments',     value: stats.departments,    change: '~5%',  color: '#10b981' },
            { label: 'Success Rate',    value: `${stats.successRate}%`, change: '2.4%', color: '#10b981' },
            { label: 'P95 Latency',     value: `${stats.p95Latency}ms`, change: '12%',  color: '#ef4444' },
          ].map(({ label, value, change, color }) => (
            <div key={label} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{value}</div>
              <div style={{ color, fontSize: '14px', marginTop: '4px' }}>{change}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0' }}>HRMS Control Room</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            {[
              { label: 'Dept',         value: stats.departments,    color: '#4361ee', pct: Math.min(100, stats.departments * 10) },
              { label: 'New Employee', value: stats.totalEmployees, color: '#10b981', pct: Math.min(100, stats.totalEmployees * 5) },
            ].map(({ label, value, color, pct }) => (
              <div key={label} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>{label}</span>
                  <span style={{ color, fontWeight: '600' }}>{value}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div>
            {[
              { label: 'Attendance Pulse',           value: '94%', color: '#f59e0b', pct: 94  },
              { label: 'Database Connection Active', value: '✓',   color: '#10b981', pct: 100 },
            ].map(({ label, value, color, pct }) => (
              <div key={label} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>{label}</span>
                  <span style={{ color, fontWeight: '600' }}>{value}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <span style={{ color: '#666' }}>{stats.departments} Departments Configured</span>
        <span
          style={{ color: '#4361ee', cursor: 'pointer', fontSize: '14px' }}
          onClick={() => navigate('/admin?section=leave-management')}
        >
          Review Pending Leave Requests →
        </span>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f5f7fa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

     {/* Sidebar */}
          <div style={{
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '24px 40px', flexShrink: 0 }}>
         <span style={{
              fontSize: '30px',
              fontWeight: '549',
              color: '#000000',
              letterSpacing: '-1px',
              fontFamily: "'Montserrat', 'Poppins', sans-serif"
            }}>
              EL
            </span>

            {/* The "O" with dot inside */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                fontSize: '30px',
                fontWeight: '549',
                color: '#000000',
                fontFamily: "'Montserrat', 'Poppins', sans-serif"
              }}>
                O
              </span>
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '3px',
                height: '3px',
                backgroundColor: '#000000',
                borderRadius: '50%',
                zIndex: 2
              }}></span>
            </div>

            <span style={{
              fontSize: '30px',
              fontWeight: '549',
              color: '#000000',
              letterSpacing: '-1px',
              fontFamily: "sans-serif"
            }}>
              G
            </span>

            <span style={{
              fontSize: '30px',
              fontWeight: '549',
              color: '#ff9933',
              letterSpacing: '-1px',
              fontFamily: "'Montserrat', 'Poppins', sans-serif"
            }}>
              IXA
            </span> 

            {/* Modern Triangle Cluster - Positioned to the right of text */}
            <div style={{
              position: 'relative',
              width: '80px',
              height: '150px',
              marginLeft: '-10px',
              display: 'inline-block',
              verticalAlign: 'middle'
            }}>
              {/* Bottom Green Triangle - Largest, bottom-right, rotated +10° */}
              <div style={{
                position: 'absolute',
                bottom: '90px',
                right: '29px',
                width: 0,
                height: 0,
                borderLeft: '18px solid transparent',
                borderRight: '18px solid transparent',
                borderBottom: '31px solid #4caf50',
                transform: 'rotate(-10deg)',
                transformOrigin: 'center',
                zIndex: 1
              }} />
              
              {/* Middle Orange Triangle - Slightly smaller, left position, rotated -20° */}
              <div style={{
                position: 'absolute',
                top: '25px',
                left: '-5px',
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '24px solid #ff9933',
                transform: 'rotate(-50deg)',
                transformOrigin: 'center',
                zIndex: 2
              }} />
              
              {/* Top Dark Gray Triangle - Medium size, top-right, rotated +30° */}
              <div style={{
                position: 'absolute',
                top: '1px',
                right: '40px',
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '28px solid #2d3748',
                transform: 'rotate(30deg)',
                transformOrigin: 'center',
                zIndex: 3
              }} />
            </div>
          <p style={{ fontSize: '10px', color: '#666', margin: '-60px 0 0 0', textAlign: 'center', letterSpacing: '1px' }}>ADMIN PORTAL</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {menuItems.map((item) => {
            const isActive =
              (item.name === 'Dashboard' && activeSection === 'dashboard') ||
              (item.name === 'Leave Management' && activeSection === 'leave-management') ||
              (item.name === 'Employees' && activeSection === 'employees') ||
              (item.name === 'Departments' && ['departments', 'new-department', 'department-details'].includes(activeSection)) ||
              (item.name === 'Salary' && activeSection === 'salary') ||
              (item.name === 'Manager Management' && activeSection === 'manager-management') ||
              (item.name === 'Holiday Calender' && activeSection === 'holidays') ||
              (item.name === 'Announcement' && activeSection === 'announcement') ||
              (item.name === 'HR Reports' && activeSection === 'hr-reports');
              (item.name === 'Visitor Management' && activeSection === 'visitors');

            return (
              <div
                key={item.name}
                onClick={() => handleNavigation(item.name)}
                style={{
                  padding: '12px 20px',
                  margin: '4px 8px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#eef2ff' : 'transparent',
                  color: isActive ? '#4361ee' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: isActive ? '500' : '400',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = '#fff3e0'; e.currentTarget.style.color = '#f97316'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#666'; } }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.name}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '12px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F97316',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}
          >
            <span>🚪</span> Logout
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, backgroundColor: '#f5f7fa' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
