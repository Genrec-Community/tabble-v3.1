import axios from 'axios';

/**
 * Optimized API service with intelligent caching and request optimization
 */
class OptimizedApiService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Cache configuration
    this.cacheConfig = {
      menu: { ttl: 5 * 60 * 1000 }, // 5 minutes
      categories: { ttl: 15 * 60 * 1000 }, // 15 minutes
      orders: { ttl: 30 * 1000 }, // 30 seconds
      specials: { ttl: 5 * 60 * 1000 }, // 5 minutes
      offers: { ttl: 5 * 60 * 1000 }, // 5 minutes
    };

    // Setup axios instance
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for deduplication
    this.api.interceptors.request.use((config) => {
      const requestKey = this.getRequestKey(config);
      
      // Check if same request is already pending
      if (this.pendingRequests.has(requestKey)) {
        // Return the existing promise
        return this.pendingRequests.get(requestKey);
      }

      // Store the request promise
      const requestPromise = Promise.resolve(config);
      this.pendingRequests.set(requestKey, requestPromise);
      
      return config;
    });

    // Response interceptor for cleanup and caching
    this.api.interceptors.response.use(
      (response) => {
        const requestKey = this.getRequestKey(response.config);
        this.pendingRequests.delete(requestKey);
        
        // Cache successful responses
        this.cacheResponse(response);
        
        return response;
      },
      (error) => {
        const requestKey = this.getRequestKey(error.config);
        this.pendingRequests.delete(requestKey);
        return Promise.reject(error);
      }
    );
  }

  getRequestKey(config) {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }

  getCacheKey(url, params = {}) {
    return `${url}:${JSON.stringify(params)}`;
  }

  cacheResponse(response) {
    const { url, method, params } = response.config;
    
    // Only cache GET requests
    if (method.toLowerCase() !== 'get') return;

    const cacheKey = this.getCacheKey(url, params);
    const cacheType = this.getCacheType(url);
    const ttl = this.cacheConfig[cacheType]?.ttl || 60000; // Default 1 minute

    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up expired cache entries
    this.cleanupCache();
  }

  getCacheType(url) {
    if (url.includes('/menu')) return 'menu';
    if (url.includes('/categories')) return 'categories';
    if (url.includes('/orders')) return 'orders';
    if (url.includes('/specials')) return 'specials';
    if (url.includes('/offers')) return 'offers';
    return 'default';
  }

  getCachedData(url, params = {}) {
    const cacheKey = this.getCacheKey(url, params);
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Batch requests to reduce server load
  async batchRequest(requests) {
    const batchSize = 5; // Process 5 requests at a time
    const results = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.request(request));
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Optimized request method with caching
  async request({ url, method = 'GET', params = {}, data = null, useCache = true }) {
    // Check cache for GET requests
    if (method.toLowerCase() === 'get' && useCache) {
      const cachedData = this.getCachedData(url, params);
      if (cachedData) {
        return { data: cachedData };
      }
    }

    // Make the request
    const config = {
      url,
      method,
      params,
      data
    };

    return await this.api.request(config);
  }

  // Optimized menu fetching with smart caching
  async getMenu(category = null, forceRefresh = false) {
    const params = category ? { category } : {};
    return await this.request({
      url: '/customer/api/menu',
      params,
      useCache: !forceRefresh
    });
  }

  // Optimized categories fetching
  async getCategories(forceRefresh = false) {
    return await this.request({
      url: '/customer/api/categories',
      useCache: !forceRefresh
    });
  }

  // Real-time order fetching with minimal caching
  async getOrders(userId, useCache = false) {
    return await this.request({
      url: `/customer/api/orders/person/${userId}`,
      useCache
    });
  }

  // Optimized specials fetching
  async getSpecials(forceRefresh = false) {
    return await this.request({
      url: '/customer/api/specials',
      useCache: !forceRefresh
    });
  }

  // Optimized offers fetching
  async getOffers(forceRefresh = false) {
    return await this.request({
      url: '/customer/api/offers',
      useCache: !forceRefresh
    });
  }

  // Chef orders with minimal caching
  async getPendingOrders() {
    return await this.request({
      url: '/chef/orders/pending',
      useCache: false // Always fresh for chef
    });
  }

  async getAcceptedOrders() {
    return await this.request({
      url: '/chef/orders/accepted',
      useCache: false // Always fresh for chef
    });
  }

  // Order actions (no caching)
  async createOrder(orderData, personId = null) {
    const params = personId ? { person_id: personId } : {};
    return await this.request({
      url: '/customer/api/orders',
      method: 'POST',
      params,
      data: orderData,
      useCache: false
    });
  }

  async acceptOrder(orderId) {
    return await this.request({
      url: `/chef/orders/${orderId}/accept`,
      method: 'PUT',
      useCache: false
    });
  }

  async completeOrder(orderId) {
    return await this.request({
      url: `/chef/orders/${orderId}/complete`,
      method: 'PUT',
      useCache: false
    });
  }

  async cancelOrder(orderId) {
    return await this.request({
      url: `/customer/api/orders/${orderId}/cancel`,
      method: 'PUT',
      useCache: false
    });
  }

  async requestPayment(orderId) {
    return await this.request({
      url: `/customer/api/orders/${orderId}/payment`,
      method: 'PUT',
      useCache: false
    });
  }

  // Cache management methods
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      cacheTypes: {},
      memoryUsage: 0
    };

    for (const [key, value] of this.cache.entries()) {
      const type = this.getCacheType(key);
      stats.cacheTypes[type] = (stats.cacheTypes[type] || 0) + 1;
      stats.memoryUsage += JSON.stringify(value).length;
    }

    return stats;
  }

  // Preload critical data
  async preloadCriticalData() {
    try {
      await Promise.all([
        this.getCategories(),
        this.getSpecials(),
        this.getOffers()
      ]);
    } catch (error) {
      console.warn('Failed to preload some critical data:', error);
    }
  }
}

// Create singleton instance
export const optimizedApi = new OptimizedApiService();
export default optimizedApi;
