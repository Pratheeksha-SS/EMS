import React, { useEffect, useMemo, useState } from 'react';
import OfficeNotes from './OfficeNotes';
import { holidayService } from '../services/holidayService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 27 }, (_, index) => 2024 + index);

const getHolidayTypeLabel = (holiday) =>
  holiday.holiday_type_display ||
  ({
    GOVT: 'Government Holiday',
    FESTIVAL: 'Festival Holiday',
    OPTIONAL: 'Optional Holiday',
    COMPANY: 'Company Event'
  }[holiday.holiday_type] || 'Holiday');

const getHolidayTypeColors = (holidayType) => {
  const colors = {
    GOVT: { bg: '#e0f2fe', text: '#075985', border: '#38bdf8' },
    FESTIVAL: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    OPTIONAL: { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' },
    COMPANY: { bg: '#dcfce7', text: '#166534', border: '#22c55e' }
  };
  return colors[holidayType] || { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

const getDayName = (dateString) =>
  new Date(dateString).toLocaleDateString('en-IN', { weekday: 'long' });

const HolidayCalendar = ({
  enableOfficeNotes = false,
  enableSearch = false,
  title = 'Holiday Calendar',
  subtitlePrefix = 'View and manage holidays for'
}) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState('list');
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfficeNotes, setShowOfficeNotes] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await holidayService.getHolidays(selectedYear);
        const holidayList = Array.isArray(data) ? data : [];
        const filtered = holidayList
          .filter((holiday) => new Date(holiday.date).getFullYear() === selectedYear)
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

  const noteStorageKey = `calendar_notes_${selectedYear}_${selectedMonth}`;
  const notes = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(noteStorageKey) || '{}');
    } catch {
      return {};
    }
  }, [noteStorageKey]);

  const filteredHolidays = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return holidays;
    }

    return holidays.filter((holiday) =>
      holiday.name?.toLowerCase().includes(term) ||
      getHolidayTypeLabel(holiday).toLowerCase().includes(term) ||
      formatDate(holiday.date).toLowerCase().includes(term)
    );
  }, [holidays, searchTerm]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const upcomingHolidays = filteredHolidays.filter((holiday) => new Date(holiday.date) >= today);
  const pastHolidays = filteredHolidays.filter((holiday) => new Date(holiday.date) < today);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    filteredHolidays.forEach((holiday) => {
      const key = holiday.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(holiday);
    });
    return map;
  }, [filteredHolidays]);

  const saveNote = () => {
    if (!selectedDateKey) return;
    const nextNotes = { ...notes };

    if (noteDraft.trim()) {
      nextNotes[selectedDateKey] = noteDraft.trim();
    } else {
      delete nextNotes[selectedDateKey];
    }

    localStorage.setItem(noteStorageKey, JSON.stringify(nextNotes));
    setSelectedDateKey(null);
    setNoteDraft('');
  };

  const openNoteEditor = (dateKey) => {
    setSelectedDateKey(dateKey);
    setNoteDraft(notes[dateKey] || '');
  };

  const renderCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push(<div key={`empty-${i}`} style={styles.emptyCell} />);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayHolidays = holidaysByDate.get(dateKey) || [];
      const note = notes[dateKey];
      const isToday =
        day === new Date().getDate() &&
        selectedMonth === new Date().getMonth() &&
        selectedYear === new Date().getFullYear();

      cells.push(
        <button
          key={dateKey}
          type="button"
          onClick={() => openNoteEditor(dateKey)}
          style={{
            ...styles.dayCell,
            borderColor: isToday ? '#2563eb' : '#dbe2ea',
            boxShadow: isToday ? '0 0 0 2px rgba(37, 99, 235, 0.12)' : 'none'
          }}
        >
          <div style={styles.dayNumber}>{day}</div>
          {dayHolidays.map((holiday) => {
            const colors = getHolidayTypeColors(holiday.holiday_type);
            return (
              <div
                key={holiday.id || `${dateKey}-${holiday.name}`}
                style={{
                  ...styles.eventPill,
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderLeft: `3px solid ${colors.border}`
                }}
                title={holiday.name}
              >
                {holiday.name}
              </div>
            );
          })}
          {note ? (
            <div style={styles.notePill} title={note}>
              Note: {note}
            </div>
          ) : null}
        </button>
      );
    }

    return (
      <div style={styles.calendarGrid}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} style={styles.weekHeader}>{day}</div>
        ))}
        {cells}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.stateBox}>
          <div style={styles.spinner} />
          <div>Loading holidays for {selectedYear}...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.stateBox}>
          <div>{error}</div>
          <button type="button" onClick={() => setSelectedYear((year) => year)} style={styles.primaryButton}>
            Retry
          </button>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div style={styles.panel}>
          {filteredHolidays.length === 0 ? (
            <div style={styles.emptyState}>No holidays found for {selectedYear}.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Holiday</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Day</th>
                  <th style={styles.th}>Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday) => {
                  const colors = getHolidayTypeColors(holiday.holiday_type);
                  return (
                    <tr key={holiday.id} style={styles.row}>
                      <td style={styles.td}>{holiday.name}</td>
                      <td style={styles.td}>{formatDate(holiday.date)}</td>
                      <td style={styles.td}>{getDayName(holiday.date)}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border
                          }}
                        >
                          {getHolidayTypeLabel(holiday)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    return (
      <div style={styles.panel}>
        <div style={styles.monthTabs}>
          {MONTHS.map((month, index) => (
            <button
              key={month}
              type="button"
              onClick={() => setSelectedMonth(index)}
              style={selectedMonth === index ? styles.monthActive : styles.monthButton}
            >
              {month.slice(0, 3)}
            </button>
          ))}
        </div>
        <h2 style={styles.monthTitle}>
          {MONTHS[selectedMonth]} {selectedYear}
        </h2>
        {renderCalendar()}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.subtitle}>{subtitlePrefix} {selectedYear}</p>
        </div>
        <div style={styles.headerControls}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={styles.select}
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div style={styles.toggleGroup}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={viewMode === 'list' ? styles.toggleActive : styles.toggleButton}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              style={viewMode === 'month' ? styles.toggleActive : styles.toggleButton}
            >
              Month View
            </button>
            {enableOfficeNotes ? (
              <button
                type="button"
                onClick={() => setShowOfficeNotes(true)}
                style={styles.notesButton}
              >
                Office Notes
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {enableSearch ? (
        <div style={styles.searchBar}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search holiday by name, type or date..."
            style={styles.searchInput}
          />
        </div>
      ) : null}

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Holidays</div>
          <div style={styles.statValue}>
            {loading ? <span style={styles.skeleton}>—</span> : filteredHolidays.length}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Upcoming</div>
          <div style={styles.statValue}>
            {loading ? <span style={styles.skeleton}>—</span> : upcomingHolidays.length}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Past</div>
          <div style={styles.statValue}>
            {loading ? <span style={styles.skeleton}>—</span> : pastHolidays.length}
          </div>
        </div>
      </div>

      {renderContent()}

      {selectedDateKey ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Add Note</h3>
            <p style={styles.modalMeta}>{selectedDateKey}</p>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              style={styles.textarea}
              placeholder="Add a reminder or note for this date"
            />
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setSelectedDateKey(null)} style={styles.secondaryButton}>
                Cancel
              </button>
              <button type="button" onClick={saveNote} style={styles.primaryButton}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showOfficeNotes && enableOfficeNotes ? (
        <OfficeNotes
          selectedYear={selectedYear}
          onClose={() => setShowOfficeNotes(false)}
        />
      ) : null}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: 0,
    color: '#111827'
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280'
  },
  headerControls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff'
  },
  toggleGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  toggleButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  toggleActive: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #0f766e',
    backgroundColor: '#0f766e',
    color: '#fff',
    cursor: 'pointer'
  },
  notesButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #d97706',
    backgroundColor: '#fff7ed',
    color: '#9a3412',
    cursor: 'pointer'
  },
  searchBar: {
    marginBottom: '20px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    fontSize: '14px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '18px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    marginTop: '4px'
  },
  panel: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px'
  },
  emptyState: {
    padding: '40px 0',
    textAlign: 'center',
    color: '#6b7280'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: '13px'
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    color: '#111827',
    fontSize: '14px'
  },
  row: {
    backgroundColor: '#fff'
  },
  badge: {
    display: 'inline-flex',
    padding: '4px 10px',
    borderRadius: '999px',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: '600'
  },
  monthTabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '18px'
  },
  monthButton: {
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  monthActive: {
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid #0f766e',
    backgroundColor: '#0f766e',
    color: '#fff',
    cursor: 'pointer'
  },
  monthTitle: {
    fontSize: '22px',
    margin: '0 0 18px',
    color: '#111827'
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gap: '8px'
  },
  weekHeader: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    paddingBottom: '6px'
  },
  dayCell: {
    minHeight: '110px',
    borderRadius: '12px',
    border: '1px solid #dbe2ea',
    backgroundColor: '#fff',
    padding: '8px',
    textAlign: 'left',
    cursor: 'pointer'
  },
  emptyCell: {
    minHeight: '110px'
  },
  dayNumber: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px'
  },
  eventPill: {
    fontSize: '11px',
    borderRadius: '8px',
    padding: '4px 6px',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  notePill: {
    fontSize: '11px',
    borderRadius: '8px',
    padding: '4px 6px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)'
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#111827'
  },
  modalMeta: {
    color: '#6b7280',
    margin: '6px 0 14px'
  },
  textarea: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '12px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px'
  },
  primaryButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#0f766e',
    color: '#fff',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  stateBox: {
    minHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#475569'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #0f766e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  skeleton: {
    color: '#94a3b8',
    fontWeight: '400'
  }
};

export default HolidayCalendar;
