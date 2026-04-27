// src/components/OfficeNotes.jsx
import React, { useState, useEffect } from 'react';

const OfficeNotes = ({ selectedYear, onClose, onNoteAdded }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteType, setNoteType] = useState('meeting');
  const [noteText, setNoteText] = useState('');
  const [existingNotes, setExistingNotes] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);

  // Load existing notes for the year
  useEffect(() => {
    const notesKey = `office_notes_${selectedYear}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      setExistingNotes(JSON.parse(savedNotes));
    }
  }, [selectedYear]);

  // Note types with icons and colors
  const noteTypes = [
    { id: 'meeting', icon: '📅', label: 'Meeting', color: '#1976d2', bgColor: '#e3f2fd' },
    { id: 'deadline', icon: '⏰', label: 'Deadline', color: '#c62828', bgColor: '#ffebee' },
    { id: 'client', icon: '📞', label: 'Client Call', color: '#2e7d32', bgColor: '#e8f5e9' },
    { id: 'report', icon: '📊', label: 'Report', color: '#f57c00', bgColor: '#fff3e0' },
    { id: 'review', icon: '👥', label: 'Review', color: '#9c27b0', bgColor: '#f3e5f5' },
  ];

  // Handle date selection
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    
    // Check if there's an existing note for this date
    const notesKey = `office_notes_${selectedYear}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      const notes = JSON.parse(savedNotes);
      const dateKey = e.target.value.replace(/-/g, '-');
      if (notes[dateKey]) {
        setSelectedNote(notes[dateKey]);
        setNoteType(notes[dateKey].type);
        setNoteText(notes[dateKey].text);
      } else {
        setSelectedNote(null);
        setNoteType('meeting');
        setNoteText('');
      }
    }
  };

  // Save note
  const handleSaveNote = () => {
    if (!noteText.trim()) {
      alert('Please enter a note');
      return;
    }

    const notesKey = `office_notes_${selectedYear}`;
    const savedNotes = localStorage.getItem(notesKey);
    let allNotes = savedNotes ? JSON.parse(savedNotes) : {};
    
    // Create note object
    const noteObj = {
      type: noteType,
      text: noteText,
      date: selectedDate,
      createdAt: new Date().toISOString()
    };

    // Add to notes
    allNotes[selectedDate] = noteObj;
    
    // Save to localStorage
    localStorage.setItem(notesKey, JSON.stringify(allNotes));
    
    // Update state
    setExistingNotes(allNotes);
    setSelectedNote(noteObj);
    
    // Notify parent
    if (onNoteAdded) {
      onNoteAdded();
    }
    
    alert('Note saved successfully!');
  };

  // Delete note
  const handleDeleteNote = () => {
    if (!selectedNote) return;

    const notesKey = `office_notes_${selectedYear}`;
    const savedNotes = localStorage.getItem(notesKey);
    if (savedNotes) {
      const allNotes = JSON.parse(savedNotes);
      delete allNotes[selectedDate];
      
      localStorage.setItem(notesKey, JSON.stringify(allNotes));
      setExistingNotes(allNotes);
      setSelectedNote(null);
      setNoteType('meeting');
      setNoteText('');
      
      if (onNoteAdded) {
        onNoteAdded();
      }
      
      alert('Note deleted successfully!');
    }
  };

  // Get notes for current month display
  const getNotesForMonth = () => {
    const month = selectedDate.substring(0, 7); // YYYY-MM
    const notesList = [];
    
    Object.entries(existingNotes).forEach(([date, note]) => {
      if (date.startsWith(month)) {
        notesList.push({ date, ...note });
      }
    });
    
    return notesList.sort((a, b) => a.date.localeCompare(b.date));
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>📝 Add Office Note</h2>
          <button onClick={onClose} style={styles.closeButton}>✖</button>
        </div>

        <div style={styles.modalBody}>
          {/* Date Selector */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              style={styles.dateInput}
              min={`${selectedYear}-01-01`}
              max={`${selectedYear}-12-31`}
            />
          </div>

          {/* Note Type Selection */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Note Type:</label>
            <div style={styles.noteTypeGrid}>
              {noteTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setNoteType(type.id)}
                  style={{
                    ...styles.noteTypeButton,
                    backgroundColor: noteType === type.id ? type.bgColor : '#f5f5f5',
                    border: noteType === type.id ? `2px solid ${type.color}` : '1px solid #ddd',
                    color: type.color,
                  }}
                >
                  <span style={styles.noteTypeIcon}>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note Text Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Note:</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your office note here... (e.g., Team meeting at 2 PM, Project deadline, etc.)"
              style={styles.textarea}
              rows="4"
            />
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            {selectedNote && (
              <button onClick={handleDeleteNote} style={styles.deleteButton}>
                🗑️ Delete
              </button>
            )}
            <button onClick={handleSaveNote} style={styles.saveButton}>
              💾 Save Note
            </button>
            <button onClick={onClose} style={styles.cancelButton}>
              ✖ Cancel
            </button>
          </div>

          {/* Notes for this month */}
          {getNotesForMonth().length > 0 && (
            <div style={styles.notesList}>
              <h3 style={styles.notesListTitle}>📋 Notes for this month:</h3>
              {getNotesForMonth().map((note, index) => {
                const typeInfo = noteTypes.find(t => t.id === note.type);
                return (
                  <div 
                    key={index} 
                    style={{
                      ...styles.noteItem,
                      backgroundColor: typeInfo?.bgColor || '#f5f5f5',
                    }}
                    onClick={() => {
                      setSelectedDate(note.date);
                      setNoteType(note.type);
                      setNoteText(note.text);
                    }}
                  >
                    <span style={styles.noteItemDate}>
                      {new Date(note.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                    <span style={styles.noteItemIcon}>{typeInfo?.icon || '📝'}</span>
                    <span style={styles.noteItemText}>{note.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    ':hover': {
      color: '#333',
    },
  },
  modalBody: {
    padding: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px',
  },
  dateInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    ':focus': {
      borderColor: '#667eea',
    },
  },
  noteTypeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  noteTypeButton: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  noteTypeIcon: {
    fontSize: '18px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    ':focus': {
      borderColor: '#667eea',
    },
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#5a67d8',
    },
  },
  deleteButton: {
    padding: '12px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#d32f2f',
    },
  },
  cancelButton: {
    padding: '12px 20px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
    ':hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  notesList: {
    marginTop: '30px',
    borderTop: '1px solid #e0e0e0',
    paddingTop: '20px',
  },
  notesListTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
  },
  noteItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'translateX(5px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  noteItemDate: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    minWidth: '60px',
  },
  noteItemIcon: {
    fontSize: '16px',
  },
  noteItemText: {
    flex: 1,
    fontSize: '13px',
    color: '#333',
  },
};

export default OfficeNotes;