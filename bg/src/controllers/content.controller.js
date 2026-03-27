const contentService = require('../services/content.service');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class ContentController {
  async generate(req, res) {
    try {
      const { userId } = req.user;
      const { topic, description, style, length } = req.body;

      if (!topic || !style || !length) {
        return ApiResponse.badRequest(res, '参数不完整');
      }

      const validStyles = ['种草推荐', '干货分享', '好物测评', '生活日常', '情感共鸣', '搞笑幽默'];
      if (!validStyles.includes(style)) {
        return ApiResponse.badRequest(res, '文案风格不合法');
      }

      const validLengths = ['short', 'medium', 'long'];
      if (!validLengths.includes(length)) {
        return ApiResponse.badRequest(res, '文案长度不合法');
      }

      const result = await contentService.generate(userId, {
        topic,
        description,
        style,
        length
      });

      logger.info('文案生成成功', { userId, topic, style, contentId: result.id });

      return ApiResponse.success(res, result);
    } catch (error) {
      logger.error('文案生成失败', error);
      
      if (error.message.includes('次数已用完')) {
        return ApiResponse.forbidden(res, error.message);
      }
      
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async getHistory(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, pageSize = 20, style } = req.query;

      const result = await contentService.getHistory(
        userId,
        parseInt(page),
        parseInt(pageSize),
        style
      );

      return ApiResponse.success(res, result);
    } catch (error) {
      logger.error('获取历史记录失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async getById(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;

      const content = await contentService.getById(parseInt(id), userId);

      return ApiResponse.success(res, content);
    } catch (error) {
      logger.error('获取文案详情失败', error);
      
      if (error.message === '文案不存在') {
        return ApiResponse.notFound(res, error.message);
      }
      
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async collect(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;

      await contentService.collect(parseInt(id), userId);

      return ApiResponse.success(res, null, '收藏成功');
    } catch (error) {
      logger.error('收藏失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async uncollect(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;

      await contentService.uncollect(parseInt(id), userId);

      return ApiResponse.success(res, null, '已取消收藏');
    } catch (error) {
      logger.error('取消收藏失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }

  async getCollections(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, pageSize = 20 } = req.query;

      const result = await contentService.getCollections(
        userId,
        parseInt(page),
        parseInt(pageSize)
      );

      return ApiResponse.success(res, result);
    } catch (error) {
      logger.error('获取收藏列表失败', error);
      return ApiResponse.error(res, 500, error.message);
    }
  }
}

module.exports = new ContentController();
