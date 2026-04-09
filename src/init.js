// NPM Packages
import { model } from "mongoose";
import bcrypt from "bcrypt";

// User Model
const User = model("User");

export default async function () {
  const email = process.env.ADMIN_ACCOUNT;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME;
  const screenName = process.env.ADMIN_SCREENNAME;
  const picture = process.env.ADMIN_PICTURE;

  const duplicate = await User.findOne({ email }).catch((erro) => console.log(erro));

  // Hash the Password
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!duplicate) {
    await User.create({
      email: email,
      password: hashedPassword,
      userName: username,
      role: "Super Admin",
      screenName: screenName,
      profilePicture: picture,
    });
  }
}
