import React from 'react';
import AdminAnnouncements from './AdminAnnouncements';

/* ─── Thin wrapper — passes user prop through to AdminAnnouncements ─────────── */

const AdminAnnouncementsWrapper = ({ user }) => {
  return <AdminAnnouncements user={user} />;
};

export default AdminAnnouncementsWrapper;