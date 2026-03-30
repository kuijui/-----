const redis = require('redis');
const logger = require('../utils/logger');

const noopClient = {
  get: async () => null,
  set: async () => null,
  setEx: async () => null,
  del: async () => null,
  incr: async () => 1,
  expire: async () => null,
  isReady: false
};

let client = noopClient;

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    connectTimeout: 3000,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        logger.warn('Redis多次重连失败，降级为无缓存模式');
        return false;
      }
      return Math.min(retries * 500, 2000);
    }
  },
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  logger.warn('Redis不可用，使用降级模式（无缓存）', { message: err.message });
  client = noopClient;
});

redisClient.on('ready', () => {
  logger.info('Redis连接成功');
  client = redisClient;
});

redisClient.connect().catch((err) => {
  logger.warn('Redis连接失败，降级为无缓存模式', { message: err.message });
});

const proxy = new Proxy(noopClient, {
  get(_, prop) {
    return (...args) => client[prop]?.(...args) ?? Promise.resolve(null);
  }
});

module.exports = proxy;
