// NPM Packages
import { model } from "mongoose";
import bcrypt from "bcrypt";

// User Model
const User = model("User");

// Roles used to be stored in title case ("Super Admin"). Existing documents
// would fail enum validation on their next save, so normalise them on boot.
const LEGACY_ROLES = {
  "Super Admin": "super_admin",
  Admin: "admin",
  Moderator: "moderator",
  User: "user",
  Guest: "guest",
};

export default async function () {
  for (const [legacy, current] of Object.entries(LEGACY_ROLES)) {
    await User.updateMany({ role: legacy }, { $set: { role: current } });
  }

  const email = process.env.ADMIN_ACCOUNT;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME;
  const screenName = process.env.ADMIN_SCREENNAME;
  const picture = process.env.ADMIN_PICTURE;

  if (!email || !password) {
    console.log("ADMIN_ACCOUNT / ADMIN_PASSWORD not set - skipping super admin seed");
    return;
  }

  const duplicate = await User.findOne({ email });
  if (duplicate) return;

  // Hash only when actually creating the account; hashing on every boot cost a
  // few hundred ms for nothing.
  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    email,
    password: hashedPassword,
    userName: username,
    role: "super_admin",
    screenName,
    profilePicture: picture,
  });

  console.log(`Seeded super admin "${email}"`);
}
