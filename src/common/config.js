// 配置文件
module.exports = {
  // 应用程序设置
  app: {
    name: 'ideaSystemX',
    version: '1.0.0',
    description: '智能知识库系统，用于记录、管理和分析想法'
  },
  
  // 数据库设置
  database: {
    // SQLite数据库文件名
    filename: 'ideas.db',
    // 向量数据库文件名
    vectorFilename: 'vectors.json'
  },
  
  // AI服务提供商
  aiProviders: [
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' }
      ],
      embeddingModels: [
        { id: 'text-embedding-ada-002', name: 'Ada Embedding' }
      ],
      requiresEndpoint: false
    },
    {
      id: 'azure',
      name: 'Azure OpenAI',
      models: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' }
      ],
      embeddingModels: [
        { id: 'text-embedding-ada-002', name: 'Ada Embedding' }
      ],
      requiresEndpoint: true
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: [
        { id: 'claude-2', name: 'Claude 2' },
        { id: 'claude-instant-1', name: 'Claude Instant' }
      ],
      embeddingModels: [],
      requiresEndpoint: false
    }
  ],
  
  // 默认设置
  defaultSettings: {
    theme: 'light', // 'light' 或 'dark'
    startWithSystem: true, // 是否随系统启动
    minimizeToTray: true, // 关闭窗口时最小化到系统托盘
    ai: {
      provider: '', // 默认为空，用户需要配置
      apiKey: '',
      model: '',
      embeddingModel: '',
      endpoint: '' // 仅Azure需要
    }
  }
};
