// 数据库服务配置
const dbConfig = {
  // SQLite数据库配置
  sqlite: {
    path: './data/ideas.db',
  },
  // 向量数据库配置（可配置）
  vector: {
    type: 'local', // 'local' 或 'remote'
    path: './data/vector_db',
    dimensions: 1536, // OpenAI嵌入维度
  },
  // AI API配置
  ai: {
    provider: 'openai', // 默认提供商
    apiKey: '', // 用户需要在设置中配置
    model: 'gpt-3.5-turbo', // 默认模型
    embeddingModel: 'text-embedding-ada-002', // 默认嵌入模型
  }
};

module.exports = dbConfig;
