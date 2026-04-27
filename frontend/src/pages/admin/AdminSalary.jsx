import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractListData } from '../../utils/extractListData';
import SalarySlipView from './SalarySlipView';

const AdminSalary = () => {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [formData, setFormData] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic_salary: 0,
    house_rent_allowance: 0,
    conveyance_allowance: 0,
    medical_allowance: 0,
    special_allowance: 0,
    bonus: 0,
    overtime: 0,
    provident_fund: 0,
    professional_tax: 0,
    income_tax: 0,
    leave_deduction: 0
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchAllSalaries();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/';
        return;
      }
      
      const response = await axios.get('http://localhost:8000/api/employees/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/';
      }
    }
  };

  const fetchAllSalaries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/';
        return;
      }
      
      const response = await axios.get('http://localhost:8000/api/salary/all/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalaries(response.data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    setSelectedEmpId(empId);
    
    if (!empId) {
      setSelectedEmployee(null);
      setFormData(prev => ({ ...prev, employee: '' }));
      return;
    }

    const employee = employees.find(emp => emp.id === parseInt(empId));
    
    if (employee) {
      setSelectedEmployee(employee);
      const userId = employee.user && typeof employee.user === 'object' ? employee.user.id : employee.user || empId;
      setFormData(prev => ({ ...prev, employee: userId }));
    } else {
      setSelectedEmployee(null);
      setFormData(prev => ({ ...prev, employee: '' }));
    }
  };

  const calculateNetSalary = () => {
    const gross = (formData.basic_salary || 0) + (formData.house_rent_allowance || 0) + 
                  (formData.conveyance_allowance || 0) + (formData.medical_allowance || 0) + 
                  (formData.special_allowance || 0) + (formData.bonus || 0) + (formData.overtime || 0);
    const deductions = (formData.provident_fund || 0) + (formData.professional_tax || 0) + 
                       (formData.income_tax || 0) + (formData.leave_deduction || 0);
    return gross - deductions;
  };

  const handleCancel = () => {
    setFormData({
      employee: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basic_salary: 0,
      house_rent_allowance: 0,
      conveyance_allowance: 0,
      medical_allowance: 0,
      special_allowance: 0,
      bonus: 0,
      overtime: 0,
      provident_fund: 0,
      professional_tax: 0,
      income_tax: 0,
      leave_deduction: 0
    });
    setSelectedEmployee(null);
    setSelectedEmpId('');
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('Please login again.');
        window.location.href = '/';
        return;
      }
      
      if (!selectedEmployee || !formData.employee) {
        alert('Please select an employee');
        setSubmitLoading(false);
        return;
      }
      
      const submitData = {
        employee: formData.employee,
        month: formData.month,
        year: formData.year,
        basic_salary: formData.basic_salary || 0,
        house_rent_allowance: formData.house_rent_allowance || 0,
        conveyance_allowance: formData.conveyance_allowance || 0,
        medical_allowance: formData.medical_allowance || 0,
        special_allowance: formData.special_allowance || 0,
        bonus: formData.bonus || 0,
        overtime: formData.overtime || 0,
        provident_fund: formData.provident_fund || 0,
        professional_tax: formData.professional_tax || 0,
        income_tax: formData.income_tax || 0,
        leave_deduction: formData.leave_deduction || 0
      };
      
      await axios.post('http://localhost:8000/api/salary/create/', submitData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert('Salary record created successfully!');
      setShowForm(false);
      handleCancel();
      fetchAllSalaries();
    } catch (error) {
      console.error('Error creating salary:', error);
      
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/';
      } else if (error.response?.status === 400 && error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to create salary record. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkAsPaid = async (salaryId) => {
    if (!window.confirm('Mark this salary as paid?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:8000/api/salary/${salaryId}/paid/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Salary marked as paid!');
      fetchAllSalaries();
    } catch (error) {
      console.error('Error marking salary as paid:', error);
      alert('Failed to update salary status');
    }
  };

  const handleViewSlip = (salary) => {
    const employee = employees.find(e => e.user === salary.employee || e.user_id === salary.employee);
    if (employee) {
      setSelectedEmployeeForSlip(employee);
      setShowSlipModal(true);
    } else {
      alert('Employee details not found for this salary slip');
    }
  };

  const closeSlipModal = () => {
    setShowSlipModal(false);
    setSelectedEmployeeForSlip(null);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading salary records...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            💰 Salary Management
          </h1>
          <p style={{ color: '#666' }}>Manage employee salaries and generate payslips</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: '#ff9933',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>➕</span> Add Salary Record
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Total Salary Records</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{salaries.length}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Total Paid Amount</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
            ₹ {salaries.filter(s => s.status === 'PAID').reduce((sum, s) => sum + (s.net_salary || 0), 0).toLocaleString()}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Pending Payments</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
            ₹ {salaries.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + (s.net_salary || 0), 0).toLocaleString()}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Employees Processed</div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {new Set(salaries.map(s => s.employee)).size}
          </div>
        </div>
      </div>

      {/* Create Salary Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '650px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Create Salary Record
            </h2>
            
            <form onSubmit={handleSubmit}>
              {selectedEmployee && (
                <div style={{
                  backgroundColor: '#e8f5e9',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  borderLeft: '4px solid #10b981'
                }}>
                  <strong>✅ Selected: </strong>
                  {selectedEmployee.first_name} {selectedEmployee.last_name || ''} 
                  <span style={{float: 'right', fontSize: '12px', color: '#666'}}>
                    ID: {selectedEmployee.employee_id}
                  </span>
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={handleEmployeeSelect}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name || ''} (ID: {emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Month *
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {monthNames.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Basic Salary *
                </label>
                <input
                  type="number"
                  name="basic_salary"
                  value={formData.basic_salary || ''}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Continue with remaining form fields... */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>House Rent Allowance (HRA)</label>
                  <input type="number" name="house_rent_allowance" value={formData.house_rent_allowance || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
                <div>
                  <label>Conveyance Allowance</label>
                  <input type="number" name="conveyance_allowance" value={formData.conveyance_allowance || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Medical Allowance</label>
                  <input type="number" name="medical_allowance" value={formData.medical_allowance || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
                <div>
                  <label>Special Allowance</label>
                  <input type="number" name="special_allowance" value={formData.special_allowance || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Bonus</label>
                  <input type="number" name="bonus" value={formData.bonus || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
                <div>
                  <label>Overtime</label>
                  <input type="number" name="overtime" value={formData.overtime || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Gross Salary (Calculated)</strong>
                  <strong style={{ color: '#4361ee' }}>₹ {(calculateNetSalary() + (formData.provident_fund + formData.professional_tax + formData.income_tax + formData.leave_deduction)).toLocaleString()}</strong>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#ef4444' }}>Deductions</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Provident Fund</label>
                  <input type="number" name="provident_fund" value={formData.provident_fund || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
                <div>
                  <label>Professional Tax</label>
                  <input type="number" name="professional_tax" value={formData.professional_tax || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label>Income Tax (TDS)</label>
                  <input type="number" name="income_tax" value={formData.income_tax || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
                <div>
                  <label>Leave Deduction</label>
                  <input type="number" name="leave_deduction" value={formData.leave_deduction || ''} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Net Salary (Take Home)</strong>
                  <strong style={{ color: '#10b981' }}>₹ {calculateNetSalary().toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCancel} style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitLoading} style={{ padding: '10px 20px', backgroundColor: submitLoading ? '#9ca3af' : '#ff9933', color: 'white', border: 'none', borderRadius: '8px', cursor: submitLoading ? 'not-allowed' : 'pointer' }}>{submitLoading ? 'Creating...' : 'Create Salary Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Records Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Salary Records</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Employee</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Month</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Basic Salary</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Net Salary</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Actions</th>
             </tr>
          </thead>
          <tbody>
            {salaries.map((salary) => (
              <tr key={salary.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px', fontWeight: '500' }}>{salary.employee_name}</td>
                <td style={{ padding: '16px' }}>{monthNames[salary.month - 1]} {salary.year}</td>
                <td style={{ padding: '16px' }}>₹ {parseFloat(salary.basic_salary).toLocaleString()}</td>
                <td style={{ padding: '16px', fontWeight: '600', color: '#4361ee' }}>₹ {parseFloat(salary.net_salary).toLocaleString()}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', backgroundColor: salary.status === 'PAID' ? '#d1fae5' : '#fff3cd', color: salary.status === 'PAID' ? '#065f46' : '#856404' }}>
                    {salary.status}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button onClick={() => handleViewSlip(salary)} style={{ padding: '6px 12px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginRight: '8px' }}>👁️ View</button>
                  {salary.status === 'PENDING' && (
                    <button onClick={() => handleMarkAsPaid(salary.id)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
            {salaries.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No salary records found. Click "Add Salary Record" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Salary Slip Modal */}
      {showSlipModal && selectedEmployeeForSlip && (
        <SalarySlipView
          employee={selectedEmployeeForSlip}
          onClose={closeSlipModal}
        />
      )}
    </div>
  );
};

export default AdminSalary;
