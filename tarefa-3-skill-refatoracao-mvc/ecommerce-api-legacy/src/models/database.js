const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(path) { this.connection = new sqlite3.Database(path); }
  run(sql, params = []) { return new Promise((resolve, reject) => this.connection.run(sql, params, function (error) { error ? reject(error) : resolve({ lastID: this.lastID, changes: this.changes }); })); }
  get(sql, params = []) { return new Promise((resolve, reject) => this.connection.get(sql, params, (error, row) => error ? reject(error) : resolve(row))); }
  all(sql, params = []) { return new Promise((resolve, reject) => this.connection.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows))); }
  close() { return new Promise((resolve, reject) => this.connection.close((error) => error ? reject(error) : resolve())); }
  async initialize() {
    await this.run('PRAGMA foreign_keys = ON');
    await this.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, pass TEXT)');
    await this.run('CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY, title TEXT, price REAL, active INTEGER)');
    await this.run('CREATE TABLE IF NOT EXISTS enrollments (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER REFERENCES courses(id))');
    await this.run('CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE, amount REAL, status TEXT)');
    await this.run('CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, action TEXT, created_at DATETIME)');
    if ((await this.get('SELECT COUNT(*) total FROM courses')).total === 0) {
      await this.run("INSERT INTO courses (title, price, active) VALUES ('Clean Architecture', 997, 1), ('Docker', 497, 1)");
    }
  }
  async transaction(work) {
    await this.run('BEGIN IMMEDIATE');
    try { const result = await work(this); await this.run('COMMIT'); return result; }
    catch (error) { await this.run('ROLLBACK'); throw error; }
  }
}

module.exports = { Database };
