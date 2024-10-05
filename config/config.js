import mongoose from 'mongoose';


const mongoURI = 'mongodb://localhost:27017/videoServe';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
    process.exit(1); 
  }
};

export default connectDB;
