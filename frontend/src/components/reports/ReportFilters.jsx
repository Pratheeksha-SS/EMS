import React, { useState } from 'react';
import { ChevronDown, Calendar, Users, Building2, RefreshCw } from 'lucide-react';

/* ─── Shared input styles matching HRMS design language ─────────── */
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #E2E8F0',
  borderRadius: '8px',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
  color: '#0F172A',
  backgroundColor: '#fff',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: '700',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const focusHandlers = {
  onFocus: e => {
    e.target.style.borderColor = '#F97316';
    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)';
  },
  onBlur: e => {
    e.target.style.borderColor = '#E2E8F0';
    e.target.style.boxShadow = 'none';
  },
};

/* ─── Preset ranges ─────────────────────────────────────────────── */
const presetRanges = [
  {
    value: 'today', label: 'Today',
    getRange: () => { const d = new Date().toISOString().split('T')[0]; return { startDate: d, endDate: d }; },
  },
  {
    value: 'yesterday', label: 'Yesterday',
    getRange: () => {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const d = y.toISOString().split('T')[0]; return { startDate: d, endDate: d };
    },
  },
  {
    value: 'week', label: 'Last 7 Days',
    getRange: () => {
      const end = new Date().toISOString().split('T')[0];
      const s = new Date(); s.setDate(s.getDate() - 7);
      return { startDate: s.toISOString().split('T')[0], endDate: end };
    },
  },
  {
    value: 'month', label: 'Last 30 Days',
    getRange: () => {
      const end = new Date().toISOString().split('T')[0];
      const s = new Date(); s.setDate(s.getDate() - 30);
      return { startDate: s.toISOString().split('T')[0], endDate: end };
    },
  },
  {
    value: 'thisMonth', label: 'This Month',
    getRange: () => {
      const today = new Date();
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: s.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
    },
  },
];

const reportTypes = [
  { value: 'attendance', label: '📅 Attendance Report' },
  { value: 'leave',      label: '📝 Leave Report' },
  { value: 'employee',   label: '👥 Employee Activity' },
  { value: 'salary',     label: '💰 Salary Report' },
];

const frequencies = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/* ─── Employee Dropdown ─────────────────────────────────────────── */
const EmployeeDropdown = ({ employees, selectedId, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = employees.find(e => e.id === parseInt(selectedId));
  const filtered = employees.filter(e => {
    const s = search.toLowerCase();
    return (
      (e.first_name || '').toLowerCase().includes(s) ||
      (e.last_name || '').toLowerCase().includes(s) ||
      (e.employee_id || '').toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', paddingRight: '12px',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = '#E2E8F0'; }}
      >
        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: '800', color: 'white', flexShrink: 0,
            }}>
              {((selected.first_name || '')[0] || '').toUpperCase()}{((selected.last_name || '')[0] || '').toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '600' }}>
              {selected.first_name} {selected.last_name}
            </span>
          </div>
        ) : (
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>Select employee…</span>
        )}
        <ChevronDown size={14} color="#64748B" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 50, overflow: 'hidden', maxHeight: '280px',
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #F1F5F9' }}>
            <input
              autoFocus
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, padding: '8px 12px', fontSize: '12px' }}
              {...focusHandlers}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No employees found
              </div>
            ) : filtered.map(emp => (
              <div
                key={emp.id}
                onClick={() => { onChange(emp.id); setOpen(false); setSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid #F8FAFC',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: '800', color: 'white', flexShrink: 0,
                }}>
                  {((emp.first_name || '')[0] || '').toUpperCase()}{((emp.last_name || '')[0] || '').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {emp.employee_id} · {emp.department || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Mode Toggle Button ─────────────────────────────────────────── */
const ModeBtn = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      padding: '9px 18px',
      border: `1.5px solid ${active ? '#F97316' : '#E2E8F0'}`,
      borderRadius: '9px',
      background: active ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'white',
      color: active ? 'white' : '#64748B',
      fontSize: '13px', fontWeight: '700',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '7px',
      transition: 'all 0.2s',
      boxShadow: active ? '0 4px 12px rgba(249,115,22,0.25)' : 'none',
    }}
  >
    {icon}
    {label}
  </button>
);

/* ─── ReportFilters (main export) ───────────────────────────────── */
const ReportFilters = ({
  filters,
  setFilters,
  dateMode,
  setDateMode,
  employees = [],
  departments = [],
  isManager = false,
  onGenerate,
  loading = false,
}) => {
  const handlePreset = (presetValue) => {
    const preset = presetRanges.find(p => p.value === presetValue);
    if (preset) {
      const { startDate, endDate } = preset.getRange();
      setFilters(prev => ({ ...prev, startDate, endDate }));
    }
  };

  return (
    <div style={{
      backgroundColor: 'white', padding: '22px 26px', borderRadius: '14px',
      marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1.5px solid #F1F5F9',
    }}>
      {/* Section label */}
      <div style={{
        fontSize: '11px', fontWeight: '700', color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        🔍 Report Filters
      </div>

      {/* Row 1: Report Type, Scope, Department */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isManager ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: '16px', marginBottom: '20px',
      }}>
        {/* Report Type */}
        <div>
          <label style={labelStyle}>Report Type</label>
          <select
            style={selectStyle}
            value={filters.reportType}
            onChange={e => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
            {...focusHandlers}
          >
            {reportTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Scope */}
        <div>
          <label style={labelStyle}>Scope</label>
          <select
            style={selectStyle}
            value={filters.scope}
            onChange={e => setFilters(prev => ({ ...prev, scope: e.target.value, employeeId: '' }))}
            {...focusHandlers}
          >
            <option value="all">All Employees</option>
            <option value="individual">Specific Employee</option>
          </select>
        </div>

        {/* Department (not for managers) */}
        {!isManager && (
          <div>
            <label style={labelStyle}>Department</label>
            <select
              style={selectStyle}
              value={filters.department}
              onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
              {...focusHandlers}
            >
              <option value="all">All Departments</option>
              {(Array.isArray(departments) ? departments : []).map(d => (
                <option key={d.id || d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Employee Picker (conditional) */}
      {filters.scope === 'individual' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Select Employee</label>
          <EmployeeDropdown
            employees={employees}
            selectedId={filters.employeeId}
            onChange={id => setFilters(prev => ({ ...prev, employeeId: id }))}
          />
        </div>
      )}

      {/* Divider */}
      <div style={{ height: '1.5px', backgroundColor: '#F1F5F9', margin: '4px 0 20px' }} />

      {/* Date Mode Toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <ModeBtn
          active={dateMode === 'single'}
          onClick={() => setDateMode('single')}
          icon={<Calendar size={15} />}
          label="Single Day"
        />
        <ModeBtn
          active={dateMode === 'range'}
          onClick={() => setDateMode('range')}
          icon={<Calendar size={15} />}
          label="Date Range"
        />
      </div>

      {/* Date inputs */}
      {dateMode === 'single' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Select Date</label>
            <input
              type="date"
              style={inputStyle}
              value={filters.singleDate}
              onChange={e => setFilters(prev => ({ ...prev, singleDate: e.target.value }))}
              {...focusHandlers}
            />
          </div>
          <div style={{ paddingBottom: '1px' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Presets
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['today', 'yesterday'].map(p => {
                const preset = presetRanges.find(r => r.value === p);
                return (
                  <button key={p} onClick={() => {
                    const d = preset.getRange();
                    setFilters(prev => ({ ...prev, singleDate: d.startDate }));
                  }} style={{
                    padding: '6px 14px', border: '1.5px solid #E2E8F0',
                    borderRadius: '8px', backgroundColor: 'white',
                    color: '#475569', fontSize: '12px', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>From Date</label>
            <input
              type="date" style={inputStyle} value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              {...focusHandlers}
            />
          </div>
          <div>
            <label style={labelStyle}>To Date</label>
            <input
              type="date" style={inputStyle} value={filters.endDate}
              onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              {...focusHandlers}
            />
          </div>
          <div>
            <label style={labelStyle}>Quick Preset</label>
            <select
              style={selectStyle}
              onChange={e => handlePreset(e.target.value)}
              defaultValue=""
              {...focusHandlers}
            >
              <option value="" disabled>Select preset…</option>
              {presetRanges.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Frequency</label>
            <select
              style={selectStyle}
              value={filters.frequency}
              onChange={e => setFilters(prev => ({ ...prev, frequency: e.target.value }))}
              {...focusHandlers}
            >
              {frequencies.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div style={{ marginTop: '22px' }}>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? '#CBD5E1' : 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(249,115,22,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 12px rgba(249,115,22,0.3)'; }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'hrSpin 0.8s linear infinite',
              }} />
              Generating Report…
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportFilters;