const axios = require('axios');
const database = require('./database');
const vectordb = require('./vectordb');
const config = require('../common/config');

class AIService {
  constructor() {
    this.settings = null;
    this.initialized = false;
  }

  // 初始化AI服务
  async init() {
    if (this.initialized) return;

    try {
      // 加载设置
      this.settings = await database.getSettings();
      this.initialized = true;
      console.log('AI服务已初始化');
    } catch (error) {
      console.error('初始化AI服务失败:', error);
      throw error;
    }
  }

  // 检查AI是否已配置
  async isConfigured() {
    await this.init();
    return (
      this.settings &&
      this.settings.ai &&
      this.settings.ai.provider &&
      this.settings.ai.apiKey &&
      this.settings.ai.model
    );
  }

  // 获取API配置
  async getAPIConfig() {
    await this.init();
    
    if (!await this.isConfigured()) {
      throw new Error('AI服务未配置');
    }
    
    const { provider, apiKey, model, embeddingModel, endpoint } = this.settings.ai;
    
    // 获取提供商配置
    const providerConfig = config.aiProviders.find(p => p.id === provider);
    if (!providerConfig) {
      throw new Error(`未知的AI提供商: ${provider}`);
    }
    
    return {
      provider,
      apiKey,
      model,
      embeddingModel,
      endpoint,
      requiresEndpoint: providerConfig.requiresEndpoint
    };
  }

  // 生成文本嵌入
  async generateEmbedding(text) {
    try {
      if (!await this.isConfigured()) {
        throw new Error('AI服务未配置');
      }
      
      const { provider, apiKey, embeddingModel, endpoint, requiresEndpoint } = await this.getAPIConfig();
      
      // 如果没有配置嵌入模型，则返回空向量
      if (!embeddingModel) {
        console.warn('未配置嵌入模型，返回空向量');
        return new Array(1536).fill(0); // 返回默认维度的零向量
      }
      
      let response;
      
      switch (provider) {
        case 'openai':
          response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
              model: embeddingModel,
              input: text
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.data[0].embedding;
          
        case 'azure':
          if (!requiresEndpoint || !endpoint) {
            throw new Error('Azure OpenAI需要配置API端点');
          }
          
          response = await axios.post(
            `${endpoint}/embeddings`,
            {
              model: embeddingModel,
              input: text
            },
            {
              headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.data[0].embedding;
          
        default:
          throw new Error(`不支持的AI提供商: ${provider}`);
      }
    } catch (error) {
      console.error('生成嵌入失败:', error);
      // 在嵌入生成失败时返回空向量，确保应用程序可以继续运行
      return new Array(1536).fill(0);
    }
  }

  // 分析想法并提取标签
  async analyzeIdea(ideaContent) {
    try {
      if (!await this.isConfigured()) {
        // 如果AI未配置，返回基本分析结果
        return {
          tags: this.extractBasicTags(ideaContent),
          summary: null
        };
      }
      
      const { provider, apiKey, model, endpoint, requiresEndpoint } = await this.getAPIConfig();
      
      const prompt = `
分析以下想法，提取关键标签（最多5个），并生成简短摘要（不超过100字）。
仅返回JSON格式，包含tags数组和summary字段。

想法内容:
${ideaContent}

JSON格式示例:
{
  "tags": ["标签1", "标签2", "标签3"],
  "summary": "这是一个简短的摘要..."
}
`;
      
      let response;
      
      switch (provider) {
        case 'openai':
          response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的想法分析助手，擅长提取关键标签和生成摘要。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          break;
          
        case 'azure':
          if (!requiresEndpoint || !endpoint) {
            throw new Error('Azure OpenAI需要配置API端点');
          }
          
          response = await axios.post(
            `${endpoint}/chat/completions`,
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的想法分析助手，擅长提取关键标签和生成摘要。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            {
              headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          break;
          
        case 'anthropic':
          response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model,
              system: '你是一个专业的想法分析助手，擅长提取关键标签和生成摘要。',
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 1000
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              }
            }
          );
          break;
          
        default:
          throw new Error(`不支持的AI提供商: ${provider}`);
      }
      
      // 解析响应
      let content;
      if (provider === 'anthropic') {
        content = response.data.content[0].text;
      } else {
        content = response.data.choices[0].message.content;
      }
      
      // 提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从AI响应中提取JSON');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      return {
        tags: result.tags || [],
        summary: result.summary || null
      };
    } catch (error) {
      console.error('分析想法失败:', error);
      // 在AI分析失败时返回基本分析结果
      return {
        tags: this.extractBasicTags(ideaContent),
        summary: null
      };
    }
  }

  // 基本标签提取（当AI不可用时使用）
  extractBasicTags(text) {
    // 简单的关键词提取逻辑
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['的', '了', '和', '是', '在', '我', '有', '这', '个', '你', '们', '他', '她', '它', '们']);
    
    // 统计词频
    const wordCounts = {};
    for (const word of words) {
      if (word.length > 1 && !stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
    
    // 按频率排序并取前5个
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  // 查找相关想法
  async findRelatedIdeas(ideaContent, ideaId, limit = 5) {
    try {
      // 生成想法的嵌入向量
      const embedding = await this.generateEmbedding(ideaContent);
      
      // 保存嵌入向量
      const vectorId = `idea_${ideaId}`;
      await vectordb.addVector(vectorId, embedding, { ideaId });
      
      // 更新想法记录中的向量ID
      await database.updateIdea(ideaId, { vector_id: vectorId });
      
      // 搜索相似向量
      const similarVectors = await vectordb.searchSimilar(embedding, limit + 1, 0.7);
      
      // 过滤掉当前想法
      const relatedVectorIds = similarVectors
        .filter(item => item.id !== vectorId)
        .slice(0, limit);
      
      // 获取相关想法的详细信息
      const relatedIdeas = [];
      for (const item of relatedVectorIds) {
        const metadata = item.metadata;
        if (metadata && metadata.ideaId) {
          const idea = await database.getIdeaById(metadata.ideaId);
          if (idea) {
            relatedIdeas.push({
              ...idea,
              similarity: item.similarity
            });
          }
        }
      }
      
      return relatedIdeas;
    } catch (error) {
      console.error('查找相关想法失败:', error);
      return [];
    }
  }

  // 生成想法总结
  async generateSummary(ideas, topic = null) {
    try {
      if (!await this.isConfigured() || ideas.length === 0) {
        return null;
      }
      
      const { provider, apiKey, model, endpoint, requiresEndpoint } = await this.getAPIConfig();
      
      // 准备想法内容
      const ideasText = ideas.map((idea, index) => {
        return `想法 ${index + 1}:\n${idea.content}`;
      }).join('\n\n');
      
      const prompt = topic 
        ? `请总结以下关于"${topic}"的想法，提炼核心观点和见解，生成一个简洁的摘要（300字以内）:\n\n${ideasText}`
        : `请总结以下想法，提炼核心观点和见解，生成一个简洁的摘要（300字以内）:\n\n${ideasText}`;
      
      let response;
      
      switch (provider) {
        case 'openai':
          response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的总结助手，擅长提炼核心观点和见解。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.choices[0].message.content;
          
        case 'azure':
          if (!requiresEndpoint || !endpoint) {
            throw new Error('Azure OpenAI需要配置API端点');
          }
          
          response = await axios.post(
            `${endpoint}/chat/completions`,
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的总结助手，擅长提炼核心观点和见解。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            {
              headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.choices[0].message.content;
          
        case 'anthropic':
          response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model,
              system: '你是一个专业的总结助手，擅长提炼核心观点和见解。',
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 1000
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.content[0].text;
          
        default:
          throw new Error(`不支持的AI提供商: ${provider}`);
      }
    } catch (error) {
      console.error('生成总结失败:', error);
      return null;
    }
  }

  // 设置提醒
  async setReminder(ideaId, ideaContent) {
    try {
      if (!await this.isConfigured()) {
        return null;
      }
      
      const { provider, apiKey, model, endpoint, requiresEndpoint } = await this.getAPIConfig();
      
      const prompt = `
分析以下想法内容，判断是否需要设置提醒，如果需要，请确定合适的提醒日期和提醒内容。
仅返回JSON格式，包含needsReminder布尔值，如果为true，则包含reminderDate（ISO格式日期）和message字段。

想法内容:
${ideaContent}

当前日期: ${new Date().toISOString().split('T')[0]}

JSON格式示例:
{
  "needsReminder": true,
  "reminderDate": "2025-04-15T09:00:00Z",
  "message": "提醒你处理这个任务..."
}

或者:
{
  "needsReminder": false
}
`;
      
      let response;
      
      switch (provider) {
        case 'openai':
          response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的日程助手，擅长分析内容并设置合适的提醒。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          break;
          
        case 'azure':
          if (!requiresEndpoint || !endpoint) {
            throw new Error('Azure OpenAI需要配置API端点');
          }
          
          response = await axios.post(
            `${endpoint}/chat/completions`,
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的日程助手，擅长分析内容并设置合适的提醒。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            {
              headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          break;
          
        case 'anthropic':
          response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model,
              system: '你是一个专业的日程助手，擅长分析内容并设置合适的提醒。',
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 1000
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              }
            }
          );
          break;
          
        default:
          throw new Error(`不支持的AI提供商: ${provider}`);
      }
      
      // 解析响应
      let content;
      if (provider === 'anthropic') {
        content = response.data.content[0].text;
      } else {
        content = response.data.choices[0].message.content;
      }
      
      // 提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从AI响应中提取JSON');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      if (result.needsReminder && result.reminderDate && result.message) {
        // 添加提醒
        const reminderId = await database.addReminder(
          ideaId,
          result.reminderDate,
          result.message
        );
        
        return {
          id: reminderId,
          date: result.reminderDate,
          message: result.message
        };
      }
      
      return null;
    } catch (error) {
      console.error('设置提醒失败:', error);
      return null;
    }
  }

  // 回答用户查询
  async answerQuery(query) {
    try {
      if (!await this.isConfigured()) {
        return '请先在设置中配置AI服务，才能使用查询功能。';
      }
      
      const { provider, apiKey, model, endpoint, requiresEndpoint } = await this.getAPIConfig();
      
      // 获取所有想法
      const ideas = await database.getAllIdeas();
      
      // 准备想法内容
      const ideasText = ideas.map((idea, index) => {
        const tagsText = idea.tags.length > 0 ? `[标签: ${idea.tags.join(', ')}]` : '';
        return `想法 ${index + 1} (${new Date(idea.created_at).toLocaleDateString()}) ${tagsText}:\n${idea.content}`;
      }).join('\n\n');
      
      const prompt = `
你是一个知识库助手，负责回答用户关于他们存储的想法的问题。
以下是用户存储的所有想法:

${ideasText}

用户问题: ${query}

请根据上述想法库回答用户问题。如果问题与想法库无关，请礼貌地引导用户询问与想法库相关的问题。
`;
      
      let response;
      
      switch (provider) {
        case 'openai':
          response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的知识库助手，负责回答用户关于他们存储的想法的问题。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.choices[0].message.content;
          
        case 'azure':
          if (!requiresEndpoint || !endpoint) {
            throw new Error('Azure OpenAI需要配置API端点');
          }
          
          response = await axios.post(
            `${endpoint}/chat/completions`,
            {
              model,
              messages: [
                { role: 'system', content: '你是一个专业的知识库助手，负责回答用户关于他们存储的想法的问题。' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7
            },
            {
              headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.choices[0].message.content;
          
        case 'anthropic':
          response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model,
              system: '你是一个专业的知识库助手，负责回答用户关于他们存储的想法的问题。',
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 2000
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
              }
            }
          );
          return response.data.content[0].text;
          
        default:
          throw new Error(`不支持的AI提供商: ${provider}`);
      }
    } catch (error) {
      console.error('回答查询失败:', error);
      return `处理您的查询时出错: ${error.message || '未知错误'}。请稍后重试，或检查AI服务配置。`;
    }
  }
}

// 导出单例实例
const aiService = new AIService();
module.exports = aiService;
