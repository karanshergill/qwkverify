import { prisma } from "@shared/config/database.js";
import jwt from "jsonwebtoken";
import redisClient from "@shared/config/redis.js";
import "dotenv/config";

export const generateToken = async (data) => {
  const token = jwt.sign({ data }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  await redisClient.set(`jwt:${token}`, "valid");

  return token;
};

export const verifyLogin = async (req, res, next) => {
  const { userName, password } = req.body;

  try {
    // Validate required fields
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find user by username, email, or mobile
    const user = await prisma.userInfo.findFirst({ 
      where: { userName: userName, password: password, del: 0 },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if user is inactive (status = 0 means inactive)
    if (user.status === 0) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact admin",
      });
    }

    // Update last login timestamp
    await prisma.userInfo.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate authentication token
    const token = await generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        userName: user.userName,
        email: user.email,
        mobile: user.mobile,
        status: user.status
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

export const getUserDetail = async (req, res, next) => {
  const { id } = req.user;

  try {
    const user = await prisma.userInfo.findFirst({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        userName: true,
        email: true,
        mobile: true,
        password: true,
        status: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        result: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: `User Detail`,
      result: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return next(error);
  }
};