import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

router.get("/download", (req, res) => {
    const filePath = req.query.file;

    if (!filePath) {
        return res.status(400).json({ message: "File path required" });
    }

    const absolutePath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: "File not found" });
    }

    res.download(absolutePath);
});

export default router;