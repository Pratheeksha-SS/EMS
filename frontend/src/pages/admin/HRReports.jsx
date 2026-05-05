import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';
import { Eye, Calendar, X } from 'lucide-react';
import ReportExport from '../../components/reports/ReportExport';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportSummaryCard from '../../components/reports/ReportSummaryCards';
import ReportTable from '../../components/reports/ReportTable';
import { formatDate } from '../../utils/reportUtils';

/* ─── Design Tokens (matching HRMS system) ──────────────────────────
   Primary:       #F97316  (orange-500)
   Primary Dark:  #EA580C  (orange-600)
   Primary Light: #FFF7ED  (orange-50)
   Accent:        #16A34A  (green-600)
   Accent Light:  #F0FDF4  (green-50)
   Neutral BG:    #F8FAFC
   Surface:       #FFFFFF
   Border:        #E2E8F0 / #F1F5F9
   Text Main:     #0F172A
   Text Muted:    #64748B
   ─────────────────────────────────────────────────────────────────── */

/* ─── Summary card configurations per report type ──────────────── */
const getSummaryCards = (reportType, summary) => {
  switch (reportType) {
    case 'attendance':
      return [
        { label: 'Total Employees', value: summary.total_employees ?? 0,  sub: 'In selected period', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
        { label: 'Present',         value: summary.present ?? 0,          sub: 'Marked present', gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)' },
        { label: 'Absent',          value: summary.absent ?? 0,           sub: 'Not marked in', gradient: 'linear-gradient(135deg, #DC2626, #B91C1C)', shadow: 'rgba(220,38,38,0.25)' },
        { label: 'On Leave',        value: summary.on_leave ?? 0,         sub: 'Approved leave', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.25)' },
      ];
    case 'leave':
      return [
        { label: 'Total Requests',  value: summary.total_leaves ?? 0,    sub: 'All requests',          icon: '📝', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
        { label: 'Approved',        value: summary.approved ?? 0,        sub: 'Leaves granted',        icon: '✅', gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)' },
        { label: 'Pending',         value: summary.pending ?? 0,         sub: 'Awaiting review',       icon: '⏳', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.25)' },
        { label: 'Rejected',        value: summary.rejected ?? 0,        sub: 'Leaves declined',       icon: '🚫', gradient: 'linear-gradient(135deg, #DC2626, #B91C1C)', shadow: 'rgba(220,38,38,0.25)' },
      ];
    case 'employee':
      return [
        { label: 'Total Employees', value: summary.total_employees ?? 0, sub: 'Total headcount',       icon: '👥', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
        { label: 'Active',          value: summary.active_employees ?? 0, sub: 'Currently active',     icon: '🟢', gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)' },
        { label: 'New Joins',       value: summary.new_joins ?? 0,       sub: 'Recent joiners',        icon: '🆕', gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)', shadow: 'rgba(37,99,235,0.25)' },
        { label: 'Top Performers',  value: summary.excellent_performers ?? 0, sub: 'Excellent rating', icon: '⭐', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.25)' },
      ];
    default:
      return [];
  }
};

/* ─── Date range label helper ────────────────────────────────────── */
const getDateLabel = (dateMode, filters) =>
  dateMode === 'single'
    ? formatDate(filters.singleDate)
    : `${formatDate(filters.startDate)} → ${formatDate(filters.endDate)}`;

/* ─── Detail Modal ───────────────────────────────────────────────── */
const DetailModal = ({ detail, onClose }) => {
  if (!detail) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '20px',
        animation: 'hrFadeIn 0.25s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '20px',
          width: '90%', maxWidth: '720px', maxHeight: '88vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          animation: 'hrSlideUp 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '20px 26px', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0', letterSpacing: '-0.3px' }}>
              📅 {formatDate(detail.date)}
            </h2>
            <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>
              {(detail.details || []).length} employee records
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '34px', height: '34px', borderRadius: '50%',
              fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['Employee', 'Emp ID', 'Department', 'Status', 'Login', 'Logout'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    color: '#64748B', fontSize: '11px', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '1.5px solid #F1F5F9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(detail.details || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No detail records available
                  </td>
                </tr>
              ) : (detail.details || []).map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #F8FAFC',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0F172A' }}>{item.employee_name}</td>
                  <td style={{ padding: '12px 16px', color: '#F97316', fontFamily: 'monospace', fontWeight: '700' }}>{item.employee_id}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: '#FFF7ED', color: '#EA580C',
                      padding: '2px 8px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '600', border: '1px solid #FED7AA',
                    }}>{item.department || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      backgroundColor: item.status === 'Present' ? '#F0FDF4' : item.status === 'Absent' ? '#FEF2F2' : '#FFFBEB',
                      color: item.status === 'Present' ? '#166534' : item.status === 'Absent' ? '#991B1B' : '#92400E',
                      border: `1px solid ${item.status === 'Present' ? '#BBF7D0' : item.status === 'Absent' ? '#FECACA' : '#FDE68A'}`,
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{item.login_time || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{item.logout_time || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1.5px solid #F1F5F9',
          backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px', backgroundColor: '#F8FAFC', color: '#475569',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              cursor: 'pointer', fontWeight: '700', fontSize: '13px',
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Date-group Card (range mode for attendance) ────────────────── */
const DateGroupCard = ({ group, onViewDetail }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: '14px',
    border: '1.5px solid #F1F5F9', overflow: 'hidden',
    marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    animation: 'hrFadeIn 0.3s ease',
  }}>
    {/* Card Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 20px', backgroundColor: '#FAFAFA',
      borderBottom: '1.5px solid #F1F5F9',
    }}>
      <Calendar size={18} color="#F97316" />
      <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', flex: 1 }}>
        {formatDate(group.date)}
      </span>
      <button
        onClick={() => onViewDetail(group)}
        style={{
          padding: '6px 14px', fontSize: '12px', fontWeight: '700',
          backgroundColor: '#FFF7ED', color: '#EA580C',
          border: '1.5px solid #FED7AA', borderRadius: '8px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F97316'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#F97316'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.color = '#EA580C'; e.currentTarget.style.borderColor = '#FED7AA'; }}
      >
        <Eye size={13} /> View Details
      </button>
    </div>

    {/* Quick Stats Row */}
    <div style={{
      display: 'flex', gap: '0', padding: '0',
      borderBottom: '1px solid #F8FAFC',
    }}>
      {[
        { label: 'Present',      value: group.present ?? 0,             color: '#16A34A', bg: '#F0FDF4' },
        { label: 'Absent',       value: group.absent ?? 0,              color: '#DC2626', bg: '#FEF2F2' },
        { label: 'On Leave',     value: group.on_leave ?? 0,            color: '#D97706', bg: '#FFFBEB' },
        { label: 'Attendance %', value: `${group.attendance_percentage || 0}%`, color: '#2563EB', bg: '#EFF6FF' },
      ].map(({ label, value, color, bg }, i, arr) => (
        <div key={label} style={{
          flex: 1, padding: '14px 16px', textAlign: 'center',
          backgroundColor: bg,
          borderRight: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
        }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
        </div>
      ))}
    </div>

    {/* Mini employee preview */}
    {group.employees && group.employees.length > 0 && (
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {group.employees.slice(0, 6).map((emp, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              fontSize: '12px', fontWeight: '600', color: '#475569',
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: emp.status === 'Present' ? '#16A34A' : emp.status === 'Absent' ? '#DC2626' : '#D97706',
              }} />
              {emp.employee_name}
            </div>
          ))}
          {group.employees.length > 6 && (
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              +{group.employees.length - 6} more
            </span>
          )}
        </div>
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   HRReports — Main Component
   ═══════════════════════════════════════════════════════════════════ */
const HRReports = ({ user, isManager = false }) => {
  const [loading, setLoading]       = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary]       = useState({});
  const [employees, setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dateMode, setDateMode]     = useState('single');
  const [detailModal, setDetailModal] = useState(null);
  const [notification, setNotification] = useState(null);

  const [filters, setFilters] = useState({
    reportType: 'attendance',
    scope:      'all',
    employeeId: '',
    department: 'all',
    singleDate: new Date().toISOString().split('T')[0],
    startDate:  new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate:    new Date().toISOString().split('T')[0],
    frequency:  'daily',
  });

  /* ── Initial data fetch ─────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          api.get('/employees/'),
          api.get('/departments/list/'),
        ]);
        setEmployees(extractListData(empRes.data));
        setDepartments(extractListData(deptRes.data));
      } catch (err) {
        console.error('Error fetching employees/departments:', err);
      }
    })();
  }, []);

  /* ── Auto-generate on filter change ────────────────────────────── */
  useEffect(() => {
    generateReport();
  }, [filters, dateMode]);

  /* ── Report API call ────────────────────────────────────────────── */
  const generateReport = async () => {
    setLoading(true);
    try {
      const endpointMap = {
        attendance: '/reports/attendance/',
        leave:      '/reports/leaves/',
        employee:   '/reports/employees/',
      };
      const endpoint = endpointMap[filters.reportType];
      if (!endpoint) return;

      const params = {
        report_type: filters.reportType,
        scope:       filters.scope,
        department:  filters.department !== 'all' ? filters.department : null,
        frequency:   filters.frequency,
        date_mode:   dateMode,
      };

      if (dateMode === 'single') {
        params.date = filters.singleDate;
      } else {
        params.start_date = filters.startDate;
        params.end_date   = filters.endDate;
      }

      if (filters.scope === 'individual' && filters.employeeId) {
        params.employee_id = filters.employeeId;
      }

      const res = await api.get(endpoint, { params });
      setReportData(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error('Error generating report:', err);
      setReportData([]);
      setSummary({});
      showNotice('Failed to generate report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  /* ── Flatten range data for export ─────────────────────────────── */
  const flatExportData = useMemo(() => {
    if (!Array.isArray(reportData)) return [];
    if (dateMode === 'range' && filters.reportType === 'attendance') {
      return reportData.flatMap(group =>
        (group.employees || []).map(emp => ({ ...emp, date: group.date }))
      );
    }
    return reportData;
  }, [reportData, dateMode, filters.reportType]);

  const summaryCards   = getSummaryCards(filters.reportType, summary);
  const dateLabel      = getDateLabel(dateMode, filters);
  const isRangeAttend  = dateMode === 'range' && filters.reportType === 'attendance';
  const isTableReport  = ['employee'].includes(filters.reportType) ||
                         (dateMode === 'single' && filters.reportType !== 'employee');

  const reportTitleMap = {
    attendance: '📅 Attendance Report',
    leave:      '📝 Leave Report',
    employee:   '👥 Employee Activity',
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes hrFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes hrSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes hrSpin { to { transform: rotate(360deg); } }
        @keyframes summaryPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        @media print { .no-print { display: none; } }
      `}</style>

      {/* ── Toast Notification ─────────────────────────────────────── */}
      {notification && (
        <div style={{
          position: 'fixed', top: '22px', right: '22px', zIndex: 2500,
          padding: '13px 20px', borderRadius: '12px', color: '#fff',
          fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backgroundColor: notification.type === 'success' ? '#16A34A'
            : notification.type === 'error' ? '#DC2626' : '#2563EB',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'hrSlideUp 0.3s ease',
        }}>
          <span style={{ fontSize: '16px' }}>
            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {notification.message}
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '26px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>📈</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              {isManager ? 'Team Reports' : 'HR Reports'}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            {isManager
              ? "Analyze your team's attendance, leave, and performance"
              : 'Generate and export detailed HR analytics across the organization'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="no-print">
          <ReportExport
            data={flatExportData}
            reportType={filters.reportType}
            summary={summary}
            dateLabel={dateLabel}
            filename={`${filters.reportType}_report_${filters.singleDate || filters.startDate}`}
          />
          <button
            onClick={() => window.print()}
            style={{
              padding: '10px 20px', backgroundColor: 'white', color: '#475569',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ── Filters Panel ──────────────────────────────────────────── */}
      <div className="no-print">
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          dateMode={dateMode}
          setDateMode={setDateMode}
          employees={employees}
          departments={departments}
          isManager={isManager}
          onGenerate={generateReport}
          loading={loading}
        />
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '18px', marginBottom: '26px',
      }}>
        {loading
          ? [1, 2, 3, 4].map(i => <ReportSummaryCard key={i} loading={true} />)
          : summaryCards.map((card, i) => (
              <ReportSummaryCard key={i} {...card} />
            ))
        }
      </div>

      {/* ── Results Header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
            {reportTitleMap[filters.reportType] || 'Report'} — {dateLabel}
          </span>
          <span style={{
            backgroundColor: '#FFF7ED', color: '#EA580C',
            padding: '2px 10px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA',
          }}>
            {loading ? '…' : flatExportData.length} records
          </span>
        </div>
        {!loading && flatExportData.length === 0 && (
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            No data — try adjusting date or filters
          </span>
        )}
      </div>

      {/* ── Main Report Output ─────────────────────────────────────── */}
      {isRangeAttend ? (
        /* Range mode: date-grouped cards */
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '140px', backgroundColor: 'white', borderRadius: '14px',
                border: '1.5px solid #F1F5F9',
                animation: 'summaryPulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : reportData.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '14px',
            border: '1.5px solid #F1F5F9', padding: '64px',
            textAlign: 'center', color: '#94A3B8',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>
              No data found
            </div>
            <div style={{ fontSize: '13px' }}>
              Try selecting a different date range or adjusting your filters
            </div>
          </div>
        ) : (
          reportData.map((group, idx) => (
            <DateGroupCard
              key={idx}
              group={group}
              onViewDetail={grp => setDetailModal({ date: grp.date, details: grp.employees || grp.details || [] })}
            />
          ))
        )
      ) : (
        /* Single day / employee: standard table */
        <ReportTable
          data={reportData}
          reportType={filters.reportType}
          loading={loading}
        />
      )}

      {/* ── Detail Modal ───────────────────────────────────────────── */}
      {detailModal && (
        <DetailModal
          detail={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
};

export default HRReports;