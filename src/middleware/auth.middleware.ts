import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string | number;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(accessToken, jwtSecret) as { userId: string | number };
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired access token" });
  }
};
