import express from 'express';
import { getUserDetail, verifyLogin } from './index.js';
import { verifyLoginSchema } from './schema.js';
import { asyncHandler } from '@shared/helpers/asyncHandler.js'
import { payloadCheck } from '@shared/helpers/commonHandler.js';
import { verifyToken } from '@shared/middlewares/auth.middleware.js';
import { validate } from '@shared/middlewares/validate.middleware.js';

const router = express.Router();

router.post(
    '/verifyLogin',
    payloadCheck(verifyLogin),
    validate(verifyLoginSchema),
    asyncHandler(verifyLogin)
);

router.get(
    '/getUserDetail',
    verifyToken,
    asyncHandler(getUserDetail)
);

export default router;