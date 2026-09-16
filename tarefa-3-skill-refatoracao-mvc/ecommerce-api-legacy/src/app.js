const express = require('express');
const { loadConfig } = require('./config/settings');
const { Database } = require('./models/database');
const { CheckoutController } = require('./controllers/checkoutController');
const { ReportController } = require('./controllers/reportController');
const { UserController } = require('./controllers/userController');
const { createRouter } = require('./views/routes');
const { errorHandler } = require('./middlewares/errorHandler');

async function createApp(overrides = {}) {
  const config = { ...loadConfig(), ...overrides };
  const database = new Database(config.databasePath);
  await database.initialize();
  const app = express();
  app.use(express.json());
  app.use(createRouter({
    checkout: new CheckoutController(database, config),
    reports: new ReportController(database),
    users: new UserController(database, config),
  }));
  app.use(errorHandler);
  app.locals.database = database;
  return app;
}

if (require.main === module) {
  createApp().then((app) => app.listen(loadConfig().port, () => console.log(`LMS API rodando na porta ${loadConfig().port}`)));
}

module.exports = { createApp };
