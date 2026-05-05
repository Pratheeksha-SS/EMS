/**
 * Employee Service Module
 * ========================
 * Handles all employee-related API operations with intelligent caching,
 * role-based access control, and automatic cache invalidation patterns.
 *
 * Usage:
 * ------
 * import employeeService from '@/services/api/modules/employeeService';
 *
 * // Get current user's profile
 * const profile = await employeeService.getCurrentEmployee();
 *
 * // Get list of all employees (managers only)
 * const employees = await employeeService.getEmployeeList();
 *
 * // Get specific employee details
 * const employee = await employeeService.getEmployeeDetail(employeeId);
 *
 * // Update employee profile
 * await employeeService.updateProfile({ name: 'John', department: 'IT' });
 */

import BaseService from '../baseService.js';
import notificationManager from '../../notificationManager.js';
import { NOTIFICATION_TYPES } from '../../notificationManager.js';
import { CACHE_CONFIG } from '../baseService.js';

class EmployeeService extends BaseService {
  constructor() {
    super('/employees');
  }

  /**
   * Get current user's employee profile
   * @returns {Promise<Object>} Current employee object
   */
  async getCurrentEmployee() {
    try {
      const data = await this.get('/me/', {
        cacheKey: 'current_employee',
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });
      return data;
    } catch (error) {
      notificationManager.error('Failed to load employee profile');
      throw error;
    }
  }

  /**
   * Get list of all employees with filters
   * Only accessible to Admin/Manager roles
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.departmentId - Filter by department ID
   * @param {string} filters.status - Filter by status (ACTIVE, INACTIVE)
   * @param {string} filters.search - Search by name/email
   * @param {number} filters.page - Pagination page number
   * @param {number} filters.pageSize - Results per page
   * @returns {Promise<Object>} List of employees with pagination
   */
  async getEmployeeList(filters = {}) {
    try {
      // Build cache key from filters
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `employee_list_${filterKey}`;

      const data = await this.get('/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load employees');
      throw error;
    }
  }

  /**
   * Get detailed information for a specific employee
   *
   * @param {number} employeeId - ID of the employee
   * @returns {Promise<Object>} Detailed employee object
   */
  async getEmployeeDetail(employeeId) {
    try {
      const data = await this.get(`/${employeeId}/`, {
        cacheKey: `employee_${employeeId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        notificationManager.warning('Employee not found');
      } else {
        notificationManager.error('Failed to load employee details');
      }
      throw error;
    }
  }

  /**
   * Get employees in a specific department
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} List of employees in department
   */
  async getEmployeesByDepartment(departmentId) {
    try {
      const data = await this.get('/', {
        params: { department: departmentId },
        cacheKey: `employees_dept_${departmentId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load department employees');
      throw error;
    }
  }

  /**
   * Get direct reports for a manager
   * Only callable by users with MANAGER role
   *
   * @returns {Promise<Array>} List of direct reports
   */
  async getDirectReports() {
    try {
      const data = await this.get('/direct-reports/', {
        cacheKey: 'direct_reports',
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      if (error.response?.status === 403) {
        notificationManager.warning('Only managers can view direct reports');
      } else {
        notificationManager.error('Failed to load direct reports');
      }
      throw error;
    }
  }

  /**
   * Search employees by name or email
   *
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchEmployees(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const data = await this.get('/', {
        params: { search: query },
        cacheKey: `employee_search_${query}`,
        cacheTTL: CACHE_CONFIG.SHORT, // Short cache for search
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Search failed');
      throw error;
    }
  }

  /**
   * Update current user's profile
   *
   * @param {Object} updates - Profile updates (name, phone, address, etc.)
   * @returns {Promise<Object>} Updated employee object
   */
  async updateProfile(updates) {
    try {
      const data = await this.put('/me/', updates);

      // Invalidate related caches
      this._invalidateEmployeeCaches();

      notificationManager.success('Profile updated successfully');

      return data;
    } catch (error) {
      notificationManager.error('Failed to update profile');
      throw error;
    }
  }

  /**
   * Update specific employee (Admin only)
   *
   * @param {number} employeeId - Employee ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated employee object
   */
  async updateEmployee(employeeId, updates) {
    try {
      const data = await this.put(`/${employeeId}/`, updates);

      // Invalidate related caches
      this._invalidateEmployeeCaches(employeeId);

      notificationManager.notify({
        type: NOTIFICATION_TYPES.EMPLOYEE_UPDATED,
        message: `Employee ${employeeId} updated`,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to update employee');
      throw error;
    }
  }

  /**
   * Create new employee (Admin only)
   *
   * @param {Object} employeeData - New employee data
   * @param {string} employeeData.first_name - First name
   * @param {string} employeeData.last_name - Last name
   * @param {string} employeeData.email - Email address
   * @param {number} employeeData.department - Department ID
   * @param {string} employeeData.position - Job position
   * @returns {Promise<Object>} Created employee object
   */
  async createEmployee(employeeData) {
    try {
      const data = await this.post('/', employeeData);

      // Invalidate list and department caches
      this._invalidateEmployeeCaches();

      notificationManager.notify({
        type: NOTIFICATION_TYPES.EMPLOYEE_CREATED,
        message: `New employee ${employeeData.first_name} created`,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to create employee');
      throw error;
    }
  }

  /**
   * Promote employee to new role (Admin/Manager only)
   *
   * @param {number} employeeId - Employee ID
   * @param {Object} promotionData - Promotion details
   * @param {string} promotionData.new_position - New position
   * @param {number} promotionData.new_department - New department (optional)
   * @param {string} promotionData.effective_date - Promotion date
   * @returns {Promise<Object>} Updated employee object
   */
  async promoteEmployee(employeeId, promotionData) {
    try {
      const data = await this.patch(`/${employeeId}/promote/`, promotionData);

      // Invalidate employee and dashboard caches
      this.cache.invalidatePattern('/employees*');
      this.cache.invalidatePattern('/dashboard*');

      notificationManager.notify({
        type: NOTIFICATION_TYPES.EMPLOYEE_PROMOTED,
        message: `Employee promoted to ${promotionData.new_position}`,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to promote employee');
      throw error;
    }
  }

  /**
   * Deactivate employee (Admin only)
   *
   * @param {number} employeeId - Employee ID
   * @param {Object} details - Deactivation details
   * @param {string} details.reason - Reason for deactivation
   * @param {string} details.effective_date - Last working day
   * @returns {Promise<Object>} Updated employee object
   */
  async deactivateEmployee(employeeId, details) {
    try {
      const data = await this.patch(`/${employeeId}/deactivate/`, details);

      // Invalidate all employee-related caches
      this._invalidateEmployeeCaches();

      notificationManager.warning(`Employee ${employeeId} deactivated`);

      return data;
    } catch (error) {
      notificationManager.error('Failed to deactivate employee');
      throw error;
    }
  }

  /**
   * Get employee activity summary (leave, attendance, etc.)
   *
   * @param {number} employeeId - Employee ID
   * @returns {Promise<Object>} Activity summary
   */
  async getEmployeeActivitySummary(employeeId) {
    try {
      const data = await this.get(`/${employeeId}/activity-summary/`, {
        cacheKey: `employee_activity_${employeeId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load employee activity');
      throw error;
    }
  }

  /**
   * Upload employee profile picture
   *
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Response with image URL
   */
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const data = await this.post('/me/profile-picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Invalidate profile cache
      this.cache.invalidatePattern('current_employee*');

      notificationManager.success('Profile picture updated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to upload profile picture');
      throw error;
    }
  }

  /**
   * Export employee list as CSV
   *
   * @param {Object} filters - Same filters as getEmployeeList()
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportEmployeeList(filters = {}) {
    try {
      const response = await this.get('/export/', {
        params: { ...this._buildFilterParams(filters), format: 'csv' },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      notificationManager.error('Failed to export employee list');
      throw error;
    }
  }

  /**
   * Get employee statistics (count, by department, by status)
   *
   * @returns {Promise<Object>} Employee statistics
   */
  async getEmployeeStats() {
    try {
      const data = await this.get('/statistics/', {
        cacheKey: 'employee_stats',
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load employee statistics');
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

    if (filters.departmentId) {
      params.department = filters.departmentId;
    }

    if (filters.status) {
      params.status = filters.status; // ACTIVE, INACTIVE, ON_LEAVE
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

    if (filters.orderBy) {
      params.ordering = filters.orderBy; // e.g., '-date_joined'
    }

    return params;
  }

  /**
   * Build cache key from filters
   * @private
   */
  _buildFilterKey(filters) {
    const key = [];
    if (filters.departmentId) key.push(`dept_${filters.departmentId}`);
    if (filters.status) key.push(`status_${filters.status}`);
    if (filters.search) key.push(`search_${filters.search}`);
    if (filters.page) key.push(`page_${filters.page}`);
    return key.join('_') || 'all';
  }

  /**
   * Invalidate all employee-related caches
   * Called after any mutation (create, update, delete, promote, etc.)
   * @private
   */
  _invalidateEmployeeCaches(employeeId = null) {
    // Invalidate specific employee cache
    if (employeeId) {
      this.cache.invalidatePattern(`employee_${employeeId}*`);
      this.cache.invalidatePattern(`employee_activity_${employeeId}*`);
    }

    // Invalidate global employee caches
    this.cache.invalidatePattern('/employees*');
    this.cache.invalidatePattern('employee_list_*');
    this.cache.invalidatePattern('employee_search_*');
    this.cache.invalidatePattern('employee_stats*');
    this.cache.invalidatePattern('direct_reports*');

    // Invalidate dependent module caches
    this.cache.invalidatePattern('/dashboard*');
    this.cache.invalidatePattern('/reports*');
    this.cache.invalidatePattern('/attendance*');
    this.cache.invalidatePattern('/leaves*');
  }
}

// Export singleton instance
export default new EmployeeService();
