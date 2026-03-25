import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export const authRouter = (jwtSecret) => {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken({ id: user._id, email: user.email }, jwtSecret);

    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ id: user._id, email: user.email }, jwtSecret);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  });

  return router;
};
