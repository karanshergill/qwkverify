import jwt from 'jsonwebtoken';
import redisClient from '@shared/config/redis.js';
import dotenv from 'dotenv';
dotenv.config();

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const exists = await redisClient.get(`jwt:${token}`);

    if (!exists || exists === 'Invalid') {
      return res.status(401).json({ message: 'Token expired or invalidated' });
    }

    req.user = decoded.data;
    next();
  } catch (err) {
    return res.status(401).json({ success:false, message: 'Unauthorized: Invalid token' });
  }
};
