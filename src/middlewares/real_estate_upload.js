import axios from "axios";
import FormData from "form-data";

export default async (req, res, next) => {
  try {
    if (req.files["thumbnail"]) {
      const file = req.files["thumbnail"][0];

      const form = new FormData();
      form.append("file", file.buffer, { filename: file.originalname, contentType: file.mimetype });

      const response = await axios.post(`${process.env.IMAGE_SERVER}/upload/single`, form, {
        headers: { "Content-Type": "multipart/form-data", Authorization: req.headers.authorization },
      });

      req.body.thumbnail = response.data.payload.path;
      delete req.files["thumbnail"];
    }

    if (req.files["images"] && req.files["images"].length > 0) {
      const form = new FormData();
      for (const file of req.files["images"]) {
        form.append("files", file.buffer, { filename: file.originalname, contentType: file.mimetype });
      }

      const response = await axios.post(`${process.env.IMAGE_SERVER}/upload/many`, form, {
        headers: { "Content-Type": "multipart/form-data", Authorization: req.headers.authorization },
      });

      const imageUrls = response.data.payload.map((image) => image.path);
      req.body.images = imageUrls;

      delete req.files["images"];
    }

    return next();
  } catch (error) {
    console.log("Error - real_estate_upload.js", error);
    return res.json({ status: 500, message: JSON.stringify(error) });
  }
};
