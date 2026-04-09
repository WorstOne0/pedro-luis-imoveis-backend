// Models
import RealEstate from "../models/real_estate.js";
//
import mongoose from "mongoose";

export default {
  get: async (req, res) => {
    try {
      const realEstateList = await RealEstate.find({});

      return res.json({ status: 200, payload: realEstateList, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - get", error);
      return res.json({ status: 500, message: JSON.stringify(error) });
    }
  },
  getById: async (req, res) => {
    const { _id } = req.params;

    try {
      const realEstate = await RealEstate.findOne({ _id });

      return res.json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - getById", error);
      return res.json({ status: 500, message: JSON.stringify(error) });
    }
  },
  create: async (req, res) => {
    try {
      const { metadata, images, thumbnail } = req.body;
      const body = { ...JSON.parse(metadata), images, thumbnail };

      const realEstate = await RealEstate.create(body);

      return res.json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - create", error);
      return res.json({ status: 500, message: JSON.stringify(error) });
    }
  },
  update: async (req, res) => {
    const { _id } = req.body;

    try {
      const realEstate = await RealEstate.findOneAndUpdate({ _id }, req.body, { new: true });

      return res.json({ status: 200, payload: realEstate, message: "Ok!" });
    } catch (error) {
      console.log("Error - real_estate_controller.js - update", error);
      return res.json({ status: 500, message: JSON.stringify(error) });
    }
  },
  //
  importOldDB: async (req, res) => {
    try {
      console.log("Importing Old DB...");
      const oldDB = mongoose.createConnection("mongodb+srv://admin:dev@cluster0.2agfw.mongodb.net/?appName=Cluster0", {
        useNewUrlParser: true,
      });

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

      return res.json({ status: 200, payload: list, message: "Ok!" });
    } catch (error) {
      console.log(error);
      return res.json({ status: 500, message: JSON.stringify(error) });
    }
  },
};
