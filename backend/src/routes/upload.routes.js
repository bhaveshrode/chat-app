import express from "express";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", upload.single("file"), (req, res) => {
    res.json({
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype
    });
});

export default router;