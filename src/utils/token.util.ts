import { Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { redisClient } from "../config/redis";

const hashToken = (token: string) => {
  //we are using crypto because that bcrypt was comparing 1st 72 chars only, which was same for all refresh token (basically that allowed even previous refresh tokens for refresh)
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateAndSetTokens = async (res: Response, userId: string) => {
  const jwtSecret = process.env.JWT_SECRET!; // ! means that this env isn't undefined
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

  const accessToken = jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: "15m" }
  );

  const jti = crypto.randomUUID();

  const refreshToken = jwt.sign(
    { userId, jti },
    jwtRefreshSecret,
    { expiresIn: "7d" }
  );

  const hashedJti = hashToken(jti);
  
  const redisKey = `refresh_token:${userId}`;
  await redisClient.setEx(redisKey, 7 * 24 * 60 * 60, hashedJti);

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
  clearTokens,
  hashToken
}
