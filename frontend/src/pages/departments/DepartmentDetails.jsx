import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(() => {
    const departments = JSON.parse(localStorage.getItem('departments') || '[]');
    const deptId = parseInt(id);
    return departments.find(d => d.id === deptId) || null;
  });
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [viewingEmployee, setViewingEmployee] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, departmentsRes] = await Promise.all([
        api.get('/employees/'),
        api.get('/departments/'),
      ]);
      const employeesData = extractListData(employeesRes.data);

      let departments = JSON.parse(localStorage.getItem('departments') || '[]');
      const deptId = parseInt(id);
      const backendDepartments = departmentsRes.data || [];
      let currentDept = backendDepartments.find(d => d.id === deptId) || departments.find(d => d.id === deptId);

      if (!currentDept) {
        const uniqueDepts = [...new Set(employeesData.map(emp => emp.department))];
        const sampleDepartments = uniqueDepts.map((dept, index) => ({
          id: index + 1,
          name: dept || 'Unassigned',
          history: `${dept || 'Unassigned'} Department`,
          teamCount: 0,
          employees: [],
          color: index % 2 === 0 ? '#4caf50' : '#ff9933',
          manager: null,
          manager_name: null,
          description: '',
        }));
        departments = sampleDepartments;
        localStorage.setItem('departments', JSON.stringify(sampleDepartments));
        currentDept = sampleDepartments.find(d => d.id === deptId);
      }

      if (currentDept) {
        const deptEmployees = employeesData.filter(emp => 
          emp.department && emp.department.toLowerCase() === currentDept.name.toLowerCase()
        );
        const savedDept = departments.find(d => d.name?.toLowerCase() === currentDept.name?.toLowerCase()) || {};

        setDepartment({
          ...savedDept,
          ...currentDept,
          history: savedDept.history || currentDept.description || currentDept.history || `${currentDept.name} Department`,
          teamCount: currentDept.employee_count ?? deptEmployees.length,
          employees: deptEmployees,
        });
        setDepartmentEmployees(deptEmployees);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee) => {
    setViewingEmployee(employee);
  };

  const handleBack = () => {
    navigate('/departments');
  };

  const closeEmployeeModal = () => {
    setViewingEmployee(null);
  };

  const filteredEmployees = departmentEmployees.filter(employee => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    if (searchBy === 'name') {
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      return fullName.includes(searchLower);
    } else if (searchBy === 'id') {
      return employee.employee_id?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  if (!department) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        margin: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
        <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Department Not Found</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          The department you're looking for doesn't exist or may have been deleted.
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff9933',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back to Departments
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <button
        onClick={handleBack}
        style={{
          padding: '10px 18px',
          backgroundColor: '#fff7ed',
          color: '#ea580c',
          border: '1px solid #fdba74',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Back to Departments
      </button>

      {/* Department Info Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        animation: 'slideIn 0.4s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          {/* Department Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#fff3e0',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '48px' }}>🏢</span>
          </div>
          
          {/* Department Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#4361ee',
              letterSpacing: '-0.5px'
            }}>
              {department.name}
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#666',
              lineHeight: '1.5',
              margin: '0 0 12px 0'
            }}>
              {department.history}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '30px'
            }}>
              <span style={{ fontSize: '18px' }}>👥</span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#ff9933'
              }}>
                Total Members: {departmentEmployees.length}
              </span>
            </div>
            {department.manager_name && (
              <div style={{
                marginTop: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#eef2ff',
                borderRadius: '30px'
              }}>
                <span style={{ fontSize: '18px' }}>👨‍💼</span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#4338ca'
                }}>
                  Manager: {department.manager_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar Section - Beautifully Designed */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              color: '#1a1a1a'
            }}>
              Team Members
            </h3>
            <span style={{
              padding: '4px 12px',
              backgroundColor: '#ff9933',
              color: 'white',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {filteredEmployees.length}
            </span>
            {searchTerm && (
              <span style={{
                padding: '4px 10px',
                backgroundColor: '#e5e7eb',
                color: '#666',
                borderRadius: '20px',
                fontSize: '12px'
              }}>
                Showing {filteredEmployees.length} of {departmentEmployees.length}
              </span>
            )}
          </div>
          
          {/* Search Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {/* Search By Dropdown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f8fafc',
              padding: '4px 8px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>🔍</span>
              <select
                value={searchBy}
                onChange={(e) => {
                  setSearchBy(e.target.value);
                  setSearchTerm('');
                }}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: '500',
                  color: '#4361ee'
                }}
              >
                <option value="name">Name</option>
                <option value="id">Employee ID</option>
              </select>
            </div>
            
            {/* Search Input */}
            <div style={{
              position: 'relative',
              minWidth: '280px'
            }}>
              <input
                type="text"
                placeholder={searchBy === 'name' ? "Search by employee name..." : "Search by employee ID..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#f8fafc'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff9933';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255,153,51,0.1)';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                  e.target.style.backgroundColor = '#f8fafc';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#999'
              }}>
                🔍
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: '#999',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff9933'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((member, index) => (
              <div
                key={member.id}
                onClick={() => handleViewEmployee(member)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '20px',
                  backgroundColor: '#fafbfc',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff3e0';
                  e.currentTarget.style.borderColor = '#ff9933';
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafbfc';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4caf50, #ff9933)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '22px',
                  flexShrink: 0
                }}>
                  {member.first_name?.charAt(0).toUpperCase() || member.full_name?.charAt(0).toUpperCase() || 'E'}
                </div>
                
                {/* Employee Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '6px'
                  }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '600', margin: 0, color: '#1a1a1a' }}>
                      {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                    </h4>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      backgroundColor: '#e8f5e9',
                      color: '#4caf50',
                      borderRadius: '20px',
                      fontWeight: '500'
                    }}>
                      {member.designation || 'Employee'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    flexWrap: 'wrap',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🆔</span> {member.employee_id || 'N/A'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📧</span> {member.email || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Arrow Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fff3e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#ff9933',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff9933';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff3e0';
                  e.currentTarget.style.color = '#ff9933';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                  →
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#666'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>👥</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#999' }}>
                {searchTerm ? 'No matching employees found' : 'No team members assigned'}
              </h3>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    marginTop: '16px',
                    padding: '8px 20px',
                    backgroundColor: '#ff9933',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          Loading department details...
        </div>
      )}

      {viewingEmployee && (
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
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {viewingEmployee.profile_image ? (
                <img
                  src={viewingEmployee.profile_image}
                  alt="Profile"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #4361ee'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: '40px',
                  color: '#9ca3af'
                }}>
                  👤
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 20px 0', textAlign: 'center' }}>
              Employee Details
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Employee ID:</strong> <span>{viewingEmployee.employee_id || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Full Name:</strong> <span>{viewingEmployee.first_name} {viewingEmployee.middle_name} {viewingEmployee.last_name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Gender:</strong> <span>{viewingEmployee.gender || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Marital Status:</strong> <span>{viewingEmployee.marital_status || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Education:</strong> <span>{viewingEmployee.education || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Email:</strong> <span>{viewingEmployee.email || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Phone:</strong> <span>{viewingEmployee.phone || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Address:</strong> <span>{viewingEmployee.address || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Department:</strong> <span>{viewingEmployee.department || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Designation:</strong> <span>{viewingEmployee.designation || '-'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                <strong>Joining Date:</strong> <span>{viewingEmployee.joining_date || '-'}</span>
              </div>

              {(viewingEmployee.emergency_contact_name ||
                viewingEmployee.emergency_contact_relationship ||
                viewingEmployee.emergency_contact_phone ||
                viewingEmployee.emergency_contact_occupation) && (
                <>
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
                    <strong style={{ fontSize: '16px', color: '#4361ee' }}>Emergency Contact</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginTop: '12px' }}>
                    <strong>Name:</strong> <span>{viewingEmployee.emergency_contact_name || '-'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                    <strong>Relationship:</strong> <span>{viewingEmployee.emergency_contact_relationship || '-'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                    <strong>Contact Number:</strong> <span>{viewingEmployee.emergency_contact_phone || '-'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                    <strong>Occupation:</strong> <span>{viewingEmployee.emergency_contact_occupation || '-'}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={closeEmployeeModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4361ee',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DepartmentDetails;
