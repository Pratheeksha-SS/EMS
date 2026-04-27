// src/components/EmployeeCalendar.jsx
import React, { useState, useEffect } from 'react';

const EmployeeCalendar = ({ holidays = [], selectedYear: propSelectedYear }) => {
  const [selectedYear, setSelectedYear] = useState(propSelectedYear || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filteredHolidays, setFilteredHolidays] = useState([]);
  const [officeNotes, setOfficeNotes] = useState({});
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('meeting');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years from 2024 to 2050
  const years = [];
  for (let year = 2024; year <= 2050; year++) {
    years.push(year);
  }

  const noteTypes = [
    { value: 'meeting', label: '📅 Meeting', color: '#2196f3' },
    { value: 'deadline', label: '⏰ Deadline', color: '#f44336' },
    { value: 'client', label: '📞 Client Visit', color: '#4caf50' },
    { value: 'other', label: '📝 Other', color: '#ff9800' },
  ];

  // Filter holidays by selected year
  useEffect(() => {
    if (holidays.length > 0) {
      const filtered = holidays.filter(holiday => {
        const holidayYear = new Date(holiday.date).getFullYear();
        return holidayYear === selectedYear;
      });
      console.log(`📊 EmployeeCalendar - Filtering for ${selectedYear}: Found ${filtered.length} holidays`);
      setFilteredHolidays(filtered);
    } else {
      setFilteredHolidays([]);
    }
  }, [selectedYear, holidays]);

  useEffect(() => {
    if (propSelectedYear) {
      setSelectedYear(propSelectedYear);
    }
  }, [propSelectedYear]);

  // Load notes from localStorage when year changes
  useEffect(() => {
    const notesKey = `office_notes_${selectedYear}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      setOfficeNotes(JSON.parse(savedNotes));
    } else {
      setOfficeNotes({});
    }
  }, [selectedYear]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(officeNotes).length > 0) {
      const notesKey = `office_notes_${selectedYear}`;
      localStorage.setItem(notesKey, JSON.stringify(officeNotes));
    }
  }, [officeNotes, selectedYear]);

  // Get holiday type info (TEXT ONLY - no icons)
  const getHolidayTypeInfo = (type) => {
    const types = {
      'NATIONAL': { 
        color: '#1976d2', 
        bgColor: '#e3f2fd', 
        label: 'Government' 
      },
      'RELIGIOUS': { 
        color: '#f57c00', 
        bgColor: '#fff3e0', 
        label: 'Religious' 
      },
      'COMPANY': { 
        color: '#4caf50', 
        bgColor: '#e8f5e9', 
        label: 'Company' 
      },
      'OTHER': { 
        color: '#9c27b0', 
        bgColor: '#f3e5f5', 
        label: 'Other' 
      },
    };
    return types[type] || types['OTHER'];
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Get holidays for a specific date (using filteredHolidays)
  const getHolidaysForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredHolidays.filter(h => h.date && h.date.startsWith(dateStr));
  };

  // Get office notes for a specific date
  const getOfficeNotesForDate = (year, month, day) => {
    const dateKey = `${year}-${month + 1}-${day}`;
    return officeNotes[dateKey] || null;
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setIsYearDropdownOpen(false);
  };

  // Handle day click to add/edit note
  const handleDayClick = (year, month, day) => {
    const dateKey = `${year}-${month + 1}-${day}`;
    const existingNote = officeNotes[dateKey];
    
    setSelectedDate({ year, month, day, dateKey });
    setNoteText(existingNote?.text || '');
    setNoteType(existingNote?.type || 'meeting');
    setShowNotePopup(true);
  };

  // Save note
  const saveNote = () => {
    if (!selectedDate) return;
    
    const updatedNotes = {
      ...officeNotes,
      [selectedDate.dateKey]: {
        text: noteText,
        type: noteType,
        date: selectedDate.dateKey
      }
    };
    
    setOfficeNotes(updatedNotes);
    setShowNotePopup(false);
  };

  // Delete note
  const deleteNote = () => {
    if (!selectedDate) return;
    
    const updatedNotes = { ...officeNotes };
    delete updatedNotes[selectedDate.dateKey];
    setOfficeNotes(updatedNotes);
    setShowNotePopup(false);
  };

  // Calculate stats for the selected year
  const today = new Date();
  const totalHolidays = filteredHolidays.length;
  const upcomingHolidays = filteredHolidays.filter(h => new Date(h.date) > today);
  const pastHolidays = filteredHolidays.filter(h => new Date(h.date) < today);

  // Render calendar for selected month
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`} style={styles.emptyCell}></td>);
    }

    // Fill in the days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayHolidays = getHolidaysForDate(selectedYear, selectedMonth, day);
      const officeNote = getOfficeNotesForDate(selectedYear, selectedMonth, day);
      const isToday = 
        day === new Date().getDate() && 
        selectedMonth === new Date().getMonth() && 
        selectedYear === new Date().getFullYear();

      // Get note type color if exists
      const noteTypeInfo = noteTypes.find(t => t.value === officeNote?.type);

      days.push(
        <td 
          key={day} 
          onClick={() => handleDayClick(selectedYear, selectedMonth, day)}
          style={{
            ...styles.calendarCell,
            backgroundColor: isToday ? '#e3f2fd' : 'white',
            border: isToday ? '2px solid #1976d2' : '1px solid #e0e0e0',
            cursor: 'pointer',
          }}
        >
          <div style={styles.dayNumber}>{day}</div>
          
          {/* Show holidays - TEXT ONLY, no icons */}
          {dayHolidays.map((holiday, idx) => {
            const typeInfo = getHolidayTypeInfo(holiday.holiday_type);
            return (
              <div 
                key={idx} 
                style={{
                  ...styles.holidayBadge,
                  backgroundColor: typeInfo.bgColor,
                  color: typeInfo.color,
                  borderLeft: `3px solid ${typeInfo.color}`,
                }}
                title={holiday.name}
              >
                {holiday.name.length > 12 
                  ? holiday.name.substring(0, 12) + '…' 
                  : holiday.name}
              </div>
            );
          })}
          
          {/* Show office note */}
          {officeNote && (
            <div 
              style={{
                ...styles.noteBadge,
                backgroundColor: noteTypeInfo?.color ? `${noteTypeInfo.color}20` : '#fff3e0',
                color: noteTypeInfo?.color || '#f57c00',
                borderLeft: `3px solid ${noteTypeInfo?.color || '#f57c00'}`,
              }}
              title={officeNote.text}
            >
              {noteTypes.find(t => t.value === officeNote.type)?.label.split(' ')[0] || '📝'} 
              {officeNote.text.length > 8 ? officeNote.text.substring(0, 8) + '…' : officeNote.text}
            </div>
          )}
        </td>
      );
    }

    // Fill remaining cells to complete the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      days.push(<td key={`empty-end-${i}`} style={styles.emptyCell}></td>);
    }

    // Split into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(<tr key={`week-${i}`}>{days.slice(i, i + 7)}</tr>);
    }

    return weeks;
  };

  // Get month stats (using filteredHolidays)
  const getMonthStats = () => {
    const monthHolidays = filteredHolidays.filter(h => {
      const date = new Date(h.date);
      return date.getMonth() === selectedMonth;
    });
    
    return {
      total: monthHolidays.length,
      byType: monthHolidays.reduce((acc, h) => {
        acc[h.holiday_type] = (acc[h.holiday_type] || 0) + 1;
        return acc;
      }, {})
    };
  };

  const monthStats = getMonthStats();

  return (
    <div style={styles.container}>
      {/* Header with Title */}
      <div style={styles.header}>
        <h1 style={styles.title}>📅 Holiday Calendar</h1>
        <p style={styles.subtitle}>View all holidays and plan ahead</p>
      </div>

      {/* Stats Cards - Like Admin View */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div>
            <div style={styles.statLabel}>Total Holidays in {selectedYear}</div>
            <div style={styles.statValue}>{totalHolidays}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div>
            <div style={styles.statLabel}>Upcoming</div>
            <div style={styles.statValue}>{upcomingHolidays.length}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div>
            <div style={styles.statLabel}>Past This Year</div>
            <div style={styles.statValue}>{pastHolidays.length}</div>
          </div>
        </div>
      </div>

      {/* Year and Month Selector */}
      <div style={styles.controlsBar}>
        {/* Year Dropdown */}
        <div style={styles.yearDropdownContainer}>
          <button 
            onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
            style={styles.yearDropdownButton}
          >
            <span style={styles.yearText}>{selectedYear}</span>
            <span style={styles.dropdownArrow}>▼</span>
          </button>
          
          {isYearDropdownOpen && (
            <div style={styles.yearDropdownMenu}>
              {years.map(year => (
                <div
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  style={{
                    ...styles.yearDropdownItem,
                    backgroundColor: selectedYear === year ? '#eef2ff' : 'white',
                    color: selectedYear === year ? '#667eea' : '#333',
                  }}
                >
                  <span>{year}</span>
                  {selectedYear === year && <span style={styles.checkmark}> ✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Month Navigation */}
        <div style={styles.monthSelector}>
          <button 
            onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
            style={styles.monthNavButton}
            title="Previous Month"
          >
            ◀
          </button>
          
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={styles.monthSelect}
          >
            {months.map((month, index) => (
              <option key={month} value={index}>
                {month} {selectedYear}
              </option>
            ))}
          </select>
          
          <button 
            onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
            style={styles.monthNavButton}
            title="Next Month"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={styles.calendarContainer}>
        <table style={styles.calendarTable}>
          <thead>
            <tr>
              <th style={styles.weekDay}>Sun</th>
              <th style={styles.weekDay}>Mon</th>
              <th style={styles.weekDay}>Tue</th>
              <th style={styles.weekDay}>Wed</th>
              <th style={styles.weekDay}>Thu</th>
              <th style={styles.weekDay}>Fri</th>
              <th style={styles.weekDay}>Sat</th>
            </tr>
          </thead>
          <tbody>
            {renderCalendar()}
          </tbody>
        </table>
      </div>

      {/* Month Stats */}
      {monthStats.total > 0 && (
        <div style={styles.monthStats}>
          <span style={styles.monthStatsText}>
            📅 {monthStats.total} holiday{monthStats.total !== 1 ? 's' : ''} this month
          </span>
        </div>
      )}

      {/* Note Popup Modal */}
      {showNotePopup && selectedDate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Add Office Note</h3>
            <p style={styles.modalDate}>
              {months[selectedDate.month]} {selectedDate.day}, {selectedDate.year}
            </p>
            
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Note Type:</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                style={styles.modalSelect}
              >
                {noteTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.modalField}>
              <label style={styles.modalLabel}>Note:</label>
              <textarea
                style={styles.modalTextarea}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                rows="3"
                autoFocus
              />
            </div>

            <div style={styles.modalButtons}>
              {officeNotes[selectedDate.dateKey] && (
                <button onClick={deleteNote} style={styles.modalDeleteButton}>
                  🗑️ Delete
                </button>
              )}
              <button onClick={saveNote} style={styles.modalSaveButton}>
                Save
              </button>
              <button onClick={() => setShowNotePopup(false)} style={styles.modalCancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend - TEXT ONLY, no icons for holiday types */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>Legend:</span>
        {Object.entries({
          'NATIONAL': 'Government',
          'RELIGIOUS': 'Religious',
          'COMPANY': 'Company',
          'OTHER': 'Other'
        }).map(([key, label]) => {
          const typeInfo = getHolidayTypeInfo(key);
          return (
            <span key={key} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: typeInfo.color }}></span>
              {label}
            </span>
          );
        })}
        {noteTypes.map(type => (
          <span key={type.value} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: type.color }}></span>
            {type.label}
          </span>
        ))}
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <p style={styles.instructionsText}>
          💡 Click on any day to add or edit office notes (meetings, deadlines, etc.)
        </p>
      </div>

      {/* Future Year Note */}
      {selectedYear > new Date().getFullYear() && (
        <div style={styles.futureNote}>
          ⏳ Showing holidays for {selectedYear}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  yearDropdownContainer: {
    position: 'relative',
    minWidth: '120px',
  },
  yearDropdownButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  yearText: {
    fontSize: '16px',
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: '12px',
    color: '#667eea',
  },
  yearDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
    marginTop: '4px',
  },
  yearDropdownItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
  },
  checkmark: {
    color: '#667eea',
    fontWeight: '600',
  },
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  monthNavButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  monthSelect: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '160px',
  },
  monthStats: {
    marginTop: '16px',
    padding: '8px 16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '20px',
    display: 'inline-block',
  },
  monthStatsText: {
    fontSize: '14px',
    color: '#2e7d32',
    fontWeight: '500',
  },
  calendarContainer: {
    overflowX: 'auto',
  },
  calendarTable: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  weekDay: {
    padding: '12px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    color: '#666',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    width: '14.28%',
  },
  calendarCell: {
    height: '100px',
    padding: '6px',
    verticalAlign: 'top',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  emptyCell: {
    height: '100px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
  },
  dayNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  holidayBadge: {
    fontSize: '11px',
    padding: '2px 4px',
    marginBottom: '2px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '500',
  },
  noteBadge: {
    fontSize: '10px',
    padding: '2px 4px',
    marginTop: '2px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  modalDate: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  modalField: {
    marginBottom: '16px',
  },
  modalLabel: {
    display: 'block',
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
    fontWeight: '500',
  },
  modalSelect: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  modalSaveButton: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  modalCancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  modalDeleteButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginRight: 'auto',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  legendTitle: {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
    marginRight: '5px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#666',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  instructions: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    textAlign: 'center',
  },
  instructionsText: {
    margin: 0,
    fontSize: '13px',
    color: '#1976d2',
  },
  futureNote: {
    marginTop: '16px',
    padding: '8px',
    backgroundColor: '#fff3e0',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#f57c00',
  },
};

export default EmployeeCalendar;
