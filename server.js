import express from "express";
import connectDB from "./config/config.js";
import cors from "cors";
import { json } from "express";
import {
  loginService,
  registerService,
  verifyOTPService,
} from "./service/authService.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import {
  addMovie,
  addShorts,
  addVideo,
  addSeries,
  addEpisode,
} from "./service/contentUploadService.js";
import { getCategories, getLanguages } from "./service/dropDownServices.js";
import {
  getMovies,
  fetchVideos,
  getShorts,
  getCategoryByName,
  getNormalVideos,
  getVideoById,
  getVideosService,
  getSeriesVideo,
  getSeriesSeasons,
  getMovieById,
} from "./service/videoServices.js";
import {
  deleteProfileImage,
  getMyProfile,
  getProfile,
  getUserContent,
  updateProfile,
} from "./service/userService.js";
import { checkFollowStatus, followUser, unfollowUser } from "./service/FollowUnFollowService.js";
import { randomDataCarousel } from "./service/carouselService.js";

const app = express();
app.use(cors());
app.use(json());

// Serve static files from the 'uploads/videos' and other directories
app.use("/uploads/videos", express.static("uploads/videos"));
app.use("/uploads/thumbnails", express.static("uploads/thumbnails"));
app.use("/uploads/trailers", express.static("uploads/trailers"));
app.use("/uploads/profiles", express.static("uploads/profiles"));

const port = process.env.PORT || 5000;
connectDB();

app.get("/", (req, res) => {
  res.send("API is running");
});

// Middleware to wrap routes with authenticateToken
const authenticatedRoute = (routeHandler) => {
  return (req, res, next) => {
    authenticateToken(req, res, (err) => {
      if (err) return next(err);
      routeHandler(req, res);
    });
  };
};

// User service routes
app.post("/register", registerService);

app.post("/login", loginService);

app.post("/verify-otp", verifyOTPService);

// Content upload routes
app.post("/addVideo", authenticatedRoute(addVideo));
app.post("/addMovie", authenticatedRoute(addMovie));
app.post("/addShorts", authenticatedRoute(addShorts));

// Get user's content
app.get("/getUserContent/:id", authenticatedRoute(getUserContent));

// Dropdown services (e.g., languages, categories)
app.get("/getLanguages", authenticatedRoute(getLanguages));
app.get("/getCategories", authenticatedRoute(getCategories));

// Fetch videos grouped by type
app.get("/videos", authenticatedRoute(fetchVideos));

// Get all movies
app.get("/getMovies", authenticatedRoute(getMovies));

// Get all shorts
app.get("/getShorts", authenticatedRoute(getShorts));

// Get profile data
app.get("/getMyProfile", authenticatedRoute(getMyProfile));
app.get("/getProfile/:userId", authenticatedRoute(getProfile));

// Get category videos
app.get("/getCategoryByName/:categoryName", authenticatedRoute(getCategoryByName));
app.get("/getNormalVideos", authenticatedRoute(getNormalVideos));
app.get("/getVideosService", authenticatedRoute(getVideosService));

app.post("/addSeries", authenticateToken,  async (req, res) => {
  addSeries (req, res);
});

app.post("/series/:seriesId/episodes", authenticateToken,  async (req, res) => {
  addEpisode (req, res);
});
// New route to fetch a single video by ID
app.get("/videos/:video_id", authenticatedRoute(getVideoById));
// Update profile data (with image upload handling via Multer)
app.put("/profile", authenticatedRoute(updateProfile));
app.delete('/profile/image', authenticatedRoute(deleteProfileImage));

app.get("/movies/:movieId", authenticatedRoute(getMovieById));
app.get("/getSeriesVideo", authenticatedRoute(getSeriesVideo));
app.get('/series/:seriesId/episodes', authenticatedRoute(getSeriesSeasons));
// Follow/Unfollow routes
app.get("/follow/:userId/status", authenticatedRoute(checkFollowStatus));
app.post("/follow", authenticatedRoute(followUser));
app.post("/unfollow", authenticatedRoute(unfollowUser));
// carousel  services
app.get("/carousel", authenticatedRoute(randomDataCarousel));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
