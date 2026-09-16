import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis";
import { email, z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { generateAndSetTokens } from "../utils/token.util";
import { error } from "console";
import { hash } from "crypto";
import { id } from "zod/locales";

const userSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email()),
  password: z.string().min(6),
});

async function signup(req: Request, res: Response): Promise<void> {
  try {
    const parsedData = userSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(400).json({ error: parsedData.error.issues });
      return;
    }

    const { name, email, password } = parsedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}



async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsedData = userSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(400).json({ error: parsedData.error.issues });
      return;
    }

    const { email, password } = parsedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    await generateAndSetTokens(res, user.id);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export {
  signup,
  login
};