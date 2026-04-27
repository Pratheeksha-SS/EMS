import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { announcementService } from '../services/announcementService';
import './AnnouncementDetail.css';

const AnnouncementDetail = ({ user, onEdit, onBack, id: propId }) => {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');

        let data;
        try {
          const response = await announcementService.getOne(id);
          data = response.data;
        } catch (serviceError) {
          // Fallback to direct axios call
          const response = await axios.get(`http://localhost:8000/api/announcements/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          data = response.data;
        }

        setAnnouncement(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching announcement:', err);
        setError(err.response?.data?.message || 'Failed to load announcement');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnnouncement();
    } else {
      setError('No announcement ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/employee/announcements');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementService.delete(announcement.id);
        if (onBack) {
          onBack();
        } else {
          navigate('/admin/announcements');
        }
      } catch (err) {
        alert('Failed to delete announcement');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadAttachment = async () => {
    if (!announcement?.attachment) return;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      const attachmentUrl = announcement.attachment_url ||
        (announcement.attachment.startsWith('http')
          ? announcement.attachment
          : `http://127.0.0.1:8000${announcement.attachment}`);

      const response = await fetch(attachmentUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = attachmentUrl.split('/').pop();
      const ext = fileName.split('.').pop().toLowerCase();
      const viewable = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

      if (viewable) {
        window.open(blobUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('Download error:', err);
      alert(`Error downloading file: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading" style={{ textAlign: 'center', padding: '60px' }}>
        Loading announcement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error" style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="detail-not-found" style={{ textAlign: 'center', padding: '60px' }}>
        Announcement not found
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="announcement-detail" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={handleBack}
          className="back-button"
          style={{
            padding: '8px 16px',
            backgroundColor: '#e5e7eb',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          &larr; Back to Announcements
        </button>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {announcement.is_pinned && (
            <span className="pinned-tag" style={{
              padding: '4px 12px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              📌 Pinned
            </span>
          )}

          {isAdmin && (
            <div className="admin-menu" style={{ position: 'relative' }}>
              <button
                className="menu-button"
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ⋯
              </button>

              {showMenu && (
                <div className="menu-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  minWidth: '120px'
                }}>
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setShowMenu(false);
                      if (onEdit) {
                        onEdit(announcement);
                      } else {
                        navigate(`/admin/announcements/${announcement.id}/edit`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="delete-btn"
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="detail-content" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h1 className="detail-title" style={{
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 20px 0',
          color: '#1a1a1a'
        }}>
          {announcement.title}
        </h1>

        <div className="detail-meta" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          paddingBottom: '20px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div className="meta-item" style={{ fontSize: '13px', color: '#666' }}>
            <span className="meta-label" style={{ fontWeight: '500' }}>Created:</span>{' '}
            <span className="meta-value">{formatDate(announcement.created_at)}</span>
          </div>
          {announcement.created_by?.username && (
            <div className="meta-item" style={{ fontSize: '13px', color: '#666' }}>
              <span className="meta-label" style={{ fontWeight: '500' }}>By:</span>{' '}
              <span className="meta-value">{announcement.created_by.username}</span>
            </div>
          )}
          {announcement.event_date && (
            <div className="meta-item" style={{ fontSize: '13px', color: '#666' }}>
              <span className="meta-label" style={{ fontWeight: '500' }}>Event Date:</span>{' '}
              <span className="meta-value">{formatDate(announcement.event_date)}</span>
            </div>
          )}
          {announcement.expiry_date && (
            <div className="meta-item" style={{ fontSize: '13px', color: '#ef4444' }}>
              <span className="meta-label" style={{ fontWeight: '500' }}>Expires:</span>{' '}
              <span className="meta-value">{formatDate(announcement.expiry_date)}</span>
            </div>
          )}
        </div>

        <div className="detail-body" style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#374151', whiteSpace: 'pre-wrap' }}>
            {announcement.description}
          </p>
        </div>

        {announcement.attachment && (
          <div className="attachment-section" style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>📎 Attachment</h3>
            <button
              className="attachment-link"
              onClick={handleDownloadAttachment}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ⬇️ {(announcement.attachment_url || announcement.attachment).split('/').pop()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementDetail;