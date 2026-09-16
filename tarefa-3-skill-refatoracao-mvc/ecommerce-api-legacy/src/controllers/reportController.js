const { CourseRepository } = require('../models/repositories');

class ReportController {
  constructor(db) { this.courses = new CourseRepository(db); }
  async execute() {
    const rows = await this.courses.financialReport();
    return rows.map((row) => ({ course: row.course, revenue: row.revenue, students: row.students ? row.students.split(',') : [] }));
  }
}

module.exports = { ReportController };
