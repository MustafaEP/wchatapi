import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.params.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'There are many requests, please wait.' },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
