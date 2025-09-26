import express from "express";
import { verifyToken } from "@shared/middlewares/auth.middleware.js";
import { asyncHandler } from "@shared/helpers/asyncHandler.js";
import { payloadCheck } from "@shared/helpers/commonHandler.js";
import { upload, handleMulterError } from "@shared/config/multer.js";
import { generateUniqueCodeFile, uploadCouponCodeFile, getCouponCodeList, downloadCouponCodeFile, getCouponCounts, getProductVerify } from "./coupon.controller.js";

const router = express.Router();

router.post(
  "/generateUniqueCodeUploadFile",
  verifyToken,
  asyncHandler(generateUniqueCodeFile)
);

router.post(
  "/couponCodeUploadFile",
  verifyToken,
  upload.single("category"),
  handleMulterError,
  asyncHandler(uploadCouponCodeFile)
);

router.post(
  "/couponCodeList",
  verifyToken,
  payloadCheck(getCouponCodeList),
  asyncHandler(getCouponCodeList)
);

router.get(
  "/couponCounts",
  verifyToken,
  asyncHandler(getCouponCounts)
);

router.post(
  "/downloadCouponCodeFile",
  verifyToken,
  payloadCheck(downloadCouponCodeFile),
  asyncHandler(downloadCouponCodeFile)
);

router.post(
  "/productVerify",
  verifyToken,
  payloadCheck(getProductVerify),
  asyncHandler(getProductVerify)
);

export default router;