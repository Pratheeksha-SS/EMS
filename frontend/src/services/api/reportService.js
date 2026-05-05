/**
 * HR Reports Service
 * 
 * Unified API service for all report operations with:
 * - Consistent report querying
 * - Automatic caching
 * - Role-based data filtering
 * - Synchronized with module changes
 * 
 * Usage:
 *   import { reportService } from '@/services/api/reportService';
 *   
 *   const leaveReport = await reportService.getLeaveReport({
 *     departmentId: 1,
 *     dateRange: ['2024-01-01', '2024-12-31'],
 *     status: 'APPROVED'
 *   });
 */

import BaseService, { CACHE_CONFIG } from '../baseService';
import { notificationManager } from '../notificationManager';

class ReportService extends BaseService {
  constructor() {
    super('/reports', CACHE_CONFIG.MEDIUM);
  }

  /**
   * Get leave report with filtering
   */
  async getLeaveReport(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 100,
        offset: params.offset || 0,
        ...this._buildFilterParams(params),
      };

      return await this.get('/leaves/', queryParams, {
        useCache: true,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to load leave report');
      throw error;
    }
  }

  /**
   * Get attendance report with filtering
   */
  async getAttendanceReport(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 100,
        offset: params.offset || 0,
        ...this._buildFilterParams(params),
      };

      return await this.get('/attendance/', queryParams, {
        useCache: true,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to load attendance report');
      throw error;
    }
  }

  /**
   * Get employee report with filtering
   */
  async getEmployeeReport(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 100,
        offset: params.offset || 0,
        ...this._buildFilterParams(params),
      };

      return await this.get('/employees/', queryParams, {
        useCache: true,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to load employee report');
      throw error;
    }
  }

  /**
   * Get dashboard statistics (cached for 2-5 minutes)
   */
  async getDashboardStats(params = {}) {
    try {
      return await this.get('/../dashboard-stats/', params, {
        useCache: true,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to load dashboard statistics');
      throw error;
    }
  }

  /**
   * Export report as CSV
   */
  async exportReportCSV(reportType, params = {}) {
    try {
      const endpoint = `/export/${reportType}/csv/`;
      const response = await this.get(endpoint, params, {
        useCache: false, // Don't cache file downloads
      });
      return response;
    } catch (error) {
      notificationManager.error('Failed to export report');
      throw error;
    }
  }

  /**
   * Export report as PDF
   */
  async exportReportPDF(reportType, params = {}) {
    try {
      const endpoint = `/export/${reportType}/pdf/`;
      const response = await this.get(endpoint, params, {
        useCache: false, // Don't cache file downloads
      });
      return response;
    } catch (error) {
      notificationManager.error('Failed to export report');
      throw error;
    }
  }

  /**
   * Helper: Build filter parameters from user input
   */
  _buildFilterParams(filters = {}) {
    const params = {};

    if (filters.departmentId) params.department_id = filters.departmentId;
    if (filters.employeeId) params.employee_id = filters.employeeId;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.singleDate) params.date = filters.singleDate;
    if (filters.status) params.status = filters.status;
    if (filters.leaveType) params.leave_type = filters.leaveType;
    if (filters.search) params.search = filters.search;

    return params;
  }

  /**
   * Refresh report data (force API call, bypass cache)
   */
  async refreshLeaveReport(params = {}) {
    try {
      return await this.get('/leaves/', params, {
        useCache: false, // Force refresh
      });
    } catch (error) {
      notificationManager.error('Failed to refresh leave report');
      throw error;
    }
  }

  /**
   * Refresh attendance report
   */
  async refreshAttendanceReport(params = {}) {
    try {
      return await this.get('/attendance/', params, {
        useCache: false, // Force refresh
      });
    } catch (error) {
      notificationManager.error('Failed to refresh attendance report');
      throw error;
    }
  }

  /**
   * Refresh dashboard stats
   */
  async refreshDashboardStats(params = {}) {
    try {
      return await this.get('/../dashboard-stats/', params, {
        useCache: false, // Force refresh
      });
    } catch (error) {
      notificationManager.error('Failed to refresh dashboard statistics');
      throw error;
    }
  }

  /**
   * Clear all report caches
   */
  clearCache() {
    const { cache } = require('../baseService');
    cache.invalidatePattern('/reports*');
    cache.invalidatePattern('/dashboard-stats*');
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats() {
    const { cache } = require('../baseService');
    return cache.getStats();
  }
}

export const reportService = new ReportService();
export default reportService;
