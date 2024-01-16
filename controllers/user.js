import User from "../models/user.js";
import bcrypt from "bcrypt";
import sendCookie from "../utils/sendCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const signUp = async (req, res) => {
  const { name, username, email, password } = req.body;
  try {
    if (!name || !username || !email || !password)
      return res
        .status(400)
        .json({ success: false, error: "Please fill all required fields" });
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user)
      return res
        .status(500)
        .json({ success: false, error: "User Already Exists Please Login." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    sendCookie(res, newUser); // setting___cookie 🍪🍪🍪;
    res.status(201).json({
      success: true,
      message: "User Created Successfully.",
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      bio: newUser.bio,
      profilepicture: newUser.profilepicture,
      name: newUser.name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { text, password } = req.body;
  try {
    if (!text || !password)
      return res
        .status(500)
        .json({ success: false, error: "Please fill all required field's" });

    let user = await User.findOne({
      $or: [{ email: text }, { username: text }],
    }).select("-updatedAt");
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: "User not found please register" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(500)
        .json({ success: false, error: "Incorrect password" });

    sendCookie(res, user);
    res.status(200).json({
      success: true,
      message: `Welcome Back ${user.username}`,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilepicture: user.profilepicture,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const logout = (req, res) => {
  res
    .cookie("token", null, {
      maxAge: 1,
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? "false" : true,
    })
    .status(200)
    .json({
      success: true,
      message: "logged out successfully.",
    });
};

export const followUnfollowUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId)
      return res
        .status(500)
        .json({ success: false, error: "Please fill all required fields" });
    const wannaFollowThisUser = await User.findById(userId);
    const i = await User.findById(req.user._id);

    if (userId.toString() === req.user._id.toString())
      return res
        .status(400)
        .json({ success: false, error: "you cannot follow yourself" });

    if (!wannaFollowThisUser || !i)
      return res.status(404).json({ success: false, error: "User not found!" });

    const isFollowing = i.following.includes(userId);
    if (isFollowing) {
      // unfollow user 👤
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: req.user._id },
      });
      res.status(200).json({
        success: true,
        message: "UnFollowed Successfully.",
      });
    } else {
      // follow user 👤
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $push: { followers: req.user._id },
      });
      res.status(200).json({
        success: true,
        message: "Followed Successfully.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  const { username, email, password, bio } = req.body;
  let { profilepicture } = req.body;
  try {
    let user = await User.findById(req.user._id)
      .select("-password")
      .select("-updatedAt");
    if (!user)
      return res.status(200).json({ success: false, error: "Use not found!" });
    if (req.params.userId.toString() !== req.user._id.toString())
      return res.status(200).json({
        success: false,
        error: "you cannot update others profile.",
      });

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    if (profilepicture) {
      if (user.profilepicture) {
        await cloudinary.uploader.destroy(
          user.profilepicture.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profilepicture);
      profilepicture = uploadedResponse.secure_url;
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.profilepicture = profilepicture || user.profilepicture;
    user.bio = bio || user.bio;

    user = await user.save();
    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  const { query } = req.params;
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(query)) {
      // userId
      user = await User.findOne({ _id: query })
        .select("-password")
        .select("-updatedAt");
    } else {
      // username
      user = await User.findOne({ username: query })
        .select("-password")
        .select("-updatedAt");
    }

    if (!user)
      return res.status(404).json({ success: false, error: "User not found!" });
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
