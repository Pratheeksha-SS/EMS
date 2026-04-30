import React, { useState } from 'react';
import { Calendar, User, Paperclip, Eye, Edit2, Trash2, ChevronRight } from 'lucide-react';

/* ─── No external CSS needed — all inline with design tokens ─────────────── */

const AnnouncementCard = ({ announcement, onDelete, onEdit, onViewDetail, isAdmin }) => {
  const [hovered, setHovered] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const handleCardClick = () => {
    if (onViewDetail) onViewDetail(announcement.id);
  };

  const handleViewFull = (e) => {
    e.stopPropagation();
    if (onViewDetail) onViewDetail(announcement.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(announcement.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(announcement.id);
  };

  const isPinned = announcement.is_pinned;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: '12px',
        border: `1.5px solid ${isPinned ? '#FDE68A' : hovered ? '#FED7AA' : '#F1F5F9'}`,
        borderLeft: `4px solid ${isPinned ? '#F59E0B' : '#F97316'}`,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: hovered ? '0 4px 16px rgba(249,115,22,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        position: 'relative',
        animation: 'slideUp 0.3s ease',
      }}
    >
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Pinned Badge */}
      {isPinned && (
        <span style={{
          position: 'absolute', top: '12px', right: isAdmin ? '110px' : '14px',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: '#FFFBEB', color: '#B45309',
          padding: '2px 10px', borderRadius: '20px',
          fontSize: '11px', fontWeight: '700', border: '1px solid #FDE68A',
        }}>
          📌 Pinned
        </span>
      )}

      {/* Admin Action Buttons — always visible, top-right */}
      {isAdmin && (
        <div style={{
          position: 'absolute', top: '12px', right: '14px',
          display: 'flex', gap: '6px',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.2s',
        }}>
          <button
            onClick={handleEdit}
            title="Edit"
            style={{
              padding: '5px 10px', background: '#EFF6FF', color: '#3B82F6',
              border: '1px solid #BFDBFE', borderRadius: '8px',
              fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
          >
            <Edit2 size={11} /> Edit
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            style={{
              padding: '5px 10px', background: '#FEF2F2', color: '#DC2626',
              border: '1px solid #FECACA', borderRadius: '8px',
              fontSize: '11px', fontWeight: '700', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingRight: isAdmin ? '160px' : '0' }}>
        {/* Icon */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: isPinned
            ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)'
            : 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          border: `1.5px solid ${isPinned ? '#FDE68A' : '#FED7AA'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
        }}>
          {isPinned ? '📌' : '📢'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <h3 style={{
            fontSize: '15px', fontWeight: '800', color: '#0F172A',
            margin: '0 0 6px 0', letterSpacing: '-0.2px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {announcement.title}
          </h3>

          {/* Description Preview */}
          <p style={{
            fontSize: '13px', color: '#64748B', margin: '0 0 12px 0',
            lineHeight: '1.55',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {announcement.description}
          </p>

          {/* Meta Row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', color: '#94A3B8', fontWeight: '600',
            }}>
              <Calendar size={11} />
              {formatDate(announcement.created_at)}
            </span>

            {announcement.event_date && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#F0FDF4', color: '#15803D',
                padding: '2px 8px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '600', border: '1px solid #BBF7D0',
              }}>
                🎉 {formatDate(announcement.event_date)}
              </span>
            )}

            {announcement.expiry_date && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#FEF2F2', color: '#DC2626',
                padding: '2px 8px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '600', border: '1px solid #FECACA',
              }}>
                ⏳ Expires {formatDate(announcement.expiry_date)}
              </span>
            )}

            {announcement.created_by_username && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: '#94A3B8', fontWeight: '600',
              }}>
                <User size={11} /> {announcement.created_by_username}
              </span>
            )}

            {announcement.attachment && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#EFF6FF', color: '#3B82F6',
                padding: '2px 8px', borderRadius: '20px',
                fontSize: '11px', fontWeight: '600', border: '1px solid #BFDBFE',
              }}>
                <Paperclip size={10} /> Attachment
              </span>
            )}

            {/* View Detail CTA */}
            <span
              onClick={handleViewFull}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '12px', fontWeight: '700', color: '#F97316',
                cursor: 'pointer', transition: 'gap 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.gap = '6px'}
              onMouseLeave={e => e.currentTarget.style.gap = '3px'}
            >
              Read more <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;
