import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

const ApplyLeave = ({ show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    leave_type: 'SICK',
    start_date: '',
    end_date: '',
    reason: '',
    child_number: '',
    is_adoption: false,
    is_surrogacy: false,
    marriage_date: '',
    is_first_marriage: true,
    child_birth_date: '',
    supporting_document: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeGender, setEmployeeGender] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  // Fetch employee gender on component mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await api.get('/employees/me/');
        setEmployeeGender(response.data.gender || 'MALE');
        setEmployeeName(response.data.first_name || 'Employee');
      } catch (err) {
        console.error('Error fetching employee data:', err);
      }
    };
    fetchEmployeeData();
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setFormData({
        leave_type: 'SICK',
        start_date: '',
        end_date: '',
        reason: '',
        child_number: '',
        is_adoption: false,
        is_surrogacy: false,
        marriage_date: '',
        is_first_marriage: true,
        child_birth_date: '',
        supporting_document: null
      });
      setError('');
      setSelectedFileName('');
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      const file = files[0];
      setFormData({ ...formData, [name]: file });
      setSelectedFileName(file ? file.name : '');
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate dates
    if (formData.start_date > formData.end_date) {
      setError('End date cannot be earlier than start date');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('leave_type', formData.leave_type);
      submitData.append('start_date', formData.start_date);
      submitData.append('end_date', formData.end_date);
      submitData.append('reason', formData.reason);
      
      // Add special fields based on leave type
      if (formData.leave_type === 'MATERNITY') {
        if (!formData.child_number) {
          setError('Please select child number for Maternity Leave');
          setLoading(false);
          return;
        }
        submitData.append('child_number', formData.child_number);
        submitData.append('is_adoption', formData.is_adoption);
        submitData.append('is_surrogacy', formData.is_surrogacy);
      }
      
      if (formData.leave_type === 'MARRIAGE') {
        if (!formData.marriage_date) {
          setError('Please select marriage date');
          setLoading(false);
          return;
        }
        submitData.append('marriage_date', formData.marriage_date);
        submitData.append('is_first_marriage', formData.is_first_marriage);
        if (formData.supporting_document) {
          submitData.append('supporting_document', formData.supporting_document);
        }
      }
      
      if (formData.leave_type === 'PATERNITY') {
        if (!formData.child_birth_date) {
          setError('Please select child birth date');
          setLoading(false);
          return;
        }
        submitData.append('child_birth_date', formData.child_birth_date);
      }

      await api.post('/leaves/apply/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reset form
      setFormData({
        leave_type: 'SICK',
        start_date: '',
        end_date: '',
        reason: '',
        child_number: '',
        is_adoption: false,
        is_surrogacy: false,
        marriage_date: '',
        is_first_marriage: true,
        child_birth_date: '',
        supporting_document: null
      });
      setSelectedFileName('');
      
      onSuccess();
      onClose();

    } catch (err) {
      console.error('Error applying leave:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(errorMessages || 'Failed to apply leave');
        } else {
          setError(errorData.toString());
        }
      } else if (err.response?.status === 400) {
        setError('Invalid request. Please check your inputs.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to apply leave. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '550px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#1a1a1a' }}>Apply for Leave</h2>
        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          Welcome, {employeeName}! Please fill in the details below.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            whiteSpace: 'pre-line',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
              Leave Type *
            </label>
            <select
              name="leave_type"
              value={formData.leave_type}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="SICK">Sick Leave</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="PAID">Paid Leave</option>
              {employeeGender === 'FEMALE' && (
                <option value="MATERNITY">Maternity Leave</option>
              )}
              {employeeGender === 'MALE' && (
                <option value="PATERNITY">Paternity Leave</option>
              )}
              <option value="MARRIAGE">Marriage Leave</option>
            </select>
          </div>

          {/* Maternity Leave Extra Fields */}
          {formData.leave_type === 'MATERNITY' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                  Child Number *
                </label>
                <select
                  name="child_number"
                  value={formData.child_number}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select child number</option>
                  <option value="1">1st Child (26 weeks leave)</option>
                  <option value="2">2nd Child (26 weeks leave)</option>
                  <option value="3">3rd Child or more (12 weeks leave)</option>
                </select>
                <small style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                  Note: 26 weeks for 1st/2nd child, 12 weeks for 3rd child onwards
                </small>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_adoption"
                    checked={formData.is_adoption}
                    onChange={handleChange}
                  />
                  <span style={{ color: '#666' }}>Adoption Case (12 weeks leave)</span>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_surrogacy"
                    checked={formData.is_surrogacy}
                    onChange={handleChange}
                  />
                  <span style={{ color: '#666' }}>Surrogacy Case (12 weeks leave)</span>
                </label>
              </div>
            </>
          )}

          {/* Marriage Leave Extra Fields */}
          {formData.leave_type === 'MARRIAGE' && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                  Marriage Date *
                </label>
                <input
                  type="date"
                  name="marriage_date"
                  value={formData.marriage_date}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_first_marriage"
                    checked={formData.is_first_marriage}
                    onChange={handleChange}
                  />
                  <span style={{ color: '#666' }}>First Marriage (One-time leave - 15 days)</span>
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                  Upload Marriage Proof (Invitation Card / Marriage Certificate)
                </label>
                <input
                  type="file"
                  name="supporting_document"
                  onChange={handleChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
                {selectedFileName && (
                  <small style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                    ✓ Selected: {selectedFileName}
                  </small>
                )}
                <small style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                  Accepted formats: PDF, JPG, PNG, DOC (Max 5MB)
                </small>
              </div>
            </>
          )}

          {/* Paternity Leave Extra Fields */}
          {formData.leave_type === 'PATERNITY' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
                Child Birth Date *
              </label>
              <input
                type="date"
                name="child_birth_date"
                value={formData.child_birth_date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                Paternity leave of 15 days is provided
              </small>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
              End Date *
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontWeight: '500' }}>
              Reason *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Please provide detailed reason for your leave request..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #bae6fd'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
              <strong>Note:</strong> Your leave request will be sent to your manager for approval. 
              You will be notified once it is approved or rejected.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e5e7eb',
                color: '#666',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Applying...' : 'Apply Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;