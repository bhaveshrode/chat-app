import express from "express";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = express.Router();

router.get("/", authMiddleware(env.jwtSecret), async (req, res) => {
    const users = await User.find({ _id: { $ne: req.user._id } })
        .select("_id name email");

    res.json(users);
});

export default router;
