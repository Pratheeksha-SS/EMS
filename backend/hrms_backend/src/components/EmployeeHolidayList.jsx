// src/components/EmployeeHolidayList.jsx
import React, { useState } from 'react';

const EmployeeHolidayList = ({ holidays, selectedYear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Get holiday type icon and color
  const getHolidayTypeInfo = (type) => {
    const types = {
      'GOVT': { icon: '🏛️', color: '#1976d2', bgColor: '#e3f2fd', label: 'Government' },
      'FESTIVAL': { icon: '🎊', color: '#f57c00', bgColor: '#fff3e0', label: 'Festival' },
      'COMPANY': { icon: '🏢', color: '#4caf50', bgColor: '#e8f5e9', label: 'Company' },
      'PARTY': { icon: '🎉', color: '#9c27b0', bgColor: '#f3e5f5', label: 'Celebration' },
    };
    return types[type] || { icon: '📅', color: '#757575', bgColor: '#f5f5f5', label: 'Other' };
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  // Get day name
  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  };

  // Filter holidays based on search and type
  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || holiday.holiday_type === filterType;
    return matchesSearch && matchesType;
  });

  // Sort holidays by date
  const sortedHolidays = [...filteredHolidays].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return (
    <div style={styles.container}>
      {/* Search and Filter Bar */}
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
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="GOVT">Government</option>
          <option value="FESTIVAL">Festival</option>
          <option value="COMPANY">Company</option>
          <option value="PARTY">Celebration</option>
        </select>
      </div>

      {/* Holidays Table */}
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
              sortedHolidays.map((holiday, index) => {
                const typeInfo = getHolidayTypeInfo(holiday.holiday_type);
                return (
                  <tr key={holiday.id || index} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>
                      <strong>{holiday.name}</strong>
                    </td>
                    <td style={styles.td}>{formatDate(holiday.date)}</td>
                    <td style={styles.td}>{getDayName(holiday.date)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: typeInfo.bgColor,
                        color: typeInfo.color,
                      }}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div style={styles.resultsCount}>
        Showing {sortedHolidays.length} of {holidays.length} holidays
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
  filterBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '0 12px',
    minWidth: '250px',
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
  filterSelect: {
    padding: '12px 20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
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
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
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