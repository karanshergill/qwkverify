import { createClient } from 'redis';
import 'dotenv/config';

const redisClient = createClient();

redisClient.on('error', (err) => console.error('❌ Redis error:', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('🔌 Redis client connected');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
})();

export default redisClient;
