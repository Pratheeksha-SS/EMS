import React from 'react';
import AnnouncementList from '../components/announcements/AnnouncementList';

const EmployeeAnnouncements = ({ user }) => {
  return (
    <div className="employee-announcements" style={{ padding: '20px' }}>
      <h1>Announcements</h1>
      <AnnouncementList isAdmin={false} />
    </div>
  );
};

export default EmployeeAnnouncements;