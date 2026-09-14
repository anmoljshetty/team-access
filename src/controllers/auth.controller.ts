import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db";

const signupSchema = z.object({
  name: z.string().optional(),
  email: z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email()),
  password: z.string().min(6),
});

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const parsedData = signupSchema.safeParse(req.body);
    
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