import FormData from "form-data";
import { postToImageServer } from "../services/image_server.js";

export default async (req, res, next) => {
  try {
    if (req.files && req.files["thumbnail"]) {
      const file = req.files["thumbnail"][0];

      const form = new FormData();
      form.append("file", file.buffer, { filename: file.originalname, contentType: file.mimetype });

      const payload = await postToImageServer("/upload/single", form, req.headers.authorization);
      req.body.thumbnail = payload.path;

      delete req.files["thumbnail"];
    }

    if (req.files && req.files["images"] && req.files["images"].length > 0) {
      const form = new FormData();
      for (const file of req.files["images"]) {
        form.append("files", file.buffer, { filename: file.originalname, contentType: file.mimetype });
      }

      const payload = await postToImageServer("/upload/many", form, req.headers.authorization);
      req.body.images = payload.map((image) => image.path);

      delete req.files["images"];
    }

    return next();
  } catch (error) {
    console.log("Error - real_estate_upload.js", error?.response?.data ?? error.message);

    // Surface the image server's own rejection (bad type, too large, expired
    // token) instead of flattening everything into a 500.
    const status = error?.response?.status ?? 502;
    const message = error?.response?.data?.message ?? "Erro ao enviar imagens";

    return res.status(status).json({ status, message });
  }
};
