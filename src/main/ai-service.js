const axios = require('axios');
const Store = require('electron-store');

class AIService {
  constructor() {
    this.store = new Store();
    this.config = this.store.get('settings.ai') || {};
    this.pendingTasks = [];
  }

  // 设置AI配置
  setConfiguration(config) {
    this.config = config;
    console.log('AI服务配置已更新');
  }

  // 检查AI配置是否有效
  checkConfiguration() {
    return !!(this.config && this.config.apiKey && this.config.provider);
  }

  // 生成文本嵌入（向量）
  async generateEmbedding(text) {
    if (!this.checkConfiguration()) {
      throw new Error('AI服务未配置');
    }

    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.generateOpenAIEmbedding(text);
        case 'azure':
          return await this.generateAzureEmbedding(text);
        case 'anthropic':
          // Anthropic目前不直接提供嵌入API，使用替代方案
          return await this.generateSimpleEmbedding(text);
        default:
          return await this.generateSimpleEmbedding(text);
      }
    } catch (error) {
      console.error('生成嵌入失败:', error);
      // 如果API调用失败，使用简单的回退方法
      return this.generateSimpleEmbedding(text);
    }
  }

  // 使用OpenAI生成嵌入
  async generateOpenAIEmbedding(text) {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: this.config.embeddingModel || 'text-embedding-ada-002'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  }

  // 使用Azure OpenAI生成嵌入
  async generateAzureEmbedding(text) {
    if (!this.config.endpoint) {
      throw new Error('Azure OpenAI端点未配置');
    }

    const response = await axios.post(
      `${this.config.endpoint}/embeddings`,
      {
        input: text,
        model: this.config.embeddingModel || 'text-embedding-ada-002'
      },
      {
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  }

  // 简单的嵌入生成方法（作为回退）
  generateSimpleEmbedding(text) {
    // 这是一个非常简化的嵌入生成方法，仅用于演示
    // 实际应用中应使用更复杂的算法或外部API
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const uniqueWords = [...new Set(words)];
    
    // 创建一个300维的向量（实际应用中可能需要更高维度）
    const vector = new Array(300).fill(0);
    
    // 基于单词的简单哈希填充向量
    for (const word of uniqueWords) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash; // 转换为32位整数
      }
      
      // 使用哈希值影响向量的几个位置
      const positions = [
        Math.abs(hash % 300),
        Math.abs((hash >> 8) % 300),
        Math.abs((hash >> 16) % 300)
      ];
      
      for (const pos of positions) {
        vector[pos] += 1;
      }
    }
    
    // 归一化向量
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return vector;
  }

  // 分析想法内容
  async analyzeIdea(content) {
    if (!this.checkConfiguration()) {
      // 如果AI未配置，使用简单的分析方法
      return this.simpleAnalyzeIdea(content);
    }

    try {
      const prompt = `
分析以下文本内容，提取关键信息：

"${content}"

请提供以下信息：
1. 提取5个或更少的相关标签（单个词或短语）
2. 生成一个简短的摘要（不超过100字）

以JSON格式返回结果：
{
  "tags": ["标签1", "标签2", ...],
  "summary": "摘要内容..."
}
`;

      let response;
      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt);
          break;
        case 'azure':
          response = await this.callAzureOpenAI(prompt);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt);
          break;
        default:
          return this.simpleAnalyzeIdea(content);
      }

      // 解析JSON响应
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            tags: Array.isArray(result.tags) ? result.tags : [],
            summary: result.summary || ''
          };
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
      }

      // 如果解析失败，使用简单的分析方法
      return this.simpleAnalyzeIdea(content);
    } catch (error) {
      console.error('分析想法失败:', error);
      return this.simpleAnalyzeIdea(content);
    }
  }

  // 简单的想法分析方法（作为回退）
  simpleAnalyzeIdea(content) {
    // 提取常见词作为标签
    const words = content.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const wordCounts = {};
    
    for (const word of words) {
      if (word.length > 3 && !['this', 'that', 'with', 'from', 'have', 'what', 'when', 'where', 'which'].includes(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
    
    // 按出现频率排序并选择前5个作为标签
    const tags = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // 简单摘要：取前100个字符
    const summary = content.length > 100 ? content.substring(0, 97) + '...' : content;
    
    return { tags, summary };
  }

  // 生成提醒
  async generateReminder(idea) {
    if (!this.checkConfiguration()) {
      return this.simpleGenerateReminder(idea);
    }

    try {
      const prompt = `
基于以下想法内容，判断是否需要设置提醒，如果需要，请生成一个提醒消息和提醒日期：

"${idea.content}"

请考虑以下因素：
1. 想法是否包含需要在未来某个时间点执行的任务
2. 想法是否提到了截止日期或时间点
3. 想法的重要性和紧急程度

以JSON格式返回结果：
{
  "needsReminder": true/false,
  "message": "提醒消息...",
  "daysFromNow": 数字（从现在起多少天后提醒）
}
`;

      let response;
      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt);
          break;
        case 'azure':
          response = await this.callAzureOpenAI(prompt);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt);
          break;
        default:
          return this.simpleGenerateReminder(idea);
      }

      // 解析JSON响应
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          if (result.needsReminder) {
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() + (result.daysFromNow || 1));
            
            return {
              ideaId: idea.id,
              message: result.message,
              reminderDate: reminderDate.toISOString(),
              isCompleted: false
            };
          }
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
      }

      // 如果不需要提醒或解析失败
      return null;
    } catch (error) {
      console.error('生成提醒失败:', error);
      return this.simpleGenerateReminder(idea);
    }
  }

  // 简单的提醒生成方法（作为回退）
  simpleGenerateReminder(idea) {
    // 检查内容中是否包含日期相关关键词
    const dateKeywords = ['明天', '下周', '下个月', '今晚', '稍后', '记得', '提醒', '别忘了', '截止', '期限'];
    
    let needsReminder = false;
    for (const keyword of dateKeywords) {
      if (idea.content.includes(keyword)) {
        needsReminder = true;
        break;
      }
    }
    
    if (needsReminder) {
      // 默认设置为1天后提醒
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 1);
      
      return {
        ideaId: idea.id,
        message: `查看您的想法: "${idea.content.substring(0, 50)}${idea.content.length > 50 ? '...' : ''}"`,
        reminderDate: reminderDate.toISOString(),
        isCompleted: false
      };
    }
    
    return null;
  }

  // 回答用户查询
  async answerQuery(query, ideas) {
    if (!this.checkConfiguration() || !ideas || ideas.length === 0) {
      return '我无法回答您的问题，因为AI服务未配置或知识库为空。';
    }

    try {
      // 准备上下文
      const context = ideas.map(idea => `想法ID ${idea.id}: ${idea.content}`).join('\n\n');
      
      const prompt = `
你是一个知识库助手，负责回答用户关于他们存储的想法的问题。以下是用户存储的想法列表：

${context}

用户问题: "${query}"

请基于上述想法回答用户的问题。如果无法从提供的想法中找到答案，请诚实地告诉用户。回答应该简洁、有帮助且直接基于提供的想法内容。
`;

      let response;
      switch (this.config.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt);
          break;
        case 'azure':
          response = await this.callAzureOpenAI(prompt);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt);
          break;
        default:
          return '抱歉，AI服务提供商配置无效。';
      }

      return response;
    } catch (error) {
      console.error('回答查询失败:', error);
      return `抱歉，处理您的查询时出错: ${error.message}`;
    }
  }

  // 调用OpenAI API
  async callOpenAI(prompt) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个有用的助手，专注于分析和理解用户的想法。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  // 调用Azure OpenAI API
  async callAzureOpenAI(prompt) {
    if (!this.config.endpoint) {
      throw new Error('Azure OpenAI端点未配置');
    }

    const response = await axios.post(
      `${this.config.endpoint}/chat/completions`,
      {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个有用的助手，专注于分析和理解用户的想法。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  // 调用Anthropic API
  async callAnthropic(prompt) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.model || 'claude-2',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.content[0].text;
  }

  // 添加待处理任务
  addPendingTask(task) {
    this.pendingTasks.push(task);
    this.savePendingTasks();
  }

  // 保存待处理任务
  savePendingTasks() {
    this.store.set('pendingAITasks', this.pendingTasks);
  }

  // 加载待处理任务
  loadPendingTasks() {
    this.pendingTasks = this.store.get('pendingAITasks') || [];
    return this.pendingTasks;
  }

  // 处理待处理任务
  async processPendingTasks() {
    if (!this.checkConfiguration()) {
      return { processed: 0, failed: 0 };
    }

    const tasks = this.loadPendingTasks();
    if (tasks.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        switch (task.type) {
          case 'analyze':
            await this.analyzeIdea(task.content);
            processed++;
            break;
          case 'embedding':
            await this.generateEmbedding(task.content);
            processed++;
            break;
          default:
            failed++;
        }
      } catch (error) {
        console.error('处理待处理任务失败:', error);
        failed++;
      }
    }

    // 清除已处理的任务
    this.pendingTasks = [];
    this.savePendingTasks();

    return { processed, failed };
  }
}

// 创建单例实例
const aiService = new AIService();

module.exports = aiService;
