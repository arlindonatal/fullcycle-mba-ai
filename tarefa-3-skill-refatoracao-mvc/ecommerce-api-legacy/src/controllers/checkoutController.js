const { UserRepository, CourseRepository } = require('../models/repositories');
const { hashPassword } = require('../services/passwordService');
const { PaymentService } = require('../services/paymentService');

class CheckoutController {
  constructor(db, config) { this.db = db; this.users = new UserRepository(db); this.courses = new CourseRepository(db); this.payments = new PaymentService(config.paymentGatewayKey); }
  async execute(body) {
    const { usr: name, eml: email, pwd: password, c_id: courseId, card } = body || {};
    if (!name || !email || !password || !courseId || !card) return { status: 400, body: 'Bad Request' };
    const course = await this.courses.active(courseId);
    if (!course) return { status: 404, body: 'Curso não encontrado' };
    const authorization = this.payments.authorize(card);
    if (authorization.status === 'DENIED') return { status: 400, body: 'Pagamento recusado' };
    const result = await this.db.transaction(async (tx) => {
      let user = await tx.get('SELECT id FROM users WHERE email = ?', [email]);
      if (!user) user = { id: (await tx.run('INSERT INTO users (name, email, pass) VALUES (?, ?, ?)', [name, email, hashPassword(password)])).lastID };
      const enrollmentId = (await tx.run('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [user.id, courseId])).lastID;
      await tx.run('INSERT INTO payments (enrollment_id, amount, status) VALUES (?, ?, ?)', [enrollmentId, course.price, authorization.status]);
      await tx.run("INSERT INTO audit_logs (action, created_at) VALUES (?, datetime('now'))", [`Checkout curso ${courseId} por ${user.id}; cartão final ${authorization.last4}`]);
      return enrollmentId;
    });
    return { status: 200, body: { msg: 'Sucesso', enrollment_id: result } };
  }
}

module.exports = { CheckoutController };
