import jwt from "jsonwebtoken";
import User from "../models/user.js";

const isAutheticated = async (req, res, next) => {
  const { token } = req.cookies;
  try {
    if (!token)
      return res.status(400).json({
        success: false,
        error: "Please Login First.",
      });

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decode._id).select("-password");
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default isAutheticated;
