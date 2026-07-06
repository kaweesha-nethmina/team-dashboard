import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { env } from "../../config/env";
import { JwtPayload } from "../../middleware/auth";

export class AuthService {
  async register(name: string, email: string, password: string, role: string = "MEMBER") {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role as any },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload: JwtPayload = { userId, email, role };
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
  }
}

export const authService = new AuthService();
