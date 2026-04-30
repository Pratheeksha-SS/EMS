import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/announcementService';
import AnnouncementForm from '../components/announcements/AnnouncementForm';

/* ─── All functionality preserved, UI uses redesigned AnnouncementForm ─────── */

const EditAnnouncement = ({ id }) => {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await announcementService.getOne(id);
        setAnnouncement(data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F8FAFC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
          <div style={{
            width: '44px', height: '44px',
            border: '4px solid #FED7AA', borderTopColor: '#F97316',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Loading announcement...</p>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F8FAFC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      }}>
        <div style={{
          background: 'white', borderRadius: '14px', padding: '48px 40px',
          border: '1.5px solid #F1F5F9', textAlign: 'center', color: '#94A3B8',
        }}>
          <span style={{ fontSize: '40px' }}>📢</span>
          <p style={{ fontWeight: '700', fontSize: '15px', color: '#64748B', marginTop: '12px' }}>
            Announcement not found.
          </p>
        </div>
      </div>
    );
  }

  return <AnnouncementForm announcement={announcement} />;
};

export default EditAnnouncement;