import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Cache configuration for different data types
 * TTL in milliseconds
 */
const CACHE_CONFIG = {
  SHORT: 60000,        // 1 minute for frequently changing data
  MEDIUM: 300000,      // 5 minutes for regular data
  LONG: 3600000,       // 1 hour for static data
  YEARLY: 31536000000, // 1 year for yearly data (holidays)
};

/**
 * Simple in-memory cache with TTL management
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Get cached value if valid (not expired)
   */
  get(key) {
    if (!this.cache.has(key)) return null;
    const cached = this.cache.get(key);
    if (Date.now() > cached.expiresAt) {
      this.invalidate(key);
      return null;
    }
    return cached.data;
  }

  /**
   * Set cache with TTL
   */
  set(key, data, ttl = CACHE_CONFIG.MEDIUM) {
    // Clear existing timer
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));

    // Set new cache entry
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });

    // Set timer for auto-expiry
    const timer = setTimeout(() => this.invalidate(key), ttl);
    this.timers.set(key, timer);
  }

  /**
   * Manually invalidate cache entry
   */
  invalidate(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching pattern (e.g., '/leaves*')
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    for (const key of this.cache.keys()) {
      this.invalidate(key);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const cache = new CacheManager();

/**
 * Create axios instance with interceptors
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * Request interceptor - add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle errors globally
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Base service with caching and common operations
 */
class BaseService {
  constructor(endpoint, defaultCacheTTL = CACHE_CONFIG.MEDIUM) {
    this.endpoint = endpoint;
    this.defaultCacheTTL = defaultCacheTTL;
  }

  /**
   * Generate cache key with query params
   */
  getCacheKey(url, params = {}) {
    const queryStr = Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return `${url}${queryStr}`;
  }

  /**
   * GET with automatic caching
   */
  async get(url = '', params = {}, options = {}) {
    const { useCache = true, cacheTTL = this.defaultCacheTTL, ...axiosOptions } = options;
    const fullUrl = url.startsWith('/') ? url : `${this.endpoint}${url}`;
    const cacheKey = this.getCacheKey(fullUrl, params);

    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log(`[Cache HIT] ${cacheKey}`);
        return cached;
      }
    }

    try {
      console.log(`[API] GET ${fullUrl}`, params);
      const response = await api.get(fullUrl, { params, ...axiosOptions });
      
      // Cache successful response
      if (useCache) {
        cache.set(cacheKey, response.data, cacheTTL);
      }
      
      return response.data;
    } catch (error) {
      console.error(`[API ERROR] GET ${fullUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * POST - invalidate related caches
   */
  async post(url = '', data = {}, options = {}) {
    const { invalidatePatterns = [], ...axiosOptions } = options;
    const fullUrl = url.startsWith('/') ? url : `${this.endpoint}${url}`;

    try {
      console.log(`[API] POST ${fullUrl}`, data);
      const response = await api.post(fullUrl, data, axiosOptions);
      
      // Invalidate related caches
      invalidatePatterns.forEach(pattern => cache.invalidatePattern(pattern));
      
      return response.data;
    } catch (error) {
      console.error(`[API ERROR] POST ${fullUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * PUT - invalidate related caches
   */
  async put(url = '', data = {}, options = {}) {
    const { invalidatePatterns = [], ...axiosOptions } = options;
    const fullUrl = url.startsWith('/') ? url : `${this.endpoint}${url}`;

    try {
      console.log(`[API] PUT ${fullUrl}`, data);
      const response = await api.put(fullUrl, data, axiosOptions);
      
      // Invalidate related caches
      invalidatePatterns.forEach(pattern => cache.invalidatePattern(pattern));
      
      return response.data;
    } catch (error) {
      console.error(`[API ERROR] PUT ${fullUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * DELETE - invalidate related caches
   */
  async delete(url = '', options = {}) {
    const { invalidatePatterns = [], ...axiosOptions } = options;
    const fullUrl = url.startsWith('/') ? url : `${this.endpoint}${url}`;

    try {
      console.log(`[API] DELETE ${fullUrl}`);
      const response = await api.delete(fullUrl, axiosOptions);
      
      // Invalidate related caches
      invalidatePatterns.forEach(pattern => cache.invalidatePattern(pattern));
      
      return response.data;
    } catch (error) {
      console.error(`[API ERROR] DELETE ${fullUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * PATCH - invalidate related caches
   */
  async patch(url = '', data = {}, options = {}) {
    const { invalidatePatterns = [], ...axiosOptions } = options;
    const fullUrl = url.startsWith('/') ? url : `${this.endpoint}${url}`;

    try {
      console.log(`[API] PATCH ${fullUrl}`, data);
      const response = await api.patch(fullUrl, data, axiosOptions);
      
      // Invalidate related caches
      invalidatePatterns.forEach(pattern => cache.invalidatePattern(pattern));
      
      return response.data;
    } catch (error) {
      console.error(`[API ERROR] PATCH ${fullUrl}:`, error.message);
      throw error;
    }
  }
}

// Export everything
export { BaseService, api, cache, CACHE_CONFIG };
export default BaseService;
