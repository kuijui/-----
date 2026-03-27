const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    
    this.qwenApiKey = process.env.QWEN_API_KEY;
    this.qwenModel = process.env.QWEN_MODEL || 'qwen-turbo';
    
    this.promptTemplates = {
      '种草推荐': this.getSeedPlantingTemplate(),
      '干货分享': this.getDryGoodsTemplate(),
      '好物测评': this.getReviewTemplate(),
      '生活日常': this.getDailyLifeTemplate(),
      '情感共鸣': this.getEmotionalTemplate(),
      '搞笑幽默': this.getHumorTemplate()
    };
  }

  getSeedPlantingTemplate() {
    return `你是一位专业的小红书博主，擅长写种草推荐类文案。
请根据以下信息生成一篇小红书文案：
主题：{topic}
描述：{description}

要求：
1. 标题要吸引眼球，可以使用emoji，突出产品优势
2. 正文要真诚、接地气，像朋友推荐一样
3. 突出产品/内容的优点和使用体验
4. 适当使用emoji增加活泼感（但不要过多）
5. 结尾要有互动性，引导评论
6. 提供3个不同风格的标题供选择
7. 推荐5-8个相关话题标签

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "titles": ["标题1", "标题2", "标题3"],
  "content": "正文内容",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
}`;
  }

  getDryGoodsTemplate() {
    return `你是一位知识型小红书博主，擅长分享实用干货。
请根据以下信息生成一篇小红书干货文案：
主题：{topic}
描述：{description}

要求：
1. 标题要突出干货价值，让人一看就想收藏
2. 内容要有条理，可以用序号或小标题
3. 提供具体可执行的建议
4. 语言专业但不失亲和力
5. 适当使用emoji作为分隔符
6. 提供3个不同风格的标题
7. 推荐5-8个相关话题标签

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "titles": ["标题1", "标题2", "标题3"],
  "content": "正文内容",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
}`;
  }

  getReviewTemplate() {
    return `你是一位专业的测评博主，擅长写产品测评文案。
请根据以下信息生成一篇小红书测评文案：
主题：{topic}
描述：{description}

要求：
1. 标题要客观真实，突出测评重点
2. 正文要有测评维度（如外观、功能、性价比等）
3. 优缺点都要提到，保持客观
4. 给出明确的推荐建议
5. 适当使用emoji
6. 提供3个不同风格的标题
7. 推荐5-8个相关话题标签

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "titles": ["标题1", "标题2", "标题3"],
  "content": "正文内容",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
}`;
  }

  getDailyLifeTemplate() {
    return `你是一位生活方式博主，擅长记录日常生活。
请根据以下信息生成一篇小红书生活日常文案：
主题：{topic}
描述：{description}

要求：
1. 标题要温馨自然，贴近生活
2. 正文要有画面感，让人身临其境
3. 语言轻松随意，像写日记一样
4. 传递积极正能量
5. 适当使用emoji
6. 提供3个不同风格的标题
7. 推荐5-8个相关话题标签

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "titles": ["标题1", "标题2", "标题3"],
  "content": "正文内容",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
}`;
  }

  getEmotionalTemplate() {
    return `你是一位情感类博主，擅长引发共鸣。
请根据以下信息生成一篇小红书情感文案：
主题：{topic}
描述：{description}

要求：
1. 标题要触动人心，引发共鸣
2. 正文要真诚走心，表达真实情感
3. 可以讲故事，有情节有细节
4. 结尾要有思考或感悟
5. 适当使用emoji
6. 提供3个不同风格的标题
7. 推荐5-8个相关话题标签

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "titles": ["标题1", "标题2", "标题3"],
  "content": "正文内容",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
}`;
  }

  getHumorTemplate() {
    return `你是一位搞笑幽默博主，擅长写有趣的内容。
请根据以下信息生成一篇小红书搞笑文案：
主题：{topic}
描述：{description}

要求：
1. 标题要有梗，让人想点进来
2. 正文要轻松幽默，可以自嘲
3. 可以用夸张的表达方式
4. 让人看了会心一笑
5. 适当使用emoji
6. 提供3个不同风格的标题
7. 推荐5-8个相关话题标签

请严格按照以下JSON格式返回（不要有任何其他文字）：
{
  "titles": ["标题1", "标题2", "标题3"],
  "content": "正文内容",
  "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
}`;
  }

  buildPrompt(style, topic, description, length) {
    const template = this.promptTemplates[style] || this.promptTemplates['种草推荐'];
    
    let prompt = template
      .replace('{topic}', topic)
      .replace('{description}', description || '无');

    const lengthGuide = {
      'short': '文案长度控制在50-100字',
      'medium': '文案长度控制在100-200字',
      'long': '文案长度控制在200-400字'
    };
    
    prompt += `\n\n${lengthGuide[length] || lengthGuide['medium']}`;
    
    return prompt;
  }

  async generateWithOpenAI(prompt) {
    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: this.openaiModel,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的小红书文案创作专家，擅长创作各种风格的爆款文案。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage.total_tokens;
      
      return {
        content,
        tokensUsed,
        model: this.openaiModel
      };
    } catch (error) {
      logger.error('OpenAI API调用失败', error.response?.data || error.message);
      throw new Error('AI生成失败，请稍后重试');
    }
  }

  async generateWithQwen(prompt) {
    try {
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        {
          model: this.qwenModel,
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一位专业的小红书文案创作专家，擅长创作各种风格的爆款文案。'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.8,
            max_tokens: 1000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.qwenApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.output.text;
      const tokensUsed = response.data.usage.total_tokens;
      
      return {
        content,
        tokensUsed,
        model: this.qwenModel
      };
    } catch (error) {
      logger.error('通义千问API调用失败', error.response?.data || error.message);
      throw new Error('AI生成失败，请稍后重试');
    }
  }

  parseAIResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI返回格式错误');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      if (!result.titles || !result.content || !result.tags) {
        throw new Error('AI返回数据不完整');
      }
      
      return result;
    } catch (error) {
      logger.error('解析AI响应失败', { content, error: error.message });
      throw new Error('AI返回格式错误，请重试');
    }
  }

  calculateScore(content, tags) {
    let score = 60;
    
    if (content.length > 100) score += 10;
    if (content.length > 200) score += 5;
    
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 0 && emojiCount < 10) score += 5;
    
    if (tags.length >= 5) score += 10;
    
    if (content.includes('姐妹') || content.includes('宝子')) score += 5;
    
    if (content.includes('！') || content.includes('？')) score += 5;
    
    return Math.min(score, 95);
  }

  async generate(params) {
    const { topic, description = '', style, length } = params;
    
    const startTime = Date.now();
    
    const prompt = this.buildPrompt(style, topic, description, length);
    
    let aiResponse;
    if (this.openaiApiKey) {
      try {
        aiResponse = await this.generateWithOpenAI(prompt);
      } catch (openaiError) {
        if (this.qwenApiKey) {
          logger.info('OpenAI失败，自动切换到通义千问', { reason: openaiError.message });
          aiResponse = await this.generateWithQwen(prompt);
        } else {
          throw openaiError;
        }
      }
    } else if (this.qwenApiKey) {
      aiResponse = await this.generateWithQwen(prompt);
    } else {
      throw new Error('未配置AI服务，请检查环境变量');
    }
    
    const parsed = this.parseAIResponse(aiResponse.content);
    
    const score = this.calculateScore(parsed.content, parsed.tags);
    
    const generationTime = Date.now() - startTime;
    
    return {
      titles: parsed.titles,
      content: parsed.content,
      tags: parsed.tags,
      score,
      aiModel: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      generationTime
    };
  }
}

module.exports = new AIService();
