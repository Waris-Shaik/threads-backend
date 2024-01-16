import mongoose from "mongoose";

const reply = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    image: { type: String },
    userProfilePicture: { type: String },
    username: {type:String,}
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    postedby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, maxlength: 500 },
    image: { type: String },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref:"User", default: [] },
    replies: [reply],
  },
  { timestamps: true }
);

const Post = mongoose.model("post", postSchema);
export default Post;
