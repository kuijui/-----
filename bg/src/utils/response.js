class ApiResponse {
  static success(res, data = null, message = 'success') {
    return res.json({
      code: 200,
      message,
      data
    });
  }

  static error(res, code = 500, message = '服务器错误', error = null) {
    return res.status(code >= 500 ? 500 : code).json({
      code,
      message,
      error
    });
  }

  static badRequest(res, message = '参数错误', error = null) {
    return this.error(res, 400, message, error);
  }

  static unauthorized(res, message = '未登录') {
    return this.error(res, 401, message);
  }

  static forbidden(res, message = '无权限') {
    return this.error(res, 403, message);
  }

  static notFound(res, message = '资源不存在') {
    return this.error(res, 404, message);
  }

  static tooManyRequests(res, message = '请求过于频繁') {
    return this.error(res, 429, message);
  }
}

module.exports = ApiResponse;
