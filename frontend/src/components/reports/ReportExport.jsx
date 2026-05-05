import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Sheet, Printer } from 'lucide-react';

/* ─── CSV / Excel helpers ────────────────────────────────────────── */
const toCSV = (headers, rows) => {
  const escape = (v) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
};

const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const getExportHeaders = (reportType) => {
  switch (reportType) {
    case 'attendance':
      return ['Employee Name', 'Employee ID', 'Department', 'Date', 'Status', 'Login Time', 'Logout Time', 'Working Hours'];
    case 'leave':
      return ['Employee Name', 'Employee ID', 'Department', 'Leave Type', 'From Date', 'To Date', 'Total Days', 'Status', 'Reason'];
    case 'employee':
      return ['Employee Name', 'Employee ID', 'Department', 'Designation', 'Joining Date', 'Tenure (Years)', 'Leaves Taken', 'Performance Rating'];
    default:
      return ['Employee Name', 'Employee ID', 'Department', 'Status'];
  }
};

const getExportRow = (item, reportType) => {
  switch (reportType) {
    case 'attendance':
      return [item.employee_name, item.employee_id, item.department, item.date, item.status, item.login_time, item.logout_time, item.working_hours];
    case 'leave':
      return [item.employee_name, item.employee_id, item.department, item.leave_type, item.start_date, item.end_date, item.total_days, item.status, item.reason];
    case 'employee':
      return [item.employee_name, item.employee_id, item.department, item.designation, item.joining_date, item.tenure_years, item.leaves_taken, item.performance_rating];
    default:
      return [item.employee_name, item.employee_id, item.department, item.status];
  }
};

/* ─── Print report HTML ──────────────────────────────────────────── */
const generatePrintHTML = ({ reportType, data, summary, dateLabel }) => {
  const headers = getExportHeaders(reportType);
  const today   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const typeLabels = {
    attendance: 'Attendance Report',
    leave:      'Leave Report',
    employee:   'Employee Activity Report',
  };

  const rows = data.map(item =>
    `<tr>${getExportRow(item, reportType).map(v => `<td>${v ?? '—'}</td>`).join('')}</tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${typeLabels[reportType] || 'HR Report'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #111827; padding: 0; }
    .page { padding: 40px 48px; max-width: 1100px; margin: 0 auto; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #F97316; }
    .company-name { font-size: 22px; font-weight: 800; color: #111827; }
    .company-sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .report-title { font-size: 18px; font-weight: 700; color: #111827; text-align: right; }
    .report-meta { font-size: 12px; color: #6b7280; text-align: right; margin-top: 4px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 26px; }
    .stat { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; text-align: center; border-top: 3px solid #F97316; }
    .stat-val { font-size: 26px; font-weight: 800; color: #F97316; }
    .stat-lbl { font-size: 11px; color: #6b7280; margin-top: 4px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { padding: 10px 12px; background: #111827; color: #fff; font-weight: 600; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="report-header">
    <div>
      <div class="company-name">📋 HR Management System</div>
      <div class="company-sub">Leave Administration Portal</div>
    </div>
    <div>
      <div class="report-title">${typeLabels[reportType] || 'HR Report'}</div>
      <div class="report-meta">Period: ${dateLabel || 'Selected Period'}</div>
      <div class="report-meta">Generated: ${today}</div>
    </div>
  </div>
  <div class="summary">
    ${Object.entries(summary || {}).slice(0, 4).map(([k, v]) => `
      <div class="stat">
        <div class="stat-val">${v}</div>
        <div class="stat-lbl">${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
      </div>
    `).join('')}
  </div>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Total Records: <strong>${data.length}</strong></span>
    <span>Confidential — HR Use Only</span>
    <span>Page 1 of 1</span>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
};

/* ─── ReportExport (main export) ────────────────────────────────── */
const ReportExport = ({
  data = [],
  reportType = 'attendance',
  summary = {},
  dateLabel = '',
  filename = 'HR_Report',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCSV = () => {
    const headers = getExportHeaders(reportType);
    const rows    = data.map(item => getExportRow(item, reportType));
    const csv     = toCSV(headers, rows);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
    setOpen(false);
  };

  const handleExcel = () => {
    const headers = getExportHeaders(reportType);
    const rows    = data.map(item => getExportRow(item, reportType));
    const table   = `<html><body><table>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      ${rows.map(r => `<tr>${r.map(c => `<td>${String(c ?? '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}
    </table></body></html>`;
    downloadFile(table, `${filename}.xls`, 'application/vnd.ms-excel');
    setOpen(false);
  };

  const handlePrint = () => {
    const html = generatePrintHTML({ reportType, data, summary, dateLabel });
    const win  = window.open('', '_blank', 'width=1100,height=800');
    if (!win) { alert('Please allow popups to print reports.'); return; }
    win.document.write(html);
    win.document.close();
    setOpen(false);
  };

  const options = [
    { icon: <FileText size={15} />, label: 'Export as CSV',   action: handleCSV },
    { icon: <Sheet    size={15} />, label: 'Export as Excel', action: handleExcel },
    { icon: <Printer  size={15} />, label: 'Print Report',    action: handlePrint },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={data.length === 0}
        style={{
          padding: '10px 20px',
          background: data.length === 0
            ? '#CBD5E1'
            : 'linear-gradient(135deg, #16A34A, #15803D)',
          color: 'white', border: 'none', borderRadius: '10px',
          fontSize: '14px', fontWeight: '700',
          cursor: data.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: data.length === 0 ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (data.length > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(22,163,74,0.4)'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = data.length === 0 ? 'none' : '0 4px 12px rgba(22,163,74,0.3)'; }}
      >
        <Download size={16} />
        Export
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          backgroundColor: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden', zIndex: 100, minWidth: '200px',
          animation: 'exportFadeIn 0.15s ease',
        }}>
          <div style={{
            padding: '10px 14px', fontSize: '10px', fontWeight: '700',
            color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px',
            borderBottom: '1px solid #F1F5F9',
          }}>
            {data.length} records ready
          </div>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'white', border: 'none',
                display: 'flex', alignItems: 'center', gap: '10px',
                fontSize: '13px', fontWeight: '600', color: '#0F172A',
                cursor: 'pointer', textAlign: 'left',
                borderBottom: i < options.length - 1 ? '1px solid #F8FAFC' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              <span style={{ color: '#F97316' }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes exportFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ReportExport;