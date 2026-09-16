function loadConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    databasePath: process.env.DATABASE_PATH || ':memory:',
    paymentGatewayKey: process.env.PAYMENT_GATEWAY_KEY || null,
    adminToken: process.env.ADMIN_TOKEN || null,
  };
}

module.exports = { loadConfig };
