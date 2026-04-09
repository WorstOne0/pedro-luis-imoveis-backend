// NPM Packages
import express from "express";
import { verifyToken } from "../../../middlewares/index.js";
// Controller
import authController from "../controllers/auth_controller.js";

const router = express.Router();

router.post("/login", authController.login);
router.get("/session", verifyToken, authController.session);

export default router;
