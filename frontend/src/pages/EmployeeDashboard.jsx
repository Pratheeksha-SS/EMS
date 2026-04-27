import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApplyLeave from '../components/ApplyLeave';
import Notification from '../components/Notification';
import EmployeeHolidayPage from './EmployeeHolidayPage';
import Salary from './Salary';
import { extractListData } from '../utils/extractListData';

import { User, Mail, Phone, MapPin, Users, Globe, Calendar, Building, BookOpen, DollarSign, Edit2, Lock } from 'lucide-react';

const EmployeeDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notification, setNotification] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({ SICK: 12, CASUAL: 10, PAID: 15 });
  const [leaveHistoryLoading, setLeaveHistoryLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_occupation: '',
    education_level: '',
    institute_name: '',
    year_of_passing: '',
    marks_type: '',
    marks_value: '',
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
    branch_name: '',
    account_type: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nextHoliday, setNextHoliday] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  const userRole = localStorage.getItem('user_role') || '';
  const isManager = userRole === 'MANAGER';

  const attendance = [
    { date: '2024-03-01', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
    { date: '2024-02-29', status: 'Present', checkIn: '08:55 AM', checkOut: '06:05 PM' },
    { date: '2024-02-28', status: 'Present', checkIn: '09:10 AM', checkOut: '06:00 PM' },
    { date: '2024-02-27', status: 'Present', checkIn: '08:50 AM', checkOut: '06:00 PM' },
    { date: '2024-02-26', status: 'Present', checkIn: '09:00 AM', checkOut: '05:30 PM' }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'profile', label: 'My Profile' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leaves', label: 'Leave Requests' },
    { id: 'salary', label: 'Salary' },
    { id: 'holidays', label: 'Holidays' }
  ];

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  const getEmployeeId = () => {
    if (employeeData?.employee_id) return employeeData.employee_id;
    return 'Not assigned';
  };

  const getMarksDisplay = () => {
    if (!employeeData?.marks_value) return 'Not set';
    const type = employeeData.marks_type;
    const value = employeeData.marks_value;
    
    if (type === 'percentage') return `${value}%`;
    if (type === 'cgpa') return `${value} / 10 CGPA`;
    if (type === 'gpa') return `${value} / 4 GPA`;
    if (type === 'grade') return `Grade: ${value}`;
    return value;
  };

  const maskSensitiveData = (value, mask = '****') => {
    if (!value) return 'Not set';
    const str = value.toString();
    if (str.length <= 4) return mask;
    return mask + str.slice(-4);
  };

  const safeLeaveHistory = extractListData(leaveHistory);
  const pendingLeavesCount = safeLeaveHistory.filter((l) => l.status === 'PENDING').length;

  const getTotalLeaveDays = () => {
    return safeLeaveHistory.reduce((total, leave) => {
      if (leave.status === 'APPROVED') {
        return total + (leave.leave_days || 0);
      }
      return total;
    }, 0);
  };

  const fetchEmployeeProfile = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setProfileLoading(false);
        return;
      }
      const response = await axios.get('/employees/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeData(response.data);
      setFormData({
        emergency_contact_name: response.data.emergency_contact_name || '',
        emergency_contact_relationship: response.data.emergency_contact_relationship || '',
        emergency_contact_phone: response.data.emergency_contact_phone || '',
        emergency_contact_occupation: response.data.emergency_contact_occupation || '',
        education_level: response.data.education_level || '',
        institute_name: response.data.institute_name || '',
        year_of_passing: response.data.year_of_passing || '',
        marks_type: response.data.marks_type || '',
        marks_value: response.data.marks_value || '',
        account_holder_name: response.data.account_holder_name || '',
        account_number: response.data.account_number || '',
        bank_name: response.data.bank_name || '',
        ifsc_code: response.data.ifsc_code || '',
        branch_name: response.data.branch_name || '',
        account_type: response.data.account_type || ''
      });
      if (response.data.profile_image) {
        setImagePreview(getImageUrl(response.data.profile_image));
      }
      localStorage.setItem('employee_profile', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      showNotification('Failed to load profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchLeaveHistory = async ({ showSpinner = true } = {}) => {
    if (showSpinner) {
      setLeaveHistoryLoading(true);
    }
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const response = await axios.get('/leaves/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveHistory(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching leave history:', error);
      setLeaveHistory([]);
      showNotification('Failed to load leave history', 'error');
    } finally {
      if (showSpinner) {
        setLeaveHistoryLoading(false);
      }
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setAnnouncementsLoading(false);
        return;
      }
      const response = await axios.get('/announcements/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = extractListData(response.data);
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const fetchNextHoliday = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const currentYear = new Date().getFullYear();
      const response = await axios.get(`/holidays/?year=${currentYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = extractListData(response.data);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = data
        .filter((h) => {
          const holidayDate = new Date(h.date);
          holidayDate.setHours(0, 0, 0, 0);
          return holidayDate >= today;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (upcoming.length > 0) setNextHoliday(upcoming[0]);
    } catch (error) {
      console.error('Error fetching next holiday:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value || ''));
      if (selectedImage) payload.append('profile_image', selectedImage);
      await axios.patch('http://127.0.0.1:8000/api/employees/me/update/', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      await fetchEmployeeProfile();
      setEditMode(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleMenuItemClick = (item) => {
    if (item.id === 'holidays') {
      setActiveTab('holidays');
    } else {
      setActiveTab(item.id);
    }
  };

  useEffect(() => {
    fetchEmployeeProfile();
    fetchLeaveHistory();
    fetchAnnouncements();
    fetchNextHoliday();
  }, []);

  useEffect(() => {
    if (showApplyModal) return undefined;

    const interval = setInterval(() => {
      fetchLeaveHistory({ showSpinner: false });
    }, 30000);

    return () => clearInterval(interval);
  }, [showApplyModal]);

  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0', color: '#1a1a1a' }}>
            Welcome back, {employeeData?.first_name || 'Employee'}!
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isManager && (
            <button onClick={() => navigate('/manager')} style={{ padding: '10px 16px', backgroundColor: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              👔 Manager Dashboard
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Leave Balance</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{leaveBalance.SICK + leaveBalance.CASUAL + leaveBalance.PAID - getTotalLeaveDays()}</div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '12px' }}>
            <span style={{ color: '#4361ee' }}>S: {leaveBalance.SICK}</span>
            <span style={{ color: '#10b981' }}>C: {leaveBalance.CASUAL}</span>
            <span style={{ color: '#f59e0b' }}>P: {leaveBalance.PAID}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Used: {getTotalLeaveDays()} days</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Attendance This Month</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>18</div>
          <div style={{ color: '#10b981', fontSize: '13px', marginTop: '4px' }}>Days Present</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Pending Approvals</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{pendingLeavesCount}</div>
          <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>{pendingLeavesCount} Leave Request(s)</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Next Holiday</div>
          {nextHoliday ? (
            <>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#4361ee' }}>{nextHoliday.name}</div>
              <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{new Date(nextHoliday.date).toLocaleDateString()}</div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '8px', backgroundColor: '#e6f7ee', padding: '2px 8px', borderRadius: '12px', display: 'inline-block' }}>{nextHoliday.holiday_type || nextHoliday.holiday_type_display || 'Holiday'}</div>
            </>
          ) : (
            <div style={{ fontSize: '16px', color: '#999', padding: '10px 0' }}>No upcoming holidays</div>
          )}
        </div>
      </div>

      {/* Employee Information Card */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0', color: '#1a1a1a' }}>Employee Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div><div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Department</div><div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeData?.department || '-'}</div></div>
          <div><div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Designation</div><div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeData?.designation || '-'}</div></div>
          <div><div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Joining Date</div><div style={{ fontSize: '15px', fontWeight: '500' }}>{formatDate(employeeData?.joining_date)}</div></div>
          <div><div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Email</div><div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeData?.email || '-'}</div></div>
          <div><div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Phone</div><div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeData?.phone || '-'}</div></div>
        </div>
      </div>

      {/* Recent Leave Requests + Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Recent Leave Requests</h3>
          {leaveHistoryLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading...</div>
          ) : safeLeaveHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No leave requests found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {safeLeaveHistory.slice(0, 5).map((leave) => {
                  const start = new Date(leave.start_date);
                  const end = new Date(leave.end_date);
                  const days = leave.leave_days || Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  return (
                    <tr key={leave.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px' }}>{leave.leave_type}</td>
                      <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>{days} days</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                          backgroundColor: leave.status === 'APPROVED' ? '#d1fae5' : leave.status === 'REJECTED' ? '#fee2e2' : '#fff3cd',
                          color: leave.status === 'APPROVED' ? '#065f46' : leave.status === 'REJECTED' ? '#991b1b' : '#856404'
                        }}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <button onClick={() => setActiveTab('leaves')} style={{ marginTop: '16px', color: '#4361ee', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', padding: 0 }}>View All Requests →</button>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>Recent Attendance</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Check In</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 0', fontSize: '14px' }}>{record.date}</td>
                  <td style={{ padding: '12px 0' }}><span style={{ color: '#10b981', fontWeight: '500' }}>{record.status}</span></td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>{record.checkIn}</td>
                  <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>{record.checkOut}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setActiveTab('attendance')} style={{ marginTop: '16px', color: '#4361ee', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', padding: 0 }}>View Full Attendance →</button>
        </div>
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>📢 Announcements</h2>
      {announcementsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No announcements yet.</p>
      ) : (
        announcements.map((announcement) => (
          <div
            key={announcement.id}
            onClick={() => setSelectedAnnouncement(announcement)}
            style={{
              padding: '20px', borderRadius: '10px', marginBottom: '12px',
              backgroundColor: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s ease',
              border: '1px solid #e5e7eb',
              borderLeft: `4px solid ${announcement.is_pinned ? '#f59e0b' : '#4361ee'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {announcement.is_pinned && (
                  <span style={{ fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '10px', marginBottom: '8px', display: 'inline-block' }}>
                    📌 Pinned
                  </span>
                )}
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '4px 0 8px 0', color: '#1a1a1a' }}>{announcement.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                  {announcement.description?.substring(0, 150)}...
                </p>
                {announcement.attachment && (
                  <span style={{ fontSize: '12px', color: '#4361ee' }}>📎 Has attachment</span>
                )}
              </div>
              <div style={{ textAlign: 'right', marginLeft: '16px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: '#666', backgroundColor: '#e5e7eb', padding: '4px 10px', borderRadius: '12px' }}>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#4361ee' }}>Click to read →</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAttendance = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 20px 0' }}>Attendance History</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666' }}>Date</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666' }}>Check In</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#666' }}>Check Out</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>{record.date}</td>
                <td style={{ padding: '16px' }}><span style={{ color: '#10b981', fontWeight: '500' }}>{record.status}</span></td>
                <td style={{ padding: '16px', color: '#666' }}>{record.checkIn}</td>
                <td style={{ padding: '16px', color: '#666' }}>{record.checkOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLeaves = () => (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Leave Requests</h2>
        <button 
          onClick={() => setShowApplyModal(true)} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4361ee', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
        >
          <span>📋</span> Apply for Leave
        </button>
      </div>
      {leaveHistoryLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Leave Type</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Duration</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Start Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>End Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Reason</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {safeLeaveHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No leave requests found. Click "Apply for Leave" to create one.</td>
                </tr>
              ) : (
                safeLeaveHistory.map((leave) => {
                  const start = new Date(leave.start_date);
                  const end = new Date(leave.end_date);
                  const days = leave.leave_days || Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  const appliedDate = leave.applied_at ? new Date(leave.applied_at).toLocaleDateString() : 'N/A';
                  return (
                    <tr key={leave.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', fontWeight: '500' }}>{leave.leave_type}</td>
                      <td style={{ padding: '16px' }}>{days} day(s)</td>
                      <td style={{ padding: '16px', color: '#666' }}>{leave.start_date}</td>
                      <td style={{ padding: '16px', color: '#666' }}>{leave.end_date}</td>
                      <td style={{ padding: '16px', color: '#666', maxWidth: '200px' }}>{leave.reason}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block', backgroundColor: leave.status === 'APPROVED' ? '#d1fae5' : leave.status === 'REJECTED' ? '#fee2e2' : '#fff3cd', color: leave.status === 'APPROVED' ? '#065f46' : leave.status === 'REJECTED' ? '#991b1b' : '#856404' }}>
                          {leave.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#666' }}>{appliedDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    if (profileLoading && !employeeData) {
      return <div style={{ textAlign: 'center', padding: '40px' }}>Loading profile...</div>;
    }

    const canEditPhone = userRole === 'EMPLOYEE';
    const canEditEmergency = userRole === 'EMPLOYEE';
    const canViewEducation = true;
    const canViewBankDetails = true;

    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <style>{`
          @media (max-width: 1024px) {
            .profile-layout { grid-template-columns: 1fr !important; }
          }
          .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          @media (max-width: 768px) {
            .field-row { grid-template-columns: 1fr !important; }
          }
        `}</style>

        <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          
          {/* LEFT: Profile Summary Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '32px 24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #f0f1f3',
            height: 'fit-content',
            position: 'sticky',
            top: '24px'
          }}>
            {/* Profile Image */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }} />
              ) : employeeData?.profile_image ? (
                <img src={getImageUrl(employeeData.profile_image)} alt="Profile" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }} />
              ) : (
                <div style={{ width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '4px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <User size={60} color="#9ca3af" />
                </div>
              )}
            </div>

            {/* Name & ID */}
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', textAlign: 'center', color: '#1f2937' }}>
              {employeeData?.first_name} {employeeData?.last_name}
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '0 0 16px 0', fontWeight: '500' }}>
              ID: {getEmployeeId()}
            </p>

            {/* Department Tag */}
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                {employeeData?.department || 'No Department'}
              </div>
              <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '500', marginTop: '4px' }}>
                {employeeData?.designation || 'Employee'}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '20px 0' }}></div>

            {/* Quick Info */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</div>
              <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500', wordBreak: 'break-all' }}>{employeeData?.email || 'Not set'}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</div>
              <div style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{formatDate(employeeData?.joining_date)}</div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditMode(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '16px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>

          {/* RIGHT: Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. PERSONAL INFORMATION */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #f0f1f3'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={20} color="#3b82f6" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                  Personal Information
                </h3>
              </div>

              <div className="field-row">
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Full Name</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={14} color="#9ca3af" />
                    {employeeData?.first_name} {employeeData?.last_name}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Email Address</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={14} color="#9ca3af" />
                    {employeeData?.email || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="field-row" style={{ marginTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Phone Number</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: canEditPhone ? '#f0fdf4' : '#f9fafb',
                    borderRadius: '8px',
                    border: canEditPhone ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                    opacity: canEditPhone ? 1 : 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {canEditPhone ? <Phone size={14} color="#10b981" /> : <Lock size={14} color="#9ca3af" />}
                    {employeeData?.phone || 'Not set'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Gender</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={14} color="#9ca3af" />
                    {employeeData?.gender || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="field-row" style={{ marginTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Language</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={14} color="#9ca3af" />
                    English
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Date Joined</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lock size={14} color="#9ca3af" />
                    {formatDate(employeeData?.joining_date)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Address</label>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  padding: '10px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Lock size={14} color="#9ca3af" />
                  {employeeData?.address || 'Not set'}
                </div>
              </div>
            </div>

            {/* 2. EMERGENCY CONTACT */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #f0f1f3'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                  Emergency Contact
                </h3>
              </div>

              <div className="field-row">
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Name</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: canEditEmergency ? '#fef3c7' : '#f9fafb',
                    borderRadius: '8px',
                    border: canEditEmergency ? '1px solid #fde047' : '1px solid #e5e7eb'
                  }}>
                    {employeeData?.emergency_contact_name || 'Not set'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Relationship</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: canEditEmergency ? '#fef3c7' : '#f9fafb',
                    borderRadius: '8px',
                    border: canEditEmergency ? '1px solid #fde047' : '1px solid #e5e7eb'
                  }}>
                    {employeeData?.emergency_contact_relationship || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="field-row" style={{ marginTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Contact Number</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: canEditEmergency ? '#fef3c7' : '#f9fafb',
                    borderRadius: '8px',
                    border: canEditEmergency ? '1px solid #fde047' : '1px solid #e5e7eb'
                  }}>
                    {employeeData?.emergency_contact_phone || 'Not set'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Occupation</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: canEditEmergency ? '#fef3c7' : '#f9fafb',
                    borderRadius: '8px',
                    border: canEditEmergency ? '1px solid #fde047' : '1px solid #e5e7eb'
                  }}>
                    {employeeData?.emergency_contact_occupation || 'Not set'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. EDUCATION DETAILS */}
            {canViewEducation && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #f0f1f3',
                opacity: userRole === 'EMPLOYEE' ? 0.85 : 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={20} color="#6366f1" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                    Education Details
                  </h3>
                  {userRole === 'EMPLOYEE' && (
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={12} />
                      Admin Only
                    </span>
                  )}
                </div>

                <div className="field-row">
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Education Level</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {employeeData?.education_level || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Institution</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {employeeData?.institute_name || 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="field-row" style={{ marginTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Year of Passing</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {employeeData?.year_of_passing || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Marks</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {getMarksDisplay()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BANK DETAILS */}
            {canViewBankDetails && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #f0f1f3',
                opacity: userRole === 'EMPLOYEE' ? 0.85 : 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#fce7f3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign size={20} color="#ec4899" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                    Bank Details
                  </h3>
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} />
                    Confidential
                  </span>
                </div>

                <div className="field-row">
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Bank Name</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {employeeData?.bank_name || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Account Number</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7,
                      letterSpacing: '2px'
                    }}>
                      {maskSensitiveData(employeeData?.account_number)}
                    </div>
                  </div>
                </div>

                <div className="field-row" style={{ marginTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>IFSC Code</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {employeeData?.ifsc_code || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Account Type</label>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      padding: '10px 12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      opacity: 0.7
                    }}>
                      {employeeData?.account_type || 'Not set'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Branch</label>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    opacity: 0.7
                  }}>
                    {employeeData?.branch_name || 'Not set'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EDIT MODAL */}
        {editMode && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '560px', backgroundColor: '#fff', borderRadius: '16px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Edit Profile</h2>
              <form onSubmit={handleProfileUpdate} encType="multipart/form-data">
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Profile Photo</label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                      <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(employeeData?.profile_image ? getImageUrl(employeeData.profile_image) : null); }} style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ) : employeeData?.profile_image ? (
                    <img src={getImageUrl(employeeData.profile_image)} alt="Current Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '2px dashed #d1d5db' }}>
                      <span style={{ fontSize: '40px', color: '#9ca3af' }}>📷</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: '12px', display: 'block', width: '100%', fontSize: '14px' }} />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Upload a profile picture (JPG, PNG, GIF)</p>
                </div>
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#4361ee' }}>Emergency Contact</h3>
                  {['emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone', 'emergency_contact_occupation'].map((field) => (
                    <div key={field} style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>{field.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}</label>
                      <input type="text" name={field} value={formData[field] || ''} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button type="button" onClick={() => setEditMode(false)} style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={profileSaving} style={{ padding: '10px 20px', backgroundColor: profileSaving ? '#9ca3af' : '#4361ee', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: profileSaving ? 'not-allowed' : 'pointer' }}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHolidays = () => <EmployeeHolidayPage />;
  const renderSalary = () => <Salary user={user} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'profile': return renderProfile();
      case 'attendance': return renderAttendance();
      case 'leaves': return renderLeaves();
      case 'announcements': return renderAnnouncements();
      case 'holidays': return renderHolidays();
      case 'salary': return renderSalary();
      default: return renderDashboard();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f5f7fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
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

          <div style={{
            position: 'relative',
            width: '80px',
            height: '150px',
            marginLeft: '-10px',
            display: 'inline-block',
            verticalAlign: 'middle'
          }}>
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
          <p style={{ fontSize: '10px', color: '#666', margin: '-60px 0 0 0', textAlign: 'center', letterSpacing: '1px' }}>EMPLOYEE PORTAL</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {menuItems.map((item) => (
            <div key={item.id} onClick={() => handleMenuItemClick(item)} style={{ padding: '12px 20px', margin: '4px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: activeTab === item.id ? '#eef2ff' : 'transparent', color: activeTab === item.id ? '#4361ee' : '#666', fontWeight: activeTab === item.id ? '600' : '400', transition: 'all 0.2s ease' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '12px 24px', 
          borderBottom: '1px solid #e5e7eb', 
          flexShrink: 0,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#666' }}>Welcome, <strong>{employeeData?.first_name || user?.username || 'Employee'}</strong></span>
            {isManager && (
              <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                👔 Manager
              </span>
            )}
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#F97316', color: '#fff', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EA580C'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F97316'}>
            🚪 Logout
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {renderContent()}
        </div>
      </div>

      <ApplyLeave show={showApplyModal} onClose={() => setShowApplyModal(false)} onSuccess={() => { fetchLeaveHistory({ showSpinner: false }); showNotification('Leave request submitted successfully!', 'success'); }} />

      {/* Announcement Modal */}
      {selectedAnnouncement && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedAnnouncement(null)}>
          <div style={{ width: '100%', maxWidth: '700px', backgroundColor: '#fff', borderRadius: '16px', padding: '40px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedAnnouncement(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            {selectedAnnouncement.is_pinned && <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>📌 Pinned</span>}
            <h1 style={{ fontSize: '26px', fontWeight: '700', margin: '0 0 16px 0' }}>{selectedAnnouncement.title}</h1>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>📅 {new Date(selectedAnnouncement.created_at).toLocaleDateString()}</span>
              {selectedAnnouncement.event_date && <span style={{ fontSize: '13px', color: '#4361ee' }}>🗓 Event: {new Date(selectedAnnouncement.event_date).toLocaleDateString()}</span>}
              {selectedAnnouncement.expiry_date && <span style={{ fontSize: '13px', color: '#ef4444' }}>⏳ Expires: {new Date(selectedAnnouncement.expiry_date).toLocaleDateString()}</span>}
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '24px' }} />
            <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px 0' }}>{selectedAnnouncement.description}</p>
            {selectedAnnouncement.attachment && (
              <div style={{ backgroundColor: '#f8faff', border: '1px solid #e0e7ff', borderRadius: '10px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px 0', fontWeight: '600' }}>📎 Attachment</p>
                <button onClick={async () => {
                  try {
                    const token = localStorage.getItem('access_token');
                    const url = selectedAnnouncement.attachment.startsWith('http') ? selectedAnnouncement.attachment : `http://127.0.0.1:8000${selectedAnnouncement.attachment}`;
                    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    if (!response.ok) throw new Error('Download failed');
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const fileName = url.split('/').pop();
                    const ext = fileName.split('.').pop().toLowerCase();
                    const viewable = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
                    if (viewable) { window.open(blobUrl, '_blank'); } else { const a = document.createElement('a'); a.href = blobUrl; a.download = fileName; a.click(); }
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                  } catch (err) { alert('Download failed: ' + err.message); }
                }} style={{ backgroundColor: '#4361ee', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  ⬇️ Download Attachment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;