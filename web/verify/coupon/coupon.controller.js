import fs from "fs";
import { generateUniqueCodeUploadFile, couponCodeUploadFile, couponCodeList, downloadCouponCodeCSV, couponCounts } from "./index.js";

export const generateUniqueCodeFile = async (req, res) => {
  const filePath = await generateUniqueCodeUploadFile();
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ success: false, message: "Failed to generate template file" });
  }

  res.download(filePath, "Unique Code Upload.csv", (err) => {
    if (err) console.error("Download error:", err);
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error("Failed to cleanup file:", e);
    }
  });
};

export const uploadCouponCodeFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File is required" });
  }
  const filePath = req.file.path;
  try {
    const result = await couponCodeUploadFile(filePath);
    res.status(result.statusCode).json(result);
  } finally {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Failed to delete uploaded file:", e);
      }
    }
  }
};

export const getCouponCodeList = async (req, res) => {
  const query = req.body.pagelimit ? req.body : req.query;
  const result = await couponCodeList(query);
  return res.status(result.statusCode).json(result);
};

export const getCouponCounts = async (req, res) => {
  const result = await couponCounts();
  return res.status(result.statusCode).json(result);
};

export const downloadCouponCodeFile = async (req, res) => {
  try {
    const filter = req.body.filter || req.query.filter || {};
    const filePath = await downloadCouponCodeCSV(filter);

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: "No records found to export"
      });
    }

    res.download(filePath, "couponMaster.csv", (err) => {
      if (err) console.error("Download error:", err);
      try {
        fs.unlinkSync(filePath); // cleanup after download
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
      }
    });
  } catch (error) {
    console.error("Error in downloadCouponCodeFile:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};