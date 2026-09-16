class UserRepository {
  constructor(db) { this.db = db; }
  findByEmail(email) { return this.db.get('SELECT id, name, email, pass FROM users WHERE email = ?', [email]); }
  create({ name, email, passwordHash }) { return this.db.run('INSERT INTO users (name, email, pass) VALUES (?, ?, ?)', [name, email, passwordHash]); }
  async deleteWithDependencies(id) {
    return this.db.transaction(async (tx) => {
      await tx.run('DELETE FROM payments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = ?)', [id]);
      await tx.run('DELETE FROM enrollments WHERE user_id = ?', [id]);
      return tx.run('DELETE FROM users WHERE id = ?', [id]);
    });
  }
}

class CourseRepository {
  constructor(db) { this.db = db; }
  active(id) { return this.db.get('SELECT * FROM courses WHERE id = ? AND active = 1', [id]); }
  financialReport() { return this.db.all("SELECT c.title course, COALESCE(SUM(CASE WHEN p.status='PAID' THEN p.amount ELSE 0 END),0) revenue, COALESCE(GROUP_CONCAT(u.name), '') students FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id LEFT JOIN users u ON u.id=e.user_id LEFT JOIN payments p ON p.enrollment_id=e.id GROUP BY c.id ORDER BY c.id"); }
}

module.exports = { UserRepository, CourseRepository };
