import { prisma } from "@shared/config/database.js";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import dotenv from "dotenv";
dotenv.config();

// Constants for validation
const MAX_ROWS = 10000;
const MAX_CODE_LENGTH = 50;
const ALLOWED_CODE_PATTERN = /^[a-zA-Z0-9\-_]+$/;
const REQUIRED_HEADER = "Unique Code (*)";

export async function generateUniqueCodeUploadFile() {
  const uploadDir = path.join(process.cwd(), "uploads", "sample");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filePath = path.join(
    uploadDir,
    `Unique_Code_Upload_Template_${timestamp}.csv`
  );

  const csvContent = `${REQUIRED_HEADER}\n`;
  fs.writeFileSync(filePath, csvContent, "utf8");

  return filePath;
}

export async function couponCodeUploadFile(filePath) {
  return new Promise((resolve) => {
    const results = [];
    const uniqueCodes = new Set();
    let rowCount = 0;
    let error = "";
    let hasValidHeader = false;

    if (!fs.existsSync(filePath)) {
      resolve({
        statusCode: 400,
        success: false,
        message: "File not found",
        response: [],
      });
      return;
    }

    const stream = fs
      .createReadStream(filePath)
      .pipe(
        csvParser({
          skipEmptyLines: true,
          skipLinesWithError: false,
        })
      )
      .on("headers", (headers) => {
        if (!headers || headers.length === 0) {
          error = "CSV file is empty or has no headers";
          return;
        }

        const cleanHeader = headers[0]
          .replace(/^\uFEFF/, "")
          .replace(/^\ufeff/, "")
          .trim();

        if (cleanHeader !== REQUIRED_HEADER) {
          error = `Invalid CSV header. Expected '${REQUIRED_HEADER}', but found '${cleanHeader}'`;
          return;
        }

        hasValidHeader = true;
      })
      .on("data", (row) => {
        if (error || !hasValidHeader) return;
        rowCount++;

        if (rowCount > MAX_ROWS) {
          error = `File contains too many rows. Maximum allowed: ${MAX_ROWS}`;
          return;
        }

        const uniqueCode = row[REQUIRED_HEADER]?.toString().trim();
        if (!uniqueCode) {
          error = `Row ${rowCount + 1}: Unique Code cannot be empty`;
          return;
        }

        if (uniqueCode.length > MAX_CODE_LENGTH) {
          error = `Row ${rowCount + 1}: Unique Code exceeds ${MAX_CODE_LENGTH} chars`;
          return;
        }

        if (!ALLOWED_CODE_PATTERN.test(uniqueCode)) {
          error = `Row ${rowCount + 1}: Invalid characters`;
          return;
        }

        if (uniqueCodes.has(uniqueCode)) {
          error = `Row ${rowCount + 1}: Duplicate '${uniqueCode}'`;
          return;
        }

        uniqueCodes.add(uniqueCode);
        results.push(uniqueCode);
      })
      .on("end", async () => {
        if (error) {
          resolve({ statusCode: 400, success: false, message: error, response: [] });
          return;
        }

        if (results.length === 0) {
          resolve({
            statusCode: 400,
            success: false,
            message: "No valid unique codes found",
            response: [],
          });
          return;
        }

        try {
          const dynamicLink = await prisma.dynamicLinkInfo.findFirst({
            where: { del: 0 },
            select: { couponLink: true },
          });

          if (!dynamicLink?.couponLink) {
            resolve({
              statusCode: 500,
              success: false,
              message: "Coupon link config not found",
              response: [],
            });
            return;
          }

          const existingCodes = await prisma.couponInfo.findMany({
            where: { uniqueCode: { in: results } },
            select: { uniqueCode: true },
          });

          const existingSet = new Set(existingCodes.map((c) => c.uniqueCode));
          const newCodes = results.filter((c) => !existingSet.has(c));

          let insertedCount = 0;
          if (newCodes.length > 0) {
            const insertData = newCodes.map((code) => ({
              uniqueCode: code,
              linkUniqueCouponCc: dynamicLink.couponLink + code,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

            const result = await prisma.couponInfo.createMany({
              data: insertData,
              skipDuplicates: true,
            });

            insertedCount = result.count;
          }

          const message =
            insertedCount > 0
              ? `Processed ${insertedCount} codes. ${existingSet.size > 0 ? existingSet.size + " duplicates skipped." : ""
                }`
              : `All ${existingSet.size} codes already exist.`;

          resolve({
            statusCode: 200,
            success: true,
            message,
            response: {
              totalProcessed: results.length,
              newCodesAdded: insertedCount,
              duplicatesSkipped: existingSet.size,
            },
          });
        } catch (dbError) {
          console.error("DB error:", dbError);
          resolve({
            statusCode: 500,
            success: false,
            message: "Database error",
            response: [],
          });
        }
      })
      .on("error", () => {
        resolve({
          statusCode: 400,
          success: false,
          message: "CSV parsing error",
          response: [],
        });
      });

    setTimeout(() => {
      if (!stream.destroyed) {
        stream.destroy();
        resolve({
          statusCode: 408,
          success: false,
          message: "File processing timeout",
          response: [],
        });
      }
    }, 30000);
  });
}

export async function couponCodeList(query) {
  const { pagelimit, start, page, verifiedFlag, filter } = query;

  const limit = pagelimit ? parseInt(pagelimit) : 500;
  const offset = start ? parseInt(start) : 0;
  const currentPage = page ? parseInt(page) : 1;
  const calculatedOffset = start ? offset : (currentPage - 1) * limit;

  const whereCondition = {};
  if (verifiedFlag !== undefined) {
    whereCondition.verifiedFlag = parseInt(verifiedFlag);
  }
  if (filter?.date_created) {
    whereCondition.dateCreated = {
      contains: filter.date_created,
      mode: "insensitive",
    };
  }

  const queryOptions = {
    where: whereCondition,
    select: { id: true, dateCreated: true, uniqueCode: true, linkUniqueCouponCc: true },
    orderBy: { id: "desc" },
  };

  if (pagelimit && parseInt(pagelimit) !== 0) {
    queryOptions.skip = calculatedOffset;
    queryOptions.take = limit;
  }

  const result = await prisma.couponInfo.findMany(queryOptions);

  let pagination = null;
  if (pagelimit && parseInt(pagelimit) !== 0) {
    const totalRecords = await prisma.couponInfo.count({ where: whereCondition });
    const totalPages = Math.ceil(totalRecords / limit);
    pagination = {
      currentPage,
      totalPages,
      totalRecords,
      recordsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startRecord: calculatedOffset + 1,
      endRecord: Math.min(calculatedOffset + limit, totalRecords),
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: result.length > 0 ? "Success" : "No data found",
    result,
    pagination,
  };
}

export async function couponCounts() {
  try {
    const totalCoupons = await prisma.couponInfo.count();

    const totalVerified = await prisma.couponInfo.count({
      where: {
        verifiedFlag: 1
      }
    });

    const totalNotVerified = await prisma.couponInfo.count({
      where: {
        verifiedFlag: 0
      }
    });

    const stats = {
      totalGenerated: totalCoupons,
      totalVerified: totalVerified,
      totalNotVerified: totalNotVerified,
    };

    return {
      statusCode: 200,
      success: true,
      message: "Coupon statistics retrieved successfully",
      result: stats
    };

  } catch (error) {
    console.error("Error fetching coupon statistics:", error);
    return {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      error: error.message
    };
  }
}

function toCSV(rows, headers) {
  const csvRows = [];
  csvRows.push(headers.join(",")); // header row

  rows.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] ?? "";
      if (typeof val === "string") {
        val = `"${val.replace(/"/g, '""')}"`; // escape quotes
      }
      return val;
    });
    csvRows.push(values.join(","));
  });

  return csvRows.join("\r\n");
}

export async function downloadCouponCodeCSV(filter = {}) {
  const whereCondition = { del: 0 };

  if (filter?.dateCreated) {
    whereCondition.dateCreated = {
      contains: filter.dateCreated,
      mode: "insensitive",
    };
  }
  if (filter?.uniqueCode) {
    whereCondition.uniqueCode = {
      contains: filter.uniqueCode,
      mode: "insensitive",
    };
  }
  if (filter?.linkUniqueCouponCc) {
    whereCondition.linkUniqueCouponCc = {
      contains: filter.linkUniqueCouponCc,
      mode: "insensitive",
    };
  }

  const rows = await prisma.couponInfo.findMany({
    where: whereCondition,
    orderBy: { id: "desc" },
    select: {
      dateCreated: true,
      uniqueCode: true,
      linkUniqueCouponCc: true,
      verifiedFlag: true,
      verifiedOn: true,
    },
  });

  if (!rows || rows.length === 0) {
    return null;
  }

  // Add Sr No + format verifiedFlag
  const dataWithSr = rows.map((row, idx) => ({
    "Sr No": idx + 1,
    "Date Created": row.dateCreated,
    "Unique Code": row.uniqueCode,
    "Link Concated Coupon Code": row.linkUniqueCouponCc,
    "Verified Status": row.verifiedFlag === 1 ? "Verified" : "Not Verified",
    "Verified On": row.verifiedOn || "",
  }));

  const headers = Object.keys(dataWithSr[0]);
  const csvContent = toCSV(dataWithSr, headers);

  // Save file temporarily
  const uploadDir = path.join(process.cwd(), "uploads", "Download_excel");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, `couponMaster_${Date.now()}.csv`);
  fs.writeFileSync(filePath, csvContent, "utf8");

  return filePath;
}