/**
 * Leave Management Service
 * 
 * Unified API service for all leave-related operations with:
 * - Automatic caching and cache invalidation
 * - Standardized error handling
 * - Role-based filtering
 * - Real-time data sync
 * 
 * Usage:
 *   import { leaveService } from '@/services/api/modules/leaveService';
 *   
 *   // Get all leaves for current employee
 *   const leaves = await leaveService.getMyLeaves();
 *   
 *   // Apply new leave
 *   await leaveService.applyLeave({ leave_type: 'SICK', ... });
 *   
 *   // Manager operations
 *   if (isManager) {
 *     const teamLeaves = await leaveService.getTeamLeaves();
 *     await leaveService.approveLeave(leaveId, comment);
 *   }
 */

import BaseService, { CACHE_CONFIG } from '../baseService';
import { notificationManager, NOTIFICATION_TYPES } from '../notificationManager';

class LeaveService extends BaseService {
  constructor() {
    super('/leaves', CACHE_CONFIG.SHORT);
  }

  /**
   * Get current employee's leave list
   */
  async getMyLeaves(params = {}) {
    try {
      return await this.get('/', params, {
        cacheTTL: CACHE_CONFIG.SHORT,
      });
    } catch (error) {
      notificationManager.error('Failed to fetch your leaves');
      throw error;
    }
  }

  /**
   * Get manager's team leaves
   */
  async getTeamLeaves(params = {}) {
    try {
      return await this.get('/manager/leaves/', params, {
        cacheTTL: CACHE_CONFIG.SHORT,
      });
    } catch (error) {
      notificationManager.error('Failed to fetch team leaves');
      throw error;
    }
  }

  /**
   * Get leave balance for current employee
   */
  async getLeaveBalance() {
    try {
      return await this.get('/balance/', {}, {
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to fetch leave balance');
      throw error;
    }
  }

  /**
   * Apply new leave
   */
  async applyLeave(leaveData) {
    try {
      const result = await this.post('/apply/', leaveData, {
        invalidatePatterns: ['/leaves*', '/reports/leaves*', '/dashboard-stats*'],
      });

      notificationManager.notify({
        type: NOTIFICATION_TYPES.LEAVE_APPLIED,
        message: `Leave request submitted for ${leaveData.leave_type}`,
      });

      return result;
    } catch (error) {
      notificationManager.error('Failed to apply leave');
      throw error;
    }
  }

  /**
   * Get single leave detail
   */
  async getLeaveDetail(leaveId) {
    try {
      return await this.get(`/${leaveId}/`, {}, {
        cacheTTL: CACHE_CONFIG.SHORT,
      });
    } catch (error) {
      notificationManager.error('Failed to fetch leave details');
      throw error;
    }
  }

  /**
   * Update leave request (only if status is PENDING)
   */
  async updateLeave(leaveId, updates) {
    try {
      const result = await this.put(`/${leaveId}/`, updates, {
        invalidatePatterns: ['/leaves*', '/reports/leaves*', '/dashboard-stats*'],
      });

      notificationManager.success('Leave updated successfully');
      return result;
    } catch (error) {
      notificationManager.error('Failed to update leave');
      throw error;
    }
  }

  /**
   * Manager: Approve leave request
   * 
   * Note: This is ONE notification for the action,
   * not separate notifications for approval + email
   */
  async approveLeave(leaveId, comment = '') {
    try {
      const result = await this.put(`/${leaveId}/approve-reject/`, {
        action: 'approve',
        comment,
      }, {
        invalidatePatterns: [
          '/leaves*',
          '/manager/leaves*',
          '/reports/leaves*',
          '/dashboard-stats*',
          '/employees*',  // Employee balance updated
        ],
      });

      notificationManager.notify({
        type: NOTIFICATION_TYPES.LEAVE_APPROVED,
        message: 'Leave request approved',
        action: { label: 'View', path: '/admin?section=leaves' },
      });

      return result;
    } catch (error) {
      notificationManager.error('Failed to approve leave');
      throw error;
    }
  }

  /**
   * Manager: Reject leave request
   */
  async rejectLeave(leaveId, comment = '') {
    try {
      const result = await this.put(`/${leaveId}/approve-reject/`, {
        action: 'reject',
        comment,
      }, {
        invalidatePatterns: [
          '/leaves*',
          '/manager/leaves*',
          '/reports/leaves*',
          '/dashboard-stats*',
          '/employees*',
        ],
      });

      notificationManager.notify({
        type: NOTIFICATION_TYPES.LEAVE_REJECTED,
        message: 'Leave request rejected',
      });

      return result;
    } catch (error) {
      notificationManager.error('Failed to reject leave');
      throw error;
    }
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(leaveId, reason = '') {
    try {
      const result = await this.delete(`/${leaveId}/`, {
        invalidatePatterns: [
          '/leaves*',
          '/manager/leaves*',
          '/reports/leaves*',
          '/dashboard-stats*',
          '/employees*',
        ],
      });

      notificationManager.notify({
        type: NOTIFICATION_TYPES.LEAVE_CANCELLED,
        message: 'Leave request cancelled',
      });

      return result;
    } catch (error) {
      notificationManager.error('Failed to cancel leave');
      throw error;
    }
  }

  /**
   * Get leave report (for HR dashboard)
   */
  async getLeaveReport(params = {}) {
    try {
      const queryParams = {
        ...params,
        limit: params.limit || 100,
        offset: params.offset || 0,
      };

      return await this.get('/', queryParams, {
        useCache: true,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to fetch leave report');
      throw error;
    }
  }

  /**
   * Get leave statistics for dashboard
   */
  async getLeaveStats(params = {}) {
    try {
      // Use reports endpoint for stats
      return await this.get('/../reports/leaves/', params, {
        useCache: true,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
    } catch (error) {
      notificationManager.error('Failed to fetch leave statistics');
      throw error;
    }
  }

  /**
   * Clear all leave-related caches
   * (Useful after bulk operations or admin actions)
   */
  clearCache() {
    const cache = require('../baseService').cache;
    cache.invalidatePattern('/leaves*');
    cache.invalidatePattern('/reports/leaves*');
    cache.invalidatePattern('/manager/leaves*');
    cache.invalidatePattern('/dashboard-stats*');
  }
}

export const leaveService = new LeaveService();
export default leaveService;
