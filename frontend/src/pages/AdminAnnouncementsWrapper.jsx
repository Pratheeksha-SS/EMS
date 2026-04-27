import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminAnnouncements from './AdminAnnouncements';

const AdminAnnouncementsWrapper = ({ user }) => {
  return <AdminAnnouncements user={user} />;
};

export default AdminAnnouncementsWrapper;