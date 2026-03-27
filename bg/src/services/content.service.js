const db = require('../config/database');
const aiService = require('./ai.service');
const userService = require('./user.service');
const logger = require('../utils/logger');

class ContentService {
  async generate(userId, params) {
    const { topic, description, style, length } = params;

    const remainingCount = await userService.getRemainingCount(userId);
    if (remainingCount <= 0) {
      throw new Error('今日生成次数已用完，请开通会员或明日再试');
    }

    const result = await aiService.generate({
      topic,
      description,
      style,
      length
    });

    const [insertResult] = await db.query(
      `INSERT INTO contents 
      (user_id, topic, description, style, length, titles, content, tags, score, ai_model, tokens_used, generation_time, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        topic,
        description || null,
        style,
        length,
        JSON.stringify(result.titles),
        result.content,
        JSON.stringify(result.tags),
        result.score,
        result.aiModel,
        result.tokensUsed,
        result.generationTime
      ]
    );

    await userService.incrementUsageCount(userId);

    const newRemainingCount = await userService.getRemainingCount(userId);

    return {
      id: insertResult.insertId,
      titles: result.titles,
      content: result.content,
      tags: result.tags,
      score: result.score,
      remainingCount: newRemainingCount,
      generationTime: result.generationTime
    };
  }

  async getHistory(userId, page = 1, pageSize = 20, style = null) {
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (style) {
      whereClause += ' AND style = ?';
      params.push(style);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM contents ${whereClause}`,
      params
    );

    const [rows] = await db.query(
      `SELECT id, topic, style, length, titles, content, tags, score, is_collected, created_at 
       FROM contents ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const list = rows.map(row => ({
      ...row,
      titles: JSON.parse(row.titles),
      tags: JSON.parse(row.tags)
    }));

    return {
      total: countResult[0].total,
      page,
      pageSize,
      list
    };
  }

  async getById(contentId, userId) {
    const [rows] = await db.query(
      'SELECT * FROM contents WHERE id = ? AND user_id = ?',
      [contentId, userId]
    );

    if (!rows[0]) {
      throw new Error('文案不存在');
    }

    const content = rows[0];
    return {
      ...content,
      titles: JSON.parse(content.titles),
      tags: JSON.parse(content.tags)
    };
  }

  async collect(contentId, userId) {
    const content = await this.getById(contentId, userId);

    if (content.is_collected) {
      throw new Error('已经收藏过了');
    }

    await db.query(
      'UPDATE contents SET is_collected = 1 WHERE id = ?',
      [contentId]
    );

    await db.query(
      'INSERT INTO collections (user_id, content_id, created_at) VALUES (?, ?, NOW())',
      [userId, contentId]
    );
  }

  async uncollect(contentId, userId) {
    await db.query(
      'UPDATE contents SET is_collected = 0 WHERE id = ?',
      [contentId]
    );

    await db.query(
      'DELETE FROM collections WHERE user_id = ? AND content_id = ?',
      [userId, contentId]
    );
  }

  async getCollections(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM collections WHERE user_id = ?',
      [userId]
    );

    const [rows] = await db.query(
      `SELECT c.*, col.created_at as collected_at 
       FROM contents c 
       INNER JOIN collections col ON c.id = col.content_id 
       WHERE col.user_id = ? 
       ORDER BY col.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    const list = rows.map(row => ({
      ...row,
      titles: JSON.parse(row.titles),
      tags: JSON.parse(row.tags)
    }));

    return {
      total: countResult[0].total,
      page,
      pageSize,
      list
    };
  }
}

module.exports = new ContentService();
