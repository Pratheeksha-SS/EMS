import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import { extractListData } from '../../utils/extractListData';
import AnnouncementCard from './AnnouncementCard';
import { RefreshCw, AlertCircle, Megaphone } from 'lucide-react';

const AnnouncementList = ({ isAdmin = false, onViewDetail, onEdit }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (!token) {
      setError('No session. Please login again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await announcementService.getAll();
      const data = extractListData(response.data);
      setAnnouncements(data);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please refresh or login again.');
      } else {
        setError('Failed to load announcements. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementService.delete(id);
        setAnnouncements(announcements.filter(a => a.id !== id));
      } catch (err) {
        alert('Failed to delete announcement');
        console.error(err);
      }
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'white', borderRadius: '14px', padding: '24px',
            border: '1.5px solid #F1F5F9',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F1F5F9', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: '18px', width: '60%', background: '#F1F5F9', borderRadius: '6px', marginBottom: '10px' }} />
                <div style={{ height: '13px', width: '90%', background: '#F8FAFC', borderRadius: '6px', marginBottom: '6px' }} />
                <div style={{ height: '13px', width: '75%', background: '#F8FAFC', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }`}</style>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        color: '#DC2626', fontSize: '14px', fontWeight: '600',
      }}>
        <AlertCircle size={18} />
        <span>{error}</span>
        <button
          onClick={fetchAnnouncements}
          style={{
            marginLeft: 'auto', background: 'white', border: '1.5px solid #FECACA',
            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: '#DC2626', fontWeight: '700',
          }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────
  if (announcements.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        border: '1.5px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        padding: '64px', textAlign: 'center', color: '#94A3B8',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid #FED7AA',
          }}>
            <span style={{ fontSize: '32px' }}>📢</span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', margin: 0 }}>
            No announcements yet
          </p>
          <p style={{ fontSize: '13px', margin: 0, color: '#94A3B8' }}>
            {isAdmin ? 'Create your first announcement using the button above.' : 'Check back later for updates.'}
          </p>
        </div>
      </div>
    );
  }

  // ── List Header ────────────────────────────────────────────────────────
  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Summary Bar */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        border: '1.5px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        marginBottom: '20px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📢</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
              All Announcements
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {pinned.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#FFFBEB', color: '#B45309',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '700', border: '1px solid #FDE68A',
              }}>
                📌 {pinned.length} Pinned
              </span>
            )}
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              {announcements.length} total
            </span>
            <button
              onClick={fetchAnnouncements}
              title="Refresh"
              style={{
                padding: '7px', borderRadius: '8px', border: '1.5px solid #E2E8F0',
                background: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: '#64748B',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Pinned Section */}
        {pinned.length > 0 && (
          <div style={{ padding: '16px 20px', background: '#FFFBEB', borderBottom: '1.5px solid #FDE68A' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
              📌 Pinned
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pinned.map(a => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  onDelete={handleDelete}
                  onEdit={onEdit}
                  onViewDetail={onViewDetail}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Section */}
        {regular.length > 0 && (
          <div style={{ padding: '16px 20px' }}>
            {pinned.length > 0 && (
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                Recent
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {regular.map(a => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  onDelete={handleDelete}
                  onEdit={onEdit}
                  onViewDetail={onViewDetail}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

export default AnnouncementList;