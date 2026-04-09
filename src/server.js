// .env config
import dotenv from "dotenv";
dotenv.config();

// NPM Packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
// Routes
import router from "./routes/index.js";
// Models
import "./features/user/models/user.js";
// Database SUPER ADMIN
import initSuperAdmin from "./init.js";

// Create Server
const app = express();
console.log("Creating Server...");

app.use(cors());

// Server Config
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(router);

const __dirname = path.resolve();
app.use("/images", express.static(path.join(__dirname, "public")));

// Database Connect
console.log("Connecting to Database...", process.env.MONGO_DB);
mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true });

// Add the super admin to the database
initSuperAdmin();

// Start Server
app.listen(process.env.PORT, () => {
  console.log(`Server Started on port ${process.env.PORT}`);
});
