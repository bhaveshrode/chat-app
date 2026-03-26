import express from 'express';
import { Chat } from '../models/Chat.js';

export const chatRouter = express.Router();

chatRouter.get('/', async (req, res) => {
    const chats = await Chat.find({ members: req.user.id })
        .populate("members", "_id name email")
        .populate({
            path: "lastMessage",
            populate: {
                path: "senderId",
                select: "name email"
            }
        })
        .sort({ updatedAt: -1 });

    res.json(chats);
});

chatRouter.post('/', async (req, res) => {
    const { name, isGroup = false, memberIds = [] } = req.body;

    const members = [...new Set([req.user.id, ...memberIds])];

    // Check If Chat Already Exists
    let chat = await Chat.findOne({
        members: { $all: members, $size: members.length }
    });

    // If chat does not exist → create new
    if (!chat) {
        chat = await Chat.create({
            name,
            isGroup,
            members,
            createdBy: req.user.id
        });
    }

    res.status(201).json(chat);
});
