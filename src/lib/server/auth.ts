import { prisma } from "$lib/server/prisma";
import type { Cookies } from "@sveltejs/kit";
import { createHash, randomBytes } from "node:crypto";

const SESSION_COOKIE = "session_token";

// Hash password with SHA256
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Generate session token
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Create session
export async function createSession(userId: string, cookies: Cookies): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Store session in database (we'll use User.subscriptionId as a simple session storage)
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionId: token },
  });

  cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false, // Set to true in production with HTTPS
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return token;
}

// Get session user
export async function getSessionUser(cookies: Cookies) {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;

  const user = await prisma.user.findFirst({
    where: { subscriptionId: token },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  return user;
}

// Destroy session
export async function destroySession(cookies: Cookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE);
  if (token) {
    await prisma.user.updateMany({
      where: { subscriptionId: token },
      data: { subscriptionId: null },
    });
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

// Role types
export type UserRole = "SUPER_ADMIN" | "MITRA";

// Check if user has required role
export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  if (requiredRole === "SUPER_ADMIN") {
    return userRole === "SUPER_ADMIN";
  }
  return true; // MITRA can access MITRA routes
}
