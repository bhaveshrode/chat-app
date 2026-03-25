import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = (secret) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token, secret);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
