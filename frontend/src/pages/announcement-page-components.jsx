// ─── NewAnnouncement.jsx ─────────────────────────────────────────────────────
// Place this file at: src/pages/NewAnnouncement.jsx

import React from 'react';
import AnnouncementForm from '../components/announcements/AnnouncementForm';

const NewAnnouncement = () => {
  return (
    <div className="new-announcement-page">
      <AnnouncementForm />
    </div>
  );
};

export default NewAnnouncement;


// ─── EditAnnouncement.jsx ─────────────────────────────────────────────────────
// Place this file at: src/pages/EditAnnouncement.jsx
// (export separately in your router)

// import React, { useState, useEffect } from 'react';
// import { announcementService } from '../services/announcementService';
// import AnnouncementForm from '../components/announcements/AnnouncementForm';
//
// const EditAnnouncement = ({ id }) => {
//   const [announcement, setAnnouncement] = useState(null);
//   const [loading, setLoading] = useState(true);
//
//   useEffect(() => {
//     const fetch = async () => {
//       try {
//         const { data } = await announcementService.getOne(id);
//         setAnnouncement(data);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetch();
//   }, [id]);
//
//   if (loading) return (
//     <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
//       <div style={{ textAlign: 'center', color: '#94A3B8' }}>
//         <div style={{ width: '40px', height: '40px', border: '4px solid #FED7AA', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
//         Loading announcement...
//       </div>
//     </div>
//   );
//   if (!announcement) return <div style={{ padding: '40px', textAlign: 'center' }}>Announcement not found.</div>;
//
//   return <AnnouncementForm announcement={announcement} />;
// };
//
// export default EditAnnouncement;


// ─── AdminAnnouncementsWrapper.jsx ───────────────────────────────────────────
// Place this file at: src/pages/AdminAnnouncementsWrapper.jsx

// import React from 'react';
// import AdminAnnouncements from './AdminAnnouncements';
//
// const AdminAnnouncementsWrapper = ({ user }) => {
//   return <AdminAnnouncements user={user} />;
// };
//
// export default AdminAnnouncementsWrapper;