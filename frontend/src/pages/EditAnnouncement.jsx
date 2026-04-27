import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/announcementService';
import AnnouncementForm from '../components/announcements/AnnouncementForm';

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

  if (loading) return <div>Loading...</div>;
  if (!announcement) return <div>Announcement not found.</div>;

  return <AnnouncementForm announcement={announcement} />;
};

export default EditAnnouncement;