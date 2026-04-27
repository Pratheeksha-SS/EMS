import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateDepartment = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    history: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get existing departments from localStorage
      const existingDepartments = JSON.parse(localStorage.getItem('departments') || '[]');
      
      // Create new department
      const newDepartment = {
        id: Date.now(), // Use timestamp as ID
        name: formData.name,
        history: formData.history,
        teamCount: 0,
        color: formData.name === 'IT' ? '#4caf50' : '#ff9933',
        createdAt: new Date().toISOString()
      };
      
      // Add to existing departments
      const updatedDepartments = [...existingDepartments, newDepartment];
      
      // Save to localStorage
      localStorage.setItem('departments', JSON.stringify(updatedDepartments));
      
      // Trigger refresh in departments page
      localStorage.setItem('refreshDepartments', 'true');
      window.dispatchEvent(new Event('storage'));
      
      // Show success message
      alert('Department created successfully!');
      
      // Navigate back to departments list
      navigate('/departments');
      
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px' }}>
        <span 
          onClick={() => navigate('/departments')}
          style={{ 
            color: '#666', 
            cursor: 'pointer',
            fontSize: '14px',
            hover: { color: '#ff9933' }
          }}
          onMouseEnter={(e) => e.target.style.color = '#ff9933'}
          onMouseLeave={(e) => e.target.style.color = '#666'}
        >
          Dashboard
        </span>
        <span style={{ color: '#999', margin: '0 8px' }}>/</span>
        <span 
          onClick={() => navigate('/departments')}
          style={{ 
            color: '#666', 
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => e.target.style.color = '#ff9933'}
          onMouseLeave={(e) => e.target.style.color = '#666'}
        >
          Departments
        </span>
        <span style={{ color: '#999', margin: '0 8px' }}>/</span>
        <span style={{ color: '#ff9933', fontSize: '14px', fontWeight: '500' }}>
          New Department
        </span>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '8px'
        }}>
          Create New Department
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '32px'
        }}>
          Fill in the details to create a new department
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>
              Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., IT, Security, HR"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4caf50';
                e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1a1a1a',
              marginBottom: '8px'
            }}>
              History <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              name="history"
              value={formData.history}
              onChange={handleChange}
              placeholder="Brief description of the department's purpose and history"
              required
              rows="6"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4caf50';
                e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => navigate('/departments')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#666',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s, border-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#e5e7eb';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #4caf50, #ff9933)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartment;