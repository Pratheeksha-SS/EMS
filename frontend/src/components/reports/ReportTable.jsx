import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Eye, Download } from 'lucide-react';
import { formatDate, getStatusColor, getLeaveTypeIcon } from '../../utils/reportUtils';

const ReportTable = ({ data, reportType, loading, onRowClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getColumns = () => {
    switch(reportType) {
      case 'attendance':
        return [
          { key: 'employee_name', label: 'Employee', sortable: true },
          { key: 'employee_id', label: 'ID', sortable: true },
          { key: 'department', label: 'Department', sortable: true },
          { key: 'date', label: 'Date', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'login_time', label: 'Login Time', sortable: false },
          { key: 'logout_time', label: 'Logout Time', sortable: false },
          { key: 'working_hours', label: 'Hours', sortable: true },
        ];
      case 'leave':
        return [
          { key: 'employee_name', label: 'Employee', sortable: true },
          { key: 'employee_id', label: 'ID', sortable: true },
          { key: 'department', label: 'Department', sortable: true },
          { key: 'leave_type', label: 'Leave Type', sortable: true },
          { key: 'start_date', label: 'From', sortable: true },
          { key: 'end_date', label: 'To', sortable: true },
          { key: 'days', label: 'Days', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
        ];
      case 'employee':
        return [
          { key: 'employee_name', label: 'Employee', sortable: true },
          { key: 'employee_id', label: 'ID', sortable: true },
          { key: 'department', label: 'Department', sortable: true },
          { key: 'designation', label: 'Designation', sortable: true },
          { key: 'total_present', label: 'Present', sortable: true },
          { key: 'total_absent', label: 'Absent', sortable: true },
          { key: 'total_leaves', label: 'Leaves', sortable: true },
          { key: 'attendance_percentage', label: 'Attendance %', sortable: true },
        ];
      default:
        return [];
    }
  };

  const getRowData = (item) => {
    switch(reportType) {
      case 'attendance':
        const status = getStatusColor(item.status);
        return {
          ...item,
          employee_name: item.employee_name || item.employee?.first_name + ' ' + item.employee?.last_name || 'N/A',
          employee_id: item.employee_id || item.employee?.employee_id || 'N/A',
          department: item.department || item.employee?.department || 'N/A',
          date: formatDate(item.date),
          status: <span style={{ ...styles.statusBadge, background: status.bg, color: status.color }}>{status.text}</span>,
          login_time: item.login_time || '-',
          logout_time: item.logout_time || '-',
          working_hours: item.working_hours || '-'
        };
      case 'leave':
        const leaveStatus = getStatusColor(item.status);
        return {
          ...item,
          employee_name: item.employee_name || item.employee?.first_name + ' ' + item.employee?.last_name || 'N/A',
          employee_id: item.employee_id || item.employee?.employee_id || 'N/A',
          department: item.department || item.employee?.department || 'N/A',
          leave_type: <span style={styles.leaveTypeBadge}>{getLeaveTypeIcon(item.leave_type)} {item.leave_type}</span>,
          start_date: formatDate(item.start_date),
          end_date: formatDate(item.end_date),
          days: `${item.days || 0} day(s)`,
          status: <span style={{ ...styles.statusBadge, background: leaveStatus.bg, color: leaveStatus.color }}>{leaveStatus.text}</span>
        };
      case 'employee':
        return {
          ...item,
          employee_name: item.employee_name || item.first_name + ' ' + item.last_name || 'N/A',
          employee_id: item.employee_id || 'N/A',
          department: item.department || 'N/A',
          designation: item.designation || 'N/A',
          total_present: item.total_present || 0,
          total_absent: item.total_absent || 0,
          total_leaves: item.total_leaves || 0,
          attendance_percentage: `${item.attendance_percentage || 0}%`
        };
      default:
        return item;
    }
  };

  const handleSort = (key) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.employee_name?.toLowerCase().includes(search)) ||
      (item.employee_id?.toString().toLowerCase().includes(search)) ||
      (item.department?.toLowerCase().includes(search))
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'date' || sortField === 'start_date' || sortField === 'end_date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = getColumns();
  const processedData = paginatedData.map(item => getRowData(item));

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={styles.skeletonRow}>
            {columns.map((_, idx) => (
              <div key={idx} style={styles.skeletonCell} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📊</div>
        <p>No data available for selected filters</p>
        <small>Try adjusting your filter criteria</small>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.searchBar}>
        <Search size={18} style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by employee name, ID, or department..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.searchInput}
        />
        <span style={styles.recordCount}>{filteredData.length} records found</span>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={styles.th}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div style={styles.thContent}>
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, idx) => (
              <tr
                key={idx}
                style={styles.tr}
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} style={styles.td}>
                    {item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            style={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  searchBar: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchIcon: {
    color: '#9ca3af',
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  recordCount: {
    fontSize: '12px',
    color: '#6b7280',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
    color: '#374151',
  },
  tr: {
    transition: 'background 0.2s',
    '&:hover': {
      background: '#fef9e8',
    },
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
  },
  leaveTypeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: '#fef3c7',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#d97706',
  },
  loadingContainer: {
    padding: '20px',
  },
  skeletonRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
  },
  skeletonCell: {
    flex: 1,
    height: '40px',
    background: '#f3f4f6',
    borderRadius: '6px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  pageBtn: {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
    '&:hover:not(:disabled)': {
      background: '#f3f4f6',
      borderColor: '#F97316',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  pageInfo: {
    fontSize: '13px',
    color: '#6b7280',
  },
};

export default ReportTable;