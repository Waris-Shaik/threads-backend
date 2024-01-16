import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/connectDB.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.js";
import postRouter from "./routes/post.js";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

const app = express();

// .lock_files 🤐;
dotenv.config();
const PORT = process.env.PORT || 8081;

// data__base 🛢️
connectDB();

// cloud__connection ⛅⛅;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET_KEY,
});

// builtin__middlewares 🔐;
app.use(
  cors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// routes 📡;
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);

// initaik route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to threads-root API",
  });
});

// SERVER__PORT 🖥️👽;
app.listen(PORT, () => {
  console.log(
    `server is listening on port:${PORT} 🚀 in ${
      process.env.NODE_ENV === "Development" ? "⌨️" : "🛢️"
    } ${process.env.NODE_ENV} mode.`
  );
});
