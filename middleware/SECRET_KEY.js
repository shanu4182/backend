import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file
const SECRET_KEY = process.env.SECRET_KEY;
export default SECRET_KEY