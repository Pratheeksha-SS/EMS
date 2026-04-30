import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { announcementService } from "../../services/announcementService";
import {
  ChevronLeft, Pin, Mail, Calendar, Paperclip,
  Check, AlertCircle, X,
} from 'lucide-react';

/* ─── All functionality preserved, UI redesigned to match HRMS design system ─ */

const AnnouncementForm = ({ announcement }) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState(announcement?.title || "");
  const [description, setDescription] = useState(announcement?.description || "");
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned || false);
  const [sendEmail, setSendEmail] = useState(false);
  const [eventDate, setEventDate] = useState(announcement?.event_date || "");
  const [expiryDate, setExpiryDate] = useState(announcement?.expiry_date || "");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleBack = () => navigate('/admin/announcements');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    console.log('=== DEBUG: Token Check ===');
    console.log('Token exists:', token ? 'YES' : 'NO');
    console.log('User role:', localStorage.getItem('user_role'));
    console.log('Username:', localStorage.getItem('username'));
    console.log('========================');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('is_pinned', isPinned);
      formData.append('send_email', sendEmail);
      if (eventDate) formData.append('event_date', eventDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      if (file) formData.append('attachment', file);

      if (announcement) {
        console.log('Updating announcement ID:', announcement.id);
        await announcementService.update(announcement.id, formData);
        showToast('Announcement updated successfully! 🎉', 'success');
      } else {
        console.log('Creating new announcement');
        await announcementService.create(formData);
        showToast('Announcement created successfully! 🎉', 'success');
      }

      setTimeout(() => navigate('/admin/announcements'), 1200);
    } catch (error) {
      console.error('❌ Error details:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      if (error.response?.status === 401) {
        showToast('Session expired. Please logout and login again.', 'error');
      } else {
        showToast('Error saving announcement. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Shared Style Helpers ───────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #E2E8F0', borderRadius: '8px',
    fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', color: '#0F172A', backgroundColor: '#fff',
    fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block', marginBottom: '6px',
    fontSize: '11px', fontWeight: '700', color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  const spinnerStyle = {
    display: 'inline-block', width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0,
  };

  const isEditing = !!announcement;

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
        }
      `}</style>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          padding: '14px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          zIndex: 2000, animation: 'slideUp 0.3s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: '#0F172A', color: 'white',
          borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : '#10B981'}`,
          fontSize: '14px', fontWeight: '600', maxWidth: '360px',
        }}>
          <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
          {toast.message}
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '28px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px',
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
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              {isEditing ? 'Edit Announcement' : 'New Announcement'}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            {isEditing ? 'Update the announcement details below' : 'Fill in the details to publish a new announcement'}
          </p>
        </div>

        <button
          onClick={handleBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', background: 'white', border: '1.5px solid #E2E8F0',
            borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      {/* ── Form Card ───────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9',
        overflow: 'hidden', maxWidth: '800px', margin: '0 auto',
        animation: 'slideUp 0.35s ease',
      }}>
        {/* Card Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '18px' }}>📝</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: 0 }}>
              {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
              {isEditing ? `Editing: ${announcement.title}` : 'All fields marked with * are required'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px' }}>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>📋 Title *</label>
            <input
              type="text"
              placeholder="Enter announcement title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>📄 Description *</label>
            <textarea
              placeholder="Enter announcement details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows="6"
              style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
            />
          </div>

          {/* Date Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>🎉 Event Date (Optional)</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                style={inputStyle}
              />
              <small style={{ fontSize: '11px', color: '#94A3B8', marginTop: '5px', display: 'block' }}>
                Will appear in the calendar view
              </small>
            </div>
            <div>
              <label style={labelStyle}>⏳ Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                style={inputStyle}
              />
              <small style={{ fontSize: '11px', color: '#94A3B8', marginTop: '5px', display: 'block' }}>
                Announcement hides after this date
              </small>
            </div>
          </div>

          {/* Options */}
          <div style={{
            padding: '18px 20px', background: '#F8FAFC',
            borderRadius: '12px', border: '1.5px solid #F1F5F9',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
              Options
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  checked: isPinned, onChange: e => setIsPinned(e.target.checked),
                  icon: '📌', label: 'Pin this announcement', desc: 'Shows at the top of the announcements list',
                  accentBg: '#FFFBEB', accentBorder: '#FDE68A', accentColor: '#B45309',
                },
                {
                  checked: sendEmail, onChange: e => setSendEmail(e.target.checked),
                  icon: '📧', label: 'Send email notification', desc: 'Notifies all employees via email',
                  accentBg: '#F0FDF4', accentBorder: '#BBF7D0', accentColor: '#15803D',
                },
              ].map((opt, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    cursor: 'pointer', padding: '12px 14px', borderRadius: '10px',
                    border: `1.5px solid ${opt.checked ? opt.accentBorder : '#E2E8F0'}`,
                    background: opt.checked ? opt.accentBg : 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={opt.onChange}
                    style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer', accentColor: '#F97316' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: opt.checked ? opt.accentColor : '#0F172A' }}>
                      {opt.icon} {opt.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>📎 Attachment (Optional)</label>
            <div style={{
              border: '1.5px dashed #E2E8F0', borderRadius: '10px',
              padding: '20px', textAlign: 'center', background: '#FAFAFA',
              transition: 'border-color 0.2s, background 0.2s',
              cursor: 'pointer',
            }}
              onDragOver={e => e.preventDefault()}
            >
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={24} color="#94A3B8" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
                  {file ? file.name : 'Click to upload a file'}
                </span>
                {file && (
                  <span style={{
                    fontSize: '11px', color: '#16A34A', fontWeight: '600',
                    background: '#F0FDF4', padding: '3px 10px', borderRadius: '20px',
                    border: '1px solid #BBF7D0',
                  }}>
                    📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
                {announcement?.attachment && !file && (
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Current: {announcement.attachment.split('/').pop()}
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'flex-end',
            paddingTop: '20px', borderTop: '1.5px solid #F1F5F9',
          }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: '11px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px 26px',
                background: loading ? '#CBD5E1' : 'linear-gradient(135deg, #F97316, #EA580C)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(249,115,22,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 12px rgba(249,115,22,0.3)'; }}
            >
              {loading ? (
                <><span style={spinnerStyle} /> Saving...</>
              ) : (
                <><Check size={16} /> {isEditing ? 'Update Announcement' : 'Create Announcement'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;