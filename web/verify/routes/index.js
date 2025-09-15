// routes/index.js
import express from 'express';
import authRoutes from '../auth/routes.js';
import couponRoutes from '../coupon/routes.js';

const router = express.Router();

// Mount all individual route modules
router.use('/', authRoutes);
router.use('/', couponRoutes);

export default router;
