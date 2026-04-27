import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLeaveManagement from './AdminLeaveManagement';
import { extractListData } from '../utils/extractListData';

// ─── Utility helpers ────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// ─── HR Reports Component ────────────────────────────────────────────────────
const ManagerHRReports = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dateMode, setDateMode] = useState('single');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDateDetail, setSelectedDateDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [filters, setFilters] = useState({
    reportType: 'attendance',
    scope: 'all',
    employeeId: '',
    department: 'all',
    singleDate: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    frequency: 'daily',
  });

  const reportTypes = [
    { value: 'attendance', label: 'Attendance',       icon: '📅', color: '#3B82F6' },
    { value: 'leave',      label: 'Leave',            icon: '📝', color: '#F59E0B' },
    { value: 'employee',   label: 'Employee Activity',icon: '👥', color: '#8B5CF6' },
    { value: 'salary',     label: 'Salary',           icon: '💰', color: '#10B981' },
  ];

  const presetRanges = [
    { value: 'today',     label: 'Today',        getRange: () => { const t = new Date().toISOString().split('T')[0]; return { startDate: t, endDate: t }; } },
    { value: 'yesterday', label: 'Yesterday',    getRange: () => { const d = new Date(); d.setDate(d.getDate()-1); const s = d.toISOString().split('T')[0]; return { startDate: s, endDate: s }; } },
    { value: 'week',      label: 'Last 7 Days',  getRange: () => { const e = new Date().toISOString().split('T')[0]; const s = new Date(); s.setDate(s.getDate()-7); return { startDate: s.toISOString().split('T')[0], endDate: e }; } },
    { value: 'month',     label: 'Last 30 Days', getRange: () => { const e = new Date().toISOString().split('T')[0]; const s = new Date(); s.setDate(s.getDate()-30); return { startDate: s.toISOString().split('T')[0], endDate: e }; } },
    { value: 'thisMonth', label: 'This Month',   getRange: () => { const t = new Date(); const s = new Date(t.getFullYear(), t.getMonth(), 1); return { startDate: s.toISOString().split('T')[0], endDate: t.toISOString().split('T')[0] }; } },
  ];

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { generateReport(); }, [filters, dateMode]);

  const fetchMeta = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const [empRes, deptRes] = await Promise.all([
        axios.get('/employees/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/departments/list/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setEmployees(extractListData(empRes.data));
      setDepartments(deptRes.data || []);
    } catch (e) { console.error(e); }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const endpoints = { attendance: '/reports/attendance/', leave: '/reports/leaves/', employee: '/reports/employees/', salary: '/reports/salary/' };
      const params = {
        report_type: filters.reportType,
        scope: filters.scope,
        department: filters.department !== 'all' ? filters.department : null,
        frequency: filters.frequency,
        date_mode: dateMode,
        ...(dateMode === 'single' ? { date: filters.singleDate } : { start_date: filters.startDate, end_date: filters.endDate }),
        ...(filters.scope === 'individual' && filters.employeeId ? { employee_id: filters.employeeId } : {}),
      };
      const token = localStorage.getItem('access_token');
      const res = await axios.get(endpoints[filters.reportType] || '/reports/attendance/', {
        params, headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (e) {
      setReportData([]); setSummary({});
    } finally { setLoading(false); }
  };

  const handlePreset = (val) => {
    const preset = presetRanges.find(p => p.value === val);
    if (preset) { const r = preset.getRange(); setFilters(f => ({ ...f, ...r })); }
  };

  const filteredEmployees = employees.filter(emp => {
    const s = employeeSearch.toLowerCase();
    return emp.first_name?.toLowerCase().includes(s) || emp.last_name?.toLowerCase().includes(s) || emp.employee_id?.toLowerCase().includes(s);
  });

  const selectedEmployee = employees.find(emp => emp.id === parseInt(filters.employeeId));
  const activeReportType = reportTypes.find(r => r.value === filters.reportType);

  const StatusBadge = ({ status }) => {
    const map = {
      Present:    { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
      Absent:     { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
      'On Leave': { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
      APPROVED:   { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
      REJECTED:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
      PENDING:    { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
      PAID:       { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
      Excellent:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
      Good:       { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
      Average:    { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
      Poor:       { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    };
    const sc = map[status] || map.PENDING;
    return (
      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
        {status}
      </span>
    );
  };

  const thStyle = { padding: '11px 16px', textAlign: 'left', color: '#666', fontSize: '12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' };

  const renderTable = (rows) => {
    if (!rows || rows.length === 0) return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>No records found</div>
      </div>
    );

    if (filters.reportType === 'attendance') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Employee','ID','Department','Status','Login','Logout','Hours'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((item, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff3e0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}>
            <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{item.employee_name}</td>
            <td style={tdStyle}><code style={{ fontSize: '12px', color: '#9ca3af' }}>{item.employee_id}</code></td>
            <td style={tdStyle}><span style={{ background: '#fff3e0', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{item.department}</span></td>
            <td style={tdStyle}><StatusBadge status={item.status} /></td>
            <td style={tdStyle}>{item.login_time || '—'}</td>
            <td style={tdStyle}>{item.logout_time || '—'}</td>
            <td style={{ ...tdStyle, fontWeight: '600' }}>{item.working_hours || '—'}</td>
          </tr>
        ))}</tbody>
      </table>
    );

    if (filters.reportType === 'leave') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Employee','ID','Department','Leave Type','Start','End','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((item, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff3e0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}>
            <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{item.employee_name}</td>
            <td style={tdStyle}><code style={{ fontSize: '12px', color: '#9ca3af' }}>{item.employee_id}</code></td>
            <td style={tdStyle}><span style={{ background: '#fff3e0', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{item.department}</span></td>
            <td style={tdStyle}><span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{item.leave_type}</span></td>
            <td style={tdStyle}>{item.start_date || '—'}</td>
            <td style={tdStyle}>{item.end_date || '—'}</td>
            <td style={tdStyle}><StatusBadge status={item.status} /></td>
          </tr>
        ))}</tbody>
      </table>
    );

    if (filters.reportType === 'employee') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Employee','ID','Department','Designation','Joining Date','Tenure','Leaves','Performance','Salary'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((item, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff3e0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}>
            <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{item.employee_name}</td>
            <td style={tdStyle}><code style={{ fontSize: '12px', color: '#9ca3af' }}>{item.employee_id}</code></td>
            <td style={tdStyle}><span style={{ background: '#fff3e0', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{item.department}</span></td>
            <td style={tdStyle}>{item.designation || '—'}</td>
            <td style={tdStyle}>{item.joining_date ? new Date(item.joining_date).toLocaleDateString('en-IN') : '—'}</td>
            <td style={tdStyle}>{item.tenure_years ? `${item.tenure_years}y` : '—'}</td>
            <td style={{ ...tdStyle, fontWeight: '700', color: '#f97316' }}>{item.leaves_taken ?? 0}</td>
            <td style={tdStyle}><StatusBadge status={item.performance_rating || 'Average'} /></td>
            <td style={{ ...tdStyle, fontWeight: '700' }}>₹{(item.last_salary || 0).toLocaleString('en-IN')}</td>
          </tr>
        ))}</tbody>
      </table>
    );

    if (filters.reportType === 'salary') return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{['Employee','ID','Department','Basic','Gross','Deductions','Net Salary','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((item, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff3e0'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#fafafa'}>
            <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{item.employee_name}</td>
            <td style={tdStyle}><code style={{ fontSize: '12px', color: '#9ca3af' }}>{item.employee_id}</code></td>
            <td style={tdStyle}><span style={{ background: '#fff3e0', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{item.department}</span></td>
            <td style={tdStyle}>₹{(item.basic_salary || 0).toLocaleString('en-IN')}</td>
            <td style={tdStyle}>₹{(item.gross_salary || 0).toLocaleString('en-IN')}</td>
            <td style={{ ...tdStyle, color: '#ef4444', fontWeight: '600' }}>₹{(item.total_deductions || 0).toLocaleString('en-IN')}</td>
            <td style={{ ...tdStyle, fontWeight: '800' }}>₹{(item.net_salary || 0).toLocaleString('en-IN')}</td>
            <td style={tdStyle}><StatusBadge status={item.payment_status} /></td>
          </tr>
        ))}</tbody>
      </table>
    );

    return null;
  };

  const renderSummary = () => {
    const cardStyle = (color) => ({ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'white', border: '1px solid #e5e7eb', flex: 1, minWidth: '100px', borderTop: `3px solid ${color}` });

    if (filters.reportType === 'attendance') return (
      <div style={{ display: 'flex', gap: '12px', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Employees', value: summary.total_employees ?? 0, color: '#f97316' },
          { label: 'Present', value: summary.present ?? 0, color: '#10b981' },
          { label: 'Absent', value: summary.absent ?? 0, color: '#ef4444' },
          { label: 'On Leave', value: summary.on_leave ?? 0, color: '#f59e0b' },
          ...(summary.attendance_rate !== undefined ? [{ label: 'Attendance %', value: `${summary.attendance_rate}%`, color: '#3b82f6' }] : []),
        ].map(s => (
          <div key={s.label} style={cardStyle(s.color)}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    );

    if (filters.reportType === 'leave') return (
      <div style={{ display: 'flex', gap: '12px', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Requests', value: summary.total_requests ?? reportData.length, color: '#f97316' },
          { label: 'Approved', value: summary.approved ?? 0, color: '#10b981' },
          { label: 'Pending', value: summary.pending ?? 0, color: '#f59e0b' },
          { label: 'Rejected', value: summary.rejected ?? 0, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={cardStyle(s.color)}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    );

    if (filters.reportType === 'employee') return (
      <div style={{ display: 'flex', gap: '12px', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: summary.total_employees ?? reportData.length, color: '#f97316' },
          { label: 'Active', value: summary.active_employees ?? 0, color: '#10b981' },
          { label: 'New Joins', value: summary.new_joins ?? 0, color: '#3b82f6' },
          { label: 'Top Performers', value: summary.excellent_performers ?? 0, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={cardStyle(s.color)}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    );

    if (filters.reportType === 'salary') return (
      <div style={{ display: 'flex', gap: '12px', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {[
          { label: 'Employees', value: summary.total_employees ?? reportData.length, color: '#f97316' },
          { label: 'Total Net', value: `₹${(summary.total_net_salary || 0).toLocaleString('en-IN')}`, color: '#10b981' },
          { label: 'Avg Net', value: `₹${(summary.average_net_salary || 0).toLocaleString('en-IN')}`, color: '#3b82f6' },
          { label: 'Paid', value: summary.paid_salaries ?? 0, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={cardStyle(s.color)}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    );

    return null;
  };

  const renderDateGroups = () => reportData.map((group, idx) => (
    <div key={idx} style={{ background: 'white', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        <span>📅</span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', flex: 1 }}>{formatDate(group.date)}</span>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Present',  value: group.present,   color: '#10b981' },
            { label: 'Absent',   value: group.absent,    color: '#ef4444' },
            { label: 'On Leave', value: group.on_leave,  color: '#f59e0b' },
            { label: 'Att. %',   value: `${group.attendance_percentage || 0}%`, color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: '44px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: s.color }}>{s.value ?? 0}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
          <button onClick={() => { setSelectedDateDetail({ date: group.date, details: group.employees || [] }); setShowDetailModal(true); }}
            style={{ padding: '6px 12px', background: '#fff3e0', border: '1px solid #fed7aa', color: '#ea580c', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            👁 Details
          </button>
        </div>
      </div>
      {group.employees && group.employees.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Employee','ID','Status','Login – Logout'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {group.employees.slice(0, 5).map((emp, ei) => (
                <tr key={ei} style={{ backgroundColor: ei % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{emp.employee_name}</td>
                  <td style={tdStyle}><code style={{ fontSize: '12px', color: '#9ca3af' }}>{emp.employee_id}</code></td>
                  <td style={tdStyle}><StatusBadge status={emp.status} /></td>
                  <td style={tdStyle}>{emp.login_time || emp.logout_time ? `${emp.login_time || '—'} → ${emp.logout_time || '—'}` : '—'}</td>
                </tr>
              ))}
              {group.employees.length > 5 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '10px', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                  +{group.employees.length - 5} more employees
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  ));

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', background: 'white', color: '#111', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374141', marginBottom: '6px' };

  return (
    <div style={{ padding: '24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', color: '#1a1a1a' }}>📊 Reports & Analytics</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Analyze your team's performance and attendance data</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => downloadCSV(reportData, `${filters.reportType}_report`)}
            style={{ padding: '9px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            ⬇ Export CSV
          </button>
          <button onClick={() => window.print()}
            style={{ padding: '9px 16px', background: 'white', color: '#666', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            🖨 Print
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {reportTypes.map(rt => (
          <button key={rt.value}
            onClick={() => setFilters(f => ({ ...f, reportType: rt.value }))}
            style={{
              padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              border: filters.reportType === rt.value ? `1.5px solid ${rt.color}` : '1px solid #e5e7eb',
              background: filters.reportType === rt.value ? `${rt.color}15` : 'white',
              color: filters.reportType === rt.value ? rt.color : '#666',
              transition: 'all 0.2s',
            }}>
            {rt.icon} {rt.label}
          </button>
        ))}
      </div>

      {/* Filters Card */}
      <div style={{ background: 'white', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 20px', borderBottom: filtersExpanded ? '1px solid #e5e7eb' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setFiltersExpanded(f => !f)}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔽 Filters & Date Selection
          </span>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {activeReportType?.label} · {dateMode === 'single' ? formatDate(filters.singleDate) : `${filters.startDate} → ${filters.endDate}`}
          </span>
        </div>

        {filtersExpanded && (
          <div style={{ padding: '20px' }}>
            {/* Row 1: Scope + Employee + Department */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={labelStyle}>👥 Scope</label>
                <select value={filters.scope}
                  onChange={e => setFilters(f => ({ ...f, scope: e.target.value, employeeId: '' }))}
                  style={inputStyle}>
                  <option value="all">All Employees</option>
                  <option value="individual">Specific Employee</option>
                </select>
              </div>

              {filters.scope === 'individual' && (
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                  <label style={labelStyle}>🧑 Employee</label>
                  <div onClick={() => setShowEmployeeDropdown(v => !v)}
                    style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: selectedEmployee ? '#111' : '#9ca3af' }}>
                      {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Select Employee'}
                    </span>
                    <span>▾</span>
                  </div>
                  {showEmployeeDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🔍</span>
                        <input autoFocus value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)}
                          placeholder="Search…"
                          style={{ border: 'none', outline: 'none', fontSize: '13px', flex: 1, fontFamily: 'inherit' }} />
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredEmployees.map(emp => (
                          <div key={emp.id}
                            onClick={() => { setFilters(f => ({ ...f, employeeId: emp.id })); setShowEmployeeDropdown(false); setEmployeeSearch(''); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fff3e0'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#f97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                              {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{emp.first_name} {emp.last_name}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{emp.department} · {emp.employee_id}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: Date Mode */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>📅 Date Mode</label>
              <div style={{ display: 'inline-flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '3px' }}>
                {[{ key: 'single', label: 'Single Day' }, { key: 'range', label: 'Date Range' }].map(m => (
                  <button key={m.key} onClick={() => setDateMode(m.key)}
                    style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: dateMode === m.key ? 'white' : 'transparent', color: dateMode === m.key ? '#f97316' : '#666', fontSize: '13px', fontWeight: dateMode === m.key ? '600' : '400', cursor: 'pointer', boxShadow: dateMode === m.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Date Inputs */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
              {dateMode === 'single' ? (
                <div style={{ flex: '0 0 240px' }}>
                  <label style={labelStyle}>Select Date</label>
                  <input type="date" value={filters.singleDate}
                    onChange={e => setFilters(f => ({ ...f, singleDate: e.target.value }))}
                    style={inputStyle} />
                </div>
              ) : (
                <>
                  <div style={{ flex: '0 0 170px' }}>
                    <label style={labelStyle}>From</label>
                    <input type="date" value={filters.startDate}
                      onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div style={{ flex: '0 0 170px' }}>
                    <label style={labelStyle}>To</label>
                    <input type="date" value={filters.endDate}
                      onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div style={{ flex: '0 0 150px' }}>
                    <label style={labelStyle}>Quick Preset</label>
                    <select defaultValue="" onChange={e => handlePreset(e.target.value)} style={inputStyle}>
                      <option value="" disabled>Select…</option>
                      {presetRanges.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '0 0 130px' }}>
                    <label style={labelStyle}>Frequency</label>
                    <select value={filters.frequency}
                      onChange={e => setFilters(f => ({ ...f, frequency: e.target.value }))}
                      style={inputStyle}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <button onClick={generateReport} disabled={loading}
              style={{ padding: '10px 28px', background: loading ? '#d1d5db' : '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? (
                <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
              ) : '✔ Generate Report'}
            </button>
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{activeReportType?.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{activeReportType?.label} Report</span>
            {!loading && <span style={{ background: '#e5e7eb', color: '#666', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{reportData.length} records</span>}
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {dateMode === 'single' ? formatDate(filters.singleDate) : `${filters.startDate} → ${filters.endDate}`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ width: '32px', height: '32px', margin: '0 auto 12px', border: '3px solid #f3f3f3', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Loading report data…</span>
          </div>
        ) : reportData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>No data available</div>
            <div style={{ fontSize: '13px' }}>Try adjusting your date range or filters, then click Generate Report.</div>
          </div>
        ) : (
          <>
            {renderSummary()}
            {dateMode === 'range' && filters.reportType === 'attendance' ? (
              <div style={{ padding: '20px' }}>{renderDateGroups()}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>{renderTable(reportData)}</div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDateDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setShowDetailModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '700px', maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>📅 Day Detail</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{formatDate(selectedDateDetail.date)}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)}
                style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '16px', color: '#666' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {selectedDateDetail.details.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>No detail records.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ position: 'sticky', top: 0 }}>
                    {['Employee','ID','Department','Status','Login – Logout'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {selectedDateDetail.details.map((item, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...tdStyle, fontWeight: '600', color: '#111' }}>{item.employee_name}</td>
                        <td style={tdStyle}><code style={{ fontSize: '12px', color: '#9ca3af' }}>{item.employee_id}</code></td>
                        <td style={tdStyle}>{item.department}</td>
                        <td style={tdStyle}><StatusBadge status={item.status} /></td>
                        <td style={tdStyle}>{item.login_time && item.logout_time ? `${item.login_time} → ${item.logout_time}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ManagerAdminDashboard = ({ user, setUser, activePage }) => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(() => activePage || 'dashboard');
  const [managerProfile, setManagerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departments: 1,
    pendingLeaves: 0,
    attendanceRate: 95.2,
    totalLeavesTaken: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const cancelRef = useRef(null);

  const menuItems = [
    { name: 'Dashboard',           icon: '📊', section: 'dashboard' },
    { name: 'Team Members',        icon: '👥', section: 'team-members' },
    { name: 'Leave Management',    icon: '📝', section: 'leave-management' },
    { name: 'Attendance',          icon: '📅', section: 'attendance' },
    { name: 'Reports & Analytics', icon: '📈', section: 'reports' },
    { name: 'Profile',             icon: '👤', section: 'profile' },
  ];

  // ─── Data fetching ───────────────────────────────────────────────────────
  const fetchManagerProfileData = useCallback(async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('/employees/me/', { headers: { Authorization: `Bearer ${token}` } });
      setManagerProfile(res.data);
    } catch (e) { console.error(e); }
    finally { setProfileLoading(false); }
  }, []);

  const fetchManagerStats = useCallback(async () => {
    if (cancelRef.current) cancelRef.current.abort();
    cancelRef.current = new AbortController();
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const [statsRes, teamRes, leavesRes] = await Promise.all([
        axios.get('/dashboard-stats/',     { headers: { Authorization: `Bearer ${token}` }, signal: cancelRef.current.signal }),
        axios.get('department-employees/', { headers: { Authorization: `Bearer ${token}` }, signal: cancelRef.current.signal }),
        axios.get('/manager-leaves/',      { headers: { Authorization: `Bearer ${token}` }, signal: cancelRef.current.signal }),
      ]);
      const bs = statsRes.data;
      const teamList  = extractListData(teamRes.data);
      const leaveList = extractListData(leavesRes.data);
      setStats({
        totalEmployees:   bs.total_employees   || teamList.length,
        departments:      bs.unique_departments || 1,
        pendingLeaves:    bs.pending_leaves    || 0,
        attendanceRate:   bs.attendance_rate   || 95.2,
        totalLeavesTaken: bs.total_leaves      || leaveList.length,
      });
      setTeamMembers(teamList);
      setLeaveRequests(leaveList);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setTeamMembers([]); setLeaveRequests([]);
    } finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeSection === 'dashboard') fetchManagerStats();
    return () => { if (cancelRef.current) cancelRef.current.abort(); };
  }, [activeSection, fetchManagerStats]);

  useEffect(() => { if (activePage) setActiveSection(activePage); }, [activePage]);
  useEffect(() => { if (activeSection === 'profile') fetchManagerProfileData(); }, [activeSection, fetchManagerProfileData]);

  const handleNavigation = (section) => setActiveSection(section);
  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

  // ─── Section: Dashboard ──────────────────────────────────────────────────
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: '#1a1a1a' }}>
          Hello, {user?.username || 'Manager'}!
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Your department overview at a glance</p>
      </div>

      {statsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ width: '32px', height: '32px', margin: '0 auto 12px', border: '3px solid #f3f3f3', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Loading stats...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {[
            { label: 'Team Size',       value: stats.totalEmployees,        change: 'Active Members',    color: '#10b981' },
            { label: 'Pending Leaves',  value: stats.pendingLeaves,         change: 'Awaiting Approval', color: '#f59e0b' },
            { label: 'Attendance Rate', value: `${stats.attendanceRate}%`,  change: 'Current Period',    color: '#10b981' },
            { label: 'Total Leaves',    value: stats.totalLeavesTaken,      change: 'All Requests',      color: '#3b82f6' },
          ].map(({ label, value, change, color }) => (
            <div key={label} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{value}</div>
              <div style={{ color, fontSize: '13px', marginTop: '4px' }}>{change}</div>
            </div>
          ))}
        </div>
      )}

      {/* Control Room */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0' }}>Manager Control Room</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            {[
              { label: 'Team Members',   value: stats.totalEmployees, color: '#f97316', pct: Math.min(100, stats.totalEmployees * 5) },
              { label: 'Leaves Taken',   value: stats.totalLeavesTaken, color: '#10b981', pct: Math.min(100, stats.totalLeavesTaken * 5) },
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
              { label: 'Attendance Rate',   value: `${stats.attendanceRate}%`, color: '#f59e0b', pct: parseFloat(stats.attendanceRate) || 0 },
              { label: 'Pending Approvals', value: stats.pendingLeaves, color: '#ef4444', pct: Math.min(100, stats.pendingLeaves * 10) },
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

      {/* Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <span style={{ color: '#666' }}>{teamMembers.length} Members in your Department</span>
        <span style={{ color: '#f97316', cursor: 'pointer', fontSize: '14px' }}
          onClick={() => handleNavigation('leave-management')}>
          Review Pending Leave Requests →
        </span>
      </div>

      {/* Recent Leave Requests */}
      {leaveRequests.length > 0 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>📝 Recent Leave Requests</span>
            <button onClick={() => handleNavigation('leave-management')} style={{ fontSize: '13px', color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              View All →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Employee', 'Leave Type', 'Duration', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.slice(0, 5).map((leave, idx) => {
                  const sMap = {
                    APPROVED: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
                    REJECTED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                    PENDING:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
                  };
                  const sc = sMap[leave.status] || sMap.PENDING;
                  return (
                    <tr key={leave.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff3e0'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                            {(leave.employee_name || 'E').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111' }}>{leave.employee_name || `Employee #${leave.employee}`}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#fffbeb', color: '#b45309', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: '1px solid #fde68a' }}>{leave.leave_type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{leave.start_date} – {leave.end_date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Section: Team Members ───────────────────────────────────────────────
  const renderTeamMembers = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', color: '#1a1a1a' }}>👥 Team Members</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>All employees in your department</p>
        </div>
        <button onClick={fetchManagerStats} title="Refresh"
          style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#666', fontWeight: '500' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>Department Directory</span>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {statsLoading ? 'Loading…' : `${teamMembers.length} member${teamMembers.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {teamMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af', fontSize: '14px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
            No team members in your department yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  {['Employee', 'Department', 'Designation', 'Email', 'Phone'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#666', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, idx) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff3e0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fafafa'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                          {(member.first_name || member.full_name || 'T').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#111' }}>
                            {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username || 'Employee'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '1px' }}>ID: {member.employee_id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#fff3e0', color: '#ea580c', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', border: '1px solid #fed7aa' }}>
                        🏢 {member.department || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>{member.designation || 'Employee'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>📧 {member.email || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>📞 {member.phone || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Section: Attendance ─────────────────────────────────────────────────
  const renderAttendance = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', color: '#1a1a1a' }}>📅 Attendance Management</h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Team attendance records and daily/monthly overview</p>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>Attendance Overview</span>
        </div>
        <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>Attendance module coming soon</p>
          <p style={{ fontSize: '13px', margin: 0 }}>Team attendance records and daily/monthly overviews will appear here.</p>
        </div>
      </div>
    </div>
  );

  // ─── Section: Profile ────────────────────────────────────────────────────
  const renderProfile = () => {
    const profileData = managerProfile || user;
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0', color: '#1a1a1a' }}>👤 My Profile</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Your manager profile and account details</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', maxWidth: '640px' }}>
          {/* Profile banner */}
          <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '28px 24px 56px', textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Manager Profile</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>
              {profileData?.full_name || profileData?.username || user?.username || 'Manager'}
            </div>
          </div>

          {/* Avatar */}
          <div style={{ textAlign: 'center', marginTop: '-40px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            {profileLoading ? (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e5e7eb', margin: '0 auto', border: '4px solid white' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '32px', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: 'white', fontWeight: '800' }}>
                {(profileData?.full_name || profileData?.username || user?.username || 'M').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ marginTop: '10px' }}>
              <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', background: '#dbeafe', color: '#1d4ed8' }}>Manager</span>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {profileLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading profile…</div>
            ) : (
              <>
                <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>📋 Personal Information</div>
                  {[
                    ['Employee ID', profileData?.employee_id],
                    ['Full Name', profileData?.full_name || profileData?.username || user?.username],
                    ['Email', profileData?.email || user?.email],
                    ['Phone', profileData?.phone],
                    ['Department', profileData?.department || profileData?.managed_department],
                    ['Designation', profileData?.designation],
                    ['Joining Date', profileData?.joining_date],
                    ['Gender', profileData?.gender],
                    ['Address', profileData?.address],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
                      <span style={{ fontSize: '14px', color: '#111', fontWeight: '400' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
                {(profileData?.emergency_contact_name || profileData?.emergency_contact_phone) && (
                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>🚨 Emergency Contact</div>
                    {[
                      ['Name', profileData?.emergency_contact_name],
                      ['Relationship', profileData?.emergency_contact_relationship],
                      ['Phone', profileData?.emergency_contact_phone],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
                        <span style={{ fontSize: '14px', color: '#111' }}>{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Section router ──────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':        return renderDashboard();
      case 'team-members':     return renderTeamMembers();
      case 'leave-management': return <AdminLeaveManagement />;
      case 'attendance':       return renderAttendance();
      case 'reports':          return <ManagerHRReports user={user} />;
      case 'profile':          return renderProfile();
      default:                 return renderDashboard();
    }
  };

  // ─── Root render ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f5f7fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 40px', flexShrink: 0 }}>
          <span style={{ fontSize: '30px', fontWeight: '549', color: '#000000', letterSpacing: '-1px', fontFamily: "'Montserrat', 'Poppins', sans-serif" }}>EL</span>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ fontSize: '30px', fontWeight: '549', color: '#000000', fontFamily: "'Montserrat', 'Poppins', sans-serif" }}>O</span>
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '3px', height: '3px', backgroundColor: '#000000', borderRadius: '50%', zIndex: 2 }}></span>
          </div>

          <span style={{ fontSize: '30px', fontWeight: '549', color: '#000000', letterSpacing: '-1px', fontFamily: 'sans-serif' }}>G</span>
          <span style={{ fontSize: '30px', fontWeight: '549', color: '#ff9933', letterSpacing: '-1px', fontFamily: "'Montserrat', 'Poppins', sans-serif" }}>IXA</span>

          <div style={{ position: 'relative', width: '80px', height: '150px', marginLeft: '-10px', display: 'inline-block', verticalAlign: 'middle' }}>
            <div style={{ position: 'absolute', bottom: '90px', right: '29px', width: 0, height: 0, borderLeft: '18px solid transparent', borderRight: '18px solid transparent', borderBottom: '31px solid #4caf50', transform: 'rotate(-10deg)', transformOrigin: 'center', zIndex: 1 }} />
            <div style={{ position: 'absolute', top: '25px', left: '-5px', width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '24px solid #ff9933', transform: 'rotate(-50deg)', transformOrigin: 'center', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: '1px', right: '40px', width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '28px solid #2d3748', transform: 'rotate(30deg)', transformOrigin: 'center', zIndex: 3 }} />
          </div>

          <p style={{ fontSize: '10px', color: '#666', margin: '-60px 0 0 0', textAlign: 'center', letterSpacing: '1px' }}>MANAGER PORTAL</p>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {menuItems.map((item) => {
            const isActive = activeSection === item.section;
            return (
              <div key={item.name}
                onClick={() => handleNavigation(item.section)}
                style={{
                  padding: '12px 20px', margin: '4px 8px', borderRadius: '8px',
                  backgroundColor: isActive ? '#fff3e0' : 'transparent',
                  color: isActive ? '#f97316' : '#666',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  fontSize: '14px', fontWeight: isActive ? '600' : '400', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = '#fff3e0'; e.currentTarget.style.color = '#f97316'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#666'; } }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ backgroundColor: 'white', padding: '12px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <span>Manager Portal</span>
            <span>›</span>
            <span style={{ color: '#111', fontWeight: '500', textTransform: 'capitalize' }}>
              {activeSection.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => navigate('/employee')}
              style={{ padding: '8px 16px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ea580c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f97316'}>
              ← Employee Dashboard
            </button>
            <button onClick={handleLogout}
              style={{ padding: '8px 16px', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ea580c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f97316'}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, backgroundColor: '#f5f7fa' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ManagerAdminDashboard;
