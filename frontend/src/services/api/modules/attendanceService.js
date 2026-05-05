/**
 * Attendance Service Module
 * ==========================
 * Handles all attendance-related API operations with caching,
 * attendance marking, reports, and statistics.
 *
 * Usage:
 * ------
 * import attendanceService from '@/services/api/modules/attendanceService';
 *
 * // Mark attendance for today
 * await attendanceService.markAttendance('PRESENT');
 *
 * // Get attendance history
 * const history = await attendanceService.getAttendanceHistory({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 *
 * // Get team attendance (managers only)
 * const teamAttendance = await attendanceService.getTeamAttendance();
 */

import BaseService from '../baseService.js';
import notificationManager from '../../notificationManager.js';
import { CACHE_CONFIG } from '../baseService.js';

class AttendanceService extends BaseService {
  constructor() {
    super('/attendance');
  }

  /**
   * Mark attendance for current employee
   * Can only be called by the employee themselves
   *
   * @param {string} status - Attendance status (PRESENT, ABSENT, LATE, ON_LEAVE)
   * @param {Object} options - Additional options
   * @param {string} options.date - Override date (default: today) - Admin only
   * @param {string} options.notes - Additional notes
   * @returns {Promise<Object>} Created/updated attendance record
   */
  async markAttendance(status, options = {}) {
    try {
      const data = await this.post('/mark/', {
        status,
        date: options.date,
        notes: options.notes,
      });

      // Invalidate attendance caches (no notification, silent operation)
      this._invalidateAttendanceCaches();

      return data;
    } catch (error) {
      if (error.response?.status === 409) {
        notificationManager.warning('Attendance already marked for this date');
      } else {
        notificationManager.error('Failed to mark attendance');
      }
      throw error;
    }
  }

  /**
   * Get personal attendance history with optional filters
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date (YYYY-MM-DD)
   * @param {string} filters.endDate - End date (YYYY-MM-DD)
   * @param {string} filters.status - Filter by status (PRESENT, ABSENT, LATE, etc.)
   * @param {number} filters.page - Pagination page
   * @returns {Promise<Object>} Attendance records with pagination
   */
  async getAttendanceHistory(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `attendance_history_${filterKey}`;

      const data = await this.get('/my-history/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load attendance history');
      throw error;
    }
  }

  /**
   * Get today's attendance record
   *
   * @returns {Promise<Object|null>} Today's attendance or null if not marked
   */
  async getTodayAttendance() {
    try {
      const data = await this.get('/today/', {
        cacheKey: 'attendance_today',
        cacheTTL: CACHE_CONFIG.SHORT, // Short cache for real-time updates
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Not marked yet
      }
      notificationManager.error('Failed to load today attendance');
      throw error;
    }
  }

  /**
   * Get team attendance for a date (Manager only)
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.date - Date to query (default: today)
   * @param {number} filters.departmentId - Filter by department
   * @param {string} filters.status - Filter by status
   * @returns {Promise<Array>} Team attendance records
   */
  async getTeamAttendance(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `team_attendance_${filterKey}`;

      const data = await this.get('/team/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.SHORT, // Real-time for team view
      });

      return data.results || data;
    } catch (error) {
      if (error.response?.status === 403) {
        notificationManager.warning('Only managers can view team attendance');
      } else {
        notificationManager.error('Failed to load team attendance');
      }
      throw error;
    }
  }

  /**
   * Get attendance summary for a period
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date (YYYY-MM-DD)
   * @param {string} filters.endDate - End date (YYYY-MM-DD)
   * @param {number} filters.employeeId - Employee ID (Admin only)
   * @returns {Promise<Object>} Attendance statistics and summary
   */
  async getAttendanceSummary(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `attendance_summary_${filterKey}`;

      const data = await this.get('/summary/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load attendance summary');
      throw error;
    }
  }

  /**
   * Get department attendance report
   *
   * @param {Object} filters - Filter options
   * @param {number} filters.departmentId - Department ID
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @returns {Promise<Array>} Department attendance breakdown
   */
  async getDepartmentAttendanceReport(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `dept_attendance_report_${filterKey}`;

      const data = await this.get('/department-report/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load department attendance report');
      throw error;
    }
  }

  /**
   * Get monthly attendance statistics
   *
   * @param {string} month - Month in YYYY-MM format
   * @returns {Promise<Object>} Monthly statistics with charts data
   */
  async getMonthlyStatistics(month) {
    try {
      const cacheKey = `attendance_monthly_${month}`;

      const data = await this.get('/monthly-stats/', {
        params: { month },
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load monthly statistics');
      throw error;
    }
  }

  /**
   * Get daily attendance breakdown (used for dashboard)
   *
   * @param {string} date - Date in YYYY-MM-DD format (default: today)
   * @returns {Promise<Object>} Daily attendance statistics
   */
  async getDailyAttendanceBreakdown(date = null) {
    try {
      const cacheKey = `attendance_daily_${date || 'today'}`;

      const data = await this.get('/daily-breakdown/', {
        params: date ? { date } : {},
        cacheKey,
        cacheTTL: CACHE_CONFIG.SHORT, // Real-time
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load daily attendance');
      throw error;
    }
  }

  /**
   * Update attendance record (Admin/Manager only)
   *
   * @param {number} attendanceId - Attendance record ID
   * @param {Object} updates - Fields to update
   * @param {string} updates.status - New status
   * @param {string} updates.notes - Updated notes
   * @returns {Promise<Object>} Updated record
   */
  async updateAttendance(attendanceId, updates) {
    try {
      const data = await this.put(`/${attendanceId}/`, updates);

      // Invalidate caches
      this._invalidateAttendanceCaches();

      notificationManager.info('Attendance updated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to update attendance');
      throw error;
    }
  }

  /**
   * Bulk update team attendance (Manager only)
   * Useful for marking entire department as present/absent on specific date
   *
   * @param {Object} data - Bulk update data
   * @param {number} data.departmentId - Department ID
   * @param {string} data.status - Status to apply to all
   * @param {string} data.date - Date to update
   * @returns {Promise<Object>} Number of records updated
   */
  async bulkUpdateAttendance(data) {
    try {
      const response = await this.post('/bulk-update/', data);

      // Invalidate all attendance caches
      this._invalidateAttendanceCaches();

      notificationManager.success(
        `Updated attendance for ${response.count || 0} employees`
      );

      return response;
    } catch (error) {
      notificationManager.error('Failed to bulk update attendance');
      throw error;
    }
  }

  /**
   * Export attendance report as CSV
   *
   * @param {Object} filters - Same filters as getAttendanceHistory()
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportAttendanceReport(filters = {}) {
    try {
      const response = await this.get('/export/', {
        params: { ...this._buildFilterParams(filters), format: 'csv' },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      notificationManager.error('Failed to export attendance report');
      throw error;
    }
  }

  /**
   * Get attendance trends (for analytics)
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @param {number} filters.employeeId - Employee ID
   * @returns {Promise<Object>} Trend data for charts
   */
  async getAttendanceTrends(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `attendance_trends_${filterKey}`;

      const data = await this.get('/trends/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load attendance trends');
      throw error;
    }
  }

  /**
   * Get late arrivals report
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @returns {Promise<Array>} Late arrival records
   */
  async getLateArrivalsReport(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `late_arrivals_${filterKey}`;

      const data = await this.get('/late-arrivals/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load late arrivals report');
      throw error;
    }
  }

  /**
   * Get absentee report
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date
   * @param {string} filters.endDate - End date
   * @param {number} filters.departmentId - Department ID
   * @returns {Promise<Array>} Absentee records
   */
  async getAbsenteeReport(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `absentee_report_${filterKey}`;

      const data = await this.get('/absentees/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load absentee report');
      throw error;
    }
  }

  /**
   * Refresh all attendance caches (force cache clear)
   * Useful after bulk updates
   *
   * @returns {Promise<void>}
   */
  async refreshAttendanceData() {
    try {
      this._invalidateAttendanceCaches();
      notificationManager.info('Attendance data refreshed');
    } catch (error) {
      notificationManager.error('Failed to refresh attendance data');
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

    if (filters.date) {
      params.date = filters.date;
    }

    if (filters.status) {
      params.status = filters.status; // PRESENT, ABSENT, LATE, ON_LEAVE
    }

    if (filters.departmentId) {
      params.department = filters.departmentId;
    }

    if (filters.employeeId) {
      params.employee = filters.employeeId;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.pageSize) {
      params.page_size = filters.pageSize;
    }

    if (filters.month) {
      params.month = filters.month;
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
    if (filters.date) key.push(`date_${filters.date}`);
    if (filters.status) key.push(`status_${filters.status}`);
    if (filters.departmentId) key.push(`dept_${filters.departmentId}`);
    if (filters.employeeId) key.push(`emp_${filters.employeeId}`);
    if (filters.month) key.push(`month_${filters.month}`);
    return key.join('_') || 'all';
  }

  /**
   * Invalidate all attendance-related caches
   * @private
   */
  _invalidateAttendanceCaches() {
    // Invalidate attendance caches
    this.cache.invalidatePattern('/attendance*');
    this.cache.invalidatePattern('attendance_*');
    this.cache.invalidatePattern('team_attendance*');
    this.cache.invalidatePattern('dept_attendance*');
    this.cache.invalidatePattern('late_arrivals*');
    this.cache.invalidatePattern('absentee_report*');

    // Invalidate dependent caches
    this.cache.invalidatePattern('/reports*');
    this.cache.invalidatePattern('/dashboard*');
  }
}

// Export singleton instance
export default new AttendanceService();
