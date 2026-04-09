import { Schema, model } from "mongoose";
import { v4 } from "uuid";
import mongoosePaginate from "mongoose-paginate-v2";

const RealEstateSchema = new Schema(
  {
    _id: {
      type: String,
      default: v4,
    },
    //
    description: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
      enum: ["apartment", "house", "land", "shop", "sobrado"],
    },
    title: {
      type: String,
    },
    // Info
    sale: {
      type: String,
      required: true,
      enum: ["sell", "rent", "both"],
    },
    price: {
      type: Number,
      required: true,
    },
    area: {
      type: Number,
      required: true,
    },
    rooms: {
      type: Number,
      required: true,
    },
    bathrooms: {
      type: Number,
      required: true,
    },
    garages: {
      type: Number,
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    //
    address: {
      cep: {
        type: String,
        required: true,
      },
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
      complement: {
        type: String,
      },
      number: {
        type: String,
        required: true,
      },
      //
      position: {
        type: Object,
        required: false,
      },
    },
    //
    thumbnail: {
      type: String,
    },
    images: {
      type: Array,
    },
    // Dates
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true, versionKey: false }
);

RealEstateSchema.plugin(mongoosePaginate);
export default model("real_estate", RealEstateSchema);
