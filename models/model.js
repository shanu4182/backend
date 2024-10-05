import mongoose from "mongoose";

const { Schema } = mongoose;

// Language Schema
const LanguageSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Category Schema
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Users Schema
const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: String,
    about: String,
    otp: { type: String, default: null },
    followersCount: { type: Number, default: 0 },  // To store the count of followers
    followingCount: { type: Number, default: 0 },  // To store the count of followings
  },
  { timestamps: true }
);

// Follow Schema (to manage followers/followings)
const FollowSchema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },  // The user who follows
    followingId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The user who is being followed
  },
  { timestamps: true }
);

// Ensure users can't follow themselves
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });  // For fast querying followers
FollowSchema.index({ followerId: 1 });   // For fast querying followings

// Add method to follow/unfollow user
FollowSchema.statics.followUser = async function (followerId, followingId) {
  // Prevent user from following themselves
  if (followerId.toString() === followingId.toString()) {
    throw new Error("You cannot follow yourself");
  }

  // Check if follow relationship already exists
  const existingFollow = await this.findOne({ followerId, followingId });

  if (!existingFollow) {
    // Create new follow relationship
    await this.create({ followerId, followingId });

    // Increment follower/following count on both users
    await mongoose.model("User").findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    await mongoose.model("User").findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });
  }
};

FollowSchema.statics.unfollowUser = async function (followerId, followingId) {
  // Remove the follow relationship
  const result = await this.deleteOne({ followerId, followingId });

  if (result.deletedCount > 0) {
    // Decrement follower/following count on both users
    await mongoose.model("User").findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    await mongoose.model("User").findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
  }
};

// Series Schema
const SeriesSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [String],
    language: { type: Schema.Types.ObjectId, ref: "Language", required: true },
    thumbnailUrl: String,
    totalSeasons: Number,
    totalEpisodes: Number,
    releaseYear: Number,
    trailerUrl: String,
    genre: [String],
    is_subscription: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Content Schema
const ContentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["short", "normal", "movie", "series"],
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    duration: String,
    url: { type: String, required: true },
    thumbnailUrl: String,
    tags: [String],
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
    contentType: {
      type: String,
      enum: ["video", "episode", "movie", "trailer"],
      required: true,
    },
    is_subscription: { type: Boolean, default: false },
    language: { type: Schema.Types.ObjectId, ref: "Language", required: true },
    category: { type: String, required: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series" },
    previewUrl: String,
    seasonNumber: Number,
    episodeNumber: Number,
    releaseYear: Number,
    trailerUrl: String,
  },
  { timestamps: true }
);

// Comments Schema
const CommentSchema = new Schema(
  {
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Interactions Schema
const InteractionSchema = new Schema(
  {
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "dislike"], required: true },
  },
  { timestamps: true }
);

// Create models
const Language = mongoose.model("Language", LanguageSchema);
const Category = mongoose.model("Category", CategorySchema);
const User = mongoose.model("User", UserSchema);
const Follow = mongoose.model("Follow", FollowSchema);
const Series = mongoose.model("Series", SeriesSchema);
const Content = mongoose.model("Content", ContentSchema);
const Comment = mongoose.model("Comment", CommentSchema);
const Interaction = mongoose.model("Interaction", InteractionSchema);

export { Language, Category, User, Series, Content, Comment, Interaction ,Follow };
