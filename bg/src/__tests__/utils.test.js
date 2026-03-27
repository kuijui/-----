describe('JwtUtil', () => {
  let JwtUtil;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'test_secret_key';
    process.env.JWT_EXPIRES_IN = '7d';
    JwtUtil = require('../utils/jwt');
  });

  test('generateToken应返回字符串', () => {
    const token = JwtUtil.generateToken({ userId: 1, openid: 'test' });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('verifyToken应能正确解码payload', () => {
    const payload = { userId: 42, openid: 'wx123' };
    const token = JwtUtil.generateToken(payload);
    const decoded = JwtUtil.verifyToken(token);
    expect(decoded.userId).toBe(42);
    expect(decoded.openid).toBe('wx123');
  });

  test('无效token应抛出错误', () => {
    expect(() => JwtUtil.verifyToken('invalid.token.string')).toThrow('Token无效或已过期');
  });

  test('篡改的token应抛出错误', () => {
    const token = JwtUtil.generateToken({ userId: 1 });
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(() => JwtUtil.verifyToken(tampered)).toThrow('Token无效或已过期');
  });

  test('decodeToken不验证签名时应返回payload', () => {
    const token = JwtUtil.generateToken({ userId: 99 });
    const decoded = JwtUtil.decodeToken(token);
    expect(decoded.userId).toBe(99);
  });
});

describe('ApiResponse', () => {
  let ApiResponse;
  let mockRes;

  beforeEach(() => {
    jest.resetModules();
    ApiResponse = require('../utils/response');
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  test('success应返回code:200', () => {
    ApiResponse.success(mockRes, { id: 1 });
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 200, message: 'success', data: { id: 1 } })
    );
  });

  test('success支持自定义message', () => {
    ApiResponse.success(mockRes, null, '操作成功');
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: '操作成功' })
    );
  });

  test('badRequest应返回code:400', () => {
    ApiResponse.badRequest(mockRes, '参数错误');
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 400, message: '参数错误' })
    );
  });

  test('unauthorized应返回code:401', () => {
    ApiResponse.unauthorized(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 401 })
    );
  });

  test('forbidden应返回code:403', () => {
    ApiResponse.forbidden(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 403 })
    );
  });

  test('notFound应返回code:404', () => {
    ApiResponse.notFound(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  test('tooManyRequests应返回code:429', () => {
    ApiResponse.tooManyRequests(mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  test('5xx错误status应为500', () => {
    ApiResponse.error(mockRes, 500, '服务器错误');
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
