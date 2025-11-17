import express from "express";
import { sendMessage, getAllMessages } from "../controller/messageController.js";
import { isAdminAuthenticated } from "../middelwares/auth.js";

const router = express.Router();

router.post("/send", sendMessage);
router.get("/getAll", isAdminAuthenticated, getAllMessages);

export default router;