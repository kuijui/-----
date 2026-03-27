const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/response');

const createRateLimiter = (windowMs = 60000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      ApiResponse.tooManyRequests(res, '请求过于频繁，请稍后再试');
    }
  });
};

const generalLimiter = createRateLimiter(60000, 100);

const strictLimiter = createRateLimiter(60000, 10);

module.exports = {
  generalLimiter,
  strictLimiter,
  createRateLimiter
};
