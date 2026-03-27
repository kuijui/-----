const db = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class UserService {
  async findByOpenid(openid) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );
    return rows[0];
  }

  async findById(userId) {
    const cacheKey = `user:info:${userId}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [rows] = await db.query(
      'SELECT id, openid, nickname, avatar, phone, gender, status, daily_free_count, total_generated, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows[0]) {
      await redis.setEx(cacheKey, 3600, JSON.stringify(rows[0]));
    }

    return rows[0];
  }

  async create(userData) {
    const { openid, unionid, nickname, avatar } = userData;
    
    const [result] = await db.query(
      'INSERT INTO users (openid, unionid, nickname, avatar, daily_free_count, created_at) VALUES (?, ?, ?, ?, 3, NOW())',
      [openid, unionid, nickname, avatar]
    );

    return result.insertId;
  }

  async update(userId, userData) {
    const fields = [];
    const values = [];

    if (userData.nickname) {
      fields.push('nickname = ?');
      values.push(userData.nickname);
    }
    if (userData.avatar) {
      fields.push('avatar = ?');
      values.push(userData.avatar);
    }
    if (userData.phone) {
      fields.push('phone = ?');
      values.push(userData.phone);
    }

    if (fields.length === 0) return;

    values.push(userId);

    await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    await redis.del(`user:info:${userId}`);
  }

  async updateLastLogin(userId) {
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [userId]
    );
  }

  async getRemainingCount(userId) {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `usage:daily:${userId}:${today}`;
    
    const used = await redis.get(cacheKey);
    const usedCount = used ? parseInt(used) : 0;

    const user = await this.findById(userId);
    const member = await this.getMemberInfo(userId);

    const dailyLimit = member ? member.daily_limit : user.daily_free_count;

    return Math.max(0, dailyLimit - usedCount);
  }

  async incrementUsageCount(userId) {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `usage:daily:${userId}:${today}`;
    
    const count = await redis.incr(cacheKey);
    
    if (count === 1) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ttl = Math.floor((tomorrow - new Date()) / 1000);
      await redis.expire(cacheKey, ttl);
    }

    await db.query(
      'UPDATE users SET total_generated = total_generated + 1 WHERE id = ?',
      [userId]
    );

    return count;
  }

  async getMemberInfo(userId) {
    const cacheKey = `member:status:${userId}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [rows] = await db.query(
      'SELECT * FROM members WHERE user_id = ? AND status = 1 AND (expire_at IS NULL OR expire_at > NOW())',
      [userId]
    );

    const member = rows[0] || null;
    
    if (member) {
      await redis.setEx(cacheKey, 1800, JSON.stringify(member));
    }

    return member;
  }

  async getUserStats(userId) {
    const remainingCount = await this.getRemainingCount(userId);
    
    const [contentStats] = await db.query(
      'SELECT COUNT(*) as total_generated, COUNT(CASE WHEN is_collected = 1 THEN 1 END) as total_collected FROM contents WHERE user_id = ?',
      [userId]
    );

    const [styleStats] = await db.query(
      'SELECT style, COUNT(*) as count FROM contents WHERE user_id = ? GROUP BY style ORDER BY count DESC LIMIT 1',
      [userId]
    );

    return {
      todayRemaining: remainingCount,
      totalGenerated: contentStats[0].total_generated,
      totalCollected: contentStats[0].total_collected,
      mostUsedStyle: styleStats[0]?.style || null
    };
  }
}

module.exports = new UserService();
