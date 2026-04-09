// NPM Packages
import express from "express";

const router = express.Router();

router.get("/version", function (req, res, next) {
  res.status(200).send({
    title: "Node Express API",
    version: "0.0.1",
  });
});

export default router;
