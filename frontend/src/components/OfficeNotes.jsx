import React, { useEffect, useMemo, useState } from 'react';

const NOTE_TYPES = [
  { id: 'meeting', label: 'Meeting', color: '#1976d2', bgColor: '#e3f2fd', icon: 'Meeting' },
  { id: 'deadline', label: 'Deadline', color: '#c62828', bgColor: '#ffebee', icon: 'Deadline' },
  { id: 'client', label: 'Client Call', color: '#2e7d32', bgColor: '#e8f5e9', icon: 'Client' },
  { id: 'report', label: 'Report', color: '#f57c00', bgColor: '#fff3e0', icon: 'Report' },
  { id: 'review', label: 'Review', color: '#9c27b0', bgColor: '#f3e5f5', icon: 'Review' }
];

const getTodayForYear = (selectedYear) => {
  const today = new Date();
  const currentYear = today.getFullYear();

  if (selectedYear === currentYear) {
    return today.toISOString().split('T')[0];
  }

  return `${selectedYear}-01-01`;
};

const OfficeNotes = ({ selectedYear, onClose, onNoteAdded }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayForYear(selectedYear));
  const [noteType, setNoteType] = useState('meeting');
  const [noteText, setNoteText] = useState('');
  const [existingNotes, setExistingNotes] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);

  const storageKey = `office_notes_${selectedYear}`;

  useEffect(() => {
    try {
      const savedNotes = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setExistingNotes(savedNotes);
    } catch {
      setExistingNotes({});
    }

    setSelectedDate(getTodayForYear(selectedYear));
    setSelectedNote(null);
    setNoteType('meeting');
    setNoteText('');
  }, [selectedYear, storageKey]);

  const notesForMonth = useMemo(() => {
    const month = selectedDate.substring(0, 7);
    return Object.entries(existingNotes)
      .filter(([date]) => date.startsWith(month))
      .map(([date, note]) => ({ date, ...note }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [existingNotes, selectedDate]);

  const resetEditor = () => {
    setSelectedNote(null);
    setSelectedDate(getTodayForYear(selectedYear));
    setNoteType('meeting');
    setNoteText('');
  };

  const closeModal = () => {
    resetEditor();
    if (onClose) {
      onClose();
    }
  };

  const loadNoteForDate = (dateValue) => {
    const note = existingNotes[dateValue];
    setSelectedDate(dateValue);

    if (note) {
      setSelectedNote(note);
      setNoteType(note.type || 'meeting');
      setNoteText(note.text || '');
      return;
    }

    setSelectedNote(null);
    setNoteType('meeting');
    setNoteText('');
  };

  const handleDateChange = (e) => {
    loadNoteForDate(e.target.value);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) {
      alert('Please enter a note');
      return;
    }

    const nextNotes = {
      ...existingNotes,
      [selectedDate]: {
        type: noteType,
        text: noteText.trim(),
        date: selectedDate,
        createdAt: selectedNote?.createdAt || new Date().toISOString()
      }
    };

    localStorage.setItem(storageKey, JSON.stringify(nextNotes));
    setExistingNotes(nextNotes);
    setSelectedNote(nextNotes[selectedDate]);

    if (onNoteAdded) {
      onNoteAdded();
    }
  };

  const handleDeleteNote = () => {
    if (!selectedNote) return;

    const nextNotes = { ...existingNotes };
    delete nextNotes[selectedDate];
    localStorage.setItem(storageKey, JSON.stringify(nextNotes));
    setExistingNotes(nextNotes);
    setSelectedNote(null);
    setNoteType('meeting');
    setNoteText('');

    if (onNoteAdded) {
      onNoteAdded();
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Office Notes</h2>
          <button type="button" onClick={closeModal} style={styles.closeButton}>
            x
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              style={styles.dateInput}
              min={`${selectedYear}-01-01`}
              max={`${selectedYear}-12-31`}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Note Type</label>
            <div style={styles.noteTypeGrid}>
              {NOTE_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setNoteType(type.id)}
                  style={{
                    ...styles.noteTypeButton,
                    backgroundColor: noteType === type.id ? type.bgColor : '#f5f5f5',
                    border: noteType === type.id ? `2px solid ${type.color}` : '1px solid #ddd',
                    color: type.color
                  }}
                >
                  <span style={styles.noteTypeIcon}>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Note</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your office note here..."
              style={styles.textarea}
              rows={4}
            />
          </div>

          <div style={styles.actionButtons}>
            {selectedNote ? (
              <button type="button" onClick={handleDeleteNote} style={styles.deleteButton}>
                Delete
              </button>
            ) : null}
            <button type="button" onClick={handleSaveNote} style={styles.saveButton}>
              Save Note
            </button>
            <button type="button" onClick={closeModal} style={styles.cancelButton}>
              Cancel
            </button>
          </div>

          {notesForMonth.length > 0 ? (
            <div style={styles.notesList}>
              <h3 style={styles.notesListTitle}>Notes for this month</h3>
              {notesForMonth.map((note) => {
                const typeInfo = NOTE_TYPES.find((type) => type.id === note.type);
                return (
                  <button
                    key={note.date}
                    type="button"
                    style={{
                      ...styles.noteItem,
                      backgroundColor: typeInfo?.bgColor || '#f5f5f5'
                    }}
                    onClick={() => loadNoteForDate(note.date)}
                  >
                    <span style={styles.noteItemDate}>
                      {new Date(note.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                    <span style={styles.noteItemIcon}>{typeInfo?.icon || 'Note'}</span>
                    <span style={styles.noteItemText}>{note.text}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
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
    padding: '16px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '500px',
    maxWidth: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666'
  },
  modalBody: {
    padding: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px'
  },
  dateInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  noteTypeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  noteTypeButton: {
    padding: '10px',
    borderRadius: '6px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px'
  },
  noteTypeIcon: {
    fontSize: '13px',
    fontWeight: '600'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
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
    fontWeight: '500'
  },
  deleteButton: {
    padding: '12px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  cancelButton: {
    padding: '12px 20px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  notesList: {
    marginTop: '30px',
    borderTop: '1px solid #e0e0e0',
    paddingTop: '20px'
  },
  notesListTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px'
  },
  noteItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '8px',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left'
  },
  noteItemDate: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    minWidth: '60px'
  },
  noteItemIcon: {
    fontSize: '12px',
    fontWeight: '600'
  },
  noteItemText: {
    flex: 1,
    fontSize: '13px',
    color: '#333'
  }
};

export default OfficeNotes;
