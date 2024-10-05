import { Content,Interaction,Series } from "../models/model.js";

async function fetchVideos(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 8; // Maximum 4 of each type per page


  try {
    const types = ["normal", "short", "movie", "series"];
    const results = await Promise.all(
      types.map(async (type) => {
        const totalCount = await Content.countDocuments({ type });
        const skip = (page - 1) * limit;
        const videos = await Content.find({ type })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          // Populate the creator field with username and profilePicture
          .populate("creator", "username profilePicture");

        return {
          type,
          videos,
          totalCount,
          hasMore: totalCount > skip + videos.length,
        };
      })
    );

    const response = results.reduce(
      (acc, { type, videos, totalCount, hasMore }) => {
        acc[type] = { videos, totalCount, hasMore };
        return acc;
      },
      {}
    );

    // console.log(
    //   "Sending response with counts:",
    //   Object.entries(response).reduce((acc, [type, { videos }]) => {
    //     acc[type] = videos.length;
    //     return acc;
    //   }, {})
    // );

    res.json(response);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Error fetching videos" });
  }
}





async function getMovies(req, res) {
  try {
    // Fetch all content where type is "movie"
    const movies = await Content.find({ type: "movie" });
    res.json(movies);
  } catch (err) {
    console.error("Error fetching movies:", err); // Log the error
    res.status(500).send("Internal Server Error");
  }
}

async function getShorts(req, res) {
  try {
    const { page = 1, limit = 3 } = req.query; // Default to page 1 and limit of 3

    const shorts = await Content.find({ type: 'short' }) // Filter to get only shorts
      .skip((page - 1) * limit) // Skip the number of items for the current page
      .limit(parseInt(limit)) // Limit the number of items per page
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .populate('creator', 'username profilePicture followersCount'); // Populate creator field with specific fields

    res.json(shorts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shorts', error });
  }
}
async function getCategoryByName(req, res) {
  const { categoryName } = req.params;

  try {
    const videos = await Content.find({ category: { $regex: new RegExp(categoryName, "i") } });

    if (videos.length === 0) {
      return res.status(200).json([]);  // Return empty array instead of 404
    }

    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos for category:", error);
    res.status(500).json({ message: 'Server error' });
  }
}


async function getNormalVideos(req, res) {
  try {
    // Fetch all content where type is "normal"
    const normalVideos = await Content.find({ type: "normal" });
    res.json(normalVideos);
  } catch (err) {
    console.error("Error fetching normal videos:", err); // Log the error
    res.status(500).send("Internal Server Error");
  }
}

async function getVideoById(req, res) {
  try {
    const { video_id } = req.params;
    const { userId } = req.user; // Get userId from auth header

    // Fetch the video with uploader details populated
    const video = await Content.findById(video_id)
      .populate({
        path: 'creator', // Populate the creator (uploader)
        select: 'username profilePicture followersCount' // Select only the fields we need
      })
      .lean(); // Use .lean() to return plain JavaScript objects, which are easier to work with

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Count total likes and dislikes from the InteractionSchema
    const totalInteractions = await Interaction.aggregate([
      { $match: { contentId: video._id } }, // Match the video ID
      {
        $group: {
          _id: '$type', // Group by 'like' or 'dislike'
          count: { $sum: 1 } // Count occurrences of each type
        }
      }
    ]);
    
    // Initialize like and dislike counts
    let totalLikes = 0;
    let totalDislikes = 0;

    totalInteractions.forEach(interaction => {
      if (interaction._id === 'like') {
        totalLikes = interaction.count;
      } else if (interaction._id === 'dislike') {
        totalDislikes = interaction.count;
      }
    });

    // Check if the current user has liked this video
    const userInteraction = await Interaction.findOne({
      contentId: video._id,
      userId: userId,
      type: 'like'
    });

    const likedByMe = !!userInteraction; // Boolean value, true if liked by the current user

    // Add the like and dislike counts and likedByMe flag to the video object
    video.totalLikes = totalLikes;
    video.totalDislikes = totalDislikes;
    video.likedByMe = likedByMe;

    res.json(video);
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    res.status(500).send('Internal Server Error');
  }
}


const getVideosService = async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch videos uploaded by the user
    const videos = await Video.find({ uploadedBy: userId });
    
    // Respond with the user's videos
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching videos', error: error.message });
  }
};



async function getSeriesVideo(req, res) {
  try {
    const seriesList = await Series.find(); // Find all series from the collection
    res.json(seriesList); // Return the series data as JSON
  } catch (err) {
    res.status(500).send(err.message); // Handle any errors
  }
}


async function getSeriesSeasons(req, res) {
  try {
    const seriesId = req.params.seriesId;
   
    // Ensure index exists
    await Content.collection.createIndex({ seriesId: 1, contentType: 1 });
    // Try querying with string conversion
    let episodes = await Content.find({
      seriesId: seriesId.toString(),
      contentType: "episode"
    }).sort({ seasonNumber: 1, episodeNumber: 1 }).lean();
    
    if (!episodes.length) {
      // If still empty, try direct MongoDB query
      episodes = await Content.collection.find({
        seriesId: seriesId,
        contentType: "episode"
      }).toArray();
    }

    if (!episodes.length) {
      const allEpisodes = await Content.find({ contentType: "episode" }).lean();
      return res.status(404).json({ message: "No episodes found for this series" });
    }
    res.status(200).json(episodes);
  } catch (error) {
    console.error("Error fetching episodes:", error);
    res.status(500).json({ 
      message: "Error fetching episodes", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

// Fetch a movie by ID
async function getMovieById(req, res) {
  try {
    const { movieId } = req.params;
    const movie = await Content.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    console.error("Error fetching movie by ID:", error);
    res.status(500).send("Internal Server Error");
  }
}



export { fetchVideos ,getMovies, getShorts,getCategoryByName,getNormalVideos,getVideoById,getVideosService,getSeriesVideo,getSeriesSeasons,getMovieById};
