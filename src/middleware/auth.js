export function apiKeyAuth(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) {
    return next();
  }
  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided !== expected) {
    return res.status(401).json({ error: 'API key required or invalid.' });
  }
  next();
}
