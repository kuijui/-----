const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined
});

client.on('error', (err) => {
  logger.error('Redis连接错误', err);
});

client.on('connect', () => {
  logger.info('Redis连接成功');
});

client.connect().catch(err => {
  logger.error('Redis初始化失败', err);
});

module.exports = client;
