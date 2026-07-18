// NPM Packages
import bcrypt from "bcrypt";
// JWT
import { createToken } from "@src/middlewares/index.js";
// Models
import User from "@src/features/user/models/user.js";

export default {
  //
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ status: 400, message: "Informe email e senha" });

    try {
      const userDecrypt = await User.findOne({ email });

      // Same response for "no such user" and "wrong password" so the endpoint
      // cannot be used to enumerate which emails have accounts.
      if (!userDecrypt || !(await bcrypt.compare(password, userDecrypt.password))) {
        return res.status(401).json({ status: 401, message: "Email ou senha incorretos" });
      }

      const user = userDecrypt.toObject();
      delete user.password;

      const accessToken = createToken(user);
      return res.status(200).json({ status: 200, accessToken, message: "Ok!" });
    } catch (error) {
      console.log("Error - auth_controller.js - login", error);
      return res.status(500).json({ status: 500, message: "Erro ao autenticar" });
    }
  },
  session: async (req, res) => {
    const { user } = req;

    try {
      const sessionUser = await User.findOne({ _id: user._id }, { password: 0 });
      if (!sessionUser) return res.status(404).json({ status: 404, message: "Usuário não encontrado" });

      return res.status(200).json({ status: 200, user: sessionUser, message: "Ok!" });
    } catch (error) {
      console.log("Error - auth_controller.js - session", error);
      return res.status(500).json({ status: 500, message: "Erro ao carregar sessão" });
    }
  },
};
