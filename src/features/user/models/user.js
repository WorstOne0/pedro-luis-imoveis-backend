import { Schema, model } from "mongoose";
import { v4 } from "uuid";
import mongoosePaginate from "mongoose-paginate-v2";

// Maybe change lates into saparated schemas
const UserSchema = new Schema(
  {
    // User
    _id: {
      type: String,
      default: v4,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["super_admin", "admin", "moderator", "user", "guest"],
      default: "guest",
    },
    // Profile
    screenName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.plugin(mongoosePaginate);
export default model("User", UserSchema);
