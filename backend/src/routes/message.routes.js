import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Message } from '../models/Message.js';

export const messageRouter = (uploadDir) => {
  const router = express.Router();

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  });

  const upload = multer({ storage });

  router.get('/:chatId', async (req, res) => {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  });

  router.get('/:chatId/search/:q', async (req, res) => {
    const regex = new RegExp(req.params.q, 'i');
    const messages = await Message.find({ chatId: req.params.chatId, text: regex }).sort({ createdAt: -1 });
    res.json(messages);
  });

  router.post('/:chatId', upload.single('file'), async (req, res) => {
    const message = await Message.create({
      chatId: req.params.chatId,
      senderId: req.user.id,
      text: req.body.text,
      fileUrl: req.file ? path.join('/', uploadDir, req.file.filename) : undefined,
      fileType: req.file?.mimetype,
      seenBy: [req.user.id]
    });

    res.status(201).json(message);
  });

  return router;
};
