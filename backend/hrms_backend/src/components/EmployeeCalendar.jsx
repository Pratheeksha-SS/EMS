// src/components/EmployeeCalendar.jsx
import React, { useState } from 'react';

const EmployeeCalendar = ({ holidays, selectedYear }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get holiday type icon and color
  const getHolidayTypeInfo = (type) => {
    const types = {
      'GOVT': { icon: '🏛️', color: '#1976d2', bgColor: '#e3f2fd' },
      'FESTIVAL': { icon: '🎊', color: '#f57c00', bgColor: '#fff3e0' },
      'COMPANY': { icon: '🏢', color: '#4caf50', bgColor: '#e8f5e9' },
      'PARTY': { icon: '🎉', color: '#9c27b0', bgColor: '#f3e5f5' },
    };
    return types[type] || { icon: '📅', color: '#757575', bgColor: '#f5f5f5' };
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Get holidays for a specific date
  const getHolidaysForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.filter(h => h.date.startsWith(dateStr));
  };

  // Get office notes from localStorage
  const getOfficeNotes = (year, month, day) => {
    const notesKey = `office_notes_${year}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      const notes = JSON.parse(savedNotes);
      const dateKey = `${year}-${month + 1}-${day}`;
      return notes[dateKey] || null;
    }
    return null;
  };

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
      const officeNote = getOfficeNotes(selectedYear, selectedMonth, day);
      const isToday = 
        day === new Date().getDate() && 
        selectedMonth === new Date().getMonth() && 
        selectedYear === new Date().getFullYear();

      days.push(
        <td key={day} style={{
          ...styles.calendarCell,
          backgroundColor: isToday ? '#e3f2fd' : 'white',
          border: isToday ? '2px solid #1976d2' : '1px solid #e0e0e0',
        }}>
          <div style={styles.dayNumber}>{day}</div>
          
          {/* Show holidays */}
          {dayHolidays.map((holiday, idx) => {
            const typeInfo = getHolidayTypeInfo(holiday.holiday_type);
            return (
              <div 
                key={idx} 
                style={{
                  ...styles.holidayBadge,
                  backgroundColor: typeInfo.bgColor,
                  color: typeInfo.color,
                }}
                title={holiday.name}
              >
                {typeInfo.icon} {holiday.name.length > 10 
                  ? holiday.name.substring(0, 10) + '…' 
                  : holiday.name}
              </div>
            );
          })}
          
          {/* Show office note */}
          {officeNote && (
            <div 
              style={{
                ...styles.noteBadge,
                backgroundColor: officeNote.type === 'meeting' ? '#e3f2fd' :
                                 officeNote.type === 'deadline' ? '#ffebee' :
                                 officeNote.type === 'client' ? '#e8f5e9' : '#fff3e0',
                color: officeNote.type === 'meeting' ? '#1976d2' :
                       officeNote.type === 'deadline' ? '#c62828' :
                       officeNote.type === 'client' ? '#2e7d32' : '#f57c00',
              }}
              title={officeNote.text}
            >
              {officeNote.type === 'meeting' ? '📅' :
               officeNote.type === 'deadline' ? '⏰' :
               officeNote.type === 'client' ? '📞' : '📝'} 
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

  return (
    <div style={styles.container}>
      {/* Month Selector */}
      <div style={styles.monthSelector}>
        <button 
          onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
          style={styles.monthNavButton}
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
        >
          ▶
        </button>
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

      {/* Legend */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>Legend:</span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#1976d2' }}></span> Government
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#f57c00' }}></span> Festival
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#4caf50' }}></span> Company
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#9c27b0' }}></span> Celebration
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#2196f3' }}></span> 📅 Meeting
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#f44336' }}></span> ⏰ Deadline
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  monthSelector: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  monthNavButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  monthSelect: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
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
    padding: '8px',
    verticalAlign: 'top',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
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
  },
  noteBadge: {
    fontSize: '10px',
    padding: '2px 4px',
    marginTop: '2px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
    fontSize: '13px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#666',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
};

export default EmployeeCalendar;