import jwt from 'jsonwebtoken';

export const signToken = (payload, secret) => jwt.sign(payload, secret, { expiresIn: '7d' });
export const verifyToken = (token, secret) => jwt.verify(token, secret);
