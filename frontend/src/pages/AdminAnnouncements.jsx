import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnnouncementList from '../components/announcements/AnnouncementList';

/* ─── Design Tokens (mirrors ManagerManagement.jsx palette) ───────────────────
   Primary       : #F97316  (orange-500)
   Primary Dark  : #EA580C  (orange-600)
   Primary Light : #FFF7ED  (orange-50)
   Accent        : #16A34A  (green-600)
   Neutral BG    : #F8FAFC
   Surface       : #FFFFFF
   Border        : #E2E8F0 / #F1F5F9
   Text Main     : #0F172A
   Text Muted    : #64748B
   ──────────────────────────────────────────────────────────────────────────── */

const AdminAnnouncements = ({ user, onViewDetail, onEdit }) => {
  const navigate = useNavigate();

  const handleNewAnnouncement = () => {
    navigate('/admin/announcements/new');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '16px',
        animation: 'slideUp 0.3s ease',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>
              <span style={{ fontSize: '20px' }}>📢</span>
            </div>
            <h1 style={{
              fontSize: '26px', fontWeight: '800', margin: 0,
              color: '#0F172A', letterSpacing: '-0.5px',
            }}>
              Announcement Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Create, manage and publish announcements to your organisation
          </p>
        </div>

        <button
          onClick={handleNewAnnouncement}
          style={{
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white', border: 'none',
            padding: '11px 22px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)';
          }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          New Announcement
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
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