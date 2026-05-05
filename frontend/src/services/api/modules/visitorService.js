/**
 * Visitor Service Module
 * =======================
 * Handles all visitor management API operations including check-in/out,
 * visitor records, and security tracking.
 *
 * Usage:
 * ------
 * import visitorService from '@/services/api/modules/visitorService';
 *
 * // Check in visitor
 * await visitorService.checkInVisitor({
 *   name: 'John Doe',
 *   company: 'ABC Corp'
 * });
 *
 * // Get visitor history
 * const history = await visitorService.getVisitorHistory();
 *
 * // Check out visitor
 * await visitorService.checkOutVisitor(visitorId);
 */

import BaseService from '../baseService.js';
import notificationManager from '../../notificationManager.js';
import { CACHE_CONFIG } from '../baseService.js';

class VisitorService extends BaseService {
  constructor() {
    super('/visitors');
  }

  /**
   * Check in a visitor (create new visitor record)
   *
   * @param {Object} visitorData - Visitor information
   * @param {string} visitorData.name - Visitor full name
   * @param {string} visitorData.email - Visitor email address
   * @param {string} visitorData.phone - Visitor phone number
   * @param {string} visitorData.company - Visitor company/organization
   * @param {string} visitorData.purpose - Purpose of visit (MEETING, DELIVERY, INTERVIEW, etc.)
   * @param {number} visitorData.host_id - Employee ID of host/meeting person
   * @param {string} visitorData.id_type - Type of ID (PASSPORT, DRIVING_LICENSE, NATIONAL_ID, etc.)
   * @param {string} visitorData.id_number - ID number
   * @returns {Promise<Object>} Created visitor check-in record
   */
  async checkInVisitor(visitorData) {
    try {
      const data = await this.post('/check-in/', visitorData);

      // Invalidate visitor caches
      this._invalidateVisitorCaches();

      notificationManager.info(
        `Visitor ${visitorData.name} checked in`
      );

      return data;
    } catch (error) {
      notificationManager.error('Failed to check in visitor');
      throw error;
    }
  }

  /**
   * Check out a visitor
   *
   * @param {number} visitorId - Visitor ID
   * @returns {Promise<Object>} Updated visitor record with check-out time
   */
  async checkOutVisitor(visitorId) {
    try {
      const data = await this.post(`/${visitorId}/check-out/`, {});

      // Invalidate caches
      this._invalidateVisitorCaches();

      notificationManager.info('Visitor checked out');

      return data;
    } catch (error) {
      notificationManager.error('Failed to check out visitor');
      throw error;
    }
  }

  /**
   * Get all visitor records with optional filters
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date (YYYY-MM-DD)
   * @param {string} filters.endDate - End date (YYYY-MM-DD)
   * @param {string} filters.status - Filter by status (CHECKED_IN, CHECKED_OUT)
   * @param {string} filters.purpose - Filter by purpose of visit
   * @param {number} filters.hostId - Filter by host employee ID
   * @param {number} filters.page - Pagination page
   * @returns {Promise<Object>} Visitor records with pagination
   */
  async getVisitorRecords(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `visitors_${filterKey}`;

      const data = await this.get('/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.SHORT, // Real-time data
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load visitor records');
      throw error;
    }
  }

  /**
   * Get personal visitor history (visitors I hosted)
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @returns {Promise<Array>} My visitor history
   */
  async getMyVisitorHistory(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `my_visitors_${filterKey}`;

      const data = await this.get('/my-history/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.SHORT,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load visitor history');
      throw error;
    }
  }

  /**
   * Get currently checked-in visitors
   *
   * @returns {Promise<Array>} List of currently checked-in visitors
   */
  async getCurrentVisitors() {
    try {
      const data = await this.get('/current/', {
        cacheKey: 'visitors_current',
        cacheTTL: CACHE_CONFIG.SHORT, // Very short cache for real-time
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load current visitors');
      throw error;
    }
  }

  /**
   * Get specific visitor details
   *
   * @param {number} visitorId - Visitor ID
   * @returns {Promise<Object>} Detailed visitor information
   */
  async getVisitorDetail(visitorId) {
    try {
      const data = await this.get(`/${visitorId}/`, {
        cacheKey: `visitor_${visitorId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        notificationManager.warning('Visitor not found');
      } else {
        notificationManager.error('Failed to load visitor details');
      }
      throw error;
    }
  }

  /**
   * Get visitor summary for dashboard
   * Shows today's check-ins, currently present, etc.
   *
   * @returns {Promise<Object>} Daily summary
   */
  async getTodayVisitorSummary() {
    try {
      const data = await this.get('/today-summary/', {
        cacheKey: 'visitors_today_summary',
        cacheTTL: CACHE_CONFIG.SHORT,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load visitor summary');
      throw error;
    }
  }

  /**
   * Get visitor statistics (total, by purpose, etc.)
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @returns {Promise<Object>} Visitor statistics
   */
  async getVisitorStatistics(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `visitors_stats_${filterKey}`;

      const data = await this.get('/statistics/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load visitor statistics');
      throw error;
    }
  }

  /**
   * Update visitor information (Admin only)
   *
   * @param {number} visitorId - Visitor ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated visitor record
   */
  async updateVisitor(visitorId, updates) {
    try {
      const data = await this.put(`/${visitorId}/`, updates);

      // Invalidate caches
      this._invalidateVisitorCaches();

      notificationManager.info('Visitor information updated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to update visitor');
      throw error;
    }
  }

  /**
   * Delete visitor record (Admin only)
   *
   * @param {number} visitorId - Visitor ID
   * @returns {Promise<void>}
   */
  async deleteVisitor(visitorId) {
    try {
      await this.delete(`/${visitorId}/`);

      // Invalidate caches
      this._invalidateVisitorCaches();

      notificationManager.success('Visitor record deleted');
    } catch (error) {
      notificationManager.error('Failed to delete visitor');
      throw error;
    }
  }

  /**
   * Send visitor notification email to host
   *
   * @param {number} visitorId - Visitor ID
   * @returns {Promise<void>}
   */
  async sendHostNotification(visitorId) {
    try {
      await this.post(`/${visitorId}/send-notification/`, {});

      notificationManager.success('Notification sent to host');
    } catch (error) {
      notificationManager.error('Failed to send notification');
      throw error;
    }
  }

  /**
   * Export visitor records as CSV
   *
   * @param {Object} filters - Same filters as getVisitorRecords()
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportVisitorRecords(filters = {}) {
    try {
      const response = await this.get('/export/', {
        params: { ...this._buildFilterParams(filters), format: 'csv' },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      notificationManager.error('Failed to export visitor records');
      throw error;
    }
  }

  /**
   * Get visitor purposes (for dropdown menu)
   *
   * @returns {Promise<Array>} Available visit purposes
   */
  async getVisitPurposes() {
    try {
      const data = await this.get('/purposes/', {
        cacheKey: 'visitor_purposes',
        cacheTTL: CACHE_CONFIG.YEARLY, // Static data
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load visit purposes');
      throw error;
    }
  }

  /**
   * Get ID types (for dropdown menu)
   *
   * @returns {Promise<Array>} Available ID types
   */
  async getIdTypes() {
    try {
      const data = await this.get('/id-types/', {
        cacheKey: 'visitor_id_types',
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load ID types');
      throw error;
    }
  }

  /**
   * Search visitors by name or company
   *
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchVisitors(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const data = await this.get('/', {
        params: { search: query },
        cacheKey: `visitors_search_${query}`,
        cacheTTL: CACHE_CONFIG.SHORT,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Search failed');
      throw error;
    }
  }

  /**
   * Get visitor analytics (for reports/dashboard)
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @returns {Promise<Object>} Analytics data for charts
   */
  async getVisitorAnalytics(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `visitors_analytics_${filterKey}`;

      const data = await this.get('/analytics/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load visitor analytics');
      throw error;
    }
  }

  /**
   * Resend visitor badge/pass (for security check-in)
   *
   * @param {number} visitorId - Visitor ID
   * @returns {Promise<Object>} Badge/pass information
   */
  async resendVisitorPass(visitorId) {
    try {
      const data = await this.post(`/${visitorId}/resend-pass/`, {});

      notificationManager.success('Visitor pass resent');

      return data;
    } catch (error) {
      notificationManager.error('Failed to resend pass');
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Build filter parameters for API calls
   * @private
   */
  _buildFilterParams(filters) {
    const params = {};

    if (filters.startDate) {
      params.date_from = filters.startDate;
    }

    if (filters.endDate) {
      params.date_to = filters.endDate;
    }

    if (filters.status) {
      params.status = filters.status; // CHECKED_IN, CHECKED_OUT
    }

    if (filters.purpose) {
      params.purpose = filters.purpose;
    }

    if (filters.hostId) {
      params.host = filters.hostId;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.pageSize) {
      params.page_size = filters.pageSize;
    }

    return params;
  }

  /**
   * Build cache key from filters
   * @private
   */
  _buildFilterKey(filters) {
    const key = [];
    if (filters.startDate) key.push(`from_${filters.startDate}`);
    if (filters.endDate) key.push(`to_${filters.endDate}`);
    if (filters.status) key.push(`status_${filters.status}`);
    if (filters.purpose) key.push(`purpose_${filters.purpose}`);
    if (filters.hostId) key.push(`host_${filters.hostId}`);
    return key.join('_') || 'all';
  }

  /**
   * Invalidate all visitor-related caches
   * @private
   */
  _invalidateVisitorCaches() {
    this.cache.invalidatePattern('/visitors*');
    this.cache.invalidatePattern('visitors_*');
    this.cache.invalidatePattern('my_visitors_*');
    this.cache.invalidatePattern('visitor_*');

    // Invalidate dependent caches
    this.cache.invalidatePattern('/dashboard*');
    this.cache.invalidatePattern('/reports*');
  }
}

// Export singleton instance
export default new VisitorService();
