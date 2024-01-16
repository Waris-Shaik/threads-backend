import express from "express";
import {
  followUnfollowUser,
  getUserProfile,
  login,
  logout,
  signUp,
  updateUser,
} from "../controllers/user.js";
import isAutheticated from "../middlewares/auth.js";
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.put("/toggleFollow/:userId", isAutheticated, followUnfollowUser);
router.put("/update/:userId", isAutheticated, updateUser);
router.get("/profile/:query", getUserProfile);

export default router;
