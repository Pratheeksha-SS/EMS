import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';

const Departments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const fromManagerMgmt = location.state?.from === 'manager-mgmt';
  
  const handleBackToManagerMgmt = () => {
    navigate(-1);
  };
  const [departments, setDepartments] = useState(() => JSON.parse(localStorage.getItem('departments') || '[]'));
  const [loading, setLoading] = useState(false);

  // Load departments from localStorage and calculate employee counts
  const loadDepartments = async () => {
    setLoading(true);
    try {
      const [employeesRes, departmentsRes] = await Promise.all([
        api.get('/employees/'),
        api.get('/departments/'),
      ]);

      const employeesData = extractListData(employeesRes.data);
      const backendDepartments = departmentsRes.data || [];
      const savedDepartments = JSON.parse(localStorage.getItem('departments') || '[]');

      const colorPalette = ['#4caf50', '#ff9933', '#4361ee', '#10b981', '#f97316', '#06b6d4'];
      const getSavedDepartment = (name) => savedDepartments.find(saved =>
        saved.name?.trim().toLowerCase() === name?.trim().toLowerCase()
      );

      let normalizedDepartments = [];

      if (backendDepartments.length > 0) {
        normalizedDepartments = backendDepartments.map((dept, index) => {
          const deptEmployees = employeesData.filter(emp =>
            emp.department?.toLowerCase() === dept.name?.toLowerCase()
          );
          const savedDepartment = getSavedDepartment(dept.name) || {};

          return {
            id: dept.id,
            name: dept.name || 'Unassigned',
            history: savedDepartment.history || dept.description || `${dept.name || 'Unassigned'} Department`,
            teamCount: dept.employee_count ?? deptEmployees.length,
            employees: deptEmployees,
            color: savedDepartment.color || colorPalette[index % colorPalette.length],
            manager: dept.manager || null,
            manager_name: dept.manager_name || null,
            description: dept.description || '',
          };
        });
      } else {
        const uniqueDepts = [...new Set(employeesData.map(emp => emp.department).filter(Boolean))];
        normalizedDepartments = uniqueDepts.map((dept, index) => {
          const deptEmployees = employeesData.filter(emp => emp.department === dept);
          const savedDepartment = getSavedDepartment(dept) || {};

          return {
            id: savedDepartment.id || index + 1,
            name: dept || 'Unassigned',
            history: savedDepartment.history || `${dept || 'Unassigned'} Department`,
            teamCount: deptEmployees.length,
            employees: deptEmployees,
            color: savedDepartment.color || colorPalette[index % colorPalette.length],
            manager: savedDepartment.manager || null,
            manager_name: savedDepartment.manager_name || null,
            description: savedDepartment.description || '',
          };
        });
      }

      setDepartments(normalizedDepartments);
      localStorage.setItem('departments', JSON.stringify(normalizedDepartments));
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Listen for storage events
  useEffect(() => {
    const handleStorageChange = () => {
      loadDepartments();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleViewDepartment = (id) => {
    navigate(`/departments/${id}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      {fromManagerMgmt && (
        <button 
          style={{
            background: '#FFF7ED',
            border: '1px solid #FCD34D',
            color: '#92400E',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}
          onClick={handleBackToManagerMgmt}
        >
          ← Back to Manager Management
        </button>
      )}
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '8px'
          }}>
            Departments
          </h1>
          <p style={{ color: '#666' }}>View your organization departments</p>
        </div>
      </div>

      {/* Departments Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {departments.map((dept) => (
          <div
            key={dept.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              border: `1px solid ${dept.color || '#4caf50'}20`,
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => handleViewDepartment(dept.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            }}
          >
            {/* Color strip */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${dept.color || '#4caf50'}, ${dept.color === '#4caf50' ? '#ff9933' : '#4caf50'})`
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${dept.color || '#4caf50'}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                color: dept.color || '#4caf50'
              }}>
                {dept.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  {dept.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  {dept.teamCount} {dept.teamCount === 1 ? 'member' : 'members'}
                </p>
              </div>
            </div>


            
            <p style={{ 
              fontSize: '14px', 
              color: '#666',
              margin: 0,
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {dept.history}
            </p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '24px' }}>
          Loading departments...
        </div>
      )}

      {departments.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '12px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🏢
          </div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Departments Found</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Departments will appear here once employees are assigned.
          </p>
        </div>
      )}
    </div>
  );
};

export default Departments;
