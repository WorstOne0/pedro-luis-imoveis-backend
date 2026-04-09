import { Schema, model } from "mongoose";
import { v4 } from "uuid";
import mongoosePaginate from "mongoose-paginate-v2";

const AddressSchema = new Schema(
  {
    _id: {
      type: String,
      default: v4,
    },
    targetId: {
      type: String,
      required: true,
    },
    //
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
      required: true,
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

AddressSchema.plugin(mongoosePaginate);
export default model("address", AddressSchema);
