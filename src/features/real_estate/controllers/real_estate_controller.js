// Models
import RealEstate from "../models/real_estate.js";
//
import mongoose from "mongoose";
import buildQuery from "./real_estate_query.js";

// Fields a client is allowed to write. Anything else in the body is dropped so
// a caller cannot reach schema fields we never meant to expose.
const WRITABLE = ["title", "description", "type", "sale", "price", "area", "rooms", "bathrooms", "garages", "featured", "address", "images", "thumbnail"];

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
  if (body.images !== undefined) merged.images = body.images;

  return pick(merged, WRITABLE);
};

const fail = (res, status, message) => res.status(status).json({ status, message });

export default {
  get: async (req, res) => {
    try {
      const { filter, options } = buildQuery(req.query);
      const result = await RealEstate.paginate(filter, options);

      // `payload` stays a plain array so existing clients keep working; the
      // pagination metadata rides alongside it.
      return res.status(200).json({
        status: 200,
        payload: result.docs,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalDocs: result.totalDocs,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
        message: "Ok!",
      });
    } catch (error) {
      console.log("Error - real_estate_controller.js - get", error);
      return fail(res, 500, "Erro ao listar imóveis");
    }
  },
  getById: async (req, res) => {
    const { _id } = req.params;

    try {
      const realEstate = await RealEstate.findOne({ _id });
      if (!realEstate) return fail(res, 404, "Imóvel não encontrado");

      return res.status(200).json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - getById", error);
      return fail(res, 500, "Erro ao buscar imóvel");
    }
  },
  create: async (req, res) => {
    try {
      const body = parseBody(req.body);
      const realEstate = await RealEstate.create(body);

      return res.status(201).json({ status: 201, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - create", error);

      if (error instanceof SyntaxError) return fail(res, 400, "Metadata inválida");
      if (error.name === "ValidationError") return fail(res, 400, error.message);

      return fail(res, 500, "Erro ao criar imóvel");
    }
  },
  update: async (req, res) => {
    const { _id } = req.params;

    try {
      const body = parseBody(req.body);

      const realEstate = await RealEstate.findOneAndUpdate({ _id }, body, { new: true, runValidators: true });
      if (!realEstate) return fail(res, 404, "Imóvel não encontrado");

      return res.status(200).json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - update", error);

      if (error instanceof SyntaxError) return fail(res, 400, "Metadata inválida");
      if (error.name === "ValidationError") return fail(res, 400, error.message);

      return fail(res, 500, "Erro ao atualizar imóvel");
    }
  },
  remove: async (req, res) => {
    const { _id } = req.params;

    try {
      const realEstate = await RealEstate.findOneAndDelete({ _id });
      if (!realEstate) return fail(res, 404, "Imóvel não encontrado");

      return res.status(200).json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - remove", error);
      return fail(res, 500, "Erro ao remover imóvel");
    }
  },
  //
  importOldDB: async (req, res) => {
    if (process.env.ENABLE_LEGACY_IMPORT !== "true") return fail(res, 404, "Not Found");

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
      return fail(res, 500, "Erro ao importar base antiga");
    }
  },
};
