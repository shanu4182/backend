import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { User, Content,Series } from "../models/model.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
// Multer configuration for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage }).single('profilePicture'); // Using .single() for single file

async function updateProfile(req, res) {
  const { userId } = req.user;

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).send('File upload error');
    } else if (err) {
      return res.status(500).send('Unknown error occurred');
    }

    const { username, about } = req.body;
    const profilePicture = req.file ? req.file.path : null;

    if (!username || !about) {
      return res.status(400).send('Missing required fields');
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (profilePicture && user.profilePicture) {
        const profileImagePath = path.join(__dirname, '..', user.profilePicture); // Full path to the image

        // Remove the profile picture file from the filesystem
        fs.unlink(profileImagePath, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).send('Error deleting profile image');
          }
        });
      }

      user.username = username;
      user.about = about;

      if (profilePicture) {
        user.profilePicture = profilePicture;
      }

      await user.save();
      res.status(200).send('Profile updated successfully');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}

async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select("-password"); // Exclude the password from the response
    if (!user) {
      return res.json({success:false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
async function getProfile(req, res) {
  try {
    const userId = req.params.userId;  // Get userId from URL params
    const user = await User.findById(userId).select("-password");  // Exclude password from the response
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}




// Get user content by user ID
async function getUserContent(req, res) {
  const userId = req.params.id;

  try {
    // Fetch normal content (videos, movies, shorts) created by the user and populate creator details
    const contents = await Content.find({ creator: userId }).populate('creator', 'username profilePicture');

    // Fetch series created by the user and populate creator details
    const series = await Series.find({ creator: userId }).populate('creator', 'username profilePicture');

    // Combine both contents and series into one response
    const allContent = [...contents, ...series];

    res.json(allContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function deleteProfileImage(req, res) {
  const { userId } = req.user; // Assuming req.user contains authenticated user's data

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has a profile picture to delete
    if (user.profilePicture) {
      const profileImagePath = path.join(__dirname, '..', user.profilePicture); // Full path to the image

      // Remove the profile picture file from the filesystem
      fs.unlink(profileImagePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return res.status(500).send('Error deleting profile image');
        }

        // Remove the profile picture reference from the user's record
        user.profilePicture = null;
        user.save();

        res.status(200).send('Profile image deleted successfully');
      });
    } else {
      return res.status(400).json({ message: 'No profile image to delete' });
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export { getProfile, updateProfile, getUserContent,deleteProfileImage ,getMyProfile};
