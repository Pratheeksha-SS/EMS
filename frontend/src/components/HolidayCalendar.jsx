import React, { useEffect, useMemo, useState } from 'react';
import OfficeNotes from './OfficeNotes';
import Skeleton, { SkeletonCard, SkeletonStatsGrid } from './Skeleton';
import { holidayService } from '../services/holidayService';

/* ─── Constants ──────────────────────────────────────────────────── */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 27 }, (_, i) => 2024 + i);

/* ─── Design Tokens (matching HRMS AdminDashboard / EmployeeDashboard)
   Primary:       #F97316  orange-500
   Primary Dark:  #EA580C  orange-600
   Primary Light: #FFF7ED  orange-50
   Accent:        #16A34A  green-600
   Accent Light:  #F0FDF4  green-50
   Neutral BG:    #F8FAFC
   Surface:       #FFFFFF
   Border:        #F1F5F9 / #E2E8F0
   Text Main:     #0F172A
   Text Muted:    #64748B
   ─────────────────────────────────────────────────────────────────── */

/* ─── Holiday type helpers ───────────────────────────────────────── */
const getHolidayTypeLabel = (holiday) =>
  holiday.holiday_type_display ||
  ({
    GOVT:     'Government Holiday',
    FESTIVAL: 'Festival Holiday',
    OPTIONAL: 'Optional Holiday',
    COMPANY:  'Company Event',
  }[holiday.holiday_type] || 'Holiday');

const getHolidayTypeColors = (holidayType) => ({
  GOVT:     { bg: '#FFF7ED', text: '#C2410C', border: '#F97316', dot: '#F97316' },
  FESTIVAL: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B', dot: '#F59E0B' },
  OPTIONAL: { bg: '#EFF6FF', text: '#1D4ED8', border: '#3B82F6', dot: '#3B82F6' },
  COMPANY:  { bg: '#F0FDF4', text: '#15803D', border: '#16A34A', dot: '#16A34A' },
}[holidayType] || { bg: '#F8FAFC', text: '#475569', border: '#94A3B8', dot: '#94A3B8' });

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

const getDayName = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { weekday: 'long' });

/* ─── Shared style primitives ────────────────────────────────────── */
const inputBase = {
  padding: '10px 14px',
  border: '1.5px solid #E2E8F0',
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
  color: '#0F172A',
  backgroundColor: '#fff',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
};

/* ═══════════════════════════════════════════════════════════════════
   HolidayCalendar — Main Component
   ═══════════════════════════════════════════════════════════════════ */
const HolidayCalendar = ({
  enableOfficeNotes = false,
  enableSearch      = false,
  title             = 'Holiday Calendar',
  subtitlePrefix    = 'View and manage holidays for',
}) => {
  const [holidays, setHolidays]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [selectedYear, setSelectedYear]     = useState(2026);
  const [selectedMonth, setSelectedMonth]   = useState(new Date().getMonth());
  const [viewMode, setViewMode]             = useState('list');
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [noteDraft, setNoteDraft]           = useState('');
  const [searchTerm, setSearchTerm]         = useState('');
  const [showOfficeNotes, setShowOfficeNotes] = useState(false);

  /* ── Fetch holidays ─────────────────────────────────────────────── */
  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);
      try {
        const data       = await holidayService.getHolidays(selectedYear);
        const holidayList = Array.isArray(data) ? data : [];
        const filtered   = holidayList
          .filter(h => new Date(h.date).getFullYear() === selectedYear)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setHolidays(filtered);
      } catch (err) {
        console.error('Error fetching holidays:', err);
        setHolidays([]);
        setError('Failed to load holidays. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
  }, [selectedYear]);

  /* ── Notes (localStorage) ────────────────────────────────────────── */
  const noteStorageKey = `calendar_notes_${selectedYear}_${selectedMonth}`;
  const notes = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(noteStorageKey) || '{}'); }
    catch { return {}; }
  }, [noteStorageKey]);

  /* ── Derived data ────────────────────────────────────────────────── */
  const filteredHolidays = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return holidays;
    return holidays.filter(h =>
      h.name?.toLowerCase().includes(term) ||
      getHolidayTypeLabel(h).toLowerCase().includes(term) ||
      formatDate(h.date).toLowerCase().includes(term)
    );
  }, [holidays, searchTerm]);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const currentDate  = useMemo(() => new Date(), []);
  const currentDay   = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();
  const todayTime    = useMemo(() => today.getTime(), [today]);

  const upcomingHolidays = useMemo(
    () => filteredHolidays.filter(h => new Date(h.date).getTime() >= todayTime),
    [filteredHolidays, todayTime]
  );
  const pastHolidays = useMemo(
    () => filteredHolidays.filter(h => new Date(h.date).getTime() < todayTime),
    [filteredHolidays, todayTime]
  );

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    filteredHolidays.forEach(h => {
      if (!map.has(h.date)) map.set(h.date, []);
      map.get(h.date).push(h);
    });
    return map;
  }, [filteredHolidays]);

  /* ── Note actions ────────────────────────────────────────────────── */
  const saveNote = () => {
    if (!selectedDateKey) return;
    const next = { ...notes };
    if (noteDraft.trim()) next[selectedDateKey] = noteDraft.trim();
    else delete next[selectedDateKey];
    localStorage.setItem(noteStorageKey, JSON.stringify(next));
    setSelectedDateKey(null);
    setNoteDraft('');
  };

  const openNoteEditor = (dateKey) => {
    setSelectedDateKey(dateKey);
    setNoteDraft(notes[dateKey] || '');
  };

  /* ── Calendar Grid ───────────────────────────────────────────────── */
  const renderCalendar = () => {
    const firstDay    = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ minHeight: '110px' }} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey   = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayHols   = holidaysByDate.get(dateKey) || [];
      const note      = notes[dateKey];
      const isToday   = day === currentDay && selectedMonth === currentMonth && selectedYear === currentYear;
      const isWeekend = (new Date(selectedYear, selectedMonth, day).getDay() === 0 || new Date(selectedYear, selectedMonth, day).getDay() === 6);

      cells.push(
        <button
          key={dateKey}
          type="button"
          onClick={() => openNoteEditor(dateKey)}
          style={{
            minHeight: '110px',
            borderRadius: '10px',
            border: `1.5px solid ${isToday ? '#F97316' : '#F1F5F9'}`,
            backgroundColor: isToday ? '#FFF7ED' : isWeekend ? '#FAFAFA' : '#FFFFFF',
            padding: '8px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: isToday ? '0 0 0 3px rgba(249,115,22,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            if (!isToday) {
              e.currentTarget.style.borderColor = '#FED7AA';
              e.currentTarget.style.backgroundColor = '#FFF7ED';
            }
          }}
          onMouseLeave={e => {
            if (!isToday) {
              e.currentTarget.style.borderColor = '#F1F5F9';
              e.currentTarget.style.backgroundColor = isWeekend ? '#FAFAFA' : '#FFFFFF';
            }
          }}
        >
          {/* Day number */}
          <div style={{
            fontSize: '13px', fontWeight: '800',
            color: isToday ? '#F97316' : isWeekend ? '#94A3B8' : '#0F172A',
            marginBottom: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{day}</span>
            {isToday && (
              <span style={{
                fontSize: '8px', fontWeight: '800', textTransform: 'uppercase',
                backgroundColor: '#F97316', color: 'white',
                padding: '1px 5px', borderRadius: '6px', letterSpacing: '0.5px',
              }}>Today</span>
            )}
          </div>

          {/* Holiday pills */}
          {dayHols.map(h => {
            const c = getHolidayTypeColors(h.holiday_type);
            return (
              <div
                key={h.id || `${dateKey}-${h.name}`}
                title={h.name}
                style={{
                  fontSize: '10px', fontWeight: '600',
                  borderRadius: '6px', padding: '3px 6px',
                  marginBottom: '3px',
                  backgroundColor: c.bg, color: c.text,
                  borderLeft: `3px solid ${c.border}`,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {h.name}
              </div>
            );
          })}

          {/* Note pill */}
          {note && (
            <div title={note} style={{
              fontSize: '10px', fontWeight: '600',
              borderRadius: '6px', padding: '3px 6px', marginTop: '3px',
              backgroundColor: '#FFFBEB', color: '#92400E',
              borderLeft: '3px solid #F59E0B',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              📝 {note}
            </div>
          )}
        </button>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '11px', fontWeight: '700',
            color: '#94A3B8', paddingBottom: '8px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>{d}</div>
        ))}
        {cells}
      </div>
    );
  };

  /* ── Toggle Button ───────────────────────────────────────────────── */
  const ToggleBtn = ({ label, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 18px',
        borderRadius: '9px',
        border: `1.5px solid ${active ? '#F97316' : '#E2E8F0'}`,
        background: active ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'white',
        color: active ? 'white' : '#64748B',
        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 4px 12px rgba(249,115,22,0.25)' : 'none',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; } }}
    >
      {label}
    </button>
  );

  /* ── Main content area ───────────────────────────────────────────── */
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          backgroundColor: 'white', borderRadius: '14px',
          border: '1.5px solid #FECACA', padding: '60px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: '40px' }}>⚠️</span>
          <div style={{ fontSize: '14px', color: '#DC2626', fontWeight: '600' }}>{error}</div>
          <button
            type="button"
            onClick={() => setSelectedYear(y => y)}
            style={{
              padding: '10px 22px', background: 'linear-gradient(135deg,#F97316,#EA580C)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}
          >↻ Retry</button>
        </div>
      );
    }

    /* ── LIST VIEW ── */
    if (viewMode === 'list') {
      return (
        <div style={{
          backgroundColor: 'white', borderRadius: '14px',
          border: '1.5px solid #F1F5F9', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {/* Table toolbar */}
          <div style={{
            padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9',
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: '#FAFAFA',
          }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
              Holiday Directory — {selectedYear}
            </span>
            <span style={{
              backgroundColor: '#FFF7ED', color: '#EA580C',
              padding: '2px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA',
            }}>{filteredHolidays.length}</span>
          </div>

          {filteredHolidays.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>
                No holidays found for {selectedYear}
              </div>
              <div style={{ fontSize: '13px' }}>Try selecting a different year or clearing the search</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['#', 'Holiday Name', 'Date', 'Day', 'Type'].map(h => (
                      <th key={h} style={{
                        padding: '12px 18px', textAlign: 'left',
                        color: '#64748B', fontSize: '11px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        borderBottom: '1.5px solid #F1F5F9',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.map((holiday, idx) => {
                    const c = getHolidayTypeColors(holiday.holiday_type);
                    const isPast = new Date(holiday.date).getTime() < todayTime;
                    return (
                      <tr
                        key={holiday.id}
                        style={{
                          borderBottom: '1px solid #F8FAFC',
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                          opacity: isPast ? 0.65 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                      >
                        {/* # */}
                        <td style={{ padding: '14px 18px', fontSize: '12px', color: '#94A3B8', fontWeight: '700' }}>
                          {idx + 1}
                        </td>
                        {/* Name */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: c.dot, flexShrink: 0,
                            }} />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                              {holiday.name}
                            </span>
                            {!isPast && new Date(holiday.date).getTime() === todayTime && (
                              <span style={{
                                fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                backgroundColor: '#F97316', color: 'white',
                                padding: '1px 6px', borderRadius: '6px', letterSpacing: '0.5px',
                              }}>Today</span>
                            )}
                          </div>
                        </td>
                        {/* Date */}
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap' }}>
                          {formatDate(holiday.date)}
                        </td>
                        {/* Day */}
                        <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748B' }}>
                          {getDayName(holiday.date)}
                        </td>
                        {/* Badge */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: '700',
                            backgroundColor: c.bg, color: c.text,
                            border: `1px solid ${c.border}`,
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot }} />
                            {getHolidayTypeLabel(holiday)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    /* ── MONTH / CALENDAR VIEW ── */
    return (
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        border: '1.5px solid #F1F5F9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden',
      }}>
        {/* Month tabs */}
        <div style={{
          padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9',
          backgroundColor: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {MONTHS.map((month, index) => {
              const active = selectedMonth === index;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setSelectedMonth(index)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: '700',
                    border: `1.5px solid ${active ? '#F97316' : '#E2E8F0'}`,
                    backgroundColor: active ? '#F97316' : 'white',
                    color: active ? 'white' : '#64748B',
                    transition: 'all 0.15s',
                    boxShadow: active ? '0 2px 8px rgba(249,115,22,0.25)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#F97316'; e.currentTarget.style.color = '#F97316'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; } }}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar heading */}
        <div style={{
          padding: '24px 12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#F97316,#EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
          }}>📅</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>
            {MONTHS[selectedMonth]} {selectedYear}
          </h2>
          {/* Holiday count for this month */}
          {(() => {
            const count = filteredHolidays.filter(h => new Date(h.date).getMonth() === selectedMonth).length;
            return count > 0 ? (
              <span style={{
                backgroundColor: '#FFF7ED', color: '#EA580C',
                padding: '2px 10px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 700, border: '1px solid #FED7AA',
              }}>{count} holiday{count !== 1 ? 's' : ''}</span>
            ) : null;
          })()}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          {renderCalendar()}
        </div>

        {/* Legend */}
        <div style={{
          padding: '14px 24px', borderTop: '1.5px solid #F1F5F9',
          backgroundColor: '#FAFAFC', display: 'flex', gap: '16px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'center' }}>Legend:</span>
          {[
            { label: 'Government',  type: 'GOVT' },
            { label: 'Festival',    type: 'FESTIVAL' },
            { label: 'Optional',    type: 'OPTIONAL' },
            { label: 'Company',     type: 'COMPANY' },
          ].map(({ label, type }) => {
            const c = getHolidayTypeColors(type);
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: c.dot }} />
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{label}</span>
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F59E0B' }} />
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Note</span>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito','Segoe UI',sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes holSpin { to { transform: rotate(360deg); } }
        @keyframes holFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes holSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
        ::-webkit-scrollbar { width:6px; height: 6px; }
        ::-webkit-scrollbar-track { background:#F8FAFC; }
        ::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:#CBD5E1; }
      `}</style>

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
              background: 'linear-gradient(135deg,#F97316,#EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>🗓️</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              {title}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            {subtitlePrefix} <strong style={{ color: '#F97316' }}>{selectedYear}</strong>
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={inputBase}
            onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* View mode */}
          <ToggleBtn label="📋 List View"  active={viewMode === 'list'}  onClick={() => setViewMode('list')} />
          <ToggleBtn label="📅 Month View" active={viewMode === 'month'} onClick={() => setViewMode('month')} />

          {/* Office Notes button */}
          {enableOfficeNotes && (
            <button
              type="button"
              onClick={() => setShowOfficeNotes(true)}
              style={{
                padding: '9px 18px',
                border: '1.5px solid #FED7AA',
                borderRadius: '9px',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F97316'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#F97316'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.color = '#EA580C'; e.currentTarget.style.borderColor = '#FED7AA'; }}
            >
              📝 Office Notes
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────── */}
      {enableSearch && (
        <div style={{
          backgroundColor: 'white', padding: '16px 20px',
          borderRadius: '12px', marginBottom: '22px',
          border: '1.5px solid #F1F5F9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by holiday name, type or date..."
            style={{
              flex: 1, padding: '8px 12px',
              border: '1.5px solid #E2E8F0', borderRadius: '8px',
              fontSize: '13px', outline: 'none', color: '#0F172A',
              fontFamily: 'inherit', backgroundColor: '#F8FAFC',
            }}
            onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; e.target.style.backgroundColor = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                padding: '6px 12px', fontSize: '12px', fontWeight: '700',
                backgroundColor: '#FEF2F2', color: '#DC2626',
                border: '1.5px solid #FECACA', borderRadius: '8px',
                cursor: 'pointer', flexShrink: 0,
              }}
            >✕ Clear</button>
          )}
        </div>
      )}

      {/* ── Summary Stat Cards ──────────────────────────────────────── */}
      {loading ? (
        <SkeletonStatsGrid />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '18px', marginBottom: '24px',
        }}>
          {[
            {
              label: 'Total Holidays', value: filteredHolidays.length,
              sub: `In ${selectedYear}`, icon: '🗓️',
              gradient: 'linear-gradient(135deg,#F97316,#EA580C)',
              shadow: 'rgba(249,115,22,0.25)',
            },
            {
              label: 'Upcoming', value: upcomingHolidays.length,
              sub: 'Yet to come', icon: '⏩',
              gradient: 'linear-gradient(135deg,#16A34A,#15803D)',
              shadow: 'rgba(22,163,74,0.25)',
            },
            {
              label: 'Past', value: pastHolidays.length,
              sub: 'Already passed', icon: '✅',
              gradient: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
              shadow: 'rgba(37,99,235,0.25)',
            },
          ].map(card => (
            <div
              key={card.label}
              style={{
                background: card.gradient,
                padding: '22px 24px', borderRadius: '16px', color: 'white',
                boxShadow: `0 6px 20px ${card.shadow}`,
                position: 'relative', overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                animation: 'holFadeIn 0.4s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${card.shadow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 20px ${card.shadow}`; }}
            >
              <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.13)' }} />
              <div style={{ position: 'absolute', bottom: '-28px', left: '-8px', width: '65px', height: '65px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>{card.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1, marginBottom: '5px', letterSpacing: '-0.5px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Holiday Type Summary Strip ───────────────────────────────── */}
      {!loading && filteredHolidays.length > 0 && (
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          padding: '14px 20px', marginBottom: '22px',
          border: '1.5px solid #F1F5F9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>By Type:</span>
          {['GOVT', 'FESTIVAL', 'OPTIONAL', 'COMPANY'].map(type => {
            const count = filteredHolidays.filter(h => h.holiday_type === type).length;
            if (!count) return null;
            const c = getHolidayTypeColors(type);
            const labels = { GOVT: 'Government', FESTIVAL: 'Festival', OPTIONAL: 'Optional', COMPANY: 'Company' };
            return (
              <span key={type} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '20px',
                backgroundColor: c.bg, color: c.text,
                border: `1px solid ${c.border}`,
                fontSize: '12px', fontWeight: '700',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: c.dot }} />
                {labels[type]}: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      {renderContent()}

      {/* ── Note Editor Modal ────────────────────────────────────────── */}
      {selectedDateKey && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
            animation: 'holFadeIn 0.25s ease',
          }}
          onClick={() => setSelectedDateKey(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: '460px',
              backgroundColor: 'white', borderRadius: '20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
              overflow: 'hidden',
              animation: 'holSlideUp 0.3s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg,#F97316,#EA580C)',
              padding: '20px 24px', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>📝 Add Note</h3>
                <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>{selectedDateKey}</p>
              </div>
              <button
                onClick={() => setSelectedDateKey(null)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  width: '32px', height: '32px', borderRadius: '50%',
                  fontSize: '18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Note / Reminder
              </label>
              <textarea
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                rows={4}
                placeholder="Add a reminder or note for this date…"
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  fontSize: '14px', fontFamily: 'inherit', resize: 'vertical',
                  boxSizing: 'border-box', color: '#0F172A', outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px 20px',
              display: 'flex', justifyContent: 'flex-end', gap: '10px',
              borderTop: '1.5px solid #F1F5F9', backgroundColor: '#FAFAFA',
            }}>
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                style={{
                  padding: '9px 20px', backgroundColor: '#F8FAFC', color: '#475569',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                }}
              >Cancel</button>
              <button
                type="button"
                onClick={saveNote}
                style={{
                  padding: '9px 22px',
                  background: 'linear-gradient(135deg,#F97316,#EA580C)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                }}
              >✔ Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Office Notes Modal ───────────────────────────────────────── */}
      {showOfficeNotes && enableOfficeNotes && (
        <OfficeNotes
          selectedYear={selectedYear}
          onClose={() => setShowOfficeNotes(false)}
        />
      )}
    </div>
  );
};

export default HolidayCalendar;
