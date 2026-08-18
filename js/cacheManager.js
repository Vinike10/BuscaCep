import { CONFIG } from './config.js';

/**
 * Multi-layer Cache Manager (L1 Memory + L2 Storage) with 24-hour TTL & Metrics
 */
export class CacheManager {
  constructor() {
    // L1: In-memory Map
    this.memoryCache = new Map();
    // Cache metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      totalSavedLatencyMs: 0
    };
    this.loadFromStorage();
    this.loadMetrics();
  }

  /**
   * Loads cached entries from persistent storage
   */
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(CONFIG.cacheStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        // Clean expired entries on load
        Object.entries(parsed).forEach(([key, item]) => {
          if (item.expiresAt > now) {
            this.memoryCache.set(key, item);
          }
        });
      }
    } catch (e) {
      console.warn('Cache: Error loading from localStorage', e);
    }
  }

  /**
   * Persists memory cache to localStorage
   */
  saveToStorage() {
    try {
      const obj = {};
      this.memoryCache.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(CONFIG.cacheStorageKey, JSON.stringify(obj));
    } catch (e) {
      console.warn('Cache: Error saving to localStorage', e);
    }
  }

  /**
   * Loads metrics
   */
  loadMetrics() {
    try {
      const raw = localStorage.getItem(CONFIG.metricsStorageKey);
      if (raw) {
        this.metrics = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Metrics: Error loading from localStorage', e);
    }
  }

  /**
   * Persists metrics
   */
  saveMetrics() {
    try {
      localStorage.setItem(CONFIG.metricsStorageKey, JSON.stringify(this.metrics));
    } catch (e) {
      console.warn('Metrics: Error saving to localStorage', e);
    }
  }

  /**
   * Retrieves an item from cache if valid and not expired
   * @param {string} cleanCep
   * @returns {object|null}
   */
  get(cleanCep) {
    const item = this.memoryCache.get(cleanCep);
    if (!item) {
      this.metrics.misses++;
      this.saveMetrics();
      return null;
    }

    // Check expiration (24h TTL)
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(cleanCep);
      this.saveToStorage();
      this.metrics.misses++;
      this.saveMetrics();
      return null;
    }

    this.metrics.hits++;
    // Assume average external query latency saved is ~250ms
    this.metrics.totalSavedLatencyMs += 250;
    this.saveMetrics();

    return {
      ...item.data,
      source: 'cache',
      cacheHit: true,
      latencyMs: 0,
      cachedAt: item.cachedAt,
      expiresAt: item.expiresAt
    };
  }

  /**
   * Saves an item to cache with 24-hour TTL
   * @param {string} cleanCep
   * @param {object} addressData
   */
  set(cleanCep, addressData) {
    const now = Date.now();
    const item = {
      data: addressData,
      cachedAt: now,
      expiresAt: now + CONFIG.cacheTtlMs
    };
    this.memoryCache.set(cleanCep, item);
    this.saveToStorage();
  }

  /**
   * Deletes a single key
   * @param {string} cleanCep
   */
  delete(cleanCep) {
    this.memoryCache.delete(cleanCep);
    this.saveToStorage();
  }

  /**
   * Clears all cached entries
   */
  clear() {
    this.memoryCache.clear();
    localStorage.removeItem(CONFIG.cacheStorageKey);
  }

  /**
   * Gets list of all active cached entries
   * @returns {Array<object>}
   */
  getAll() {
    const list = [];
    const now = Date.now();
    this.memoryCache.forEach((item, key) => {
      if (item.expiresAt > now) {
        list.push({
          cep: key,
          ...item.data,
          cachedAt: item.cachedAt,
          expiresAt: item.expiresAt,
          ttlRemainingMs: Math.max(0, item.expiresAt - now)
        });
      }
    });
    return list;
  }

  /**
   * Returns cache metrics & hit ratio
   */
  getStats() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRatio = total > 0 ? ((this.metrics.hits / total) * 100).toFixed(1) : '0.0';
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      totalQueries: total,
      hitRatio: `${hitRatio}%`,
      itemsCount: this.memoryCache.size,
      timeSavedSeconds: (this.metrics.totalSavedLatencyMs / 1000).toFixed(2)
    };
  }
}

export const cache = new CacheManager();
