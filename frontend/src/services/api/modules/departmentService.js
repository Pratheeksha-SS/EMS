/**
 * Department Service Module
 * ==========================
 * Handles all department-related API operations with caching,
 * including CRUD operations and department statistics.
 *
 * Usage:
 * ------
 * import departmentService from '@/services/api/modules/departmentService';
 *
 * // Get all departments
 * const departments = await departmentService.getDepartmentList();
 *
 * // Get specific department details
 * const dept = await departmentService.getDepartmentDetail(deptId);
 *
 * // Create new department (Admin only)
 * await departmentService.createDepartment({ name: 'IT' });
 */

import BaseService from '../baseService.js';
import notificationManager from '../../notificationManager.js';
import { CACHE_CONFIG } from '../baseService.js';

class DepartmentService extends BaseService {
  constructor() {
    super('/departments');
  }

  /**
   * Get list of all departments
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.search - Search by name
   * @param {string} filters.status - Filter by status (ACTIVE, INACTIVE)
   * @param {number} filters.page - Pagination page
   * @returns {Promise<Object|Array>} Departments list with pagination
   */
  async getDepartmentList(filters = {}) {
    try {
      const filterKey = this._buildFilterKey(filters);
      const cacheKey = `department_list_${filterKey}`;

      const data = await this.get('/', {
        params: this._buildFilterParams(filters),
        cacheKey,
        cacheTTL: CACHE_CONFIG.LONG, // Departments rarely change
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load departments');
      throw error;
    }
  }

  /**
   * Get detailed information for a specific department
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Department object with employees count
   */
  async getDepartmentDetail(departmentId) {
    try {
      const data = await this.get(`/${departmentId}/`, {
        cacheKey: `department_${departmentId}`,
        cacheTTL: CACHE_CONFIG.LONG,
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        notificationManager.warning('Department not found');
      } else {
        notificationManager.error('Failed to load department details');
      }
      throw error;
    }
  }

  /**
   * Get all employees in a department
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} List of employees
   */
  async getDepartmentEmployees(departmentId) {
    try {
      const data = await this.get(`/${departmentId}/employees/`, {
        cacheKey: `department_employees_${departmentId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load department employees');
      throw error;
    }
  }

  /**
   * Get department statistics (employee count, salary, etc.)
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Department statistics
   */
  async getDepartmentStats(departmentId) {
    try {
      const data = await this.get(`/${departmentId}/statistics/`, {
        cacheKey: `department_stats_${departmentId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load department statistics');
      throw error;
    }
  }

  /**
   * Get department hierarchy (head and subdepartments)
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Department hierarchy
   */
  async getDepartmentHierarchy(departmentId) {
    try {
      const data = await this.get(`/${departmentId}/hierarchy/`, {
        cacheKey: `department_hierarchy_${departmentId}`,
        cacheTTL: CACHE_CONFIG.LONG,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load department hierarchy');
      throw error;
    }
  }

  /**
   * Get all department heads (managers)
   *
   * @returns {Promise<Array>} List of department heads
   */
  async getDepartmentHeads() {
    try {
      const data = await this.get('/heads/', {
        cacheKey: 'department_heads',
        cacheTTL: CACHE_CONFIG.LONG,
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load department heads');
      throw error;
    }
  }

  /**
   * Create new department (Admin only)
   *
   * @param {Object} departmentData - Department details
   * @param {string} departmentData.name - Department name
   * @param {string} departmentData.description - Department description
   * @param {number} departmentData.head_id - Department head employee ID
   * @param {number} departmentData.parent_id - Parent department ID (if subdepartment)
   * @returns {Promise<Object>} Created department object
   */
  async createDepartment(departmentData) {
    try {
      const data = await this.post('/', departmentData);

      // Invalidate list caches
      this._invalidateDepartmentCaches();

      notificationManager.success(`Department "${departmentData.name}" created`);

      return data;
    } catch (error) {
      notificationManager.error('Failed to create department');
      throw error;
    }
  }

  /**
   * Update department details (Admin only)
   *
   * @param {number} departmentId - Department ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated department object
   */
  async updateDepartment(departmentId, updates) {
    try {
      const data = await this.put(`/${departmentId}/`, updates);

      // Invalidate caches
      this._invalidateDepartmentCaches(departmentId);

      notificationManager.success('Department updated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to update department');
      throw error;
    }
  }

  /**
   * Change department head/manager (Admin only)
   *
   * @param {number} departmentId - Department ID
   * @param {number} newHeadId - New department head employee ID
   * @returns {Promise<Object>} Updated department object
   */
  async changeDepartmentHead(departmentId, newHeadId) {
    try {
      const data = await this.patch(`/${departmentId}/change-head/`, {
        head_id: newHeadId,
      });

      // Invalidate caches
      this._invalidateDepartmentCaches(departmentId);

      notificationManager.success('Department head updated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to change department head');
      throw error;
    }
  }

  /**
   * Deactivate department (Admin only)
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Updated department object
   */
  async deactivateDepartment(departmentId) {
    try {
      const data = await this.patch(`/${departmentId}/deactivate/`, {});

      // Invalidate all department caches
      this._invalidateDepartmentCaches();

      notificationManager.warning('Department deactivated');

      return data;
    } catch (error) {
      notificationManager.error('Failed to deactivate department');
      throw error;
    }
  }

  /**
   * Get department budget and financials (Admin only)
   *
   * @param {number} departmentId - Department ID
   * @param {string} fiscalYear - Fiscal year (default: current year)
   * @returns {Promise<Object>} Budget and financial data
   */
  async getDepartmentBudget(departmentId, fiscalYear = null) {
    try {
      const params = fiscalYear ? { fiscal_year: fiscalYear } : {};

      const data = await this.get(`/${departmentId}/budget/`, {
        params,
        cacheKey: `department_budget_${departmentId}_${fiscalYear || 'current'}`,
        cacheTTL: CACHE_CONFIG.LONG,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load department budget');
      throw error;
    }
  }

  /**
   * Get department performance metrics
   *
   * @param {number} departmentId - Department ID
   * @returns {Promise<Object>} Performance metrics
   */
  async getDepartmentPerformance(departmentId) {
    try {
      const data = await this.get(`/${departmentId}/performance/`, {
        cacheKey: `department_performance_${departmentId}`,
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load department performance');
      throw error;
    }
  }

  /**
   * Export departments list as CSV
   *
   * @param {Object} filters - Same filters as getDepartmentList()
   * @returns {Promise<Blob>} CSV file blob
   */
  async exportDepartmentList(filters = {}) {
    try {
      const response = await this.get('/export/', {
        params: { ...this._buildFilterParams(filters), format: 'csv' },
        responseType: 'blob',
      });

      return response;
    } catch (error) {
      notificationManager.error('Failed to export departments');
      throw error;
    }
  }

  /**
   * Get all departments as flat list (for dropdowns)
   * Cached long-term since departments rarely change
   *
   * @returns {Promise<Array>} Simple department objects with id and name
   */
  async getDepartmentsForDropdown() {
    try {
      const data = await this.get('/', {
        params: { format: 'dropdown' },
        cacheKey: 'departments_dropdown',
        cacheTTL: CACHE_CONFIG.LONG, // 1 hour cache
      });

      return data.results || data;
    } catch (error) {
      notificationManager.error('Failed to load department list');
      throw error;
    }
  }

  /**
   * Get department overview with all key metrics
   *
   * @returns {Promise<Object>} Overview data for dashboard
   */
  async getDepartmentOverview() {
    try {
      const data = await this.get('/overview/', {
        cacheKey: 'departments_overview',
        cacheTTL: CACHE_CONFIG.MEDIUM,
      });

      return data;
    } catch (error) {
      notificationManager.error('Failed to load departments overview');
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

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.status) {
      params.status = filters.status; // ACTIVE, INACTIVE
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
    if (filters.search) key.push(`search_${filters.search}`);
    if (filters.status) key.push(`status_${filters.status}`);
    if (filters.page) key.push(`page_${filters.page}`);
    return key.join('_') || 'all';
  }

  /**
   * Invalidate all department-related caches
   * @private
   */
  _invalidateDepartmentCaches(departmentId = null) {
    // Invalidate specific department cache
    if (departmentId) {
      this.cache.invalidatePattern(`department_${departmentId}*`);
      this.cache.invalidatePattern(`department_employees_${departmentId}*`);
      this.cache.invalidatePattern(`department_stats_${departmentId}*`);
      this.cache.invalidatePattern(`department_hierarchy_${departmentId}*`);
      this.cache.invalidatePattern(`department_budget_${departmentId}*`);
      this.cache.invalidatePattern(`department_performance_${departmentId}*`);
    }

    // Invalidate global department caches
    this.cache.invalidatePattern('/departments*');
    this.cache.invalidatePattern('department_list_*');
    this.cache.invalidatePattern('department_heads*');
    this.cache.invalidatePattern('departments_dropdown*');
    this.cache.invalidatePattern('departments_overview*');

    // Invalidate dependent caches
    this.cache.invalidatePattern('/employees*');
    this.cache.invalidatePattern('/reports*');
    this.cache.invalidatePattern('/dashboard*');
  }
}

// Export singleton instance
export default new DepartmentService();
