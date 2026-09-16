function errorHandler(error, _req, res, _next) {
  console.error(error.message);
  res.status(500).json({ error: 'Erro interno' });
}

module.exports = { errorHandler };
