import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Printer, Download } from 'lucide-react';

const ReportExport = ({ data, filename, reportType }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getHeaders = () => {
    switch(reportType) {
      case 'attendance':
        return ['Employee Name', 'Employee ID', 'Department', 'Date', 'Status', 'Login Time', 'Logout Time', 'Working Hours'];
      case 'leave':
        return ['Employee Name', 'Employee ID', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied On'];
      case 'employee':
        return ['Employee Name', 'Employee ID', 'Department', 'Designation', 'Joining Date', 'Tenure (Days)', 'Tenure (Years)', 'Status', 'Leaves Taken', 'Leave Balance', 'Last Salary', 'Performance Rating'];
      case 'salary':
        return ['Employee Name', 'Employee ID', 'Department', 'Designation', 'Month', 'Year', 'Basic Salary', 'HRA', 'Conveyance', 'Medical', 'Special Allowance', 'Bonus', 'Overtime', 'Gross Salary', 'PF', 'Professional Tax', 'Income Tax', 'Leave Deduction', 'Total Deductions', 'Net Salary', 'Payment Status', 'Payment Date'];
      default:
        return ['Employee Name', 'Employee ID', 'Department', 'Date', 'Status'];
    }
  };

  const getRowData = (item) => {
    switch(reportType) {
      case 'attendance':
        return [
          item.employee_name || (item.employee?.first_name + ' ' + item.employee?.last_name) || 'N/A',
          item.employee_id || item.employee?.employee_id || 'N/A',
          item.department || item.employee?.department || 'N/A',
          item.date,
          item.status || 'N/A',
          item.login_time || '-',
          item.logout_time || '-',
          item.working_hours || '-'
        ];
      case 'leave':
        return [
          item.employee_name || (item.employee?.first_name + ' ' + item.employee?.last_name) || 'N/A',
          item.employee_id || item.employee?.employee_id || 'N/A',
          item.leave_type || 'N/A',
          item.start_date,
          item.end_date,
          item.days || 'N/A',
          item.reason || 'N/A',
          item.status || 'N/A',
          item.applied_on || item.created_at
        ];
      case 'employee':
        return [
          item.employee_name || (item.first_name + ' ' + item.last_name) || 'N/A',
          item.employee_id || 'N/A',
          item.department || 'N/A',
          item.designation || 'N/A',
          item.joining_date || 'N/A',
          item.tenure_days || 0,
          item.tenure_years || 0,
          item.status || 'N/A',
          item.leaves_taken || 0,
          item.leave_balance || 0,
          item.last_salary || 0,
          item.performance_rating || 'N/A'
        ];
      case 'salary':
        return [
          item.employee_name || 'N/A',
          item.employee_id || 'N/A',
          item.department || 'N/A',
          item.designation || 'N/A',
          item.month || 'N/A',
          item.year || 'N/A',
          item.basic_salary || 0,
          item.house_rent_allowance || 0,
          item.conveyance_allowance || 0,
          item.medical_allowance || 0,
          item.special_allowance || 0,
          item.bonus || 0,
          item.overtime || 0,
          item.gross_salary || 0,
          item.provident_fund || 0,
          item.professional_tax || 0,
          item.income_tax || 0,
          item.leave_deduction || 0,
          item.total_deductions || 0,
          item.net_salary || 0,
          item.payment_status || 'N/A',
          item.payment_date || 'N/A'
        ];
      default:
        return ['N/A', 'N/A', 'N/A', 'N/A', 'N/A'];
    }
  };

  const exportToCSV = () => {
    if (!data?.length) {
      alert('No data to export');
      return;
    }
    
    const headers = getHeaders();
    const rows = data.map(getRowData);
    
    const escapeCSV = (cell) => {
      const str = String(cell ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    const csv = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const exportToExcel = () => {
    if (!data?.length) {
      alert('No data to export');
      return;
    }

    const wb = XLSX.utils.book_new();
    const headers = getHeaders();
    const rows = data.map(getRowData);
    const fullData = [headers, ...rows]; // No empty rows!

    const ws = XLSX.utils.aoa_to_sheet(fullData);

    // Enhanced column widths
    const colWidths = headers.map((h, i) => {
      // Date columns need more width (12-15 chars for mm/dd/yyyy format)
      const dateColIndices = {
        attendance: [3],
        leave: [4, 5, 9],
        employee: []
      }[reportType] || [];
      
      if (dateColIndices.includes(i)) {
        return { wch: 15 }; // Fixed width for date columns
      }
      
      const samples = fullData.slice(1, 6).map(r => String(r[i] ?? '').length);
      const maxLen = Math.max(h.length, ...samples, 10);
      return { wch: Math.min(maxLen + 2, 20) };
    });
    ws['!cols'] = colWidths;

    // Format columns properly
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    for (let C = 0; C <= range.e.c; C++) {
      const col = XLSX.utils.encode_col(C);
      
      // Employee ID (col B): TEXT format
      if (C === 1) {
        for (let R = 1; R <= range.e.r; R++) {
          const addr = col + (R + 1);
          if (ws[addr]) {
            ws[addr].t = 's';
            ws[addr].z = '@';
          }
        }
      }

      // Date columns: Convert to Excel serial numbers + MM/DD/YYYY format
      const dateColIndices = {
        attendance: [3],  // Date (col D, 0-indexed)
        leave: [4, 5, 9], // Start, End, Applied On (cols E,F,J)
        employee: []
      }[reportType] || [];

      if (dateColIndices.includes(C)) {
        for (let R = 1; R <= range.e.r; R++) {
          const addr = col + (R + 1);
          if (ws[addr] && ws[addr].v) {
            const date = new Date(ws[addr].v);
            if (!isNaN(date.getTime())) {
              // Convert JavaScript date to Excel serial number
              const excelDate = (date - new Date(1900, 0, 1)) / 86400000 + 1;
              ws[addr].t = 'n';
              ws[addr].v = excelDate;
              ws[addr].z = 'mm\\/dd\\/yyyy'; // Format: 12/03/2026
            }
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}_Leave_Report.xlsx`);
    setShowMenu(false);
  };

  const printReport = () => {
    const headers = getHeaders();
    const rows = data.map(getRowData);
    
    const html = `
      <!DOCTYPE html>
      <html><head><title>${filename}</title>
      <style>body{font-family:Arial;padding:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background:#f5f5f5;}</style>
      </head><body>
      <h1>${filename}</h1><p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
      ${rows.map(row => `<tr>${row.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}
      </tbody></table><p>Records: ${data.length}</p>
      </body></html>
    `;
    
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setShowMenu(false);
  };

  if (!data?.length) return null;

  return (
    <div style={styles.container}>
      <button onClick={() => setShowMenu(!showMenu)} style={styles.button}>
        <Download size={16} /> Export ({data.length} rows)
      </button>
      {showMenu && (
        <div style={styles.menu}>
          <button onClick={exportToCSV} style={styles.menuItem}>📄 CSV</button>
          <button onClick={exportToExcel} style={styles.menuItem}>📊 Excel</button>
          <button onClick={printReport} style={styles.menuItem}>🖨️ Print</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { position: 'relative', display: 'inline-block' },
  button: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #059669, #10B981)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
  },
  menu: {
    position: 'absolute',
    top: '100%', right: 0, marginTop: 8,
    background: 'white', borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    minWidth: 180
  },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px', border: 'none', background: 'none',
    width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: 14,
    borderBottom: '1px solid #f0f0f0'
  }
};

export default ReportExport;