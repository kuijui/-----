jest.mock('../config/database', () => ({ query: jest.fn() }));
jest.mock('../services/ai.service', () => ({ generate: jest.fn() }));
jest.mock('../services/user.service', () => ({
  getRemainingCount: jest.fn(),
  incrementUsageCount: jest.fn()
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const db = require('../config/database');
const aiService = require('../services/ai.service');
const userService = require('../services/user.service');
const contentService = require('../services/content.service');

const mockAIResult = {
  titles: ['标题1', '标题2', '标题3'],
  content: '这是生成的正文内容',
  tags: ['#标签1', '#标签2'],
  score: 80,
  aiModel: 'gpt-3.5-turbo',
  tokensUsed: 200,
  generationTime: 1500
};

describe('ContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate()', () => {
    test('次数充足时应正常生成并返回结果', async () => {
      userService.getRemainingCount.mockResolvedValueOnce(2);
      aiService.generate.mockResolvedValueOnce(mockAIResult);
      db.query.mockResolvedValueOnce([{ insertId: 100 }]);
      userService.incrementUsageCount.mockResolvedValueOnce(1);
      userService.getRemainingCount.mockResolvedValueOnce(1);

      const result = await contentService.generate(1, {
        topic: '春季穿搭',
        description: '分享穿搭',
        style: '种草推荐',
        length: 'medium'
      });

      expect(result.id).toBe(100);
      expect(result.titles).toEqual(mockAIResult.titles);
      expect(result.content).toBe(mockAIResult.content);
      expect(result.remainingCount).toBe(1);
    });

    test('次数为0时应抛出错误', async () => {
      userService.getRemainingCount.mockResolvedValueOnce(0);

      await expect(contentService.generate(1, {
        topic: '测试',
        style: '种草推荐',
        length: 'medium'
      })).rejects.toThrow('今日生成次数已用完');

      expect(aiService.generate).not.toHaveBeenCalled();
    });

    test('应传递正确参数给aiService', async () => {
      userService.getRemainingCount.mockResolvedValueOnce(3);
      aiService.generate.mockResolvedValueOnce(mockAIResult);
      db.query.mockResolvedValueOnce([{ insertId: 1 }]);
      userService.incrementUsageCount.mockResolvedValueOnce(1);
      userService.getRemainingCount.mockResolvedValueOnce(2);

      await contentService.generate(1, {
        topic: '护肤好物',
        description: '推荐好用的护肤品',
        style: '好物测评',
        length: 'long'
      });

      expect(aiService.generate).toHaveBeenCalledWith({
        topic: '护肤好物',
        description: '推荐好用的护肤品',
        style: '好物测评',
        length: 'long'
      });
    });

    test('description为undefined时应存null到数据库', async () => {
      userService.getRemainingCount.mockResolvedValueOnce(3);
      aiService.generate.mockResolvedValueOnce(mockAIResult);
      db.query.mockResolvedValueOnce([{ insertId: 1 }]);
      userService.incrementUsageCount.mockResolvedValueOnce(1);
      userService.getRemainingCount.mockResolvedValueOnce(2);

      await contentService.generate(1, { topic: '测试', style: '种草推荐', length: 'short' });

      const insertArgs = db.query.mock.calls[0][1];
      expect(insertArgs[2]).toBeNull();
    });

    test('生成后应调用incrementUsageCount', async () => {
      userService.getRemainingCount.mockResolvedValue(3);
      aiService.generate.mockResolvedValueOnce(mockAIResult);
      db.query.mockResolvedValueOnce([{ insertId: 1 }]);
      userService.incrementUsageCount.mockResolvedValueOnce(1);

      await contentService.generate(1, { topic: '测试', style: '种草推荐', length: 'medium' });

      expect(userService.incrementUsageCount).toHaveBeenCalledWith(1);
    });
  });

  describe('getHistory()', () => {
    const mockRow = {
      id: 1,
      topic: '春季穿搭',
      style: '种草推荐',
      length: 'medium',
      titles: JSON.stringify(['标题1', '标题2', '标题3']),
      content: '正文',
      tags: JSON.stringify(['#t1']),
      score: 80,
      is_collected: 0,
      created_at: '2026-03-27'
    };

    test('应返回分页数据并解析JSON字段', async () => {
      db.query
        .mockResolvedValueOnce([[{ total: 5 }]])
        .mockResolvedValueOnce([[mockRow]]);

      const result = await contentService.getHistory(1, 1, 20);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.list[0].titles).toEqual(['标题1', '标题2', '标题3']);
      expect(result.list[0].tags).toEqual(['#t1']);
    });

    test('按风格筛选时WHERE子句应包含style条件', async () => {
      db.query
        .mockResolvedValueOnce([[{ total: 2 }]])
        .mockResolvedValueOnce([[mockRow]]);

      await contentService.getHistory(1, 1, 20, '种草推荐');

      const countQuery = db.query.mock.calls[0][0];
      expect(countQuery).toContain('style = ?');
      expect(db.query.mock.calls[0][1]).toContain('种草推荐');
    });

    test('第2页的offset应为pageSize', async () => {
      db.query
        .mockResolvedValueOnce([[{ total: 30 }]])
        .mockResolvedValueOnce([[]]);

      await contentService.getHistory(1, 2, 20);

      const listQueryArgs = db.query.mock.calls[1][1];
      expect(listQueryArgs).toContain(20);  // offset = (2-1)*20 = 20
    });
  });

  describe('getById()', () => {
    test('找到文案时应解析JSON字段返回', async () => {
      const mockRow = {
        id: 1,
        titles: JSON.stringify(['t1', 't2', 't3']),
        content: '正文',
        tags: JSON.stringify(['#t1'])
      };
      db.query.mockResolvedValueOnce([[mockRow]]);

      const result = await contentService.getById(1, 1);
      expect(result.titles).toEqual(['t1', 't2', 't3']);
      expect(result.tags).toEqual(['#t1']);
    });

    test('文案不存在时应抛出错误', async () => {
      db.query.mockResolvedValueOnce([[]]);
      await expect(contentService.getById(999, 1)).rejects.toThrow('文案不存在');
    });

    test('应只返回属于该用户的文案', async () => {
      db.query.mockResolvedValueOnce([[]]);
      await contentService.getById(1, 2).catch(() => {});
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 2]
      );
    });
  });

  describe('collect()', () => {
    test('未收藏时应成功收藏', async () => {
      db.query
        .mockResolvedValueOnce([[{
          id: 1,
          titles: JSON.stringify(['t1']),
          tags: JSON.stringify(['#t1']),
          is_collected: 0
        }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      await expect(contentService.collect(1, 1)).resolves.toBeUndefined();
      expect(db.query).toHaveBeenCalledTimes(3);
    });

    test('已收藏时应抛出错误', async () => {
      db.query.mockResolvedValueOnce([[{
        id: 1,
        titles: JSON.stringify(['t1']),
        tags: JSON.stringify(['#t1']),
        is_collected: 1
      }]]);

      await expect(contentService.collect(1, 1)).rejects.toThrow('已经收藏过了');
    });
  });

  describe('uncollect()', () => {
    test('应执行UPDATE和DELETE两条SQL', async () => {
      db.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      await contentService.uncollect(1, 1);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query.mock.calls[0][0]).toContain('is_collected = 0');
      expect(db.query.mock.calls[1][0]).toContain('DELETE FROM collections');
    });
  });

  describe('getCollections()', () => {
    test('应返回分页的收藏列表并解析JSON字段', async () => {
      db.query
        .mockResolvedValueOnce([[{ total: 3 }]])
        .mockResolvedValueOnce([[{
          id: 1,
          titles: JSON.stringify(['t1', 't2', 't3']),
          tags: JSON.stringify(['#t1']),
          content: '正文',
          collected_at: '2026-03-27'
        }]]);

      const result = await contentService.getCollections(1, 1, 20);
      expect(result.total).toBe(3);
      expect(result.list[0].titles).toEqual(['t1', 't2', 't3']);
    });
  });
});
