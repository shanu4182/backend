import { Follow, User } from "../models/model.js";


// Check if the current user is already following the target user
export const checkFollowStatus = async (req, res) => {
    const { userId } = req.params; // Target user ID from the URL
    const currentUserId = req.user.userId; // Get the current user's ID from the JWT token
    console.log(userId, " hhhhhh  ",currentUserId);
    try {
      const follow = await Follow.findOne({
        followerId: currentUserId,
        followingId: userId,
      });
  
      res.status(200).json({ isFollowing: !!follow });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  // Follow a user
  export const followUser = async (req, res) => {
    const { userId } = req.body; // Target user ID from the request body
    const currentUserId = req.user.userId; // Get the current user's ID from the JWT token
  console.log(userId, " hhhhhh  ",currentUserId);
    try {
      // Check if the user is trying to follow themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
  
      // Check if the user is already following
      const existingFollow = await Follow.findOne({
        followerId: currentUserId,
        followingId: userId,
      });
  
      if (existingFollow) {
        return res.status(400).json({ message: "Already following the user" });
      }
  
      // Create new follow record
      await Follow.create({ followerId: currentUserId, followingId: userId });
  
      // Increment the follow counts for both users
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });
  
      res.status(200).json({ message: "Successfully followed the user" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  // Unfollow a user
  export const unfollowUser = async (req, res) => {
    const { userId } = req.body; // Target user ID from the request body
    const currentUserId = req.user.userId; // Get the current user's ID from the JWT token
  
    try {
      // Find and delete the follow record
      const result = await Follow.deleteOne({
        followerId: currentUserId,
        followingId: userId,
      });
  
      if (result.deletedCount === 0) {
        return res.status(400).json({ message: "You are not following this user" });
      }
  
      // Decrement the follow counts for both users
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
  
      res.status(200).json({ message: "Successfully unfollowed the user" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };