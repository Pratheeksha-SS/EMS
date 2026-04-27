import React, { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import './AnnouncementCard.css';

const AnnouncementCard = ({ announcement, onDelete, onEdit, onViewDetail, isAdmin }) => {
  //const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCardClick = () => {
  if (onViewDetail) {
    onViewDetail(announcement);
  }
};

  const handleViewFull = (e) => {
  e.stopPropagation();
  if (onViewDetail) {
    onViewDetail(announcement);
  }
};

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    onEdit(announcement);
    setShowActions(false); // Hide actions after edit
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click
    onDelete(announcement.id);
    setShowActions(false); // Hide actions after delete
  };

  return (
    <div className="announcement-card-wrapper">
      <div 
        className={`announcement-card ${announcement.is_pinned ? 'pinned' : ''} ${showActions ? 'expanded' : ''}`}
        onClick={handleCardClick}
      >
        {announcement.is_pinned && <span className="pinned-badge">📌 Pinned</span>}
        
        {isAdmin && (
          <div className="admin-actions">
            <button 
              className="action-btn edit-btn" 
              onClick={handleEdit}
              title="Edit Announcement"
            >
              ✏️
            </button>
            <button 
              className="action-btn delete-btn" 
              onClick={handleDelete}
              title="Delete Announcement"
            >
              🗑️
            </button>
          </div>
        )}
        
        <h3>{announcement.title}</h3>
        <p className="description-preview">
          {announcement.description.substring(0, 100)}...
        </p>
        
        <div className="announcement-meta">
          <span>📅 {formatDate(announcement.created_at)}</span>
          {announcement.event_date && (
            <span>🎉 Event: {formatDate(announcement.event_date)}</span>
          )}
          {announcement.created_by_username && (
            <span>👤 By: {announcement.created_by_username}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;