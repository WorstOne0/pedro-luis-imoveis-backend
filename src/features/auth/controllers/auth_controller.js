// NPM Packages
import bcrypt from "bcrypt";
// JWT
import { createToken } from "@src/middlewares/index.js";
// Models
import User from "@src/features/user/models/user.js";

export default {
  //
  login: async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) return res.json({ status: 400, error: "Missing email or password" });

    const userDecrypt = await User.findOne({ email });
    if (!userDecrypt) return res.status(404).json({ error: "User not Found" });

    const user = userDecrypt.toObject();
    delete user.password;

    // Decrypt the Password
    if (!(await bcrypt.compare(password, userDecrypt.password))) {
      // Wrong password
      return res.json({ status: 401, error: "Incorrect email or password" });
    }

    const accessToken = createToken(user);
    return res.json({ status: 200, accessToken });
  },
  session: async (req, res, next) => {
    const { user } = req;

    const sessionUser = await User.findOne({ _id: user._id }, { password: 0 });
    if (!sessionUser) return res.json({ status: 404, error: "User not Found" });

    return res.json({ status: 200, user: sessionUser });
  },
};
