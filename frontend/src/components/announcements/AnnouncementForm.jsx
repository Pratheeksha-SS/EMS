import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { announcementService } from "../../services/announcementService";

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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleBack = () => {
    navigate('/admin/announcements');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // 🔍 DEBUG: Check token before sending
  const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
  console.log('=== DEBUG: Token Check ===');
  console.log('Token exists:', token ? 'YES' : 'NO');
  console.log('Token value:', token ? token.substring(0, 50) + '...' : 'null');
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
      alert("Announcement updated successfully!");
    } else {
      console.log('Creating new announcement');
      await announcementService.create(formData);
      alert("Announcement created successfully!");
    }

    navigate('/admin/announcements');

  } catch (error) {
    console.error('❌ Error details:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    
    if (error.response?.status === 401) {
      alert("Session expired. Please logout and login again.");
    } else {
      alert("Error saving announcement. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

  // Styles
  const styles = {
    container: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      maxWidth: "700px",
      margin: "40px auto",
      padding: "30px",
    },
    header: {
      marginBottom: "30px",
      paddingBottom: "20px",
      borderBottom: "2px solid #e0e0e0",
      display: "flex",
      alignItems: "center",
      gap: "20px",
    },
    backButton: {
      background: "none",
      border: "none",
      fontSize: "18px",
      cursor: "pointer",
      color: "#4361ee",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      borderRadius: "8px",
      transition: "all 0.3s ease",
    },
    title: {
      margin: 0,
      color: "#2c3e50",
      fontSize: "24px",
    },
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "600",
      color: "#2c3e50",
      fontSize: "14px",
    },
    input: {
      width: "100%",
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: "12px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      resize: "vertical",
    },
    row: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
      marginBottom: "20px",
    },
    checkboxes: {
      marginBottom: "20px",
      padding: "15px",
      background: "#f8f9fa",
      borderRadius: "8px",
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      marginBottom: "10px",
    },
    fileInput: {
      width: "100%",
      padding: "10px",
      border: "1px dashed #ddd",
      borderRadius: "8px",
      background: "#fafafa",
      cursor: "pointer",
      boxSizing: "border-box",
    },
    fileInfo: {
      color: "#4CAF50",
      fontSize: "12px",
      display: "block",
      marginTop: "5px",
    },
    existingFile: {
      color: "#4361ee",
      fontSize: "12px",
      display: "block",
      marginTop: "5px",
    },
    actions: {
      display: "flex",
      gap: "15px",
      justifyContent: "flex-end",
      marginTop: "30px",
      paddingTop: "20px",
      borderTop: "1px solid #e0e0e0",
    },
    cancelBtn: {
      background: "#6c757d",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
    submitBtn: {
      background: "#4361ee",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
    smallText: {
      color: "#666",
      fontSize: "11px",
      display: "block",
      marginTop: "4px",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header with Back Button */}
      <div style={styles.header}>
        <button
          onClick={handleBack}
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.target.style.background = "#f0f4ff";
            e.target.style.transform = "translateX(-5px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "none";
            e.target.style.transform = "translateX(0)";
          }}
        >
          ← Back
        </button>
        <h1 style={styles.title}>
          {announcement ? "Edit Announcement" : "Create New Announcement"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Title Field */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Title *</label>
          <input
            type="text"
            placeholder="Enter announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        {/* Description Field */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Description *</label>
          <textarea
            placeholder="Enter announcement details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="6"
            style={styles.textarea}
          />
        </div>

        {/* Date Fields Row */}
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Event Date (Optional)</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={styles.input}
            />
            <small style={styles.smallText}>Will appear in calendar</small>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiry Date (Optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={styles.input}
            />
            <small style={styles.smallText}>Announcement will hide after this date</small>
          </div>
        </div>

        {/* Checkboxes */}
        <div style={styles.checkboxes}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            <span>📌 Pin this announcement (shows at top of list)</span>
          </label>
          
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            <span>📧 Send email notification to all employees</span>
          </label>
        </div>

        {/* File Upload */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Attachment (Optional)</label>
          <input
            type="file"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          {file && (
            <small style={styles.fileInfo}>
              📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </small>
          )}
          {announcement?.attachment && !file && (
            <small style={styles.existingFile}>
              Current file: {announcement.attachment.split('/').pop()}
            </small>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleBack}
            style={styles.cancelBtn}
            onMouseEnter={(e) => {
              e.target.style.background = "#5a6268";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#6c757d";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "#3046c0";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(67, 97, 238, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = "#4361ee";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {loading ? "Saving..." : (announcement ? "✓ Update Announcement" : "✓ Create Announcement")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;