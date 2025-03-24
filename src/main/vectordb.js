const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const config = require('../common/config');

class VectorDatabase {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), config.database.vectorFilename);
    this.vectors = {};
    this.initialized = false;
  }

  // 初始化向量数据库
  async init() {
    if (this.initialized) return;

    try {
      // 确保目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 如果向量数据库文件存在，则加载它
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.vectors = JSON.parse(data);
      }

      this.initialized = true;
      console.log('向量数据库已初始化');
    } catch (error) {
      console.error('初始化向量数据库失败:', error);
      throw error;
    }
  }

  // 保存向量数据库到文件
  async save() {
    try {
      await this.init();
      fs.writeFileSync(this.dbPath, JSON.stringify(this.vectors, null, 2), 'utf8');
    } catch (error) {
      console.error('保存向量数据库失败:', error);
      throw error;
    }
  }

  // 添加向量
  async addVector(id, vector, metadata = {}) {
    try {
      await this.init();
      this.vectors[id] = {
        vector,
        metadata,
        timestamp: new Date().toISOString()
      };
      await this.save();
      return id;
    } catch (error) {
      console.error('添加向量失败:', error);
      throw error;
    }
  }

  // 获取向量
  async getVector(id) {
    try {
      await this.init();
      return this.vectors[id] || null;
    } catch (error) {
      console.error('获取向量失败:', error);
      throw error;
    }
  }

  // 更新向量
  async updateVector(id, vector, metadata = {}) {
    try {
      await this.init();
      if (!this.vectors[id]) {
        throw new Error(`向量 ${id} 不存在`);
      }
      
      this.vectors[id] = {
        vector,
        metadata: { ...this.vectors[id].metadata, ...metadata },
        timestamp: new Date().toISOString()
      };
      
      await this.save();
      return id;
    } catch (error) {
      console.error('更新向量失败:', error);
      throw error;
    }
  }

  // 删除向量
  async deleteVector(id) {
    try {
      await this.init();
      if (this.vectors[id]) {
        delete this.vectors[id];
        await this.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除向量失败:', error);
      throw error;
    }
  }

  // 计算余弦相似度
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('向量维度不匹配');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  // 搜索相似向量
  async searchSimilar(queryVector, limit = 10, threshold = 0.7) {
    try {
      await this.init();
      
      const results = [];
      
      for (const [id, data] of Object.entries(this.vectors)) {
        const similarity = this.cosineSimilarity(queryVector, data.vector);
        
        if (similarity >= threshold) {
          results.push({
            id,
            similarity,
            metadata: data.metadata,
            timestamp: data.timestamp
          });
        }
      }
      
      // 按相似度降序排序
      results.sort((a, b) => b.similarity - a.similarity);
      
      // 返回前limit个结果
      return results.slice(0, limit);
    } catch (error) {
      console.error('搜索相似向量失败:', error);
      throw error;
    }
  }

  // 获取所有向量
  async getAllVectors() {
    try {
      await this.init();
      return this.vectors;
    } catch (error) {
      console.error('获取所有向量失败:', error);
      throw error;
    }
  }

  // 获取向量数量
  async getCount() {
    try {
      await this.init();
      return Object.keys(this.vectors).length;
    } catch (error) {
      console.error('获取向量数量失败:', error);
      throw error;
    }
  }

  // 清空向量数据库
  async clear() {
    try {
      this.vectors = {};
      await this.save();
      console.log('向量数据库已清空');
      return true;
    } catch (error) {
      console.error('清空向量数据库失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
const vectorDatabase = new VectorDatabase();
module.exports = vectorDatabase;
