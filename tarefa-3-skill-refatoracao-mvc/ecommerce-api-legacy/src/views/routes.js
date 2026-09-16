const express = require('express');

function send(res, result) { return typeof result.body === 'string' ? res.status(result.status).send(result.body) : res.status(result.status).json(result.body); }
function createRouter(controllers) {
  const router = express.Router();
  router.post('/api/checkout', async (req, res, next) => { try { send(res, await controllers.checkout.execute(req.body)); } catch (error) { next(error); } });
  router.get('/api/admin/financial-report', async (_req, res, next) => { try { res.json(await controllers.reports.execute()); } catch (error) { next(error); } });
  router.delete('/api/users/:id', async (req, res, next) => { try { send(res, await controllers.users.delete(req.params.id, req.get('X-Admin-Token'))); } catch (error) { next(error); } });
  router.get('/health', (_req, res) => res.json({ status: 'ok' }));
  return router;
}

module.exports = { createRouter };
