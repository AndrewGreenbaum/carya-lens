// Chrome Storage API wrapper with TTL support

import { CACHE_TTL_MS } from '../../constants/config';
import { logger } from '../../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class StorageCache {
  private storage: chrome.storage.StorageArea;

  constructor(storageType: 'local' | 'sync' = 'local') {
    this.storage = chrome.storage[storageType];
  }

  /**
   * Get item from cache
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.storage.get(key);
      const entry: CacheEntry<T> | undefined = result[key];

      if (!entry) {
        logger.debug('Cache miss', { key });
        return null;
      }

      // Check if expired
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        logger.debug('Cache expired', { key, age: now - entry.timestamp });
        await this.remove(key);
        return null;
      }

      logger.debug('Cache hit', { key, age: now - entry.timestamp });
      return entry.data;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set item in cache with TTL
   */
  async set<T>(key: string, data: T, ttl: number = CACHE_TTL_MS): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      await this.storage.set({ [key]: entry });
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
      logger.debug('Cache remove', { key });
    } catch (error) {
      logger.error('Cache remove error', { key, error });
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error });
    }
  }

  /**
   * Get multiple items from cache
   */
  async getMany<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};

    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.get<T>(key);
      })
    );

    return results;
  }

  /**
   * Set multiple items in cache
   */
  async setMany<T>(items: Record<string, T>, ttl: number = CACHE_TTL_MS): Promise<void> {
    const entries: Record<string, CacheEntry<T>> = {};
    const now = Date.now();

    Object.entries(items).forEach(([key, data]) => {
      entries[key] = {
        data,
        timestamp: now,
        ttl,
      };
    });

    try {
      await this.storage.set(entries);
      logger.debug('Cache set many', { count: Object.keys(items).length });
    } catch (error) {
      logger.error('Cache set many error', { error });
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    totalItems: number;
    bytesUsed: number;
  }> {
    try {
      const all = await this.storage.get(null);
      const totalItems = Object.keys(all).length;

      // Estimate bytes used
      const bytesUsed = new Blob([JSON.stringify(all)]).size;

      return { totalItems, bytesUsed };
    } catch (error) {
      logger.error('Cache stats error', { error });
      return { totalItems: 0, bytesUsed: 0 };
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    try {
      const all = await this.storage.get(null);
      const now = Date.now();
      let cleaned = 0;

      const keysToRemove: string[] = [];

      Object.entries(all).forEach(([key, value]) => {
        const entry = value as CacheEntry<unknown>;
        if (entry.timestamp && entry.ttl) {
          if (now - entry.timestamp > entry.ttl) {
            keysToRemove.push(key);
            cleaned++;
          }
        }
      });

      if (keysToRemove.length > 0) {
        await this.storage.remove(keysToRemove);
        logger.info('Cache cleanup complete', { cleaned });
      }

      return cleaned;
    } catch (error) {
      logger.error('Cache cleanup error', { error });
      return 0;
    }
  }
}

// Export singleton instances
export const localCache = new StorageCache('local');
export const syncCache = new StorageCache('sync');

// Export convenience functions
export const cache = {
  get: <T>(key: string) => localCache.get<T>(key),
  set: <T>(key: string, data: T, ttl?: number) => localCache.set(key, data, ttl),
  remove: (key: string) => localCache.remove(key),
  clear: () => localCache.clear(),
  has: (key: string) => localCache.has(key),
  getStats: () => localCache.getStats(),
  cleanup: () => localCache.cleanup(),
};
