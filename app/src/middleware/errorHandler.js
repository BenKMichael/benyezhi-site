module.exports = function errorHandler(err, req, res, next) {
  console.error(err);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
  res.status(500).send('Internal Server Error');
};
