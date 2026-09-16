const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

test('boot, health and checkout contracts', async () => {
  const app = await createApp({ databasePath: ':memory:', adminToken: 'test-token' });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const checkout = await fetch(`${base}/api/checkout`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usr: 'Ana', eml: 'ana@example.com', pwd: 'safe-pass', c_id: 1, card: '4111222233334444' }) });
    assert.equal(checkout.status, 200);
    assert.equal((await fetch(`${base}/api/admin/financial-report`)).status, 200);
    assert.equal((await fetch(`${base}/api/users/1`, { method: 'DELETE' })).status, 403);
  } finally { await new Promise((resolve) => server.close(resolve)); await app.locals.database.close(); }
});
