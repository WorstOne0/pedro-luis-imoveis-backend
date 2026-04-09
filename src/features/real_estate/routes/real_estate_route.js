// NPM Packages
import express from "express";
import multer from "multer";
import { verifyToken, realEstateUpload } from "../../../middlewares/index.js";
// Controller
import realEstateController from "../controllers/real_estate_controller.js";

const router = express.Router();
const tempMulter = multer({ storage: multer.memoryStorage() });
const uploadFields = tempMulter.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.get("/real_estate", realEstateController.get);
router.post("/real_estate/:_id", realEstateController.getById);
router.post("/real_estate", verifyToken, uploadFields, realEstateUpload, realEstateController.create);
router.put("/real_estate", verifyToken, uploadFields, realEstateUpload, realEstateController.update);
//
router.post("/real_estate/oldDB/import", verifyToken, realEstateController.importOldDB);

export default router;
