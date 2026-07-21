// Models
import RealEstate from "../models/real_estate.js";
//
import mongoose from "mongoose";
import buildQuery from "../utils/real_estate_query.js";
import { deleteFromImageServer } from "../../../services/image_server.js";

// Fields a client is allowed to write. Anything else in the body is dropped so
// a caller cannot reach schema fields we never meant to expose.
const WRITABLE = [
  "title",
  "description",
  "type",
  "sale",
  "price",
  "area",
  "rooms",
  "bathrooms",
  "garages",
  "featured",
  "sold",
  "features",
  "address",
  "images",
  "thumbnail",
];

const pick = (source, keys) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

// The upload middleware puts the resulting urls on req.body, while the rest of
// the payload arrives as a JSON string in `metadata` (multipart cannot nest).
const parseBody = (body) => {
  if (!body.metadata) return pick(body, WRITABLE);

  const metadata = typeof body.metadata === "string" ? JSON.parse(body.metadata) : body.metadata;
  const merged = { ...metadata };

  if (body.thumbnail !== undefined) merged.thumbnail = body.thumbnail;

  // Kept images (urls the client sent back in metadata) plus newly uploaded
  // ones, in that order. Uploads used to overwrite the whole gallery, so adding
  // one photo on edit silently deleted the rest — which is why the dashboard
  // could not offer a per-image delete.
  if (body.images !== undefined) merged.images = [...(metadata.images ?? []), ...body.images];

  return pick(merged, WRITABLE);
};

export default {
  get: async (req, res) => {
    try {
      const { filter, sort, limit } = buildQuery(req.query);

      const query = RealEstate.find(filter).sort(sort);
      if (limit) query.limit(limit);

      const realEstateList = await query;

      return res.status(200).json({ status: 200, payload: realEstateList, total: realEstateList.length, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - get", error);
      return res.status(500).json({ status: 500, message: "Erro ao listar imóveis" });
    }
  },
  getById: async (req, res) => {
    const { _id } = req.params;

    try {
      const realEstate = await RealEstate.findOne({ _id });
      if (!realEstate) return res.status(404).json({ status: 404, message: "Imóvel não encontrado" });

      return res.status(200).json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - getById", error);
      return res.status(500).json({ status: 500, message: "Erro ao buscar imóvel" });
    }
  },
  create: async (req, res) => {
    try {
      const body = parseBody(req.body);
      const realEstate = await RealEstate.create(body);

      return res.status(201).json({ status: 201, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - create", error);

      if (error instanceof SyntaxError) return res.status(400).json({ status: 400, message: "Metadata inválida" });
      if (error.name === "ValidationError") return res.status(400).json({ status: 400, message: error.message });

      return res.status(500).json({ status: 500, message: "Erro ao criar imóvel" });
    }
  },
  update: async (req, res) => {
    const { _id } = req.params;

    try {
      const body = parseBody(req.body);

      // Read first so the files that are about to be dropped can be identified.
      const previous = await RealEstate.findOne({ _id }).lean();
      if (!previous) return res.status(404).json({ status: 404, message: "Imóvel não encontrado" });

      const realEstate = await RealEstate.findOneAndUpdate({ _id }, body, { new: true, runValidators: true });

      // Anything the record no longer references is now unreachable. Without
      // this every edit left its replaced images on disk forever.
      const kept = new Set([realEstate.thumbnail, ...(realEstate.images ?? [])]);
      const orphaned = [previous.thumbnail, ...(previous.images ?? [])].filter((url) => url && !kept.has(url));

      if (orphaned.length > 0) {
        const { failed } = await deleteFromImageServer(orphaned, req.headers.authorization);
        if (failed.length > 0) console.log(`Warning - real_estate ${_id} updated, but these files remain:`, failed);
      }

      return res.status(200).json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - update", error);

      if (error instanceof SyntaxError) return res.status(400).json({ status: 400, message: "Metadata inválida" });
      if (error.name === "ValidationError") return res.status(400).json({ status: 400, message: error.message });

      return res.status(500).json({ status: 500, message: "Erro ao atualizar imóvel" });
    }
  },
  remove: async (req, res) => {
    const { _id } = req.params;

    try {
      const realEstate = await RealEstate.findOneAndDelete({ _id });
      if (!realEstate) return res.status(404).json({ status: 404, message: "Imóvel não encontrado" });

      // The listing is gone either way. Orphaned files are a disk-space problem;
      // a failed cleanup is not worth failing the request the client asked for.
      const files = [realEstate.thumbnail, ...(realEstate.images ?? [])];
      const { failed } = await deleteFromImageServer(files, req.headers.authorization);

      if (failed.length > 0) console.log(`Warning - real_estate ${_id} deleted, but these files remain:`, failed);

      return res.status(200).json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - remove", error);
      return res.status(500).json({ status: 500, message: "Erro ao remover imóvel" });
    }
  },
  //
  importOldDB: async (req, res) => {
    if (process.env.ENABLE_LEGACY_IMPORT !== "true") return res.status(404).json({ status: 404, message: "Not Found" });

    try {
      console.log("Importing Old DB...");
      const oldDB = mongoose.createConnection(process.env.OLD_MONGO_DB);

      const postSchema = new mongoose.Schema({
        postedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: false,
        },
        price: {
          type: Number,
          required: true,
        },
        info: {
          type: {
            area: {
              type: Number,
              required: true,
            },
            sale: {
              type: String,
              required: true,
            },
            room: {
              type: Number,
              required: true,
            },
            suite: {
              type: Number,
              required: true,
            },
            garage: {
              type: Number,
              required: true,
            },
            spotlight: {
              type: Boolean,
              require: true,
            },
          },
          required: true,
        },
        infoAdd: {
          type: [String],
          required: false,
        },
        address: {
          type: {
            street: {
              type: String,
              required: true,
            },
            district: {
              type: String,
              required: true,
            },
            city: {
              type: String,
              required: true,
            },
            state: {
              type: String,
              required: true,
            },
            latitude: {
              type: Number,
              required: false,
            },
            longitude: {
              type: Number,
              required: false,
            },
          },
          require: true,
        },
        imagens: {
          type: [
            {
              name: String,
              key: String,
              url: String,
              size: Number,
            },
          ],
          required: false,
        },
        thumbnail: {
          type: {
            name: String,
            key: String,
            url: String,
            size: Number,
          },
          required: false,
        },
        createdAt: {
          type: Date,
          default: Date.now(),
        },
        updatedAt: {
          type: Date,
          default: Date.now(),
        },
      });

      const postModel = oldDB.model("Post", postSchema);
      const posts = await postModel.find({});

      const list = [];
      for (const post of posts) {
        const realEstateObj = {};

        realEstateObj.title = post.name;

        if (post.type == "Apartamento") realEstateObj.type = "apartment";
        if (post.type == "Casa") realEstateObj.type = "house";
        if (post.type == "Terreno") realEstateObj.type = "land";
        if (post.type == "Sala Comercial") realEstateObj.type = "shop";
        if (post.type == "Sobrado") realEstateObj.type = "sobrado";

        realEstateObj.description = post.description;
        //
        realEstateObj.price = post.price;
        realEstateObj.area = post.info.area;
        realEstateObj.sale = "sell";
        realEstateObj.rooms = post.info.room;
        realEstateObj.bathrooms = post.info.suite;
        realEstateObj.garages = post.info.garage;
        realEstateObj.featured = post.info.spotlight;
        //
        realEstateObj.address = {};
        realEstateObj.address.cep = "85800-001";
        realEstateObj.address.street = post.address.street;
        realEstateObj.address.district = post.address.district;
        realEstateObj.address.city = post.address.city;
        realEstateObj.address.state = post.address.state;
        realEstateObj.address.complement = "";
        realEstateObj.address.number = "00";
        realEstateObj.address.position = {
          lat: post.address.latitude,
          lng: post.address.longitude,
        };

        realEstateObj.images = post.imagens.map((image) => image.url);
        realEstateObj.thumbnail = post.thumbnail.url;

        const realEstate = await RealEstate.create(realEstateObj);
        list.push(realEstate);
      }

      await oldDB.close();

      return res.status(200).json({ status: 200, payload: list, message: "Ok!" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ status: 500, message: "Erro ao importar base antiga" });
    }
  },
};
