import express from "express";
import { createPost, deletePost, deleteReply, feedPosts, getOnlyMyReplies, getPost, getUserPosts, likeUnlikePost, replyPost } from "../controllers/post.js";
import isAutheticated from "../middlewares/auth.js";
const router = express.Router();

router.get('/feed', isAutheticated, feedPosts);
router.get('/myreplies', isAutheticated, getOnlyMyReplies);
router.get('/:postId',getPost);
router.get('/user/:username', getUserPosts );
router.post("/new", isAutheticated, createPost);
router.delete('/delete/:postId', isAutheticated, deletePost);
router.put('/toggleLike/:postId', isAutheticated, likeUnlikePost);
router.post('/reply/:postId', isAutheticated, replyPost);
router.delete('/:postId/reply/delete/:replyId', isAutheticated, deleteReply);

export default router;
