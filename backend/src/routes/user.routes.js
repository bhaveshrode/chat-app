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

router.delete("/:id", async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
});

export default router;