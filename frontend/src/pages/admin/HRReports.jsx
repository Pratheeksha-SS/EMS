import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';
import { Printer, LayoutGrid, Calendar, Users, User, Building2, ChevronDown, Eye, Check, DollarSign } from 'lucide-react';
import ReportExport from '../../components/reports/ReportExport';
import { formatDate, downloadCSV } from '../../utils/reportUtils';

const HRReports = ({ user, isManager = false }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [viewType, setViewType] = useState('table');
  
  // Date mode: 'single' or 'range'
  const [dateMode, setDateMode] = useState('single');
  
  // Filters
  const [filters, setFilters] = useState({
    reportType: 'attendance',
    scope: 'all',
    employeeId: '',
    department: 'all',
    singleDate: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    frequency: 'daily'
  });

  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDateDetail, setSelectedDateDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const reportTypes = [
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'leave', label: 'Leave Report' },
    { value: 'employee', label: 'Employee Activity' },
    { value: 'salary', label: 'Salary Report' },
  ];

  const presetRanges = [
    { value: 'today', label: 'Today', getRange: () => {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }},
    { value: 'yesterday', label: 'Yesterday', getRange: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const date = yesterday.toISOString().split('T')[0];
      return { startDate: date, endDate: date };
    }},
    { value: 'week', label: 'Last 7 Days', getRange: () => {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString().split('T')[0], endDate: end };
    }},
    { value: 'month', label: 'Last 30 Days', getRange: () => {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString().split('T')[0], endDate: end };
    }},
    { value: 'thisMonth', label: 'This Month', getRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: start.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
    }},
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  useEffect(() => {
    fetchEmployeesAndDepartments();
  }, []);

  useEffect(() => {
    generateReport();
  }, [filters, dateMode]);

  const fetchEmployeesAndDepartments = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees/'),
        api.get('/departments/list/')
      ]);
      setEmployees(extractListData(empRes.data));
      setDepartments(deptRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = {
        report_type: filters.reportType,
        scope: filters.scope,
        department: filters.department !== 'all' ? filters.department : null,
        frequency: filters.frequency,
        date_mode: dateMode
      };

      if (dateMode === 'single') {
        params.date = filters.singleDate;
      } else {
        params.start_date = filters.startDate;
        params.end_date = filters.endDate;
      }

      if (filters.scope === 'individual' && filters.employeeId) {
        params.employee_id = filters.employeeId;
      }

      switch(filters.reportType) {
        case 'attendance':
          endpoint = '/reports/attendance/';
          break;
        case 'leave':
          endpoint = '/reports/leaves/';
          break;
        case 'employee':
          endpoint = '/reports/employees/';
          break;
        case 'salary':
          endpoint = '/reports/salary/';
          break;
        default:
          return;
      }

      const response = await api.get(endpoint, { params });
      setReportData(response.data.data || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (presetValue) => {
    const preset = presetRanges.find(p => p.value === presetValue);
    if (preset) {
      const { startDate, endDate } = preset.getRange();
      setFilters({ ...filters, startDate, endDate });
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

  const handleDateClick = (date, details) => {
    setSelectedDateDetail({ date, details });
    setShowDetailModal(true);
  };

  const getExportHeaders = () => {
    switch(filters.reportType) {
      case 'attendance':
        return ['Date', 'Employee Name', 'Employee ID', 'Department', 'Status', 'Login Time', 'Logout Time', 'Working Hours'];
      case 'leave':
        return ['Date', 'Employee Name', 'Employee ID', 'Department', 'Leave Type', 'Status'];
      case 'employee':
        return ['Date', 'Employee Name', 'Employee ID', 'Department', 'Designation', 'Joining Date', 'Tenure (Days)', 'Tenure (Years)', 'Status', 'Email', 'Phone', 'Leaves Taken', 'Approved Leaves', 'Pending Leaves', 'Leave Balance', 'Last Salary', 'Basic Salary', 'Performance Score', 'Performance Rating', 'Tasks Completed', 'Projects Assigned', 'Training Completed', 'Warnings Issued'];
      case 'salary':
        return ['Employee Name', 'Employee ID', 'Department', 'Designation', 'Month', 'Year', 'Basic Salary', 'HRA', 'Conveyance', 'Medical', 'Special Allowance', 'Bonus', 'Overtime', 'Gross Salary', 'PF', 'Professional Tax', 'Income Tax', 'Leave Deduction', 'Total Deductions', 'Net Salary', 'Payment Status', 'Payment Date'];
      default:
        return ['Date', 'Employee Name', 'Employee ID', 'Department', 'Status'];
    }
  };

  const getReportTitle = () => {
    switch(filters.reportType) {
      case 'attendance': return 'Attendance';
      case 'leave': return 'Leave';
      case 'employee': return 'Employee Activity';
      case 'salary': return 'Salary';
      default: return 'HR';
    }
  };

  const renderDateWiseOutput = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <div key={i} style={styles.skeletonCard}>
              <div style={styles.skeletonHeader} />
              <div style={styles.skeletonStats} />
              <div style={styles.skeletonTable} />
            </div>
          ))}
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div style={styles.emptyState}>
          <Calendar size={48} color="#CBD5E1" />
          <p>No data available for selected filters</p>
          <small>Try adjusting your date range or filters</small>
        </div>
      );
    }

    // Handle employee reports differently - they are not date-wise
    if (filters.reportType === 'employee') {
      return (
        <div style={styles.dateCard}>
          <div style={styles.dateCardHeader}>
            <Users size={20} color="#F97316" />
            <h3 style={styles.dateCardTitle}>Employee Activity Report</h3>
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statBoxValue}>{summary.total_employees || 0}</div>
              <div style={styles.statBoxLabel}>Total Employees</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#10B981' }}>
              <div style={{ ...styles.statBoxValue, color: '#10B981' }}>{summary.active_employees || 0}</div>
              <div style={styles.statBoxLabel}>Active</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#3B82F6' }}>
              <div style={{ ...styles.statBoxValue, color: '#3B82F6' }}>{summary.new_joins || 0}</div>
              <div style={styles.statBoxLabel}>New Joins</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#F59E0B' }}>
              <div style={{ ...styles.statBoxValue, color: '#F59E0B' }}>{summary.excellent_performers || 0}</div>
              <div style={styles.statBoxLabel}>Excellent Performers</div>
            </div>
          </div>

          {viewType === 'table' && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Joining Date</th>
                    <th>Tenure</th>
                    <th>Leaves</th>
                    <th>Performance</th>
                    <th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} style={styles.tableRow}>
                      <td>{item.employee_name}</td>
                      <td>{item.employee_id}</td>
                      <td>{item.department}</td>
                      <td>{item.joining_date ? new Date(item.joining_date).toLocaleDateString() : 'N/A'}</td>
                      <td>{item.tenure_years ? `${item.tenure_years}y` : 'N/A'}</td>
                      <td>{item.leaves_taken || 0}</td>
                      <td>
                        <span style={{
                          ...styles.statusBadge,
                          background: item.performance_rating === 'Excellent' ? '#10B98120' : 
                                     item.performance_rating === 'Good' ? '#3B82F620' : 
                                     item.performance_rating === 'Average' ? '#F59E0B20' : '#EF444420',
                          color: item.performance_rating === 'Excellent' ? '#10B981' : 
                                 item.performance_rating === 'Good' ? '#3B82F6' : 
                                 item.performance_rating === 'Average' ? '#F59E0B' : '#EF4444'
                        }}>
                          {item.performance_rating}
                        </span>
                      </td>
                      <td>₹{item.last_salary || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // Handle salary reports
    if (filters.reportType === 'salary') {
      return (
        <div style={styles.dateCard}>
          <div style={styles.dateCardHeader}>
            <DollarSign size={20} color="#F97316" />
            <h3 style={styles.dateCardTitle}>Salary Report - {summary.report_period || 'Selected Period'}</h3>
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statBoxValue}>{summary.total_employees || 0}</div>
              <div style={styles.statBoxLabel}>Total Employees</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#10B981' }}>
              <div style={{ ...styles.statBoxValue, color: '#10B981' }}>₹{summary.total_net_salary?.toLocaleString() || 0}</div>
              <div style={styles.statBoxLabel}>Total Net Salary</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#3B82F6' }}>
              <div style={{ ...styles.statBoxValue, color: '#3B82F6' }}>₹{summary.average_net_salary?.toLocaleString() || 0}</div>
              <div style={styles.statBoxLabel}>Avg Net Salary</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#F59E0B' }}>
              <div style={{ ...styles.statBoxValue, color: '#F59E0B' }}>{summary.paid_salaries || 0}</div>
              <div style={styles.statBoxLabel}>Paid Salaries</div>
            </div>
          </div>

          {viewType === 'table' && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Basic Salary</th>
                    <th>Gross Salary</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} style={styles.tableRow}>
                      <td>{item.employee_name}</td>
                      <td>{item.employee_id}</td>
                      <td>{item.department}</td>
                      <td>₹{item.basic_salary?.toLocaleString() || 0}</td>
                      <td>₹{item.gross_salary?.toLocaleString() || 0}</td>
                      <td>₹{item.total_deductions?.toLocaleString() || 0}</td>
                      <td>₹{item.net_salary?.toLocaleString() || 0}</td>
                      <td>
                        <span style={{
                          ...styles.statusBadge,
                          background: item.payment_status === 'PAID' ? '#10B98120' : '#F59E0B20',
                          color: item.payment_status === 'PAID' ? '#10B981' : '#F59E0B'
                        }}>
                          {item.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (dateMode === 'single') {
      const data = reportData[0] || {};
      return (
        <div style={styles.dateCard}>
          <div style={styles.dateCardHeader}>
            <Calendar size={20} color="#F97316" />
            <h3 style={styles.dateCardTitle}>{formatDate(filters.singleDate)}</h3>
          </div>
          
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statBoxValue}>{summary.total_employees || 0}</div>
              <div style={styles.statBoxLabel}>Total Employees</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#10B981' }}>
              <div style={{ ...styles.statBoxValue, color: '#10B981' }}>{summary.present || 0}</div>
              <div style={styles.statBoxLabel}>Present</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#EF4444' }}>
              <div style={{ ...styles.statBoxValue, color: '#EF4444' }}>{summary.absent || 0}</div>
              <div style={styles.statBoxLabel}>Absent</div>
            </div>
            <div style={{ ...styles.statBox, borderTopColor: '#F59E0B' }}>
              <div style={{ ...styles.statBoxValue, color: '#F59E0B' }}>{summary.on_leave || 0}</div>
              <div style={styles.statBoxLabel}>On Leave</div>
            </div>
          </div>

          {viewType === 'table' && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Login Time</th>
                    <th>Logout Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} style={styles.tableRow}>
                      <td>{item.employee_name}</td>
                      <td>{item.employee_id}</td>
                      <td>{item.department}</td>
                      <td>
                        <span style={{
                          ...styles.statusBadge,
                          background: item.status === 'Present' ? '#10B98120' : 
                                     item.status === 'Absent' ? '#EF444420' : '#F59E0B20',
                          color: item.status === 'Present' ? '#10B981' : 
                                 item.status === 'Absent' ? '#EF4444' : '#F59E0B'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.login_time || '-'}</td>
                      <td>{item.logout_time || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // Range mode - Grouped by date
    return (
      <div>
        {reportData.map((group, idx) => (
          <div key={idx} style={styles.dateCard}>
            <div style={styles.dateCardHeader}>
              <Calendar size={20} color="#F97316" />
              <h3 style={styles.dateCardTitle}>{formatDate(group.date)}</h3>
              <button 
                style={styles.viewDetailBtn}
                onClick={() => handleDateClick(group.date, group.details || [])}
              >
                <Eye size={14} />
                View Details
              </button>
            </div>
            
            <div style={styles.statsRowSmall}>
              <div style={styles.statItem}>
                <span style={styles.statLabelSmall}>Present</span>
                <span style={{ ...styles.statValueSmall, color: '#10B981' }}>{group.present || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabelSmall}>Absent</span>
                <span style={{ ...styles.statValueSmall, color: '#EF4444' }}>{group.absent || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabelSmall}>On Leave</span>
                <span style={{ ...styles.statValueSmall, color: '#F59E0B' }}>{group.on_leave || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabelSmall}>Attendance %</span>
                <span style={{ ...styles.statValueSmall, color: '#8B5CF6' }}>{group.attendance_percentage || 0}%</span>
              </div>
            </div>

            {viewType === 'table' && group.employees && group.employees.length > 0 && (
              <div style={styles.tableWrapper}>
                <table style={styles.miniTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.employees.slice(0, 5).map((emp, empIdx) => (
                      <tr key={empIdx}>
                        <td>{emp.employee_name}</td>
                        <td>{emp.employee_id}</td>
                        <td>
                          <span style={{
                            ...styles.statusDot,
                            background: emp.status === 'Present' ? '#10B981' : 
                                       emp.status === 'Absent' ? '#EF4444' : '#F59E0B'
                          }} />
                          {emp.status}
                        </td>
                        <td>{emp.login_time || emp.logout_time ? `${emp.login_time || '-'} - ${emp.logout_time || '-'}` : '-'}</td>
                      </tr>
                    ))}
                    {group.employees.length > 5 && (
                      <tr>
                        <td colSpan="4" style={styles.moreRow}>
                          +{group.employees.length - 5} more employees
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 {isManager ? 'Team Reports' : 'HR Reports'}</h1>
          <p style={styles.subtitle}>
            {isManager 
              ? 'View and analyze your team\'s performance and data' 
              : 'View and analyze employee data across the organization'
            }
          </p>
        </div>
        <div style={styles.headerActions}>
          <ReportExport
            data={reportData}
            filename={`${getReportTitle()}_Report`}
            reportType={filters.reportType}
            onExport={() => {}}
          />
          <button style={styles.printBtn} onClick={() => window.print()}>
            <Printer size={18} />
            Print
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div style={styles.filtersCard}>
        {/* Row 1: Report Type & Scope */}
        <div style={styles.filtersRow}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>📊 Report Type</label>
            <select
              style={styles.select}
              value={filters.reportType}
              onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.label}>👥 Scope</label>
            <div style={styles.scopeWrapper}>
              <select
                style={styles.scopeSelect}
                value={filters.scope}
                onChange={(e) => setFilters({ ...filters, scope: e.target.value, employeeId: '' })}
              >
                <option value="all">All Employees</option>
                <option value="individual">Specific Employee</option>
              </select>
              
              {filters.scope === 'individual' && (
                <div style={styles.employeeSelectorWrapper}>
                  <div 
                    style={styles.employeeSelect}
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                  >
                    {selectedEmployee ? (
                      <span>{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Select Employee</span>
                    )}
                    <ChevronDown size={14} />
                  </div>
                  {showEmployeeDropdown && (
                    <div style={styles.employeeDropdown}>
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        style={styles.employeeSearchInput}
                      />
                      <div style={styles.employeeList}>
                        {filteredEmployees.map(emp => (
                          <div
                            key={emp.id}
                            style={styles.employeeItem}
                            onClick={() => {
                              setFilters({ ...filters, employeeId: emp.id });
                              setShowEmployeeDropdown(false);
                              setEmployeeSearch('');
                            }}
                          >
                            <div style={styles.employeeAvatar}>
                              {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                            </div>
                            <div>
                              <div>{emp.first_name} {emp.last_name}</div>
                              <div style={styles.employeeDept}>{emp.department}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isManager && (
            <div style={styles.filterGroup}>
              <label style={styles.label}>🏢 Department</label>
              <select
                style={styles.select}
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Row 2: Date Selection - Dual Mode */}
        <div style={styles.dateSection}>
          <div style={styles.dateModeToggle}>
            <button
              style={{
                ...styles.modeBtn,
                ...(dateMode === 'single' ? styles.modeBtnActive : {})
              }}
              onClick={() => setDateMode('single')}
            >
              <Calendar size={16} />
              Single Day Report
            </button>
            <button
              style={{
                ...styles.modeBtn,
                ...(dateMode === 'range' ? styles.modeBtnActive : {})
              }}
              onClick={() => setDateMode('range')}
            >
              <Calendar size={16} />
              Custom Date Range
            </button>
          </div>

          <div style={styles.dateInputsRow}>
            {dateMode === 'single' ? (
              <div style={styles.singleDateBox}>
                <label style={styles.label}>Select Date</label>
                <input
                  type="date"
                  style={styles.dateInputLarge}
                  value={filters.singleDate}
                  onChange={(e) => setFilters({ ...filters, singleDate: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div style={styles.rangeBox}>
                  <label style={styles.label}>From</label>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div style={styles.rangeBox}>
                  <label style={styles.label}>To</label>
                  <input
                    type="date"
                    style={styles.dateInput}
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
                <div style={styles.rangeBox}>
                  <label style={styles.label}>Preset</label>
                  <select
                    style={styles.select}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Select preset</option>
                    {presetRanges.map(preset => (
                      <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.rangeBox}>
                  <label style={styles.label}>Frequency</label>
                  <select
                    style={styles.select}
                    value={filters.frequency}
                    onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
                  >
                    {frequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <button
          style={styles.generateBtn}
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? (
            <>
              <div style={styles.spinner} />
              Generating Report...
            </>
          ) : (
            <>
              <Check size={18} />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* View Toggle */}
      <div style={styles.viewToggle}>
        <span style={styles.resultsCount}>{reportData.length} records found</span>
        <div style={styles.toggleButtons}>
          <button
            style={{ ...styles.toggleBtn, ...(viewType === 'table' ? styles.toggleBtnActive : {}) }}
            onClick={() => setViewType('table')}
          >
            <LayoutGrid size={16} />
            Table View
          </button>
        </div>
      </div>

      {/* Date-wise Output */}
      {renderDateWiseOutput()}

      {/* Detail Modal */}
      {showDetailModal && selectedDateDetail && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Details for {formatDate(selectedDateDetail.date)}</h3>
              </div>
              <button style={styles.modalClose} onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <table style={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedDateDetail.details || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.employee_name}</td>
                      <td>{item.employee_id}</td>
                      <td>{item.department}</td>
                      <td>
                        <span style={{
                          ...styles.statusDot,
                          background: item.status === 'Present' ? '#10B981' : 
                                     item.status === 'Absent' ? '#EF4444' : '#F59E0B'
                        }} />
                        {item.status}
                      </td>
                      <td>{item.login_time && item.logout_time ? `${item.login_time} - ${item.logout_time}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    background: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  printBtn: {
    padding: '10px 20px',
    background: 'white',
    color: '#475569',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filtersCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e5e7eb',
  },
  filtersRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterGroup: {
    flex: 1,
    minWidth: '200px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    background: 'white',
    cursor: 'pointer',
  },
  scopeWrapper: {
    display: 'flex',
    gap: '12px',
  },
  scopeSelect: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    background: 'white',
  },
  employeeSelectorWrapper: {
    flex: 1,
    position: 'relative',
  },
  employeeSelect: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxHeight: '280px',
    overflow: 'hidden',
  },
  employeeSearchInput: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    borderBottom: '1px solid #e5e7eb',
    outline: 'none',
    fontSize: '13px',
  },
  employeeList: {
    maxHeight: '230px',
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
  employeeDept: {
    fontSize: '11px',
    color: '#6b7280',
  },
  dateSection: {
    marginBottom: '24px',
  },
  dateModeToggle: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  modeBtn: {
    padding: '8px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  modeBtnActive: {
    background: '#F97316',
    color: 'white',
    borderColor: '#F97316',
  },
  dateInputsRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  singleDateBox: {
    flex: 1,
    maxWidth: '300px',
  },
  rangeBox: {
    flex: 1,
    minWidth: '150px',
  },
  dateInputLarge: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '14px',
  },
  dateInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '13px',
  },
  generateBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #F97316, #F59E0B)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
    },
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  viewToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  resultsCount: {
    fontSize: '13px',
    color: '#6b7280',
  },
  toggleButtons: {
    display: 'flex',
    gap: '8px',
    background: '#f3f4f6',
    padding: '4px',
    borderRadius: '10px',
  },
  toggleBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  toggleBtnActive: {
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    color: '#F97316',
  },
  dateCard: {
    background: 'white',
    borderRadius: '16px',
    marginBottom: '20px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    animation: 'fadeIn 0.3s ease',
  },
  dateCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    background: '#fafafa',
    borderBottom: '1px solid #e5e7eb',
  },
  dateCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    flex: 1,
  },
  viewDetailBtn: {
    padding: '6px 12px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    '&:hover': {
      background: '#F97316',
      color: 'white',
    },
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  statBox: {
    textAlign: 'center',
    padding: '16px',
    borderRadius: '12px',
    background: '#f8fafc',
    borderTop: '3px solid #F97316',
  },
  statBoxValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#F97316',
  },
  statBoxLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  statsRowSmall: {
    display: 'flex',
    gap: '24px',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f8fafc',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statLabelSmall: {
    fontSize: '12px',
    color: '#6b7280',
  },
  statValueSmall: {
    fontSize: '16px',
    fontWeight: '600',
  },
  tableWrapper: {
    overflowX: 'auto',
    padding: '0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  miniTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
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
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '6px',
  },
  moreRow: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '11px',
    padding: '8px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  skeletonCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  skeletonHeader: {
    height: '24px',
    width: '200px',
    background: '#f3f4f6',
    borderRadius: '4px',
    marginBottom: '16px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonStats: {
    height: '60px',
    background: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '16px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonTable: {
    height: '100px',
    background: '#f3f4f6',
    borderRadius: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px',
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '700px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  modalClose: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    background: '#f3f4f6',
    cursor: 'pointer',
    fontSize: '16px',
  },
  modalBody: {
    padding: '20px 24px',
    overflow: 'auto',
    flex: 1,
  },
  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
};

export default HRReports;
