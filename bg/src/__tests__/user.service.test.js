jest.mock('../config/database', () => ({ query: jest.fn() }));
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn()
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const db = require('../config/database');
const redis = require('../config/redis');
const userService = require('../services/user.service');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByOpenid()', () => {
    test('应返回找到的用户', async () => {
      const mockUser = { id: 1, openid: 'test_openid', nickname: '用户' };
      db.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userService.findByOpenid('test_openid');
      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE openid = ?',
        ['test_openid']
      );
    });

    test('用户不存在时应返回undefined', async () => {
      db.query.mockResolvedValueOnce([[]]);
      const result = await userService.findByOpenid('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('findById()', () => {
    test('缓存命中时应直接返回缓存数据', async () => {
      const mockUser = { id: 1, nickname: '用户' };
      redis.get.mockResolvedValueOnce(JSON.stringify(mockUser));

      const result = await userService.findById(1);
      expect(result).toEqual(mockUser);
      expect(db.query).not.toHaveBeenCalled();
    });

    test('缓存未命中时应查询数据库并写入缓存', async () => {
      const mockUser = { id: 1, nickname: '用户' };
      redis.get.mockResolvedValueOnce(null);
      db.query.mockResolvedValueOnce([[mockUser]]);
      redis.setEx.mockResolvedValueOnce('OK');

      const result = await userService.findById(1);
      expect(result).toEqual(mockUser);
      expect(redis.setEx).toHaveBeenCalledWith('user:info:1', 3600, JSON.stringify(mockUser));
    });

    test('用户不存在时不应写入缓存', async () => {
      redis.get.mockResolvedValueOnce(null);
      db.query.mockResolvedValueOnce([[]]);

      const result = await userService.findById(999);
      expect(result).toBeUndefined();
      expect(redis.setEx).not.toHaveBeenCalled();
    });
  });

  describe('create()', () => {
    test('应插入用户并返回insertId', async () => {
      db.query.mockResolvedValueOnce([{ insertId: 42 }]);

      const userId = await userService.create({
        openid: 'new_openid',
        unionid: 'uid',
        nickname: '新用户',
        avatar: 'http://avatar.jpg'
      });

      expect(userId).toBe(42);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['new_openid', 'uid', '新用户', 'http://avatar.jpg']
      );
    });
  });

  describe('update()', () => {
    test('有字段时应执行UPDATE并清除缓存', async () => {
      db.query.mockResolvedValueOnce([{}]);
      redis.del.mockResolvedValueOnce(1);

      await userService.update(1, { nickname: '新昵称' });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET nickname = ?'),
        expect.arrayContaining(['新昵称', 1])
      );
      expect(redis.del).toHaveBeenCalledWith('user:info:1');
    });

    test('没有字段时不应执行UPDATE', async () => {
      await userService.update(1, {});
      expect(db.query).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    test('应支持同时更新多个字段', async () => {
      db.query.mockResolvedValueOnce([{}]);
      redis.del.mockResolvedValueOnce(1);

      await userService.update(1, { nickname: '新昵称', avatar: 'new.jpg', phone: '13800000000' });

      const callArgs = db.query.mock.calls[0];
      expect(callArgs[0]).toContain('nickname = ?');
      expect(callArgs[0]).toContain('avatar = ?');
      expect(callArgs[0]).toContain('phone = ?');
    });
  });

  describe('getRemainingCount()', () => {
    // getRemainingCount内部调用顺序：
    // 1. redis.get(usage counter)  2. findById→redis.get(user cache)  3. getMemberInfo→redis.get(member cache)

    test('未使用任何次数时应返回每日限额', async () => {
      redis.get
        .mockResolvedValueOnce(null)   // #1 使用次数计数器
        .mockResolvedValueOnce(null)   // #2 用户缓存(findById)
        .mockResolvedValueOnce(null);  // #3 会员缓存(getMemberInfo)
      db.query
        .mockResolvedValueOnce([[{ id: 1, daily_free_count: 3 }]])  // findById
        .mockResolvedValueOnce([[]]);                               // getMemberInfo

      const count = await userService.getRemainingCount(1);
      expect(count).toBe(3);
    });

    test('已使用1次时应返回2', async () => {
      redis.get
        .mockResolvedValueOnce('1')    // #1 已使用1次
        .mockResolvedValueOnce(null)   // #2 用户缓存miss
        .mockResolvedValueOnce(null);  // #3 会员缓存miss
      db.query
        .mockResolvedValueOnce([[{ id: 1, daily_free_count: 3 }]])
        .mockResolvedValueOnce([[]]);

      const count = await userService.getRemainingCount(1);
      expect(count).toBe(2);
    });

    test('次数用尽时应返回0而非负数', async () => {
      redis.get
        .mockResolvedValueOnce('5')   // #1 已超出限制
        .mockResolvedValueOnce(null)  // #2 用户缓存miss
        .mockResolvedValueOnce(null); // #3 会员缓存miss
      db.query
        .mockResolvedValueOnce([[{ id: 1, daily_free_count: 3 }]])
        .mockResolvedValueOnce([[]]);

      const count = await userService.getRemainingCount(1);
      expect(count).toBe(0);
    });

    test('用户不存在时应默认返回3次', async () => {
      redis.get
        .mockResolvedValueOnce(null)   // #1 使用次数
        .mockResolvedValueOnce(null)   // #2 用户缓存miss
        .mockResolvedValueOnce(null);  // #3 会员缓存miss
      db.query
        .mockResolvedValueOnce([[]])   // findById returns empty
        .mockResolvedValueOnce([[]]); // getMemberInfo returns empty

      const count = await userService.getRemainingCount(999);
      expect(count).toBe(3);
    });

    test('会员用户应使用会员限额', async () => {
      const mockMember = { daily_limit: 30 };
      redis.get
        .mockResolvedValueOnce('5')                           // #1 已用5次
        .mockResolvedValueOnce(null)                          // #2 用户缓存miss
        .mockResolvedValueOnce(JSON.stringify(mockMember));   // #3 会员缓存命中
      db.query
        .mockResolvedValueOnce([[{ id: 1, daily_free_count: 3 }]]); // findById only

      const count = await userService.getRemainingCount(1);
      expect(count).toBe(25);
    });
  });

  describe('incrementUsageCount()', () => {
    test('首次调用时应设置TTL到明天零点', async () => {
      redis.incr.mockResolvedValueOnce(1);
      redis.expire.mockResolvedValueOnce(1);
      db.query.mockResolvedValueOnce([{}]);

      await userService.incrementUsageCount(1);

      expect(redis.expire).toHaveBeenCalledWith(
        expect.stringContaining('usage:daily:1:'),
        expect.any(Number)
      );
      const ttl = redis.expire.mock.calls[0][1];
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(86400);
    });

    test('非首次调用时不应设置TTL', async () => {
      redis.incr.mockResolvedValueOnce(2);
      db.query.mockResolvedValueOnce([{}]);

      await userService.incrementUsageCount(1);
      expect(redis.expire).not.toHaveBeenCalled();
    });

    test('应同时更新数据库total_generated', async () => {
      redis.incr.mockResolvedValueOnce(1);
      redis.expire.mockResolvedValueOnce(1);
      db.query.mockResolvedValueOnce([{}]);

      await userService.incrementUsageCount(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('total_generated = total_generated + 1'),
        [1]
      );
    });

    test('应返回当前使用次数', async () => {
      redis.incr.mockResolvedValueOnce(3);
      db.query.mockResolvedValueOnce([{}]);

      const count = await userService.incrementUsageCount(1);
      expect(count).toBe(3);
    });
  });

  describe('getMemberInfo()', () => {
    test('缓存命中时应返回会员信息', async () => {
      const mockMember = { member_type: 'monthly', daily_limit: 30 };
      redis.get.mockResolvedValueOnce(JSON.stringify(mockMember));

      const result = await userService.getMemberInfo(1);
      expect(result).toEqual(mockMember);
      expect(db.query).not.toHaveBeenCalled();
    });

    test('非会员时应返回null', async () => {
      redis.get.mockResolvedValueOnce(null);
      db.query.mockResolvedValueOnce([[]]);

      const result = await userService.getMemberInfo(1);
      expect(result).toBeNull();
      expect(redis.setEx).not.toHaveBeenCalled();
    });

    test('有会员时应写入缓存', async () => {
      const mockMember = { member_type: 'yearly', daily_limit: 100 };
      redis.get.mockResolvedValueOnce(null);
      db.query.mockResolvedValueOnce([[mockMember]]);

      await userService.getMemberInfo(1);
      expect(redis.setEx).toHaveBeenCalledWith(
        'member:status:1', 1800, JSON.stringify(mockMember)
      );
    });
  });
});
