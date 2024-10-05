import jwt from 'jsonwebtoken';
import SECRET_KEY from './SECRET_KEY.js';

export const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    SECRET_KEY
  );
};

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = await jwt.verify(token, SECRET_KEY);
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(403).json({ error: 'Invalid token' });
  }
};
