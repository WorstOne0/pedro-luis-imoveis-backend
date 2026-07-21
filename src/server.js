// .env config
import dotenv from "dotenv";
dotenv.config();

// NPM Packages
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import multer from "multer";
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

// Multer rejects oversized or over-count uploads by throwing. Without this the
// dashboard gets Express' default HTML 500 and the broker is told nothing —
// "too many photos" looked identical to a server crash. Mirrors the handler in
// the image service.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "Arquivo maior que 300MB",
      // Sending a thumbnail plus an oversized gallery trips the global file
      // count before the gallery's own maxCount, so this message has to name
      // the real limit too - it is the one the broker actually sees.
      LIMIT_FILE_COUNT: "Máximo de 30 imagens na galeria, além da capa",
      // multer reports exceeding a field's maxCount with this code, so the
      // message names the field rather than guessing at the format.
      LIMIT_UNEXPECTED_FILE:
        error.field === "images" ? "Máximo de 30 imagens na galeria" : `Arquivo inesperado no campo "${error.field}"`,
    };

    return res.status(400).json({ status: 400, message: messages[error.code] ?? "Arquivo inválido" });
  }

  console.log("Error - server.js", error);
  return res.status(500).json({ status: 500, message: "Erro interno" });
});

// Database Connect and Initialize the super admin to the database
console.log("Connecting to Database...", process.env.MONGO_DB);
mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true }).then(() => initSuperAdmin());

// Start Server
app.listen(process.env.PORT, () => {
  console.log(`Server Started on port ${process.env.PORT}`);
});
