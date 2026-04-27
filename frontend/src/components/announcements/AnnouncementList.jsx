import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import { extractListData } from '../../utils/extractListData';
import AnnouncementCard from './AnnouncementCard';

const AnnouncementList = ({ isAdmin = false, onViewDetail,onEdit }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    // Check token before fetch
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (!token) {
      setError('No session. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await announcementService.getAll();
      console.log('API RESPONSE:', response.data);
      
      // Handle both array and paginated (DRF) responses
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
        alert('Announcement deleted successfully');
      } catch (err) {
        alert('Failed to delete announcement');
        console.error(err);
      }
    }
  };

  const handleEdit = (announcement) => {
    // You can implement edit functionality later
    console.log('Edit:', announcement);
    alert('Edit feature coming soon!');
  };

  if (loading) return <div className="loading">Loading announcements...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="announcement-list">
      <h2>All Announcements</h2>
      {announcements.length === 0 ? (
        <p className="no-data">No announcements yet.</p>
      ) : (
        (announcements || []).map(announcement => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onDelete={handleDelete}
            onEdit={onEdit}
            onViewDetail={onViewDetail}
            isAdmin={isAdmin}
          />
        ))
      )}
    </div>
  );
};

export default AnnouncementList;