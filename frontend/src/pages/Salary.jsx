import { useState, useEffect } from 'react';
import axios from 'axios';

const Salary = ({ user }) => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSalaryHistory();
  }, []);

  const fetchSalaryHistory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:8000/api/salary/my/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalaries(response.data);
    } catch (error) {
      console.error('Error fetching salary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (salary) => {
    setSelectedSalary(salary);
    setShowModal(true);
  };

  const handleDownloadSlip = (salary) => {
    // Create printable salary slip
    const printWindow = window.open('', '_blank');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Slip - ${monthNames[salary.month - 1]} ${salary.year}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #ff9933;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-text {
            font-size: 32px;
            font-weight: 600;
            color: #000000;
          }
          .logo-ixa {
            font-size: 32px;
            font-weight: 600;
            color: #ff9933;
          }
          .portal-text {
            font-size: 12px;
            color: #666;
          }
          .title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #4361ee;
          }
          .info-section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            border: 1px solid #e5e7eb;
            text-align: left;
          }
          th {
            background: #f8fafc;
            font-weight: 600;
          }
          .total-row {
            background: #fff3cd;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .status-paid {
            color: #10b981;
            font-weight: bold;
          }
          .status-pending {
            color: #f59e0b;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <div>
              <span class="logo-text">EL</span>
              <span class="logo-text">O</span>
              <span class="logo-text">G</span>
              <span class="logo-ixa">IXA</span>
              <div class="portal-text">HRMS - Salary Slip</div>
            </div>
          </div>
        </div>
        
        <div class="title">
          Salary Slip - ${monthNames[salary.month - 1]} ${salary.year}
        </div>
        
        <div class="info-section">
          <strong>Employee Details:</strong><br/>
          Name: ${salary.employee_name}<br/>
          Employee ID: ${salary.employee_id || 'N/A'}<br/>
          Payment Status: <span class="${salary.status === 'PAID' ? 'status-paid' : 'status-pending'}">${salary.status}</span><br/>
          ${salary.payment_date ? `Payment Date: ${new Date(salary.payment_date).toLocaleDateString()}` : ''}
        </div>
        
        <table>
          <tr>
            <th colspan="2">Earnings</th>
          </tr>
          <tr>
            <td>Basic Salary</td>
            <td align="right">₹ ${parseFloat(salary.basic_salary).toLocaleString()}</td>
          </tr>
          <tr>
            <td>House Rent Allowance (HRA)</td>
            <td align="right">₹ ${parseFloat(salary.house_rent_allowance).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Conveyance Allowance</td>
            <td align="right">₹ ${parseFloat(salary.conveyance_allowance).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Medical Allowance</td>
            <td align="right">₹ ${parseFloat(salary.medical_allowance).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Special Allowance</td>
            <td align="right">₹ ${parseFloat(salary.special_allowance).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Bonus</td>
            <td align="right">₹ ${parseFloat(salary.bonus).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Overtime</td>
            <td align="right">₹ ${parseFloat(salary.overtime).toLocaleString()}</td>
          </tr>
          <tr style="background: #e8f5e9; font-weight: bold;">
            <td>Gross Salary</td>
            <td align="right">₹ ${parseFloat(salary.gross_salary).toLocaleString()}</td>
          </tr>
        </table>
        
        <table>
          <tr>
            <th colspan="2">Deductions</th>
          </tr>
          <tr>
            <td>Provident Fund (PF)</td>
            <td align="right">₹ ${parseFloat(salary.provident_fund).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Professional Tax</td>
            <td align="right">₹ ${parseFloat(salary.professional_tax).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Income Tax (TDS)</td>
            <td align="right">₹ ${parseFloat(salary.income_tax).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Leave Deduction</td>
            <td align="right">₹ ${parseFloat(salary.leave_deduction).toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td>Total Deductions</td>
            <td align="right">₹ ${parseFloat(salary.total_deductions).toLocaleString()}</td>
          </tr>
        </table>
        
        <table>
          <tr class="total-row">
            <td>Net Salary (Take Home)</td>
            <td align="right">₹ ${parseFloat(salary.net_salary).toLocaleString()}</td>
          </tr>
        </table>
        
        <div class="footer">
          <p>This is a computer generated salary slip. No signature required.</p>
          <p>ELOGIXA HRMS - India | UAE | DR.Congo</p>
          <p>www.elogixa.co.in</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #4361ee',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          💰 Salary History
        </h1>
        <p style={{ color: '#666' }}>View your salary details and download salary slips</p>
      </div>

      {/* Stats Cards */}
      {salaries.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Latest Net Salary</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4361ee' }}>
              ₹ {salaries[0]?.net_salary?.toLocaleString() || 0}
            </div>
            <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>
              {monthNames[salaries[0]?.month - 1]} {salaries[0]?.year}
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Average Monthly Salary</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
              ₹ {Math.round(salaries.reduce((sum, s) => sum + s.net_salary, 0) / salaries.length).toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              Over {salaries.length} month(s)
            </div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Total Earnings (YTD)</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
              ₹ {salaries.reduce((sum, s) => sum + s.net_salary, 0).toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              Year to Date
            </div>
          </div>
        </div>
      )}

      {/* Salary Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Salary Records</h2>
        </div>
        
        {salaries.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Salary Records Found</h3>
            <p>Your salary details will appear here once processed by HR.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Month</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Basic Salary</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Gross Salary</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Net Salary</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', color: '#666' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
              {salaries.map((salary) => (
                <tr key={salary.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>
                    {monthNames[salary.month - 1]} {salary.year}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    ₹ {parseFloat(salary.basic_salary).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    ₹ {parseFloat(salary.gross_salary).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#4361ee' }}>
                    ₹ {parseFloat(salary.net_salary).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: salary.status === 'PAID' ? '#d1fae5' : '#fff3cd',
                      color: salary.status === 'PAID' ? '#065f46' : '#856404'
                    }}>
                      {salary.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleViewDetails(salary)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#4361ee',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDownloadSlip(salary)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Download Slip
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Salary Details Modal */}
      {showModal && selectedSalary && (
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
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              Salary Details - {monthNames[selectedSalary.month - 1]} {selectedSalary.year}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <strong>Earnings</strong>
                <strong>Amount (₹)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Basic Salary</span>
                <span>{parseFloat(selectedSalary.basic_salary).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>House Rent Allowance</span>
                <span>{parseFloat(selectedSalary.house_rent_allowance).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Conveyance Allowance</span>
                <span>{parseFloat(selectedSalary.conveyance_allowance).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Medical Allowance</span>
                <span>{parseFloat(selectedSalary.medical_allowance).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <span>Special Allowance</span>
                <span>{parseFloat(selectedSalary.special_allowance).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold', color: '#4361ee' }}>
                <span>Gross Salary</span>
                <span>{parseFloat(selectedSalary.gross_salary).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <strong>Deductions</strong>
                <strong>Amount (₹)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Provident Fund</span>
                <span>{parseFloat(selectedSalary.provident_fund).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Professional Tax</span>
                <span>{parseFloat(selectedSalary.professional_tax).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <span>Income Tax (TDS)</span>
                <span>{parseFloat(selectedSalary.income_tax).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold', color: '#ef4444' }}>
                <span>Total Deductions</span>
                <span>{parseFloat(selectedSalary.total_deductions).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                <span>Net Salary (Take Home)</span>
                <span style={{ color: '#10b981' }}>₹ {parseFloat(selectedSalary.net_salary).toLocaleString()}</span>
              </div>
            </div>

            {selectedSalary.payment_date && (
              <div style={{ marginBottom: '20px', fontSize: '13px', color: '#666' }}>
                Payment Date: {new Date(selectedSalary.payment_date).toLocaleDateString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadSlip(selectedSalary);
                  setShowModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Download Salary Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;