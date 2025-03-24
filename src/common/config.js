module.exports = {
  database: {
    filename: 'ideaSystemX.db',
    vectorFilename: 'ideaSystemX_vectors.json'
  },
  
  defaultSettings: {
    theme: 'light',
    language: 'zh-CN',
    ai: {
      provider: '',
      apiKey: '',
      model: '',
      embeddingModel: '',
      endpoint: ''
    }
  },
  
  aiProviders: [
    {
      id: 'openai',
      name: 'OpenAI',
      requiresEndpoint: false,
      models: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ],
      embeddingModels: [
        { id: 'text-embedding-3-small', name: 'Text Embedding 3 Small' },
        { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large' },
        { id: 'text-embedding-ada-002', name: 'Text Embedding Ada 002' }
      ]
    },
    {
      id: 'azure',
      name: 'Azure OpenAI',
      requiresEndpoint: true,
      models: [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo' }
      ],
      embeddingModels: [
        { id: 'text-embedding-ada-002', name: 'Text Embedding Ada 002' }
      ]
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      requiresEndpoint: false,
      models: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        { id: 'claude-2.1', name: 'Claude 2.1' },
        { id: 'claude-2.0', name: 'Claude 2.0' },
        { id: 'claude-instant-1.2', name: 'Claude Instant 1.2' }
      ],
      embeddingModels: []
    }
  ]
};
