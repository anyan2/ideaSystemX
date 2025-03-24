// 向量数据库服务
const fs = require('fs');
const path = require('path');
const dbConfig = require('../common/config').vector;

class VectorDatabaseService {
  constructor() {
    this.dbPath = path.resolve(dbConfig.path);
    this.dimensions = dbConfig.dimensions;
    this.ensureDatabaseDirectory();
    this.vectors = this.loadVectors();
  }

  ensureDatabaseDirectory() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
    
    // 创建向量索引文件
    const indexPath = path.join(this.dbPath, 'index.json');
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, JSON.stringify({ vectors: [] }));
    }
  }

  loadVectors() {
    try {
      const indexPath = path.join(this.dbPath, 'index.json');
      const data = fs.readFileSync(indexPath, 'utf8');
      return JSON.parse(data).vectors;
    } catch (error) {
      console.error('加载向量数据库失败:', error);
      return [];
    }
  }

  saveVectors() {
    try {
      const indexPath = path.join(this.dbPath, 'index.json');
      fs.writeFileSync(indexPath, JSON.stringify({ vectors: this.vectors }));
    } catch (error) {
      console.error('保存向量数据库失败:', error);
    }
  }

  // 添加向量
  addVector(ideaId, vector, metadata = {}) {
    if (!Array.isArray(vector) || vector.length !== this.dimensions) {
      throw new Error(`向量维度必须为 ${this.dimensions}`);
    }

    const vectorData = {
      id: ideaId,
      vector,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    };

    // 检查是否已存在相同ID的向量
    const existingIndex = this.vectors.findIndex(v => v.id === ideaId);
    if (existingIndex !== -1) {
      this.vectors[existingIndex] = vectorData;
    } else {
      this.vectors.push(vectorData);
    }

    this.saveVectors();
    return vectorData;
  }

  // 删除向量
  deleteVector(ideaId) {
    const initialLength = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.id !== ideaId);
    
    if (this.vectors.length !== initialLength) {
      this.saveVectors();
      return true;
    }
    
    return false;
  }

  // 计算余弦相似度
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // 搜索相似向量
  searchSimilarVectors(queryVector, limit = 10) {
    if (!Array.isArray(queryVector) || queryVector.length !== this.dimensions) {
      throw new Error(`查询向量维度必须为 ${this.dimensions}`);
    }

    // 计算所有向量与查询向量的相似度
    const similarities = this.vectors.map(item => ({
      id: item.id,
      similarity: this.cosineSimilarity(queryVector, item.vector),
      metadata: item.metadata
    }));

    // 按相似度降序排序并返回前N个结果
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // 获取所有向量
  getAllVectors() {
    return this.vectors;
  }

  // 获取特定ID的向量
  getVector(ideaId) {
    return this.vectors.find(v => v.id === ideaId);
  }
}

module.exports = new VectorDatabaseService();
