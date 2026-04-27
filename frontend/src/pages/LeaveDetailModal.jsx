import React from 'react';
import { formatDate } from '../utils/reportUtils';

const LeaveDetailModal = ({ leave, onClose, onApprove, onReject, reviewComments, onCommentsChange, actionLoading, styles }) => {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Leave Request Details</h2>
          <button onClick={onClose} style={{ ...styles.subtleButton, padding: '8px 12px' }}>Close</button>
        </div>
        <div style={styles.modalBody}>
          <div style={{ ...styles.metaGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
            <div><div style={styles.metaLabel}>Employee Name</div><div style={{ fontWeight: '500' }}>{leave.employee_name}</div></div>
            <div><div style={styles.metaLabel}>Employee ID</div><div style={{ fontWeight: '500' }}>{leave.employee_id}</div></div>
            <div><div style={styles.metaLabel}>Leave Type</div><div style={{ fontWeight: '500' }}>{leave.leave_type}</div></div>
            <div><div style={styles.metaLabel}>Status</div><span style={{ ...styles.statusBadge, ...leave.status_style }}>{leave.status}</span></div>
            <div><div style={styles.metaLabel}>Department</div><div>{leave.department}</div></div>
            <div><div style={styles.metaLabel}>From</div><div>{leave.start_date}</div></div>
            <div><div style={styles.metaLabel}>End</div><div>{leave.end_date}</div></div>
            <div><div style={styles.metaLabel}>Total Days</div><div>{leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</div></div>
            <div><div style={styles.metaLabel}>Applied On</div><div>{leave.applied_at ? formatDate(leave.applied_at) : 'N/A'}</div></div>
            <div><div style={styles.metaLabel}>Reason</div><div style={styles.box}>{leave.reason || 'No reason provided'}</div></div>
          </div>
          {leave.status === 'PENDING' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={styles.metaLabel}>Review Comments</div>
              <textarea 
                value={reviewComments} 
                onChange={onCommentsChange}
                placeholder="Add comments..."
                style={styles.textarea} 
              />
            </div>
          )}
        </div>
        <div style={styles.modalFooter}>
          {leave.status !== 'PENDING' && (
            <button onClick={() => handleDeleteLeave(leave.id)} style={styles.dangerButton}>
              Delete
            </button>
          )}
          <button onClick={onReject} disabled={actionLoading} style={styles.dangerButton}>
            {actionLoading ? 'Saving...' : 'Reject'}
          </button>
          <button onClick={onApprove} disabled={actionLoading} style={styles.successButton}>
            {actionLoading ? 'Saving...' : 'Approve'}
          </button>
          <button onClick={onClose} style={styles.subtleButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailModal;

