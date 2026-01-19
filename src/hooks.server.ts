import { redirect, type Handle } from "@sveltejs/kit";
import { getSessionUser } from "$lib/server/auth";
import { prisma } from "$lib/server/prisma";

const publicRoutes = ["/login", "/register", "/"];

export const handle: Handle = async ({ event, resolve }) => {
  // Get user from session
  const user = await getSessionUser(event.cookies);
  event.locals.user = user;

  const path = event.url.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => path === route || path.startsWith(route + "?"))) {
    // Redirect logged-in users away from login/register
    if (user && (path === "/login" || path === "/register")) {
      throw redirect(302, user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/mitra/dashboard");
    }
    return resolve(event);
  }

  // Require authentication for protected routes
  if (!user) {
    throw redirect(302, "/login");
  }

  // Role-based access control
  if (path.startsWith("/admin")) {
    if (user.role !== "SUPER_ADMIN") {
      throw redirect(302, "/mitra/dashboard");
    }
  }

  if (path.startsWith("/mitra")) {
    if (user.role !== "MITRA" && user.role !== "SUPER_ADMIN") {
      throw redirect(302, "/login");
    }

    // Check subscription for MITRA users only
    if (user.role === "MITRA") {
      // Allow subscription-expired page and settings
      if (path === "/subscription-expired" || path === "/settings" || path === "/logout") {
        return resolve(event);
      }

      // Check if user has active subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      const now = new Date();
      const hasValidSubscription =
        subscription &&
        subscription.isActive &&
        new Date(subscription.endDate) > now;

      if (!hasValidSubscription) {
        throw redirect(302, "/subscription-expired");
      }
    }
  }

  // Allow subscription-expired page
  if (path === "/subscription-expired") {
    return resolve(event);
  }

  return resolve(event);
};
