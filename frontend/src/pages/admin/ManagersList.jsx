import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';

const ManagersList = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingManager, setViewingManager] = useState(null);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const [managersRes, departmentsRes] = await Promise.all([
        api.get('/managers/'),
        api.get('/departments/')
      ]);
      
      const managersList = extractListData(managersRes.data);
      const departmentsList = extractListData(departmentsRes.data);

      const managersData = managersList.map(manager => {
        const assignedDept = departmentsList.find(dept => 
          String(dept.manager) === String(manager.id)
        );
        return {
          ...manager,
          employee_id: manager.employee_id || manager.id,
          department_name: assignedDept?.name || 'Not assigned'
        };
      });
      
      setManagers(managersData);
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading managers...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/manager-management')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#FFF7ED',
          border: '1px solid #FED7AA',
          borderRadius: '10px',
          color: '#F97316',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
      >
        ← Back to Manager Management
      </button>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600',
          margin: '0 0 8px 0',
          color: '#1a1a1a'
        }}>
          Managers ({managers.length})
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: '#666',
          margin: 0
        }}>
          Filtered view of employees with Manager role
        </p>
      </div>

      {/* Stats Card */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Active Managers</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{managers.length}</div>
        </div>
      </div>

      {/* Managers Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {managers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No managers found. Promote employees via Manager Management.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Manager</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Employee ID</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Department</th>
                  <th style={{ textAlign: 'left', padding: '12px', color: '#666', fontSize: '14px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #F97316, #F59E0B)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {manager.name?.charAt(0).toUpperCase()}
                        </div>
                        <div 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setViewingManager(manager)}
                        >
                          <div style={{ fontWeight: '600' }}>{manager.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{manager.designation || 'Manager'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{manager.employee_id || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{manager.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {manager.department_name || 'Not assigned'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '20px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagersList;
