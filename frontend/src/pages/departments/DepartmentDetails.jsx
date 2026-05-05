import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';
import {
  ChevronLeft, Users, Search, X, Eye,
  Mail, Phone, Building2, UserCheck,
  AlertCircle, RefreshCw, Briefcase, Calendar,
} from 'lucide-react';

/* ─── Design Tokens ──────────────────────────────────────────────────────────
   Primary       : #F97316  (orange-500)
   Primary Dark  : #EA580C  (orange-600)
   Primary Light : #FFF7ED  (orange-50)
   Accent        : #16A34A  (green-600)
   Neutral BG    : #F8FAFC
   Surface       : #FFFFFF
   Border        : #E2E8F0 / #F1F5F9
   Text Main     : #0F172A
   Text Muted    : #64748B
   ──────────────────────────────────────────────────────────────────────────── */

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ PRIORITY 1: Use passed department object (fastest, most accurate)
  const passedDept = location.state?.dept;
  const [department, setDepartment] = useState(passedDept || null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [loading, setLoading] = useState(!passedDept);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [viewingEmployee, setViewingEmployee] = useState(null);

  useEffect(() => {
    if (passedDept) {
      console.log('✅ Using passed dept from Departments:', passedDept.id, passedDept.name);
      fetchEmployeesForDepartment(passedDept);
    } else if (id) {
      console.log('🔄 No passed dept, fetching department by ID:', id);
      fetchDepartmentById(id);
    }
  }, [id, passedDept]);

  // ─── All original data fetching logic preserved ──────────────────────────
  const fetchDepartmentById = async (deptId) => {
    try {
      const res = await api.get(`/departments/${deptId}/`);
      const deptData = res.data;
      console.log('Backend dept by ID:', deptData);
      setDepartment(deptData);
      fetchEmployeesForDepartment(deptData);
    } catch (error) {
      console.error('❌ Failed to fetch department by ID:', error.response?.data || error.message);
      tryFallbackDepartment(deptId);
    }
  };

  const tryFallbackDepartment = async (deptId) => {
    console.log('🔄 Fallback: fetching all departments to match ID');
    try {
      const saved = JSON.parse(localStorage.getItem('departments') || '[]');
      const savedMatch = saved.find((d) => String(d.id) === String(deptId));
      if (savedMatch) {
        setDepartment(savedMatch);
        fetchEmployeesForDepartment(savedMatch);
        return;
      }

      const res = await api.get('/departments/?include_employee_departments=1');
      const allDepts = extractListData(res.data);
      const matched = allDepts.find((d) => String(d.id) === String(deptId));
      if (matched) {
        console.log('✅ Found matching dept in fallback:', matched);
        setDepartment(matched);
        fetchEmployeesForDepartment(matched);
      } else {
        console.error('❌ No department found matching ID:', deptId);
        navigate('/departments', { replace: true });
      }
    } catch (error) {
      console.error('Fallback failed:', error);
      navigate('/departments', { replace: true });
    }
  };

  const fetchEmployeesForDepartment = async (dept) => {
    const normalizedName = dept.name?.trim();
    setLoading(true);
    console.log(`🔄 Fetching employees for "${normalizedName}" (ID: ${dept.id})`);
    try {
      const employeesRes = await api.get(`/employees/?department=${encodeURIComponent(normalizedName)}&compact=1&limit=100`);
      let deptEmployees = extractListData(employeesRes.data);

      console.log(`Backend filter: ${deptEmployees.length} employees`);

      if (deptEmployees.length === 0 && dept.employees?.length > 0) {
        console.log('Using passed dept.employees:', dept.employees.length);
        deptEmployees = dept.employees;
      }

      setDepartment((prev) => (prev ? { ...prev, teamCount: deptEmployees.length } : null));
      setDepartmentEmployees(deptEmployees);
      console.log(`✅ FINAL: ${deptEmployees.length} employees loaded for ${normalizedName}`);
    } catch (error) {
      console.error('❌ Employee fetch error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee) => setViewingEmployee(employee);
  const handleBack = () => navigate('/departments');
  const closeEmployeeModal = () => setViewingEmployee(null);

  const filteredEmployees = departmentEmployees.filter((employee) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (searchBy === 'name') {
      const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase().trim();
      return fullName.includes(searchLower);
    } else if (searchBy === 'id') {
      return (employee.employee_id || '').toLowerCase().includes(searchLower);
    }
    return true;
  });

  // ─── Shared helpers ──────────────────────────────────────────────────────
  const AvatarCircle = ({ name, size = 42, fontSize = 16 }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #F97316, #EA580C)',
      color: 'white', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: '800', fontSize,
      flexShrink: 0,
    }}>
      {(name || 'E').charAt(0).toUpperCase()}
    </div>
  );

  const ModalInfoRow = ({ label, value, color }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '2px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: color || '#0F172A', fontWeight: '600' }}>{value || '—'}</span>
    </div>
  );

  // ─── Not found state ──────────────────────────────────────────────────────
  if (!department && !loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F8FAFC',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px',
      }}>
        <button onClick={handleBack} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', background: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: '700',
          cursor: 'pointer', marginBottom: '20px', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <ChevronLeft size={16} /> Back to Departments
        </button>
        <div style={{
          backgroundColor: 'white', borderRadius: '14px', padding: '64px 40px',
          border: '1.5px solid #F1F5F9', textAlign: 'center', color: '#94A3B8',
        }}>
          <span style={{ fontSize: '48px' }}>🏢</span>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#64748B', marginTop: '16px', marginBottom: '8px' }}>
            Department Not Found
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '24px' }}>
            The department ID <strong style={{ color: '#F97316' }}>{id}</strong> doesn't exist.
          </p>
          <button onClick={handleBack} style={{
            padding: '10px 24px', background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
          }}>
            ← Back to Departments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse   { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        .emp-row:hover { background-color: #FFF7ED !important; border-color: #FED7AA !important; transform: translateX(4px); }
        input:focus, select:focus { border-color: #F97316 !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important; outline: none !important; }
      `}</style>

      {/* ── Back Button ─────────────────────────────────────────────────── */}
      <button
        onClick={handleBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', background: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: '700',
          cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s',
          animation: 'fadeIn 0.3s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}
      >
        <ChevronLeft size={16} /> Back to Departments
      </button>

      {/* ── Department Hero Card ─────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9', marginBottom: '24px',
        animation: 'slideUp 0.35s ease',
      }}>
        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '28px 32px 56px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '110px', height: '110px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '40px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            Department
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            {department?.name || 'Loading...'}
          </h1>
        </div>

        {/* Floating stats card */}
        <div style={{ padding: '0 28px', marginTop: '-22px', position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #F1F5F9',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '18px 24px',
            display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* Team count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#16A34A" />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: departmentEmployees.length > 0 ? '#16A34A' : '#94A3B8', lineHeight: 1 }}>
                  {departmentEmployees.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Team Members
                </div>
              </div>
            </div>

            <div style={{ width: '1.5px', background: '#F1F5F9', alignSelf: 'stretch' }} />

            {/* Manager */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={18} color="#3B82F6" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: department?.manager_name ? '#3B82F6' : '#94A3B8', lineHeight: 1.2 }}>
                  {department?.manager_name || 'Unassigned'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Manager
                </div>
              </div>
            </div>

            {department?.source && (
              <>
                <div style={{ width: '1.5px', background: '#F1F5F9', alignSelf: 'stretch' }} />
                <span style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  background: department.source === 'backend' ? '#F0FDF4' : '#FFFBEB',
                  color: department.source === 'backend' ? '#16A34A' : '#B45309',
                  border: `1px solid ${department.source === 'backend' ? '#BBF7D0' : '#FDE68A'}`,
                }}>
                  {department.source === 'backend' ? 'Official' : 'Dynamic'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {(department?.history || department?.description) && (
          <div style={{ padding: '20px 28px 24px' }}>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.65', margin: 0 }}>
              {department.history || department.description}
            </p>
          </div>
        )}
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        border: '1.5px solid #F1F5F9', marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '14px',
        animation: 'slideUp 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={17} color="#F97316" />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
            Team Members
          </span>
          {searchTerm ? (
            <span style={{
              padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
              background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA',
            }}>
              {filteredEmployees.length} of {departmentEmployees.length}
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              {departmentEmployees.length} total
            </span>
          )}
        </div>

        {/* Search Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search by select */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#F8FAFC', padding: '2px 10px 2px 6px',
            borderRadius: '10px', border: '1.5px solid #E2E8F0',
          }}>
            <Search size={13} color="#94A3B8" />
            <select
              value={searchBy}
              onChange={e => { setSearchBy(e.target.value); setSearchTerm(''); }}
              style={{
                border: 'none', background: 'transparent', fontSize: '12px',
                fontWeight: '700', color: '#475569', cursor: 'pointer',
                outline: 'none', padding: '6px 0', fontFamily: 'inherit',
              }}
            >
              <option value="name">By Name</option>
              <option value="id">By ID</option>
            </select>
          </div>

          {/* Search input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder={searchBy === 'name' ? 'Search team members...' : 'Search by ID...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '9px 36px 9px 34px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '13px', color: '#0F172A', backgroundColor: '#F8FAFC',
                boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: '#E2E8F0', border: 'none', borderRadius: '50%',
                  width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: '#64748B',
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Employee List ────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1.5px solid #F1F5F9',
        overflow: 'hidden', minHeight: '200px',
        animation: 'fadeIn 0.4s ease',
      }}>
        {/* Table header */}
        {!loading && filteredEmployees.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0', borderBottom: '1.5px solid #F1F5F9', background: '#F8FAFC' }}>
            {['Employee', 'Contact', 'Designation', ''].map((h, i) => (
              <div key={i} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</div>
            ))}
          </div>
        )}

        {loading ? (
          /* Loading skeleton */
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px', background: '#F8FAFC', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '14px', background: '#E2E8F0', borderRadius: '6px', width: '40%', marginBottom: '8px' }} />
                  <div style={{ height: '11px', background: '#F1F5F9', borderRadius: '6px', width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div>
            {filteredEmployees.map((member, index) => (
              <div
                key={member.id || `${member.employee_id}-${index}`}
                className="emp-row"
                onClick={() => handleViewEmployee(member)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: '0', alignItems: 'center',
                  borderBottom: index < filteredEmployees.length - 1 ? '1px solid #F8FAFC' : 'none',
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {/* Employee */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AvatarCircle name={member.first_name || member.full_name || 'E'} size={42} fontSize={16} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '2px' }}>
                      {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unnamed'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', fontWeight: '600' }}>
                      ID: {member.employee_id || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                    <Mail size={11} color="#94A3B8" /> {member.email || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                    <Phone size={11} color="#94A3B8" /> {member.phone || 'N/A'}
                  </div>
                </div>

                {/* Designation */}
                <div style={{ padding: '14px 16px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: '#F0FDF4', color: '#16A34A',
                    padding: '4px 10px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600', border: '1px solid #BBF7D0',
                  }}>
                    <Briefcase size={10} /> {member.designation || 'Team Member'}
                  </span>
                </div>

                {/* View action */}
                <div style={{ padding: '14px 16px' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleViewEmployee(member); }}
                    style={{
                      padding: '6px 12px', background: '#EFF6FF', color: '#3B82F6',
                      border: '1px solid #BFDBFE', borderRadius: '8px',
                      fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                  >
                    <Eye size={12} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '72px 20px', color: '#94A3B8' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#F8FAFC', border: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👥</div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', margin: 0 }}>
                {searchTerm ? 'No matching employees found' : 'No team members assigned'}
              </p>
              <p style={{ fontSize: '13px', margin: 0 }}>
                {searchTerm
                  ? `Try different search terms for "${searchTerm}"`
                  : `No employees assigned to "${department?.name}" department yet.`}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    marginTop: '8px', padding: '8px 20px',
                    background: 'linear-gradient(135deg, #F97316, #EA580C)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Full-page Loading Overlay ────────────────────────────────────── */}
      {loading && !departmentEmployees.length && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(248,250,252,0.88)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999,
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: '40px 48px', textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
            border: '1.5px solid #F1F5F9',
          }}>
            <div style={{
              width: '52px', height: '52px',
              border: '4px solid #FED7AA', borderTopColor: '#F97316',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              margin: '0 auto 18px',
            }} />
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>
              Loading department details...
            </p>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
              Fetching team members from HRMS
            </p>
          </div>
        </div>
      )}

      {/* ── Employee Detail Modal ────────────────────────────────────────── */}
      {viewingEmployee && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            width: '90%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease',
          }}>
            {/* Modal gradient header */}
            <div style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              padding: '28px 28px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <button
                onClick={closeEmployeeModal}
                style={{
                  position: 'absolute', top: '14px', right: '14px',
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  fontSize: '20px', cursor: 'pointer', width: '32px', height: '32px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Employee Profile
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                {viewingEmployee.full_name || `${viewingEmployee.first_name || ''} ${viewingEmployee.last_name || ''}`.trim() || 'Employee'}
              </div>
            </div>

            {/* Floating avatar */}
            <div style={{ textAlign: 'center', marginTop: '-40px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
              {viewingEmployee.profile_image ? (
                <img
                  src={viewingEmployee.profile_image}
                  alt="Profile"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                />
              ) : (
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', fontSize: '32px', color: 'white', fontWeight: '800',
                  border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}>
                  {(viewingEmployee.first_name || 'E').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  padding: '3px 12px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px',
                  backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                }}>
                  {viewingEmployee.designation || 'Team Member'}
                </span>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '0 28px 28px' }}>
              <div style={{ padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                  📋 Personal Information
                </div>
                <ModalInfoRow label="Employee ID" value={viewingEmployee.employee_id} />
                <ModalInfoRow label="Email" value={viewingEmployee.email} />
                <ModalInfoRow label="Phone" value={viewingEmployee.phone} />
                <ModalInfoRow label="Department" value={viewingEmployee.department} color="#F97316" />
                <ModalInfoRow label="Designation" value={viewingEmployee.designation} />
                <ModalInfoRow label="Joining Date" value={viewingEmployee.joining_date} />
              </div>

              {viewingEmployee.emergency_contact_name && (
                <div style={{ padding: '18px', backgroundColor: '#FFFBEB', borderRadius: '12px', border: '1.5px solid #FDE68A', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                    🚨 Emergency Contact
                  </div>
                  <ModalInfoRow label="Name" value={viewingEmployee.emergency_contact_name} />
                  <ModalInfoRow label="Relationship" value={viewingEmployee.emergency_contact_relationship} />
                  <ModalInfoRow label="Phone" value={viewingEmployee.emergency_contact_phone} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  onClick={closeEmployeeModal}
                  style={{
                    padding: '10px 28px', backgroundColor: '#F8FAFC', color: '#475569',
                    border: '1.5px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s',
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
    </div>
  );
};

export default DepartmentDetails;
