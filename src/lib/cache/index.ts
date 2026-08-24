import Redis from 'ioredis';
import { createChildLogger } from '../logger';

const log = createChildLogger('CacheService');

// In-Memory Fallback Store with TTL expiration
interface MemoryCacheItem {
  value: string;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, MemoryCacheItem>();

  get(key: string): string | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    // Prevent unbounded memory growth
    if (this.store.size > 2000) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delPattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  flush(): void {
    this.store.clear();
  }
}

class CacheService {
  private redis: Redis | null = null;
  private memory = new InMemoryCache();
  private isRedisConnected = false;
  private connectionAttempted = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 2) {
            log.warn('Redis unavailable. Gracefully falling back to in-memory cache.');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 1000);
        },
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.redis.connect()
        .then(() => {
          this.isRedisConnected = true;
          log.info('Redis cache connection established successfully.');
        })
        .catch((err) => {
          this.isRedisConnected = false;
          log.warn({ error: err.message }, 'Redis initial connection failed; using In-Memory fallback.');
        });

      this.redis.on('error', (err) => {
        this.isRedisConnected = false;
      });

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.isRedisConnected = false;
      log.warn({ error: message }, 'Redis initialization failed; running in In-Memory mode.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.redis) {
        const data = await this.redis.get(key);
        if (data) return JSON.parse(data) as T;
      }
    } catch (err) {
      log.debug({ key }, 'Redis get error, falling back to memory cache.');
    }

    const memData = this.memory.get(key);
    if (memData) {
      try {
        return JSON.parse(memData) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const stringified = JSON.stringify(value);
    // Always update memory store for fallback consistency
    this.memory.set(key, stringified, ttlSeconds);

    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.setex(key, ttlSeconds, stringified);
      }
    } catch (err) {
      log.debug({ key }, 'Redis setex failed; saved in memory fallback.');
    }
  }

  async del(key: string): Promise<void> {
    this.memory.del(key);
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
      }
    } catch (err) {
      log.debug({ key }, 'Redis del failed.');
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    this.memory.delPattern(pattern);
    try {
      if (this.isRedisConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (err) {
      log.debug({ pattern }, 'Redis invalidate pattern failed.');
    }
  }

  getStatus(): { isRedisConnected: boolean; mode: 'REDIS' | 'MEMORY_FALLBACK' } {
    return {
      isRedisConnected: this.isRedisConnected,
      mode: this.isRedisConnected ? 'REDIS' : 'MEMORY_FALLBACK',
    };
  }
}

export const cacheService = new CacheService();
