import React, { useState, useEffect } from 'react';

const EmployeeHolidayList = ({ holidays = [], selectedYear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredByYear, setFilteredByYear] = useState([]);

  // Filter holidays by selected year
  useEffect(() => {
    if (holidays.length > 0) {
      const yearFiltered = holidays.filter(holiday => {
        const holidayYear = new Date(holiday.date).getFullYear();
        return holidayYear === selectedYear;
      });
      setFilteredByYear(yearFiltered);
    } else {
      setFilteredByYear([]);
    }
  }, [holidays, selectedYear]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  };

  // ✅ ONLY SEARCH FILTER (NO TYPE FILTER)
  const filteredHolidays = filteredByYear.filter(holiday =>
    holiday.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedHolidays = [...filteredHolidays].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Holidays in {selectedYear}</h2>
        <p style={styles.subtitle}>{filteredByYear.length} holidays found</p>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search holidays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Holiday Name</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Day</th>
              <th style={styles.th}>Type</th>
            </tr>
          </thead>
          <tbody>
            {sortedHolidays.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.noData}>
                  No holidays found for {selectedYear}
                </td>
              </tr>
            ) : (
              sortedHolidays.map((holiday, index) => (
                <tr key={holiday.id || index} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>
                    <strong>{holiday.name}</strong>
                  </td>
                  <td style={styles.td}>{formatDate(holiday.date)}</td>
                  <td style={styles.td}>{getDayName(holiday.date)}</td>

                  {/* ✅ ALWAYS GOVERNMENT HOLIDAY */}
                  <td style={styles.td}>
                    Government Holiday
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.resultsCount}>
        Showing {sortedHolidays.length} of {filteredByYear.length} holidays in {selectedYear}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  filterBar: {
    marginBottom: '20px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '0 12px',
    maxWidth: '300px',
  },
  searchIcon: {
    fontSize: '16px',
    color: '#999',
    marginRight: '8px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    outline: 'none',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    color: '#666',
    fontWeight: '600',
    fontSize: '14px',
    borderBottom: '2px solid #dee2e6',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#333',
  },
  rowEven: {
    backgroundColor: 'white',
  },
  rowOdd: {
    backgroundColor: '#f8f9fa',
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  resultsCount: {
    marginTop: '20px',
    textAlign: 'right',
    fontSize: '13px',
    color: '#999',
  },
};

export default EmployeeHolidayList;