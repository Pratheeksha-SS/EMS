/**
 * Centralized Notification Manager
 * 
 * Manages all system notifications with:
 * - Single notification per action (no spam)
 * - Deduplication of simultaneous notifications
 * - Intelligent batching
 * - Role-based notification rules
 * 
 * Usage:
 *   import { notificationManager } from '@/services/notificationManager';
 *   
 *   notificationManager.success('Leave approved successfully');
 *   notificationManager.error('Failed to update profile');
 *   notificationManager.notify({ type: 'leave_approved', title: '...' });
 */

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  // Leave events
  LEAVE_APPLIED: 'leave_applied',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  LEAVE_CANCELLED: 'leave_cancelled',
  
  // Announcement events
  ANNOUNCEMENT_POSTED: 'announcement_posted',
  ANNOUNCEMENT_UPDATED: 'announcement_updated',
  
  // Employee events
  EMPLOYEE_CREATED: 'employee_created',
  EMPLOYEE_UPDATED: 'employee_updated',
  EMPLOYEE_PROMOTED: 'employee_promoted',
  
  // System events
  SYNC_ERROR: 'sync_error',
  DATA_UPDATED: 'data_updated',
  
  // Generic
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Notification rules per role
 */
const ROLE_BASED_RULES = {
  ADMIN: {
    receive: [
      NOTIFICATION_TYPES.LEAVE_APPLIED,
      NOTIFICATION_TYPES.LEAVE_APPROVED,
      NOTIFICATION_TYPES.LEAVE_REJECTED,
      NOTIFICATION_TYPES.ANNOUNCEMENT_POSTED,
      NOTIFICATION_TYPES.EMPLOYEE_CREATED,
      NOTIFICATION_TYPES.EMPLOYEE_PROMOTED,
    ],
    mute: [],
  },
  MANAGER: {
    receive: [
      NOTIFICATION_TYPES.LEAVE_APPLIED,
      NOTIFICATION_TYPES.LEAVE_APPROVED,
      NOTIFICATION_TYPES.ANNOUNCEMENT_POSTED,
    ],
    mute: [
      NOTIFICATION_TYPES.EMPLOYEE_CREATED,
      NOTIFICATION_TYPES.EMPLOYEE_PROMOTED,
    ],
  },
  EMPLOYEE: {
    receive: [
      NOTIFICATION_TYPES.LEAVE_APPROVED,
      NOTIFICATION_TYPES.LEAVE_REJECTED,
      NOTIFICATION_TYPES.ANNOUNCEMENT_POSTED,
    ],
    mute: [
      NOTIFICATION_TYPES.LEAVE_APPLIED,
      NOTIFICATION_TYPES.EMPLOYEE_CREATED,
    ],
  },
};

/**
 * Notification details configuration
 */
const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.LEAVE_APPLIED]: {
    title: 'Leave Request Submitted',
    color: 'info',
    icon: '📋',
    duration: 5000,
    action: null,
  },
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: {
    title: 'Leave Approved ✓',
    color: 'success',
    icon: '✅',
    duration: 6000,
    action: { label: 'View', path: '/leaves' },
  },
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: {
    title: 'Leave Request Rejected',
    color: 'error',
    icon: '❌',
    duration: 6000,
    action: { label: 'View', path: '/leaves' },
  },
  [NOTIFICATION_TYPES.ANNOUNCEMENT_POSTED]: {
    title: 'New Announcement',
    color: 'info',
    icon: '📢',
    duration: 5000,
    action: { label: 'Read', path: '/announcements' },
  },
  [NOTIFICATION_TYPES.EMPLOYEE_CREATED]: {
    title: 'New Employee Added',
    color: 'info',
    icon: '👤',
    duration: 5000,
    action: null,
  },
  [NOTIFICATION_TYPES.SYNC_ERROR]: {
    title: 'Sync Error',
    color: 'error',
    icon: '⚠️',
    duration: 7000,
    action: { label: 'Retry', callback: 'retry' },
  },
  [NOTIFICATION_TYPES.DATA_UPDATED]: {
    title: 'Data Updated',
    color: 'success',
    icon: '🔄',
    duration: 3000,
    action: null,
  },
};

/**
 * Main notification manager
 */
class NotificationManager {
  constructor() {
    this.queue = [];
    this.active = [];
    this.listeners = [];
    this.userRole = localStorage.getItem('user_role') || 'EMPLOYEE';
    this.maxActive = 3;
    this.deduplicateTime = 3000; // 3 seconds
    this.lastNotifications = new Map();
  }

  /**
   * Check if notification should be shown based on role
   */
  shouldShowNotification(type) {
    const rules = ROLE_BASED_RULES[this.userRole] || ROLE_BASED_RULES.EMPLOYEE;
    
    // Check if notification is in muted list
    if (rules.mute.includes(type)) return false;
    
    // Check if notification is in receive list
    if (rules.receive.includes(type)) return true;
    
    // Allow generic notifications (success, error, etc.)
    return Object.values(NOTIFICATION_TYPES).slice(-4).includes(type);
  }

  /**
   * Check if notification is duplicate
   */
  isDuplicate(type, message) {
    const key = `${type}:${message}`;
    const lastTime = this.lastNotifications.get(key);
    
    if (lastTime && Date.now() - lastTime < this.deduplicateTime) {
      return true;
    }
    
    this.lastNotifications.set(key, Date.now());
    return false;
  }

  /**
   * Core notification method
   */
  notify(options) {
    const {
      type = NOTIFICATION_TYPES.INFO,
      title = 'Notification',
      message = '',
      color = 'info',
      icon = 'ℹ️',
      duration = 5000,
      action = null,
    } = options;

    // Check role-based rules
    if (!this.shouldShowNotification(type)) {
      console.log(`[Notification] Muted for role ${this.userRole}: ${type}`);
      return;
    }

    // Check for duplicates
    if (this.isDuplicate(type, message)) {
      console.log(`[Notification] Duplicate suppressed: ${type}`);
      return;
    }

    // Create notification object
    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      color,
      icon,
      duration,
      action,
      timestamp: Date.now(),
    };

    console.log(`[Notification] ${title}${message ? ': ' + message : ''}`);

    // Add to queue
    this.queue.push(notification);
    this.processQueue();

    // Notify listeners
    this.notifyListeners(notification);
  }

  /**
   * Process notification queue
   */
  processQueue() {
    while (this.queue.length > 0 && this.active.length < this.maxActive) {
      const notification = this.queue.shift();
      this.active.push(notification);

      // Auto-remove after duration
      if (notification.duration) {
        setTimeout(() => this.remove(notification.id), notification.duration);
      }

      // Emit show event
      this.emit('show', notification);
    }
  }

  /**
   * Remove notification from active
   */
  remove(id) {
    const index = this.active.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.active.splice(index, 1)[0];
      this.emit('hide', notification);
      this.processQueue(); // Process next in queue
    }
  }

  /**
   * Convenience methods
   */
  success(message, action = null) {
    this.notify({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: 'Success',
      message,
      color: 'success',
      icon: '✓',
      duration: 4000,
      action,
    });
  }

  error(message, action = null) {
    this.notify({
      type: NOTIFICATION_TYPES.ERROR,
      title: 'Error',
      message,
      color: 'error',
      icon: '✕',
      duration: 6000,
      action,
    });
  }

  warning(message, action = null) {
    this.notify({
      type: NOTIFICATION_TYPES.WARNING,
      title: 'Warning',
      message,
      color: 'warning',
      icon: '!',
      duration: 5000,
      action,
    });
  }

  info(message, action = null) {
    this.notify({
      type: NOTIFICATION_TYPES.INFO,
      title: 'Info',
      message,
      color: 'info',
      icon: 'ℹ',
      duration: 4000,
      action,
    });
  }

  /**
   * Event listeners
   */
  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  off(event, callback) {
    this.listeners = this.listeners.filter(
      l => !(l.event === event && l.callback === callback)
    );
  }

  notifyListeners(notification) {
    this.listeners.forEach(listener => {
      if (listener.event === 'notify' || listener.event === notification.type) {
        listener.callback(notification);
      }
    });
  }

  emit(event, data) {
    this.listeners.forEach(listener => {
      if (listener.event === event) {
        listener.callback(data);
      }
    });
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.active = [];
    this.queue = [];
    this.emit('clear', null);
  }

  /**
   * Get active notifications
   */
  getActive() {
    return [...this.active];
  }

  /**
   * Update user role
   */
  setUserRole(role) {
    this.userRole = role;
    console.log(`[Notification] Role changed to ${role}`);
  }

  /**
   * Debug statistics
   */
  getStats() {
    return {
      active: this.active.length,
      queued: this.queue.length,
      userRole: this.userRole,
      deduplicated: this.lastNotifications.size,
    };
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager();

// Export for convenience
export default notificationManager;
