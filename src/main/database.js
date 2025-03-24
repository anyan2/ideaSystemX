const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const config = require('../common/config');

class Database {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), config.database.filename);
    this.db = null;
    this.initialized = false;
  }

  // 初始化数据库
  async init() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      // 确保目录存在
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('数据库连接失败:', err.message);
          reject(err);
          return;
        }

        console.log('已连接到SQLite数据库');
        this.createTables()
          .then(() => {
            this.initialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }

  // 创建数据表
  async createTables() {
    const queries = [
      // 想法表
      `CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        summary TEXT,
        vector_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 标签表
      `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`,
      
      // 想法-标签关联表
      `CREATE TABLE IF NOT EXISTS idea_tags (
        idea_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (idea_id, tag_id),
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      )`,
      
      // 提醒表
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idea_id INTEGER,
        reminder_date DATETIME NOT NULL,
        message TEXT,
        is_completed BOOLEAN DEFAULT 0,
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
      )`,
      
      // 设置表
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        settings_json TEXT NOT NULL
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }
  }

  // 执行SQL语句（无返回结果）
  async run(sql, params = []) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL执行错误:', err.message);
          reject(err);
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  // 执行SQL查询（返回单行结果）
  async get(sql, params = []) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('SQL查询错误:', err.message);
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  // 执行SQL查询（返回多行结果）
  async all(sql, params = []) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL查询错误:', err.message);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  // 保存想法
  async saveIdea(idea) {
    try {
      // 开始事务
      await this.run('BEGIN TRANSACTION');
      
      // 插入想法
      const result = await this.run(
        'INSERT INTO ideas (content, summary, vector_id) VALUES (?, ?, ?)',
        [idea.content, idea.summary || null, idea.vector_id || null]
      );
      
      const ideaId = result.lastID;
      
      // 处理标签
      if (idea.tags && Array.isArray(idea.tags) && idea.tags.length > 0) {
        for (const tagName of idea.tags) {
          // 查找或创建标签
          let tagId;
          const existingTag = await this.get('SELECT id FROM tags WHERE name = ?', [tagName]);
          
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const tagResult = await this.run('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = tagResult.lastID;
          }
          
          // 关联想法和标签
          await this.run(
            'INSERT INTO idea_tags (idea_id, tag_id) VALUES (?, ?)',
            [ideaId, tagId]
          );
        }
      }
      
      // 提交事务
      await this.run('COMMIT');
      
      // 返回完整的想法对象
      return await this.getIdeaById(ideaId);
    } catch (error) {
      // 回滚事务
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // 获取所有想法
  async getAllIdeas() {
    const ideas = await this.all(`
      SELECT 
        i.id, 
        i.content, 
        i.summary, 
        i.vector_id, 
        i.created_at, 
        i.updated_at
      FROM ideas i
      ORDER BY i.created_at DESC
    `);
    
    // 为每个想法加载标签
    for (const idea of ideas) {
      idea.tags = await this.getIdeaTags(idea.id);
    }
    
    return ideas;
  }

  // 根据ID获取想法
  async getIdeaById(id) {
    const idea = await this.get(
      'SELECT id, content, summary, vector_id, created_at, updated_at FROM ideas WHERE id = ?',
      [id]
    );
    
    if (!idea) return null;
    
    // 加载标签
    idea.tags = await this.getIdeaTags(id);
    
    return idea;
  }

  // 更新想法
  async updateIdea(id, updates) {
    try {
      // 开始事务
      await this.run('BEGIN TRANSACTION');
      
      // 更新想法基本信息
      const updateFields = [];
      const updateValues = [];
      
      if (updates.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(updates.content);
      }
      
      if (updates.summary !== undefined) {
        updateFields.push('summary = ?');
        updateValues.push(updates.summary);
      }
      
      if (updates.vector_id !== undefined) {
        updateFields.push('vector_id = ?');
        updateValues.push(updates.vector_id);
      }
      
      // 总是更新updated_at字段
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      if (updateFields.length > 0) {
        const sql = `UPDATE ideas SET ${updateFields.join(', ')} WHERE id = ?`;
        updateValues.push(id);
        await this.run(sql, updateValues);
      }
      
      // 更新标签（如果提供了新标签）
      if (updates.tags !== undefined) {
        // 删除现有标签关联
        await this.run('DELETE FROM idea_tags WHERE idea_id = ?', [id]);
        
        // 添加新标签
        if (Array.isArray(updates.tags) && updates.tags.length > 0) {
          for (const tagName of updates.tags) {
            // 查找或创建标签
            let tagId;
            const existingTag = await this.get('SELECT id FROM tags WHERE name = ?', [tagName]);
            
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const tagResult = await this.run('INSERT INTO tags (name) VALUES (?)', [tagName]);
              tagId = tagResult.lastID;
            }
            
            // 关联想法和标签
            await this.run(
              'INSERT INTO idea_tags (idea_id, tag_id) VALUES (?, ?)',
              [id, tagId]
            );
          }
        }
      }
      
      // 提交事务
      await this.run('COMMIT');
      
      // 返回更新后的想法
      return await this.getIdeaById(id);
    } catch (error) {
      // 回滚事务
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // 删除想法
  async deleteIdea(id) {
    try {
      // 开始事务
      await this.run('BEGIN TRANSACTION');
      
      // 删除想法-标签关联
      await this.run('DELETE FROM idea_tags WHERE idea_id = ?', [id]);
      
      // 删除提醒
      await this.run('DELETE FROM reminders WHERE idea_id = ?', [id]);
      
      // 删除想法
      const result = await this.run('DELETE FROM ideas WHERE id = ?', [id]);
      
      // 提交事务
      await this.run('COMMIT');
      
      return result.changes > 0;
    } catch (error) {
      // 回滚事务
      await this.run('ROLLBACK');
      throw error;
    }
  }

  // 获取想法的标签
  async getIdeaTags(ideaId) {
    const rows = await this.all(`
      SELECT t.name
      FROM tags t
      JOIN idea_tags it ON t.id = it.tag_id
      WHERE it.idea_id = ?
    `, [ideaId]);
    
    return rows.map(row => row.name);
  }

  // 获取所有标签
  async getAllTags() {
    const rows = await this.all('SELECT id, name FROM tags ORDER BY name');
    return rows;
  }

  // 搜索想法
  async searchIdeas(query) {
    const searchTerm = `%${query}%`;
    
    const ideas = await this.all(`
      SELECT 
        i.id, 
        i.content, 
        i.summary, 
        i.vector_id, 
        i.created_at, 
        i.updated_at
      FROM ideas i
      WHERE i.content LIKE ? OR i.summary LIKE ?
      ORDER BY i.created_at DESC
    `, [searchTerm, searchTerm]);
    
    // 为每个想法加载标签
    for (const idea of ideas) {
      idea.tags = await this.getIdeaTags(idea.id);
    }
    
    return ideas;
  }

  // 按标签筛选想法
  async getIdeasByTags(tagNames) {
    if (!Array.isArray(tagNames) || tagNames.length === 0) {
      return [];
    }
    
    // 构建查询参数
    const params = tagNames.map(tag => tag);
    
    // 构建查询，要求想法包含所有指定的标签
    const ideas = await this.all(`
      SELECT 
        i.id, 
        i.content, 
        i.summary, 
        i.vector_id, 
        i.created_at, 
        i.updated_at
      FROM ideas i
      WHERE i.id IN (
        SELECT it.idea_id
        FROM idea_tags it
        JOIN tags t ON it.tag_id = t.id
        WHERE t.name IN (${tagNames.map(() => '?').join(',')})
        GROUP BY it.idea_id
        HAVING COUNT(DISTINCT t.name) = ?
      )
      ORDER BY i.created_at DESC
    `, [...params, tagNames.length]);
    
    // 为每个想法加载标签
    for (const idea of ideas) {
      idea.tags = await this.getIdeaTags(idea.id);
    }
    
    return ideas;
  }

  // 保存设置
  async saveSettings(settings) {
    const settingsJson = JSON.stringify(settings);
    
    // 检查设置是否已存在
    const existing = await this.get('SELECT id FROM settings WHERE id = 1');
    
    if (existing) {
      // 更新现有设置
      await this.run('UPDATE settings SET settings_json = ? WHERE id = 1', [settingsJson]);
    } else {
      // 插入新设置
      await this.run('INSERT INTO settings (id, settings_json) VALUES (1, ?)', [settingsJson]);
    }
    
    return settings;
  }

  // 获取设置
  async getSettings() {
    const row = await this.get('SELECT settings_json FROM settings WHERE id = 1');
    
    if (row) {
      return JSON.parse(row.settings_json);
    }
    
    // 返回默认设置
    return config.defaultSettings;
  }

  // 添加提醒
  async addReminder(ideaId, reminderDate, message) {
    const result = await this.run(
      'INSERT INTO reminders (idea_id, reminder_date, message) VALUES (?, ?, ?)',
      [ideaId, reminderDate, message]
    );
    
    return result.lastID;
  }

  // 获取所有提醒
  async getAllReminders() {
    return await this.all(`
      SELECT 
        r.id, 
        r.idea_id, 
        r.reminder_date, 
        r.message, 
        r.is_completed,
        i.content as idea_content
      FROM reminders r
      JOIN ideas i ON r.idea_id = i.id
      ORDER BY r.reminder_date
    `);
  }

  // 获取未完成的提醒
  async getPendingReminders() {
    return await this.all(`
      SELECT 
        r.id, 
        r.idea_id, 
        r.reminder_date, 
        r.message, 
        r.is_completed,
        i.content as idea_content
      FROM reminders r
      JOIN ideas i ON r.idea_id = i.id
      WHERE r.is_completed = 0 AND r.reminder_date <= CURRENT_TIMESTAMP
      ORDER BY r.reminder_date
    `);
  }

  // 标记提醒为已完成
  async completeReminder(id) {
    const result = await this.run(
      'UPDATE reminders SET is_completed = 1 WHERE id = ?',
      [id]
    );
    
    return result.changes > 0;
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
        } else {
          console.log('数据库连接已关闭');
        }
      });
      this.db = null;
      this.initialized = false;
    }
  }
}

// 导出单例实例
const database = new Database();
module.exports = database;
