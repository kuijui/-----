process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';
process.env.QWEN_API_KEY = 'test-qwen-key';

jest.mock('axios');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const axios = require('axios');
const logger = require('../utils/logger');
const aiService = require('../services/ai.service');

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildPrompt()', () => {
    test('应该替换topic和description占位符', () => {
      const prompt = aiService.buildPrompt('种草推荐', '春季穿搭', '分享穿搭技巧', 'medium');
      expect(prompt).toContain('春季穿搭');
      expect(prompt).toContain('分享穿搭技巧');
      expect(prompt).toContain('文案长度控制在100-200字');
    });

    test('description为空时应使用"无"', () => {
      const prompt = aiService.buildPrompt('干货分享', '测试主题', '', 'short');
      expect(prompt).toContain('无');
      expect(prompt).toContain('文案长度控制在50-100字');
    });

    test('未知风格应fallback到种草推荐模板', () => {
      const seedPrompt = aiService.buildPrompt('种草推荐', '主题', '描述', 'medium');
      const unknownPrompt = aiService.buildPrompt('未知风格', '主题', '描述', 'medium');
      expect(unknownPrompt).toBe(seedPrompt);
    });

    test('length为long时应包含200-400字指引', () => {
      const prompt = aiService.buildPrompt('生活日常', '主题', '描述', 'long');
      expect(prompt).toContain('文案长度控制在200-400字');
    });

    test('未知length应fallback到medium', () => {
      const prompt = aiService.buildPrompt('种草推荐', '主题', '描述', 'unknown');
      expect(prompt).toContain('文案长度控制在100-200字');
    });

    test('6种风格都应各自有独立模板', () => {
      const styles = ['种草推荐', '干货分享', '好物测评', '生活日常', '情感共鸣', '搞笑幽默'];
      const prompts = styles.map(s => aiService.buildPrompt(s, '主题', '', 'medium'));
      const uniquePrompts = new Set(prompts);
      expect(uniquePrompts.size).toBe(6);
    });
  });

  describe('parseAIResponse()', () => {
    test('应该正确解析标准JSON格式', () => {
      const raw = JSON.stringify({
        titles: ['标题1', '标题2', '标题3'],
        content: '正文内容',
        tags: ['#标签1', '#标签2']
      });
      const result = aiService.parseAIResponse(raw);
      expect(result.titles).toHaveLength(3);
      expect(result.content).toBe('正文内容');
      expect(result.tags).toHaveLength(2);
    });

    test('应该从混合文本中提取JSON', () => {
      const raw = `这是一些前缀文字 {"titles":["t1","t2","t3"],"content":"正文","tags":["#t1"]} 这是后缀`;
      const result = aiService.parseAIResponse(raw);
      expect(result.titles).toEqual(['t1', 't2', 't3']);
    });

    test('JSON中缺少titles时应抛出错误', () => {
      const raw = JSON.stringify({ content: '正文', tags: ['#t1'] });
      expect(() => aiService.parseAIResponse(raw)).toThrow('AI返回格式错误，请重试');
    });

    test('JSON中缺少content时应抛出错误', () => {
      const raw = JSON.stringify({ titles: ['t1'], tags: ['#t1'] });
      expect(() => aiService.parseAIResponse(raw)).toThrow('AI返回格式错误，请重试');
    });

    test('JSON中缺少tags时应抛出错误', () => {
      const raw = JSON.stringify({ titles: ['t1'], content: '正文' });
      expect(() => aiService.parseAIResponse(raw)).toThrow('AI返回格式错误，请重试');
    });

    test('完全无效文本应抛出错误', () => {
      expect(() => aiService.parseAIResponse('这根本不是JSON')).toThrow('AI返回格式错误，请重试');
    });
  });

  describe('calculateScore()', () => {
    test('基础分应为60', () => {
      const score = aiService.calculateScore('短文案', ['#t1']);
      expect(score).toBe(60);
    });

    test('内容超过100字应加10分', () => {
      const longContent = 'a'.repeat(101);
      const score = aiService.calculateScore(longContent, ['#t1']);
      expect(score).toBe(70);
    });

    test('内容超过200字应再加5分', () => {
      const longContent = 'a'.repeat(201);
      const score = aiService.calculateScore(longContent, ['#t1']);
      expect(score).toBe(75);
    });

    test('有emoji应加5分', () => {
      const score = aiService.calculateScore('内容🌸', ['#t1']);
      expect(score).toBeGreaterThan(60);
    });

    test('标签>=5个应加10分', () => {
      const score = aiService.calculateScore('短内容', ['#t1', '#t2', '#t3', '#t4', '#t5']);
      expect(score).toBe(70);
    });

    test('包含"姐妹"应加5分', () => {
      const score = aiService.calculateScore('姐妹们快来看', ['#t1']);
      expect(score).toBeGreaterThan(60);
    });

    test('包含感叹号应加5分', () => {
      const score = aiService.calculateScore('超好用！', ['#t1']);
      expect(score).toBeGreaterThan(60);
    });

    test('最高分不超过95', () => {
      const perfect = '姐妹们！🌸'.repeat(50);
      const tags = ['#t1', '#t2', '#t3', '#t4', '#t5'];
      const score = aiService.calculateScore(perfect, tags);
      expect(score).toBeLessThanOrEqual(95);
    });
  });

  describe('generateWithOpenAI()', () => {
    test('调用成功时应返回content和tokensUsed', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: '{"titles":["t1","t2","t3"],"content":"正文","tags":["#t1"]}' } }],
          usage: { total_tokens: 200 }
        }
      });

      const result = await aiService.generateWithOpenAI('test prompt');
      expect(result.content).toContain('titles');
      expect(result.tokensUsed).toBe(200);
      expect(result.model).toBe('gpt-3.5-turbo');
    });

    test('API调用失败时应抛出错误', async () => {
      axios.post.mockRejectedValueOnce(new Error('network error'));
      await expect(aiService.generateWithOpenAI('test')).rejects.toThrow('AI生成失败，请稍后重试');
    });
  });

  describe('generateWithQwen()', () => {
    test('调用成功时应返回content和tokensUsed', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          output: { text: '{"titles":["t1","t2","t3"],"content":"正文","tags":["#t1"]}' },
          usage: { total_tokens: 180 }
        }
      });

      const result = await aiService.generateWithQwen('test prompt');
      expect(result.content).toContain('titles');
      expect(result.tokensUsed).toBe(180);
      expect(result.model).toBe('qwen-turbo');
    });

    test('API调用失败时应抛出错误', async () => {
      axios.post.mockRejectedValueOnce(new Error('network error'));
      await expect(aiService.generateWithQwen('test')).rejects.toThrow('AI生成失败，请稍后重试');
    });
  });

  describe('generate() - 核心生成方法', () => {
    const mockOpenAIResponse = {
      data: {
        choices: [{ message: { content: '{"titles":["标题1","标题2","标题3"],"content":"这是正文内容，超过一百字的长度姐妹们！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！","tags":["#标签1","#标签2","#标签3","#标签4","#标签5"]}' } }],
        usage: { total_tokens: 300 }
      }
    };

    test('应返回完整的生成结果结构', async () => {
      axios.post.mockResolvedValueOnce(mockOpenAIResponse);
      const result = await aiService.generate({
        topic: '春季穿搭',
        style: '种草推荐',
        length: 'medium'
      });

      expect(result).toHaveProperty('titles');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('aiModel');
      expect(result).toHaveProperty('tokensUsed');
      expect(result).toHaveProperty('generationTime');
      expect(result.titles).toHaveLength(3);
    });

    test('OpenAI失败时应自动切换到通义千问', async () => {
      axios.post
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockResolvedValueOnce({
          data: {
            output: { text: '{"titles":["t1","t2","t3"],"content":"正文内容","tags":["#t1","#t2","#t3","#t4","#t5"]}' },
            usage: { total_tokens: 150 }
          }
        });

      const result = await aiService.generate({
        topic: '测试',
        style: '干货分享',
        length: 'short'
      });

      expect(result.aiModel).toBe('qwen-turbo');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('OpenAI失败'),
        expect.any(Object)
      );
    });

    test('两个AI都未配置时应抛出错误', async () => {
      const savedOpenai = aiService.openaiApiKey;
      const savedQwen = aiService.qwenApiKey;
      aiService.openaiApiKey = null;
      aiService.qwenApiKey = null;

      await expect(aiService.generate({ topic: '测试', style: '种草推荐', length: 'medium' }))
        .rejects.toThrow('未配置AI服务，请检查环境变量');

      aiService.openaiApiKey = savedOpenai;
      aiService.qwenApiKey = savedQwen;
    });

    test('generationTime应为正数', async () => {
      axios.post.mockResolvedValueOnce(mockOpenAIResponse);
      const result = await aiService.generate({ topic: '测试', style: '种草推荐', length: 'medium' });
      expect(result.generationTime).toBeGreaterThanOrEqual(0);
    });
  });
});
