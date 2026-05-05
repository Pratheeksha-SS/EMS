/**
 * Holiday Service Module
 * =======================
 * Handles all holiday-related API operations with caching.
 * Used for displaying holidays on calendars and dashboards.
 *
 * Usage:
 * ------
 * import holidayService from '@/services/api/modules/holidayService';
 *
 * // Get all holidays for a year
 * const holidays = await holidayService.getHolidays(2024);
 *
 * // Get upcoming holidays
 * const upcoming = await holidayService.getUpcomingHolidays(5);
 *
 * // Get holidays for calendar view
 * const calendarData = await holidayService.getHolidaysForCalendar();
 */

import BaseService from '../baseService.js';
import notificationManager from '../../notificationManager.js';
import { CACHE_CONFIG } from '../baseService.js';

class HolidayService extends BaseService {
  constructor() {
    super('/holidays');
  }

  /**
   * Get all holidays for a specific year
   *
   * @param {number} year - Year (default: current year)
   * @returns {Promise<Array>} List of holidays
   */
  async getHolidays(year = new Date().getFullYear()) {
    try {
      const cacheKey = `holidays_${year}`;

      const data = await this.get('/', {
        params: { year },
        cacheKey,
        cacheTTL: CACHE_CONFIG.YEARLY, // Holidays are rarely updated
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load holidays');
      throw error;
    }
  }

  /**
   * Get upcoming holidays (next N days)
   *
   * @param {number} days - Number of days to look ahead (default: 30)
   * @returns {Promise<Array>} List of upcoming holidays
   */
  async getUpcomingHolidays(days = 30) {
    try {
      const cacheKey = `holidays_upcoming_${days}`;

      const data = await this.get('/upcoming/', {
        params: { days },
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM, // Re-check daily
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load upcoming holidays');
      throw error;
    }
  }

  /**
   * Get holidays for a date range (for calendar/report views)
   *
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Holidays in date range
   */
  async getHolidaysInRange(startDate, endDate) {
    try {
      const cacheKey = `holidays_${startDate}_${endDate}`;

      const data = await this.get('/', {
        params: { date_from: startDate, date_to: endDate },
        cacheKey,
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load holidays');
      throw error;
    }
  }

  /**
   * Get holidays for calendar view (organized by month/week)
   *
   * @param {number} year - Year
   * @param {number} month - Month (1-12), optional for full year
   * @returns {Promise<Object>} Holidays organized for calendar rendering
   */
  async getHolidaysForCalendar(year = null, month = null) {
    try {
      year = year || new Date().getFullYear();
      const suffix = month ? `_${month}` : '';
      const cacheKey = `holidays_calendar_${year}${suffix}`;

      const data = await this.get('/calendar/', {
        params: month ? { year, month } : { year },
        cacheKey,
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load calendar holidays');
      throw error;
    }
  }

  /**
   * Get specific holiday details
   *
   * @param {number} holidayId - Holiday ID
   * @returns {Promise<Object>} Holiday object with details
   */
  async getHolidayDetail(holidayId) {
    try {
      const data = await this.get(`/${holidayId}/`, {
        cacheKey: `holiday_${holidayId}`,
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        notificationManager.warning('Holiday not found');
      } else {
        notificationManager.error('Failed to load holiday details');
      }
      throw error;
    }
  }

  /**
   * Check if a specific date is a holiday
   *
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object|null>} Holiday object if date is a holiday, null otherwise
   */
  async isHoliday(date) {
    try {
      const data = await this.get('/check/', {
        params: { date },
        cacheKey: `holiday_check_${date}`,
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Not a holiday
      }
      throw error;
    }
  }

  /**
   * Get holiday categories (types of holidays)
   *
   * @returns {Promise<Array>} Holiday categories
   */
  async getHolidayCategories() {
    try {
      const data = await this.get('/categories/', {
        cacheKey: 'holiday_categories',
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load holiday categories');
      throw error;
    }
  }

  /**
   * Get holiday count for a year
   *
   * @param {number} year - Year
   * @returns {Promise<number>} Number of holidays
   */
  async getHolidayCount(year = new Date().getFullYear()) {
    try {
      const data = await this.get('/count/', {
        params: { year },
        cacheKey: `holiday_count_${year}`,
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create new holiday (Admin only)
   *
   * @param {Object} holidayData - Holiday details
   * @param {string} holidayData.name - Holiday name
   * @param {string} holidayData.date - Holiday date (YYYY-MM-DD)
   * @param {string} holidayData.category - Holiday category
   * @param {string} holidayData.description - Holiday description
   * @returns {Promise<Object>} Created holiday object
   */
  async createHoliday(holidayData) {
    try {
      const data = await this.post('/', holidayData);

      // Invalidate holiday caches
      this._invalidateHolidayCaches();

      notificationManager.success(`Holiday "${holidayData.name}" created`);

      return data;
    } catch (error) {
      notificationManager.error('Failed to create holiday');
      throw error;
    }
  }

  /**
   * Update holiday (Admin only)
   *
   * @param {number} holidayId - Holiday ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated holiday object
   */
  async updateHoliday(holidayId, updates) {
    try {
      const data = await this.put(`/${holidayId}/`, updates);

      // Invalidate caches
      this._invalidateHolidayCaches();

      notificationManager.success('Holiday updated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to update holiday');
      throw error;
    }
  }

  /**
   * Delete holiday (Admin only)
   *
   * @param {number} holidayId - Holiday ID
   * @returns {Promise<void>}
   */
  async deleteHoliday(holidayId) {
    try {
      await this.delete(`/${holidayId}/`);

      // Invalidate caches
      this._invalidateHolidayCaches();

      notificationManager.success('Holiday deleted');
    } catch (error) {
      notificationManager.error('Failed to delete holiday');
      throw error;
    }
  }

  /**
   * Export holidays as CSV
   *
   * @param {number} year - Year to export
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportHolidays(year = new Date().getFullYear()) {
    try {
      const response = await this.get('/export/', {
        params: { year, format: 'csv' },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      notificationManager.error('Failed to export holidays');
      throw error;
    }
  }

  /**
   * Get holidays for employee (considering leave balances)
   * Used in leave request workflow
   *
   * @returns {Promise<Array>} List of holidays for current year
   */
  async getHolidaysForLeaveRequest() {
    try {
      const data = await this.get('/for-leave-request/', {
        cacheKey: 'holidays_for_leave_request',
        cacheTTL: CACHE_CONFIG.YEARLY,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load holidays');
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Invalidate all holiday-related caches
   * @private
   */
  _invalidateHolidayCaches() {
    this.cache.invalidatePattern('/holidays*');
    this.cache.invalidatePattern('holidays_*');
    this.cache.invalidatePattern('holiday_*');

    // Invalidate dependent caches
    this.cache.invalidatePattern('/dashboard*');
    this.cache.invalidatePattern('/calendar*');
    this.cache.invalidatePattern('/leaves*');
  }
}

// Export singleton instance
export default new HolidayService();
