import { createClient } from 'redis';

let redisClient: any = null;

export const initRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err: any) => console.error('Redis Error:', err));
    await redisClient.connect();
    console.log('✓ Redis connected');
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    // Fallback to in-memory storage for development
    return null;
  }
};

const inMemoryStore: Map<string, any> = new Map();

export const setRedis = async (key: string, value: any, expiry?: number) => {
  if (redisClient) {
    await redisClient.setEx(key, expiry || 300, JSON.stringify(value));
  } else {
    // In-memory fallback
    inMemoryStore.set(key, value);
    if (expiry) {
      setTimeout(() => inMemoryStore.delete(key), expiry * 1000);
    }
  }
};

export const getRedis = async (key: string) => {
  if (redisClient) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } else {
    // In-memory fallback
    return inMemoryStore.get(key) || null;
  }
};

export const deleteRedis = async (key: string) => {
  if (redisClient) {
    await redisClient.del(key);
  } else {
    // In-memory fallback
    inMemoryStore.delete(key);
  }
};
