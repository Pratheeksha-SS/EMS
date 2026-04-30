// ─── EmployeeAnnouncements.jsx ──────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnnouncementList from '../components/announcements/AnnouncementList';

export const EmployeeAnnouncements = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={{
        marginBottom: '28px',
        animation: 'slideUp 0.3s ease',
      }}>
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
            Announcements
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
          Stay updated with the latest news from your organisation
        </p>
      </div>

      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <AnnouncementList
          isAdmin={false}
          onViewDetail={(id) => navigate(`/employee/announcements/${id}`)}
        />
      </div>
    </div>
  );
};

export default EmployeeAnnouncements;
