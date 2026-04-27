// src/pages/EmployeeHolidayPage.jsx
import React, { useState, useEffect } from 'react';
import EmployeeCalendar from '../components/EmployeeCalendar';
import EmployeeHolidayList from '../components/EmployeeHolidayList';
import OfficeNotes from '../components/OfficeNotes';

const EmployeeHolidayPage = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showNotes, setShowNotes] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    myNotes: 0
  });

  // Available years from 2024 to 2030
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  // Load holidays when year changes
  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/holidays/?year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
        
        // Calculate stats
        const today = new Date();
        const upcoming = data.filter(h => new Date(h.date) > today);
        
        // Get notes count from localStorage
        const notesKey = `office_notes_${selectedYear}`;
        const savedNotes = localStorage.getItem(notesKey);
        const notesCount = savedNotes ? Object.keys(JSON.parse(savedNotes)).length : 0;
        
        setStats({
          total: data.length,
          upcoming: upcoming.length,
          myNotes: notesCount
        });
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📅 Holiday Calendar</h1>
        <p style={styles.subtitle}>View all holidays and plan ahead</p>
      </div>

      {/* Year Selector */}
      <div style={styles.yearSelector}>
        {years.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            style={{
              ...styles.yearButton,
              backgroundColor: selectedYear === year ? '#667eea' : 'white',
              color: selectedYear === year ? 'white' : '#333',
              border: selectedYear === year ? 'none' : '1px solid #ddd',
            }}
          >
            {year} {year > new Date().getFullYear() ? '⏳' : ''}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div>
            <div style={styles.statLabel}>Total Holidays</div>
            <div style={styles.statValue}>{stats.total}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div>
            <div style={styles.statLabel}>Upcoming</div>
            <div style={styles.statValue}>{stats.upcoming}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📝</div>
          <div>
            <div style={styles.statLabel}>My Notes</div>
            <div style={styles.statValue}>{stats.myNotes}</div>
          </div>
        </div>
      </div>

      {/* View Toggle and Notes Button */}
      <div style={styles.controls}>
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...styles.viewButton,
              backgroundColor: viewMode === 'list' ? '#667eea' : '#f0f0f0',
              color: viewMode === 'list' ? 'white' : '#333',
            }}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              ...styles.viewButton,
              backgroundColor: viewMode === 'calendar' ? '#667eea' : '#f0f0f0',
              color: viewMode === 'calendar' ? 'white' : '#333',
            }}
          >
            📆 Calendar View
          </button>
        </div>
        
        <button
          onClick={() => setShowNotes(!showNotes)}
          style={{
            ...styles.notesButton,
            backgroundColor: showNotes ? '#667eea' : '#f0f0f0',
            color: showNotes ? 'white' : '#333',
          }}
        >
          📝 {showNotes ? 'Hide Notes' : 'Add Office Notes'}
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={styles.loading}>Loading holidays...</div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <EmployeeHolidayList 
              holidays={holidays} 
              selectedYear={selectedYear}
            />
          ) : (
            <EmployeeCalendar 
              holidays={holidays}
              selectedYear={selectedYear}
            />
          )}
        </>
      )}

      {/* Office Notes Popup */}
      {showNotes && (
        <OfficeNotes 
          selectedYear={selectedYear}
          onClose={() => setShowNotes(false)}
          onNoteAdded={() => {
            fetchHolidays(); // Refresh stats
          }}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '32px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#333',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  yearSelector: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  yearButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  viewToggle: {
    display: 'flex',
    gap: '10px',
  },
  viewButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  notesButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

export default EmployeeHolidayPage;