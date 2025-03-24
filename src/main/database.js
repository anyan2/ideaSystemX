// 数据库服务
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbConfig = require('../common/config').sqlite;

class DatabaseService {
  constructor() {
    this.dbPath = path.resolve(dbConfig.path);
    this.ensureDatabaseDirectory();
    this.db = new sqlite3.Database(this.dbPath);
    this.initDatabase();
  }

  ensureDatabaseDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  initDatabase() {
    this.db.serialize(() => {
      // 创建想法表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS ideas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          tags TEXT,
          summary TEXT
        )
      `);

      // 创建标签表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 创建想法-标签关联表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS idea_tags (
          idea_id INTEGER,
          tag_id INTEGER,
          PRIMARY KEY (idea_id, tag_id),
          FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
        )
      `);

      // 创建提醒表
      this.db.run(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          idea_id INTEGER,
          reminder_date TIMESTAMP NOT NULL,
          message TEXT,
          is_completed BOOLEAN DEFAULT 0,
          FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE
        )
      `);
    });
  }

  // 保存新想法
  saveIdea(idea) {
    return new Promise((resolve, reject) => {
      const { content, tags } = idea;
      const tagsJson = tags ? JSON.stringify(tags) : null;
      
      this.db.run(
        `INSERT INTO ideas (content, tags) VALUES (?, ?)`,
        [content, tagsJson],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID, content, tags });
        }
      );
    });
  }

  // 获取所有想法
  getAllIdeas() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ideas ORDER BY created_at DESC`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 解析标签JSON
        const ideas = rows.map(row => ({
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : []
        }));
        
        resolve(ideas);
      });
    });
  }

  // 按ID获取想法
  getIdeaById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM ideas WHERE id = ?`, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        // 解析标签JSON
        const idea = {
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : []
        };
        
        resolve(idea);
      });
    });
  }

  // 更新想法
  updateIdea(id, updates) {
    return new Promise((resolve, reject) => {
      const { content, tags, summary } = updates;
      const tagsJson = tags ? JSON.stringify(tags) : null;
      
      this.db.run(
        `UPDATE ideas SET content = ?, tags = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [content, tagsJson, summary, id],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            reject(new Error('想法不存在'));
            return;
          }
          
          resolve({ id, ...updates });
        }
      );
    });
  }

  // 删除想法
  deleteIdea(id) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ideas WHERE id = ?`, [id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          reject(new Error('想法不存在'));
          return;
        }
        
        resolve({ id });
      });
    });
  }

  // 按标签搜索想法
  searchIdeasByTag(tag) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM ideas WHERE tags LIKE ? ORDER BY created_at DESC`,
        [`%${tag}%`],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          // 解析标签JSON并过滤确保标签完全匹配
          const ideas = rows
            .map(row => ({
              ...row,
              tags: row.tags ? JSON.parse(row.tags) : []
            }))
            .filter(idea => idea.tags.includes(tag));
          
          resolve(ideas);
        }
      );
    });
  }

  // 按内容搜索想法
  searchIdeasByContent(query) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM ideas WHERE content LIKE ? ORDER BY created_at DESC`,
        [`%${query}%`],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          // 解析标签JSON
          const ideas = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : []
          }));
          
          resolve(ideas);
        }
      );
    });
  }

  // 关闭数据库连接
  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();
