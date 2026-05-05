import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { extractListData } from "../utils/extractListData";
import {
  Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  FileText, Briefcase, Mail, Phone,
  Building2, RefreshCw,
  ThumbsUp, ThumbsDown, Eye, MessageSquare, X,
  Crown, ChevronLeft
} from 'lucide-react';

/* ─── Design Tokens (mirrors ManagerManagement.jsx palette) ──────────────────
   Primary       : #F97316  (orange-500)
   Primary Dark  : #EA580C  (orange-600)
   Primary Light : #FFF7ED  (orange-50)
   Accent        : #16A34A  (green-600)
   Accent Light  : #F0FDF4  (green-50)
   Neutral BG    : #F8FAFC
   Surface       : #FFFFFF
   Border        : #E2E8F0 / #F1F5F9
   Text Main     : #0F172A
   Text Muted    : #64748B
   ──────────────────────────────────────────────────────────────────────────── */

const ManagerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("team");
  const [expandedLeaveId, setExpandedLeaveId] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [managerInfo, setManagerInfo] = useState(null);

  // State for employee view modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    department: ""
  });

  // ─── Shared Style Helpers ─────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#0F172A',
    backgroundColor: '#fff',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const spinnerStyle = {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  };

  const AvatarCircle = ({ name, size = 38, fontSize = 14, gradient = 'linear-gradient(135deg, #F97316, #EA580C)' }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: gradient,
      color: 'white', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: '700', fontSize,
      flexShrink: 0,
    }}>
      {(name || 'E').charAt(0).toUpperCase()}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getManagerDepartment = useCallback(async () => {
    try {
      const res = await api.get('/current-user/');
      setManagerInfo(res.data);
      return res.data.managed_department || '';
    } catch (err) {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.managed_department || '';
        }
      } catch (e) {
        console.error('Could not decode JWT:', e);
      }
      return '';
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const department = await getManagerDepartment();
      if (!department) {
        setError("You have not been assigned to a department yet. Please contact your administrator.");
        setLoading(false);
        return;
      }
      const teamRes = await api.get("department-employees/", { params: { page: 1, limit: 10 } });
      const teamData = extractListData(teamRes.data);
      setTeamMembers(teamData);

      const leavesRes = await api.get("manager-leaves/", { params: { page: 1, limit: 10 } });
      const teamLeaves = extractListData(leavesRes.data);

      const pending = teamLeaves.filter(l => l.status === 'PENDING').length;
      const approved = teamLeaves.filter(l => l.status === 'APPROVED').length;
      const rejected = teamLeaves.filter(l => l.status === 'REJECTED').length;

      setStats({
        totalEmployees: teamData.length,
        pendingLeaves: pending,
        approvedLeaves: approved,
        rejectedLeaves: rejected,
        department: department
      });
      setLeaveRequests(teamLeaves);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const msg = err.response?.data?.error || err.message || "Failed to load data";
      setError(msg);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [getManagerDepartment]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleLeaveAction = async (leaveId, action) => {
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${leaveId}/approve/`, {
        status: action,
        comments: comments
      });
      showToast(`Leave request ${action.toLowerCase()} successfully`, "success");
      setShowLeaveModal(false);
      setSelectedLeave(null);
      setComments("");
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating leave:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to update leave request";
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleLeaveExpansion = (leaveId) => {
    setExpandedLeaveId(expandedLeaveId === leaveId ? null : leaveId);
    const leave = leaveRequests.find(l => l.id === leaveId);
    if (leave) {
      setSelectedLeave(leave);
      setComments(leave.comments || "");
    }
  };

  const openLeaveModal = (leave) => {
    setSelectedLeave(leave);
    setComments(leave.comments || "");
    setShowLeaveModal(true);
  };

  const openEmployeeModal = (employee) => {
    setViewingEmployee(employee);
    setShowEmployeeModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const calcDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / 86400000) + 1;
  };

  const getLeaveTypeIcon = (type) => {
    switch (type) {
      case 'CASUAL': return <Calendar size={13} />;
      case 'SICK':   return <Clock size={13} />;
      case 'PAID':   return <Briefcase size={13} />;
      default:       return <FileText size={13} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return { bg: '#F0FDF4', color: '#15803D', dot: '#10B981', border: '#BBF7D0' };
      case 'REJECTED': return { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444', border: '#FECACA' };
      case 'PENDING':  return { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', border: '#FDE68A' };
      default:         return { bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8', border: '#E2E8F0' };
    }
  };

  const getEmployeeName = (leave) => leave.employee_name || `Employee #${leave.employee}`;
  const getEmployeeInitial = (leave) => getEmployeeName(leave).charAt(0).toUpperCase();

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #FED7AA', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: '15px', color: '#64748B', fontWeight: '600', margin: 0 }}>Loading your dashboard...</p>
        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Fetching team and leave data</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px' }}>

      {/* ── Global Styles ────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
        }
        .mgr-table-row:hover { background-color: #FFF7ED !important; }
        .mgr-leave-card:hover { border-color: #FED7AA !important; box-shadow: 0 4px 20px rgba(249,115,22,0.12) !important; }
        .mgr-action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          padding: '14px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          zIndex: 2000, animation: 'slideUp 0.3s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: '#0F172A', color: 'white',
          borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#3B82F6' : '#10B981'}`,
          fontSize: '14px', fontWeight: '600', maxWidth: '360px',
        }}>
          <span style={{ fontSize: '16px' }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}
          </span>
          {toast.message}
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px',
          padding: '12px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '12px', color: '#DC2626', fontSize: '14px',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchDashboardData} style={{
            marginLeft: 'auto', background: 'white', border: '1.5px solid #FECACA',
            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            color: '#DC2626', fontWeight: '700',
          }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>
              <Users size={22} color="white" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Manager Dashboard
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Manage your team and leave requests
            {stats.department && (
              <span> · <span style={{ color: '#F97316', fontWeight: '700' }}>{stats.department}</span> Department</span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/employee')}
            style={{
              padding: '11px 20px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '7px', color: '#475569', fontSize: '14px', fontWeight: '700',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <ChevronLeft size={16} /> Employee Dashboard
          </button>
          <button
            onClick={fetchDashboardData}
            title="Refresh data"
            style={{
              padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#64748B', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          {
            label: 'Team Members',
            value: loading ? '...' : stats.totalEmployees,
            sub: 'Active Workforce',
            gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
            shadow: 'rgba(249,115,22,0.25)',
          },
          {
            label: 'Pending Leaves',
            value: stats.pendingLeaves,
            sub: 'Awaiting Approval',
            gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
            shadow: 'rgba(245,158,11,0.25)',
          },
          {
            label: 'Approved Leaves',
            value: stats.approvedLeaves,
            sub: 'This Period',
            gradient: 'linear-gradient(135deg, #16A34A, #15803D)',
            shadow: 'rgba(22,163,74,0.25)',
          },
          {
            label: 'Rejected Leaves',
            value: stats.rejectedLeaves,
            sub: 'Not Sanctioned',
            gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
            shadow: 'rgba(239,68,68,0.2)',
          },
        ].map(card => (
          <div key={card.label} style={{
            background: card.gradient, padding: '22px 24px', borderRadius: '16px',
            color: 'white', boxShadow: `0 6px 20px ${card.shadow}`,
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '90px', height: '90px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.12)',
            }} />
            <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
            <div style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{card.value}</div>
            <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'white', padding: '5px', borderRadius: '14px', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
        {[
          { key: "team",    icon: <Users size={15} />,        label: "Team Members",       count: teamMembers.length },
          { key: "leaves",  icon: <Calendar size={15} />,     label: "All Leave Requests", count: leaveRequests.length },
          { key: "pending", icon: <AlertCircle size={15} />,  label: "Pending Approvals",  count: stats.pendingLeaves },
        ].map(({ key, icon, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'all 0.2s',
              background: activeTab === key ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'transparent',
              color: activeTab === key ? 'white' : '#64748B',
              boxShadow: activeTab === key ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            {icon}
            {label}
            <span style={{
              padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
              background: activeTab === key ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
              color: activeTab === key ? 'white' : '#64748B',
            }}>{count}</span>
          </button>
        ))}
      </div>

      {/* ─── Team Members Tab ─────────────────────────────────────────────────── */}
      {activeTab === "team" && (
        <div style={{
          backgroundColor: 'white', borderRadius: '14px',
          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1.5px solid #F1F5F9',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="#F97316" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                Your Team — {stats.department}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              {teamMembers.length} Member{teamMembers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {teamMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '36px' }}>👥</span>
                No team members assigned to your department yet.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['Employee', 'Contact', 'Department', 'Designation', 'Joining Date', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '13px 16px', textAlign: 'left',
                        color: '#64748B', fontSize: '11px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        borderBottom: '1.5px solid #F1F5F9',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, idx) => (
                    <tr
                      key={member.id}
                      className="mgr-table-row"
                      style={{
                        borderBottom: '1px solid #F8FAFC',
                        transition: 'background-color 0.15s',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AvatarCircle
                            name={member.full_name || member.first_name || 'E'}
                            size={38} fontSize={14}
                          />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                              {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username || 'Employee'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '1px' }}>
                              ID: {member.employee_id || member.id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={11} /> {member.email || member.user_email || 'N/A'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={11} /> {member.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          backgroundColor: '#FFF7ED', color: '#EA580C',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: '600', border: '1px solid #FED7AA',
                        }}>
                          <Building2 size={11} /> {member.department || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                        {member.designation || 'Employee'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                        {formatDate(member.joining_date)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          className="mgr-action-btn"
                          onClick={() => openEmployeeModal(member)}
                          style={{
                            padding: '6px 12px', background: '#EFF6FF', color: '#3B82F6',
                            border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '12px',
                            fontWeight: '600', cursor: 'pointer', display: 'inline-flex',
                            alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── All Leaves Tab ───────────────────────────────────────────────────── */}
      {activeTab === "leaves" && (
        <div style={{
          backgroundColor: 'white', borderRadius: '14px',
          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1.5px solid #F1F5F9',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#F97316" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>All Leave Requests</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              {leaveRequests.length} Request{leaveRequests.length !== 1 ? 's' : ''}
            </span>
          </div>

          {leaveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '36px' }}>📅</span>
                No leave requests found for your department.
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {leaveRequests.map((leave) => {
                const days = calcDays(leave.start_date, leave.end_date);
                const sc = getStatusColor(leave.status);
                const isExpanded = expandedLeaveId === leave.id;
                return (
                  <div
                    key={leave.id}
                    className="mgr-leave-card"
                    style={{
                      border: '1.5px solid #F1F5F9', borderRadius: '14px', overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AvatarCircle name={getEmployeeName(leave)} size={38} fontSize={14} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{getEmployeeName(leave)}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px', fontFamily: 'monospace' }}>
                            ID: {leave.employee_id || leave.employee}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px',
                        flexShrink: 0,
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                        {leave.status}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          backgroundColor: '#FFFBEB', color: '#B45309',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: '600', border: '1px solid #FDE68A',
                        }}>
                          {getLeaveTypeIcon(leave.leave_type)} {leave.leave_type}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          backgroundColor: '#F8FAFC', color: '#64748B',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: '600', border: '1px solid #E2E8F0',
                        }}>
                          <Calendar size={11} /> {days} day{days !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Duration</div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600', marginBottom: '12px' }}>
                        {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Reason</div>
                      <div style={{
                        fontSize: '13px', color: '#475569', backgroundColor: '#F8FAFC',
                        padding: '10px 12px', borderRadius: '8px', lineHeight: '1.5',
                        border: '1px solid #F1F5F9',
                      }}>
                        {leave.reason || 'No reason provided'}
                      </div>

                      {/* Expanded Action Panel */}
                      {isExpanded && leave.status === 'PENDING' && (
                        <div style={{ marginTop: '14px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1.5px solid #E2E8F0', animation: 'slideUp 0.2s ease' }}>
                          <label style={labelStyle}>Review Comments</label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add comments for this leave request..."
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '12px' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedLeaveId(null); }}
                              style={{
                                padding: '7px 14px', background: '#F8FAFC', color: '#475569',
                                border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '12px',
                                fontWeight: '700', cursor: 'pointer',
                              }}
                            >Cancel</button>
                            <button
                              disabled={actionLoading}
                              onClick={(e) => { e.stopPropagation(); handleLeaveAction(leave.id, 'REJECTED'); }}
                              style={{
                                padding: '7px 14px', background: '#EF4444', color: 'white',
                                border: 'none', borderRadius: '8px', fontSize: '12px',
                                fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                opacity: actionLoading ? 0.7 : 1,
                              }}
                            >
                              {actionLoading ? <span style={spinnerStyle} /> : <ThumbsDown size={13} />}
                              {actionLoading ? 'Saving...' : 'Reject'}
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={(e) => { e.stopPropagation(); handleLeaveAction(leave.id, 'APPROVED'); }}
                              style={{
                                padding: '7px 14px', background: '#16A34A', color: 'white',
                                border: 'none', borderRadius: '8px', fontSize: '12px',
                                fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                opacity: actionLoading ? 0.7 : 1,
                              }}
                            >
                              {actionLoading ? <span style={spinnerStyle} /> : <ThumbsUp size={13} />}
                              {actionLoading ? 'Saving...' : 'Approve'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button
                          onClick={() => toggleLeaveExpansion(leave.id)}
                          style={{
                            flex: 1, padding: '7px 12px',
                            background: isExpanded ? '#F1F5F9' : 'linear-gradient(135deg, #F97316, #EA580C)',
                            color: isExpanded ? '#475569' : 'white',
                            border: 'none', borderRadius: '8px', fontSize: '12px',
                            fontWeight: '700', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Eye size={13} />
                          {isExpanded ? 'Hide Details' : leave.status === 'PENDING' ? 'Review' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Pending Approvals Tab ────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <div style={{
          backgroundColor: 'white', borderRadius: '14px',
          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1.5px solid #F1F5F9',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color="#F97316" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Pending Approvals</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              {stats.pendingLeaves} Pending
            </span>
          </div>

          {stats.pendingLeaves === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '36px' }}>✅</span>
                All leave requests have been processed.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '13px 16px', textAlign: 'left',
                        color: '#64748B', fontSize: '11px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        borderBottom: '1.5px solid #F1F5F9',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.filter(l => l.status === 'PENDING').map((leave, idx) => (
                    <tr
                      key={leave.id}
                      className="mgr-table-row"
                      style={{
                        borderBottom: '1px solid #F8FAFC',
                        transition: 'background-color 0.15s',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AvatarCircle name={getEmployeeName(leave)} size={38} fontSize={14} />
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{getEmployeeName(leave)}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '1px' }}>
                              ID: {leave.employee_id || leave.employee}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          backgroundColor: '#FFFBEB', color: '#B45309',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: '600', border: '1px solid #FDE68A',
                        }}>
                          {getLeaveTypeIcon(leave.leave_type)} {leave.leave_type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                        {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#F97316', fontFamily: 'monospace' }}>
                          {calcDays(leave.start_date, leave.end_date)}d
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: '#64748B' }}>
                          {leave.reason || 'No reason provided'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          className="mgr-action-btn"
                          onClick={() => openLeaveModal(leave)}
                          style={{
                            padding: '6px 12px', background: 'linear-gradient(135deg, #F97316, #EA580C)',
                            color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px',
                            fontWeight: '600', cursor: 'pointer', display: 'inline-flex',
                            alignItems: 'center', gap: '5px', transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
                          }}
                        >
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Employee Details Modal ────────────────────────────────────────────── */}
      {showEmployeeModal && viewingEmployee && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '620px',
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
          }}>
            {/* Modal Header Gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              padding: '32px 28px 60px', textAlign: 'center', position: 'relative',
            }}>
              <button onClick={() => setShowEmployeeModal(false)}
                style={{
                  position: 'absolute', top: '14px', right: '14px',
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Employee Profile
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                {viewingEmployee.full_name || `${viewingEmployee.first_name || ''} ${viewingEmployee.last_name || ''}`.trim() || 'Employee'}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '-44px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', fontSize: '38px',
                border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                color: 'white', fontWeight: '800',
              }}>
                {(viewingEmployee.full_name || viewingEmployee.first_name || 'E').charAt(0).toUpperCase()}
              </div>
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  backgroundColor: '#ECFDF5', color: '#15803D', border: '1px solid #BBF7D0',
                }}>
                  Team Member
                </span>
              </div>
            </div>

            <div style={{ padding: '0 28px 28px' }}>
              <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                  📋 Personal Information
                </div>
                <InfoRow label="Employee ID" value={viewingEmployee.employee_id} />
                <InfoRow label="Email" value={viewingEmployee.email || viewingEmployee.user_email} />
                <InfoRow label="Phone" value={viewingEmployee.phone} />
                <InfoRow label="Department" value={viewingEmployee.department || 'Not assigned'} />
                <InfoRow label="Designation" value={viewingEmployee.designation || 'Employee'} />
                <InfoRow label="Joining Date" value={formatDate(viewingEmployee.joining_date)} />
                <InfoRow label="Gender" value={viewingEmployee.gender} />
                <InfoRow label="Address" value={viewingEmployee.address} />
              </div>

              {(viewingEmployee.emergency_contact_name || viewingEmployee.emergency_contact_phone) && (
                <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                    🚨 Emergency Contact
                  </div>
                  <InfoRow label="Name" value={viewingEmployee.emergency_contact_name} />
                  <InfoRow label="Relationship" value={viewingEmployee.emergency_contact_relationship} />
                  <InfoRow label="Phone" value={viewingEmployee.emergency_contact_phone} />
                  <InfoRow label="Occupation" value={viewingEmployee.emergency_contact_occupation} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  style={{
                    padding: '10px 28px', backgroundColor: '#F8FAFC', color: '#475569',
                    border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '13px', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Leave Details / Review Modal ──────────────────────────────────────── */}
      {showLeaveModal && selectedLeave && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}
          onClick={e => e.target === e.currentTarget && setShowLeaveModal(false)}
        >
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '540px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              padding: '22px 28px', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0' }}>Leave Request Review</h2>
                <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>{getEmployeeName(selectedLeave)}</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
            </div>

            <div style={{ padding: '28px' }}>
              {/* Details Grid */}
              <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                  📋 Leave Details
                </div>
                <InfoRow label="Leave Type" value={selectedLeave.leave_type} />
                <InfoRow label="Start Date" value={formatDate(selectedLeave.start_date)} />
                <InfoRow label="End Date" value={formatDate(selectedLeave.end_date)} />
                <InfoRow label="Total Days" value={`${calcDays(selectedLeave.start_date, selectedLeave.end_date)} day(s)`} />
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>Status</span>
                  <span>{(() => {
                    const sc = getStatusColor(selectedLeave.status);
                    return (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                        {selectedLeave.status}
                      </span>
                    );
                  })()}</span>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Reason for Leave</label>
                <div style={{
                  fontSize: '13px', color: '#334155', backgroundColor: '#F8FAFC',
                  padding: '12px 14px', borderRadius: '10px', lineHeight: '1.6',
                  border: '1.5px solid #F1F5F9',
                }}>
                  {selectedLeave.reason || 'No reason provided'}
                </div>
              </div>

              {/* Existing comments for non-pending */}
              {selectedLeave.status !== 'PENDING' && selectedLeave.comments && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Manager's Comments</label>
                  <div style={{
                    fontSize: '13px', color: '#B45309', backgroundColor: '#FFFBEB',
                    padding: '12px 14px', borderRadius: '10px', lineHeight: '1.6',
                    border: '1.5px solid #FDE68A', display: 'flex', alignItems: 'flex-start', gap: '8px',
                  }}>
                    <MessageSquare size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    {selectedLeave.comments}
                  </div>
                </div>
              )}

              {/* Comment input for pending */}
              {selectedLeave.status === 'PENDING' && (
                <div style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Comments (Optional)</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '88px', resize: 'vertical' }}
                    placeholder="Add comments or notes about this leave request..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div style={{ padding: '0 28px 28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{
                  padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer',
                }}
              >Close</button>
              {selectedLeave.status === 'PENDING' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleLeaveAction(selectedLeave.id, 'REJECTED')}
                    style={{
                      padding: '10px 22px', backgroundColor: '#EF4444', color: 'white',
                      border: 'none', borderRadius: '10px', fontSize: '14px',
                      fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      opacity: actionLoading ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
                    }}
                  >
                    {actionLoading ? <span style={spinnerStyle} /> : <ThumbsDown size={15} />}
                    {actionLoading ? 'Saving...' : 'Reject'}
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleLeaveAction(selectedLeave.id, 'APPROVED')}
                    style={{
                      padding: '10px 22px', backgroundColor: '#16A34A', color: 'white',
                      border: 'none', borderRadius: '10px', fontSize: '14px',
                      fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      opacity: actionLoading ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                    }}
                  >
                    {actionLoading ? <span style={spinnerStyle} /> : <ThumbsUp size={15} />}
                    {actionLoading ? 'Saving...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
