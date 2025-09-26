import fs from "fs";
import path from "path"; 
import { generateUniqueCodeUploadFile, couponCodeUploadFile, couponCodeList, downloadCouponCodeCSV, couponCounts, productVerify } from "./index.js";

export const generateUniqueCodeFile = async (req, res) => {
  try {
    const filePath = await generateUniqueCodeUploadFile();
    
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate template file" 
      });
    }

    // Read file content for preview
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Get file stats
    const fileName = path.basename(filePath);

    // Return preview data
    res.status(200).json({
      success: true,
      message: "Sample File Generated Successfully",
      fileName: `uploads/sample/${fileName}`,
    });

  } catch (err) {
    console.error("generateUniqueCodeFile error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
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
  try {
    const query = { ...req.query, ...req.body };

    const pagelimit = query.pagelimit || query.pageLimit || 10;
    const start = query.start ? parseInt(query.start) : 0;
    const page = query.page ? parseInt(query.page) : 1;
    const verifiedFlag = query.verifiedFlag !== undefined ? parseInt(query.verifiedFlag) : undefined;
    const filter = query.filter || {};

    const result = await couponCodeList({ pagelimit, start, page, verifiedFlag, filter });
    return res.status(result.statusCode).json(result);
  } catch (err) {
    console.error("getCouponCodeList error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
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

    // Read file content for preview
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Get file stats
    const fileName = path.basename(filePath);

    return res.status(200).json({
      success: true,
      message: "Downloaded Successfully",
      fileName: `uploads/Download_excel/${fileName}`,
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

export const getProductVerify = async (req, res) => {
  const query = req.body;
  const result = await productVerify(query, req);
  return res.status(result.statusCode).json(result);
};