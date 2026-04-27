import React, { useState } from 'react';
import { Filter, RotateCcw, Search, Calendar, Users, User, Building2, ChevronDown } from 'lucide-react';

const ReportFilters = ({ filters, employees, departments, onFilterChange, onGenerate, loading }) => {
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const reportTypes = [
    { value: 'attendance', label: 'Attendance Report', icon: '📊' },
    { value: 'leave', label: 'Leave Report', icon: '📝' },
    { value: 'employee', label: 'Employee Activity', icon: '👥' },
  ];

  const dateRangeOptions = [
    { value: 'single', label: 'Single Date' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const calculateDateRange = (rangeValue) => {
    const today = new Date();
    let startDate, endDate;
    
    switch(rangeValue) {
      case 'single':
        return null;
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        return null;
    }
    
    return { startDate, endDate };
  };

  const handleDateRangeChange = (rangeValue) => {
    if (rangeValue === 'single') {
      // For single date, set both start and end to the same date (current date)
      const today = new Date().toISOString().split('T')[0];
      onFilterChange({ 
        dateRange: rangeValue, 
        startDate: today, 
        endDate: today 
      });
    } else if (rangeValue === 'custom') {
      onFilterChange({ dateRange: rangeValue });
    } else {
      const { startDate, endDate } = calculateDateRange(rangeValue);
      if (startDate && endDate) {
        onFilterChange({ dateRange: rangeValue, startDate, endDate });
      }
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const search = employeeSearch.toLowerCase();
    return (
      (emp.first_name?.toLowerCase().includes(search) ||
       emp.last_name?.toLowerCase().includes(search) ||
       emp.employee_id?.toLowerCase().includes(search))
    );
  });

  const selectedEmployee = employees.find(emp => emp.id === parseInt(filters.employeeId));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Filter size={18} color="#F97316" />
          <h3 style={styles.title}>Report Filters</h3>
        </div>
        <button onClick={onGenerate} style={styles.resetBtn} disabled={loading}>
          <RotateCcw size={14} />
          Reset Filters
        </button>
      </div>

      <div style={styles.filtersRow}>
        {/* Report Type */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>Report Type</label>
          <select
            style={styles.select}
            value={filters.reportType}
            onChange={(e) => onFilterChange({ reportType: e.target.value })}
          >
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Scope */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>Scope</label>
          <div style={styles.scopeButtons}>
            <button
              style={{
                ...styles.scopeBtn,
                ...(filters.scope === 'all' ? styles.scopeBtnActive : {})
              }}
              onClick={() => onFilterChange({ scope: 'all', employeeId: '' })}
            >
              <Users size={14} />
              All Employees
            </button>
            <button
              style={{
                ...styles.scopeBtn,
                ...(filters.scope === 'individual' ? styles.scopeBtnActive : {})
              }}
              onClick={() => onFilterChange({ scope: 'individual' })}
            >
              <User size={14} />
              Specific Employee
            </button>
          </div>
        </div>

        {/* Employee Selector */}
        {filters.scope === 'individual' && (
          <div style={styles.filterGroup}>
            <label style={styles.label}>Select Employee</label>
            <div style={styles.employeeSelector}>
              <div 
                style={styles.employeeInput} 
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                {selectedEmployee ? (
                  <span>{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                ) : (
                  <span style={{ color: '#9ca3af' }}>Choose an employee...</span>
                )}
                <ChevronDown size={16} />
              </div>
              {showEmployeeDropdown && (
                <div style={styles.employeeDropdown}>
                  <div style={styles.employeeSearch}>
                    <Search size={14} />
                    <input
                      type="text"
                      placeholder="Search employee..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      style={styles.employeeSearchInput}
                    />
                  </div>
                  <div style={styles.employeeList}>
                    {filteredEmployees.map(emp => (
                      <div
                        key={emp.id}
                        style={styles.employeeItem}
                        onClick={() => {
                          onFilterChange({ employeeId: emp.id });
                          setShowEmployeeDropdown(false);
                          setEmployeeSearch('');
                        }}
                      >
                        <div style={styles.employeeAvatar}>
                          {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={styles.employeeName}>
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div style={styles.employeeDept}>{emp.department}</div>
                        </div>
                      </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <div style={styles.noResults}>No employees found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Department Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>Department</label>
          <select
            style={styles.select}
            value={filters.department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>Date Range</label>
          <select
            style={styles.select}
            value={filters.dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div style={styles.customRange}>
            <input
              type="date"
              style={styles.dateInput}
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
            />
            <span>to</span>
            <input
              type="date"
              style={styles.dateInput}
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
            />
          </div>
        )}

        {/* Single Date Input */}
        {filters.dateRange === 'single' && (
          <div style={styles.singleDateRange}>
            <input
              type="date"
              style={styles.dateInput}
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value, endDate: e.target.value })}
            />
          </div>
        )}

        {/* Generate Button */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>&nbsp;</label>
          <button
            style={styles.generateBtn}
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <div style={styles.spinner} />
                Generating...
              </>
            ) : (
              <>
                <Search size={16} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  resetBtn: {
    padding: '6px 12px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#6b7280',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#e5e7eb',
    },
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'flex-end',
  },
  filterGroup: {
    flex: 1,
    minWidth: '160px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#F97316',
    },
  },
  scopeButtons: {
    display: 'flex',
    gap: '8px',
  },
  scopeBtn: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: '#10B981',
      color: '#10B981',
    },
  },
  scopeBtnActive: {
    background: '#10B981',
    color: 'white',
    borderColor: '#10B981',
    '&:hover': {
      background: '#059669',
      color: 'white',
    },
  },
  employeeSelector: {
    position: 'relative',
  },
  employeeInput: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'border-color 0.2s',
    '&:hover': {
      borderColor: '#F97316',
    },
  },
  employeeDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxHeight: '300px',
    overflow: 'hidden',
  },
  employeeSearch: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderBottom: '1px solid #e5e7eb',
  },
  employeeSearchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '13px',
  },
  employeeList: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    '&:hover': {
      background: '#fef9e8',
    },
  },
  employeeAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #F97316, #F59E0B)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  employeeName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937',
  },
  employeeDept: {
    fontSize: '11px',
    color: '#6b7280',
  },
  noResults: {
    padding: '20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
  },
  customRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '240px',
  },
  singleDateRange: {
    minWidth: '160px',
  },
  dateInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    background: 'white',
    transition: 'border-color 0.2s',
    '&:focus': {
      outline: 'none',
      borderColor: '#F97316',
    },
  },
  generateBtn: {
    width: '100%',
    padding: '10px 12px',
    background: 'linear-gradient(135deg, #F97316, #F59E0B)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    '&:hover:not(:disabled)': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default ReportFilters;