// NPM Packages
import express from "express";
import multer from "multer";
import { verifyToken, realEstateUpload, requireRole } from "../../../middlewares/index.js";
// Controller
import realEstateController from "../controllers/real_estate_controller.js";

const router = express.Router();

// Uploads are held in memory only long enough to forward them to the image
// service. Without a limit a single large video would grow the heap until the
// process dies, so this caps a request at roughly what the image service will
// accept anyway.
const MAX_UPLOAD = 300 * 1024 * 1024;

const tempMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD, files: 11 },
});

const uploadFields = tempMulter.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.get("/real_estate", realEstateController.get);
router.get("/real_estate/:_id", realEstateController.getById);
router.post("/real_estate", verifyToken, uploadFields, realEstateUpload, realEstateController.create);
router.put("/real_estate/:_id", verifyToken, uploadFields, realEstateUpload, realEstateController.update);
router.delete("/real_estate/:_id", verifyToken, realEstateController.remove);
//
router.post("/real_estate/oldDB/import", verifyToken, requireRole("super_admin"), realEstateController.importOldDB);

export default router;
