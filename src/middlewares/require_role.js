/**
 * Gate a route behind one or more user roles. Must run after verifyToken,
 * which is what puts req.user in place.
 */
export default (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: 403, message: "Acesso negado" });
    }

    return next();
  };
