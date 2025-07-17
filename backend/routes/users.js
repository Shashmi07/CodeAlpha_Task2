const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('followers', 'username').populate('following', 'username');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Follow a user
router.post('/:id/follow', auth, async (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ msg: 'Cannot follow yourself' });

  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) return res.status(404).json({ msg: 'User to follow not found' });

    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ msg: 'Already following this user' });
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.json({ msg: 'Followed user' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Unfollow a user
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow) return res.status(404).json({ msg: 'User to unfollow not found' });

    currentUser.following = currentUser.following.filter(f => f.toString() !== userToUnfollow._id.toString());
    userToUnfollow.followers = userToUnfollow.followers.filter(f => f.toString() !== currentUser._id.toString());

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ msg: 'Unfollowed user' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
