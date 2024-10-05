import multer from "multer";
import path from "path";
import { Content, Series } from "../models/model.js";
import mongoose from "mongoose";

// Multer configuration with updates to include 'video' field
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "file") {
      cb(null, "uploads/videos/");
    } else if (file.fieldname === "thumbnail") {
      cb(null, "uploads/thumbnails/");
    } else if (file.fieldname === "trailer") {
      cb(null, "uploads/trailers/");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/episodes/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

// Updated multer configuration to include the 'video' field
const upload = multer({ storage: storage }).fields([
  { name: "file", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "trailer", maxCount: 1 },
  { name: "video", maxCount: 1 }, // Added the "video" field for episodes
]);

async function addVideo(req, res) {
  const { userId } = req.user;

  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    const { title, description, categoryName, language, duration } = req.body;
    const file = req.files.file[0];
    const thumbnail = req.files.thumbnail[0];

    if (!title || !description || !categoryName || !language || !duration || !file || !thumbnail) {
      return res.status(400).send("Missing required fields or files");
    }

    try {
      const newContent = new Content({
        type: "normal",
        title,
        description,
        category: categoryName,
        language,
        duration,
        url: file.path,
        thumbnailUrl: thumbnail.path,
        creator: userId,
        contentType: "video",
      });

      await newContent.save();
      res.status(201).send("Video added successfully");
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}

async function addShorts(req, res) {
  const { userId } = req.user;

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).send("File upload error");
    } else if (err) {
      return res.status(500).send("Unknown error occurred");
    }

    const { title, description, categoryName, language, duration } = req.body;
    const file = req.files && req.files.file ? req.files.file[0] : null;
    const thumbnail = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;

    if (!title || !description || !categoryName || !language || !duration || !file || !thumbnail) {
      return res.status(400).send("Missing required fields or files");
    }

    try {
      const newShort = new Content({
        type: "short",
        title,
        description,
        category: categoryName,
        language,
        duration,
        url: file.path,
        thumbnailUrl: thumbnail.path,
        creator: userId,
        contentType: "video",
      });

      await newShort.save();
      res.status(201).send("Shorts added successfully");
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}

async function addMovie(req, res) {
  const { userId } = req.user;

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).send("File upload error");
    } else if (err) {
      return res.status(500).send("Unknown error occurred");
    }

    const { name, description, categoryName, language, releaseDate, duration } = req.body;
    const file = req.files.file ? req.files.file[0] : null;
    const thumbnail = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const trailer = req.files.trailer ? req.files.trailer[0] : null;

    if (!name || !description || !categoryName || !language || !releaseDate || !duration || !file || !thumbnail || !trailer) {
      return res.status(400).send("Missing required fields or files");
    }

    try {
      const newMovie = new Content({
        type: "movie",
        title: name,
        description,
        category: categoryName,
        language,
        duration,
        url: file.path,
        thumbnailUrl: thumbnail.path,
        trailerUrl: trailer.path,
        creator: userId,
        contentType: "movie",
        releaseYear: new Date(releaseDate).getFullYear(),
      });

      await newMovie.save();
      res.status(201).send("Movie added successfully");
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}

async function addSeries(req, res) {
  const { userId } = req.user;

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "File upload error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Unknown error occurred", error: err });
    }

    const { title, description, tags, language, releaseDate, category, is_subscription } = req.body;

    const thumbnailUrl = req.files["thumbnail"] ? req.files["thumbnail"][0].path : null;
    const trailerUrl = req.files["trailer"] ? req.files["trailer"][0].path : null;

    if (!title || !description || !language || !releaseDate || !category || !thumbnailUrl || !trailerUrl) {
      return res.status(400).json({ message: "Missing required fields or files" });
    }

    try {
      const newSeries = new Series({
        title,
        description,
        creator: userId,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        language,
        releaseDate,
        category,
        thumbnailUrl,
        trailerUrl,
        totalSeasons: 0,
        totalEpisodes: 0,
      });

      await newSeries.save();

      res.status(201).json({ message: "Series uploaded successfully", _id: newSeries._id, series: newSeries });
    } catch (error) {
      res.status(500).json({ message: "Error uploading series", error: error.message });
    }
  });
}

// Add Episode to Series
async function addEpisode(req, res) {
  const { userId } = req.user;
  const { seriesId } = req.params;

  // Check if the seriesId is valid
  if (!mongoose.Types.ObjectId.isValid(seriesId)) {
    return res.status(400).json({ message: "Invalid series ID" });
  }

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).json({ message: "File upload error", error: err });
    } else if (err) {
      return res.status(500).json({ message: "Unknown error occurred", error: err });
    }

    const { title, description, tags, language, category, releaseYear, seasonNumber, episodeNumber } = req.body;

    const thumbnailUrl = req.files["thumbnail"] ? req.files["thumbnail"][0].path : null;
    const file = req.files.file ? req.files.file[0] : null;

    if (!title || !language || !category || !thumbnailUrl || !file) {
      return res.status(400).json({ message: "Missing required fields or files" });
    }

    try {
      const newEpisode = new Content({
        type: "series",
        title,
        description,
        creator: userId,
        url: file.path,
        thumbnailUrl,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
        language,
        category,
        seriesId: new mongoose.Types.ObjectId(seriesId),
        contentType: "episode",
        releaseYear: releaseYear || null,
        seasonNumber: seasonNumber || null,
        episodeNumber: episodeNumber || null,
        is_subscription: false,
      });

      await newEpisode.save();
      await Series.findByIdAndUpdate(seriesId, { $inc: { totalEpisodes: 1 } });

      res.status(201).json({ message: "Episode added successfully", episode: newEpisode });
    } catch (error) {
      console.error("Error saving episode:", error);
      res.status(500).json({ message: "Error uploading episode", error: error.message });
    }
  });
}


export { addVideo, addShorts, addMovie, addSeries, addEpisode };
