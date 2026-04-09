import express from "express";
const router = express.Router();

import version from "./version.js";
import authRoute from "../features/auth/routes/auth_route.js";
import realEstateRoute from "../features/real_estate/routes/real_estate_route.js";

// Routes
router.use(version);
router.use(authRoute);
router.use(realEstateRoute);

export default router;
