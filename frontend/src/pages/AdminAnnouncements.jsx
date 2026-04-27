import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnnouncementList from '../components/announcements/AnnouncementList';
import './AdminAnnouncements.css';

const AdminAnnouncements = ({ user,onViewDetail, onEdit }) => {
  const navigate = useNavigate();

  const handleNewAnnouncement = () => {
    navigate('/admin/announcements/new');
  };

  return (
    <div className="admin-announcements">
      <div className="header">
        <h1>Announcement Management</h1>
        <button className="btn-primary" onClick={handleNewAnnouncement}>
          + New Announcement
        </button>
      </div>

      <div className="content">
        <AnnouncementList
          isAdmin={true}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          user={user}
        />
      </div>
    </div>
  );
};

export default AdminAnnouncements;