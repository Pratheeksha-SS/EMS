/**
 * Announcement Service Module
 * ============================
 * Handles all announcement-related API operations with caching,
 * including creation, updates, and notifications.
 *
 * Usage:
 * ------
 * import announcementService from '@/services/api/modules/announcementService';
 *
 * // Get all announcements
 * const announcements = await announcementService.getAnnouncements();
 *
 * // Create new announcement (Admin/Manager only)
 * await announcementService.createAnnouncement({
 *   title: 'Holiday Notice',
 *   content: 'Office closed tomorrow'
 * });
 *
 * // Get specific announcement
 * const announcement = await announcementService.getAnnouncementDetail(id);
 */

import BaseService from '../baseService.js';
import notificationManager from '../../notificationManager.js';
import { NOTIFICATION_TYPES } from '../../notificationManager.js';
import { CACHE_CONFIG } from '../baseService.js';

class AnnouncementService extends BaseService {
  constructor() {
    super('/announcements');
  }

  /**
   * Get list of announcements with optional filters
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.status - Filter by status (DRAFT, PUBLISHED, ARCHIVED)
   * @param {string} filters.departmentId - Filter by department
   * @param {string} filters.search - Search by title or content
   * @param {number} filters.page - Pagination page
   * @returns {Promise<Object>} Announcements list with pagination
   */
  async getAnnouncements(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `announcements_${filterKey}`;

      const data = await this.get('/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load announcements');
      throw error;
    }
  }

  /**
   * Get announcements visible to current user
   * Takes into account user role and department
   *
   * @returns {Promise<Array>} List of visible announcements
   */
  async getVisibleAnnouncements() {
    try {
      const data = await this.get('/visible/', {
        cacheKey: 'announcements_visible',
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load announcements');
      throw error;
    }
  }

  /**
   * Get recent announcements (for dashboard)
   *
   * @param {number} limit - Number of announcements to fetch (default: 5)
   * @returns {Promise<Array>} Recent announcements
   */
  async getRecentAnnouncements(limit = 5) {
    try {
      const data = await this.get('/', {
        params: { limit },
        cacheKey: `announcements_recent_${limit}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results?.slice(0, limit) || data.slice(0, limit);
    } catch (error) {
      notificationManager.error('Failed to load recent announcements');
      throw error;
    }
  }

  /**
   * Get specific announcement details
   *
   * @param {number} announcementId - Announcement ID
   * @returns {Promise<Object>} Announcement object with comments count
   */
  async getAnnouncementDetail(announcementId) {
    try {
      const data = await this.get(`/${announcementId}/`, {
        cacheKey: `announcement_${announcementId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        notificationManager.warning('Announcement not found');
      } else {
        notificationManager.error('Failed to load announcement');
      }
      throw error;
    }
  }

  /**
   * Create new announcement (Admin/Manager only)
   *
   * @param {Object} announcementData - Announcement details
   * @param {string} announcementData.title - Announcement title
   * @param {string} announcementData.content - Announcement content/body
   * @param {string} announcementData.type - Type (GENERAL, URGENT, INFO, REMINDER)
   * @param {number} announcementData.departmentId - Department ID (null for company-wide)
   * @param {string} announcementData.publishDate - Publication date (optional)
   * @param {string} announcementData.status - Status (DRAFT, PUBLISHED)
   * @returns {Promise<Object>} Created announcement object
   */
  async createAnnouncement(announcementData) {
    try {
      const data = await this.post('/', announcementData);

      // Invalidate announcements cache
      this._invalidateAnnouncementCaches();

      notificationManager.notify({
        type: NOTIFICATION_TYPES.ANNOUNCEMENT_POSTED,
        message: `New announcement: "${announcementData.title}"`,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to create announcement');
      throw error;
    }
  }

  /**
   * Update announcement (Admin/Manager only)
   *
   * @param {number} announcementId - Announcement ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated announcement object
   */
  async updateAnnouncement(announcementId, updates) {
    try {
      const data = await this.put(`/${announcementId}/`, updates);

      // Invalidate caches
      this._invalidateAnnouncementCaches(announcementId);

      notificationManager.notify({
        type: NOTIFICATION_TYPES.ANNOUNCEMENT_UPDATED,
        message: 'Announcement updated',
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to update announcement');
      throw error;
    }
  }

  /**
   * Publish an announcement (make it visible to users)
   *
   * @param {number} announcementId - Announcement ID
   * @param {Object} options - Publication options
   * @param {boolean} options.sendNotification - Whether to send notification to users
   * @param {Date} options.publishDate - When to publish (null = immediately)
   * @returns {Promise<Object>} Updated announcement object
   */
  async publishAnnouncement(announcementId, options = {}) {
    try {
      const data = await this.patch(`/${announcementId}/publish/`, {
        send_notification: options.sendNotification !== false,
        publish_date: options.publishDate,
      });

      // Invalidate caches
      this._invalidateAnnouncementCaches(announcementId);

      notificationManager.success('Announcement published');

      return data;
    } catch (error) {
      notificationManager.error('Failed to publish announcement');
      throw error;
    }
  }

  /**
   * Unpublish an announcement (make it invisible)
   *
   * @param {number} announcementId - Announcement ID
   * @returns {Promise<Object>} Updated announcement object
   */
  async unpublishAnnouncement(announcementId) {
    try {
      const data = await this.patch(`/${announcementId}/unpublish/`, {});

      // Invalidate caches
      this._invalidateAnnouncementCaches(announcementId);

      notificationManager.info('Announcement unpublished');

      return data;
    } catch (error) {
      notificationManager.error('Failed to unpublish announcement');
      throw error;
    }
  }

  /**
   * Archive announcement (remove from active list)
   *
   * @param {number} announcementId - Announcement ID
   * @returns {Promise<Object>} Updated announcement object
   */
  async archiveAnnouncement(announcementId) {
    try {
      const data = await this.patch(`/${announcementId}/archive/`, {});

      // Invalidate caches
      this._invalidateAnnouncementCaches(announcementId);

      notificationManager.info('Announcement archived');

      return data;
    } catch (error) {
      notificationManager.error('Failed to archive announcement');
      throw error;
    }
  }

  /**
   * Delete announcement (permanent, admin only)
   *
   * @param {number} announcementId - Announcement ID
   * @returns {Promise<void>}
   */
  async deleteAnnouncement(announcementId) {
    try {
      await this.delete(`/${announcementId}/`);

      // Invalidate caches
      this._invalidateAnnouncementCaches();

      notificationManager.success('Announcement deleted');
    } catch (error) {
      notificationManager.error('Failed to delete announcement');
      throw error;
    }
  }

  /**
   * Mark announcement as read by current user
   *
   * @param {number} announcementId - Announcement ID
   * @returns {Promise<void>}
   */
  async markAnnouncementAsRead(announcementId) {
    try {
      await this.post(`/${announcementId}/mark-read/`, {});

      // Invalidate recent cache
      this.cache.invalidatePattern('announcements_*');
    } catch (error) {
      // Silent error - this is non-critical operation
      console.warn('Failed to mark announcement as read:', error);
    }
  }

  /**
   * Get announcement read statistics
   *
   * @param {number} announcementId - Announcement ID
   * @returns {Promise<Object>} Read statistics (total, read, unread)
   */
  async getAnnouncementReadStats(announcementId) {
    try {
      const data = await this.get(`/${announcementId}/read-stats/`, {
        cacheKey: `announcement_stats_${announcementId}`,
        cacheTTL: CACHE_CONFIG.SHORT,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load announcement statistics');
      throw error;
    }
  }

  /**
   * Get announcements by type
   *
   * @param {string} type - Announcement type (GENERAL, URGENT, INFO, REMINDER)
   * @returns {Promise<Array>} Announcements of specified type
   */
  async getAnnouncementsByType(type) {
    try {
      const data = await this.get('/', {
        params: { type },
        cacheKey: `announcements_type_${type}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load announcements');
      throw error;
    }
  }

  /**
   * Search announcements
   *
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchAnnouncements(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const data = await this.get('/', {
        params: { search: query },
        cacheKey: `announcements_search_${query}`,
        cacheTTL: CACHE_CONFIG.SHORT,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Search failed');
      throw error;
    }
  }

  /**
   * Export announcements as CSV
   *
   * @param {Object} filters - Same filters as getAnnouncements()
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportAnnouncements(filters = {}) {
    try {
      const response = await this.get('/export/', {
        params: { ...this._buildFilterParams(filters), format: 'csv' },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      notificationManager.error('Failed to export announcements');
      throw error;
    }
  }

  /**
   * Get announcement categories/types for dropdown
   *
   * @returns {Promise<Array>} Available announcement types
   */
  async getAnnouncementTypes() {
    try {
      const data = await this.get('/types/', {
        cacheKey: 'announcement_types',
        cacheTTL: CACHE_CONFIG.LONG, // Static data
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load announcement types');
      throw error;
    }
  }

  /**
   * Get unread announcements count for current user
   *
   * @returns {Promise<number>} Count of unread announcements
   */
  async getUnreadCount() {
    try {
      const data = await this.get('/unread-count/', {
        cacheKey: 'announcements_unread_count',
        cacheTTL: CACHE_CONFIG.SHORT, // Short cache for real-time updates
      });

      return data.count || 0;
    } catch (error) {
      return 0; // Return 0 on error
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Build filter parameters for API calls
   * @private
   */
  _buildFilterParams(filters) {
    const params = {};

    if (filters.status) {
      params.status = filters.status; // DRAFT, PUBLISHED, ARCHIVED
    }

    if (filters.departmentId) {
      params.department = filters.departmentId;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.pageSize) {
      params.page_size = filters.pageSize;
    }

    if (filters.type) {
      params.type = filters.type; // GENERAL, URGENT, INFO, REMINDER
    }

    return params;
  }

  /**
   * Build cache key from filters
   * @private
   */
  _buildFilterKey(filters) {
    const key = [];
    if (filters.status) key.push(`status_${filters.status}`);
    if (filters.departmentId) key.push(`dept_${filters.departmentId}`);
    if (filters.search) key.push(`search_${filters.search}`);
    if (filters.page) key.push(`page_${filters.page}`);
    if (filters.type) key.push(`type_${filters.type}`);
    return key.join('_') || 'all';
  }

  /**
   * Invalidate all announcement-related caches
   * @private
   */
  _invalidateAnnouncementCaches(announcementId = null) {
    // Invalidate specific announcement cache
    if (announcementId) {
      this.cache.invalidatePattern(`announcement_${announcementId}*`);
      this.cache.invalidatePattern(`announcement_stats_${announcementId}*`);
    }

    // Invalidate global announcement caches
    this.cache.invalidatePattern('/announcements*');
    this.cache.invalidatePattern('announcements_*');
    this.cache.invalidatePattern('announcements_search_*');
    this.cache.invalidatePattern('announcements_unread_count*');

    // Invalidate dependent caches
    this.cache.invalidatePattern('/dashboard*');
  }
}

// Export singleton instance
export default new AnnouncementService();
