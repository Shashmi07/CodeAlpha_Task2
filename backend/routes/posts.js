const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const newPost = new Post({ user: req.user.id, content: req.body.content });
    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all posts (latest first)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', ['username'])
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username' }
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Like a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.push(req.user.id);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Comment on post
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const comment = new Comment({
      user: req.user.id,
      post: req.params.id,
      content: req.body.content,
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    res.json(comment);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
