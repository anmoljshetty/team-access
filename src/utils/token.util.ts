import { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { redisClient } from "../config/redis";

const generateAndSetTokens = async (res: Response, userId: string) => {
  const jwtSecret = process.env.JWT_SECRET!; // ! means that this env isn't undefined
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

  const accessToken = jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    jwtRefreshSecret,
    { expiresIn: "7d" }
  );

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  
  const redisKey = `refresh_token:${userId}`;
  await redisClient.setEx(redisKey, 7 * 24 * 60 * 60, hashedRefreshToken);

  // Cookies can be stored more securely,  I will look into that later.

  // Set Access Token as normal cookie
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Set Refresh Token as HTTP-only, SameSite cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearTokens = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
};

export {
  generateAndSetTokens,
  clearTokens
}
