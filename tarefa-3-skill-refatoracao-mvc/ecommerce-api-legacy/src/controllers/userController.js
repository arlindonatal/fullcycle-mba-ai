const crypto = require('crypto');
const { UserRepository } = require('../models/repositories');

class UserController {
  constructor(db, config) { this.users = new UserRepository(db); this.adminToken = config.adminToken; }
  async delete(id, suppliedToken) {
    const expected = Buffer.from(this.adminToken || '');
    const supplied = Buffer.from(suppliedToken || '');
    if (!expected.length || expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return { status: 403, body: 'Não autorizado' };
    await this.users.deleteWithDependencies(id);
    return { status: 200, body: 'Usuário deletado com suas dependências.' };
  }
}

module.exports = { UserController };
