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

/**
 * Reads the seed accounts out of the environment.
 *
 * Numbered suffixes rather than one comma-separated list: a comma is a legal
 * password character, so splitting `ADMIN_PASSWORD` on commas would quietly
 * truncate a perfectly good password and seed an account nobody can log into.
 * Parallel lists also drift — two emails and one password is a silent misparse.
 *
 * `ADMIN_ACCOUNT` is the first account (unchanged, so existing .env files keep
 * working), then `ADMIN_ACCOUNT_2`, `_3` and so on until one is missing.
 */
const readAdmins = () => {
  const admins = [];

  for (let index = 1; ; index++) {
    const suffix = index === 1 ? "" : `_${index}`;
    const email = process.env[`ADMIN_ACCOUNT${suffix}`];

    if (!email) break;

    admins.push({
      email,
      password: process.env[`ADMIN_PASSWORD${suffix}`],
      userName: process.env[`ADMIN_USERNAME${suffix}`],
      screenName: process.env[`ADMIN_SCREENNAME${suffix}`],
      picture: process.env[`ADMIN_PICTURE${suffix}`],
    });
  }

  return admins;
};

export default async function () {
  for (const [legacy, current] of Object.entries(LEGACY_ROLES)) {
    await User.updateMany({ role: legacy }, { $set: { role: current } });
  }

  const admins = readAdmins();

  if (admins.length === 0) {
    console.log("ADMIN_ACCOUNT not set - skipping super admin seed");
    return;
  }

  for (const { email, password, userName, screenName, picture } of admins) {
    if (!password) {
      console.log(`No password set for "${email}" - skipping`);
      continue;
    }

    const duplicate = await User.findOne({ email });
    if (duplicate) continue;

    // Hash only when actually creating the account; hashing on every boot cost a
    // few hundred ms for nothing.
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
      userName,
      role: "super_admin",
      screenName,
      profilePicture: picture,
    });

    console.log(`Seeded super admin "${email}"`);
  }
}
