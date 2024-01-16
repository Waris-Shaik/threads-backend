import Post from "../models/post.js";
import User from "../models/user.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  const { text, postedby } = req.body;
  let { image } = req.body;
  if (!postedby)
    return res
      .status(400)
      .json({ success: false, error: "Please fill all required fields" });
  if (!text && !image)
    return res
      .status(400)
      .json({ success: false, error: "Please fill all required fields" });
  try {
    const user = await User.findById(postedby);
    if (!user)
      return res.status(400).json({ success: false, error: "User not found!" });

    if (user._id.toString() !== req.user._id.toString())
      return res.status(401).json({
        success: false,
        error: "Unauthorized to create post.",
      });
    const maxLength = 500;
    if (text?.length > maxLength)
      return res.status(400).json({
        success: false,
        error: `Text must be less than ${maxLength} characters`,
      });

    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      image = uploadedResponse.secure_url;
    }

    const newPost = await Post.create({ postedby, text, image });
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      newPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId).select("-updatedAt");
    if (!post)
      return res.status(404).json({
        success: false,
        error: "Post not found!",
      });

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  const { postId } = req.params;
  try {
    if (!postId)
      return res.status(400).json({
        success: false,
        error: "Please fill all required fields",
      });

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, error: "Post not found!" });
    if (post.postedby.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized to delete post.",
      });
    }
    if (post.image) {
      const imageId = post.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imageId);
    }
    await Post.findByIdAndDelete(postId);
    res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
      post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const likeUnlikePost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, error: "Post not found!" });
    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: req.user._id } });
      res.status(200).json({
        success: true,
        message: "Unliked Successfully.",
      });
    } else {
      await Post.updateOne({ _id: postId }, { $push: { likes: req.user._id } });
      res.status(200).json({
        success: true,
        message: "Liked Successfully.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const replyPost = async (req, res) => {
  const { postId } = req.params;
  const { text, image } = req.body;
  try {
    if (!text && !image)
      return res
        .status(400)
        .json({ success: false, error: "Please fill all required fields" });

    const post = await Post.findById(postId);

    if (!post)
      return res.status(404).json({ success: false, error: "Post not found!" });

    const reply = {
      userId: req.user._id,
      username: req.user.username,
      text,
      image,
      userProfilePicture: req.user.profilepicture,
    };
    // 1st method
    // await Post.findByIdAndUpdate(postId, {$push:{replies:reply}});

    // 2nd method
    post.replies.push(reply);
    await post.save();

    res.status(201).json({
      success: true,
      message: "Commented Successfully",
      text,
      image,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const feedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found!" });
    const following = user.following;

    const posts = await Post.find({ postedby: { $in: following } }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      feedLength: posts.length,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getOnlyMyReplies = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found!" });
    const following = user.following;
    const posts = await Post.find({ postedby: { $in: following } });
    let arr = [];
    let myreplies = [];
    posts.map((post) => post.replies.length > 0 && arr.push(post));

    arr.map((post) => { 
      const obj = {
        _id: post._id,
        postedby: post.postedby,
        text: post.text,
        image: post.image,
        likes: post.likes,
      };
      myreplies.push({
        ...obj,
        replies: post.replies
          .filter((reply) => reply.userId.toString() === user._id.toString())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      });
    });

    res.status(200).json({
      success: true,
      myreplies,
    });

    // // const myreplies = filtered.filter((reply)=> reply.userId.toString() === user._id.toString()).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

    // res.status(200).json({
    //   success:true,
    //   length: filtered.length,
    //   // myreplies
    //   filtered
    // })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(404)
        .json({ success: true, message: "User not found." });
    const posts = await Post.find({ postedby: user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      myPostsLength: posts.length,
      posts,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteReply = async (req, res) => {
  const { postId, replyId } = req.params;
  try {
    if (!replyId || !postId)
      return res.status(400).json({ success: true, error: "Fill the values" });
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const post = await Post.findById(postId);

    if (!post)
      return res.status(404).json({ success: false, error: "Post not found." });
    const getReply = post.replies.find(
      (reply) => reply._id.toString() === replyId.toString()
    );

    if (!getReply)
      return res.status(404).json({ success: false, error: "Reply not found" });

    //  post.postedby.toString() !== user._id.toString()

    if (user._id.toString() !== getReply.userId.toString())
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized to delete reply." });

    // const length = post.replies.length;
    const updatedReplies = post.replies.filter(
      (reply) => reply._id.toString() !== replyId.toString()
    );
    // const afterFilter = updatedReplies.length;
    post.replies = updatedReplies;
    await post.save();

    res.status(200).json({
      success: true,
      message: "Deletd Successfully",
      // length,
      // afterFilter,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
