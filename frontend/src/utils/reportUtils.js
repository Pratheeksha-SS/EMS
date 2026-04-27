
// Helper functions for reports

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  switch(status?.toUpperCase()) {
    case 'APPROVED':
    case 'PRESENT':
      return { bg: '#10B98120', color: '#10B981', text: 'Approved' };
    case 'REJECTED':
    case 'ABSENT':
      return { bg: '#EF444420', color: '#EF4444', text: 'Rejected' };
    case 'PENDING':
    case 'LATE':
      return { bg: '#F59E0B20', color: '#F59E0B', text: 'Pending' };
    default:
      return { bg: '#6B728020', color: '#6B7280', text: status || 'N/A' };
  }
};

export const getLeaveTypeIcon = (type) => {
  switch(type?.toUpperCase()) {
    case 'CASUAL': return '🏖️';
    case 'SICK': return '🤒';
    case 'PAID': return '💰';
    case 'MATERNITY': return '👶';
    case 'PATERNITY': return '👨‍👧';
    default: return '📅';
  }
};

export const downloadCSV = (data, filename, headers, rowFormatter) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  data.forEach(item => {
    const row = rowFormatter(item);
    const escapedRow = row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      const stringCell = String(cell);
      if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
        return `"${stringCell.replace(/"/g, '""')}"`;
      }
      return stringCell;
    });
    csvRows.push(escapedRow.join(','));
  });
  
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getDateRangeOptions = () => [
  { value: 'today', label: 'Today', days: 0 },
  { value: 'yesterday', label: 'Yesterday', days: 1 },
  { value: 'week', label: 'Last 7 Days', days: 7 },
  { value: 'month', label: 'Last 30 Days', days: 30 },
  { value: 'thisMonth', label: 'This Month', days: null },
  { value: 'thisYear', label: 'This Year', days: null },
  { value: 'custom', label: 'Custom Range', days: null }
];

export const calculateDateRange = (rangeType) => {
  const today = new Date();
  let startDate, endDate;
  
  switch(rangeType) {
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