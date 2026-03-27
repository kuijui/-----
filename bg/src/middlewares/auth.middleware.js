const JwtUtil = require('../utils/jwt');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, '请先登录');
    }

    const token = authHeader.substring(7);
    
    const decoded = JwtUtil.verifyToken(token);
    
    req.user = {
      userId: decoded.userId,
      openid: decoded.openid
    };
    
    next();
  } catch (error) {
    logger.error('Token验证失败', error);
    return ApiResponse.unauthorized(res, 'Token无效或已过期');
  }
};

module.exports = authMiddleware;
