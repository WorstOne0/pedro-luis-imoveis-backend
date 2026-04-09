import jwt from "jsonwebtoken";

const createToken = (user) => {
  return jwt.sign({ user }, process.env.ACCESS_TOKEN_JWT, { expiresIn: "5h" });
};

const verifyToken = async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization;
    if (!accessToken) return res.json({ status: 401, message: "Não autorizado" });

    const jwtData = jwt.verify(accessToken.split(" ")[1], process.env.ACCESS_TOKEN_JWT);
    req.user = { ...jwtData.user };

    return next();
  } catch {
    return res.json({ status: 401, message: "Não autorizado" });
  }
};

export { verifyToken, createToken };
