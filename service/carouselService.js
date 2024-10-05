import { Content } from "../models/model.js";

const randomDataCarousel = async (req, res) => {
    try {

      const movies = await Content.aggregate([
        { $match: { type: 'movie' } }, // Only movies
        { $sample: { size: 4 } }, // Randomly sample 4 movies
        { $project: { title: 1, thumbnailUrl: 1, _id: 1 } } // Select only these fields
      ]);
  
      res.status(200).json(movies);
    } catch (error) {
        console.log(error)
      res.status(500).json({ error: 'Failed to fetch random movies' });
    }
  };
  
  export { randomDataCarousel };