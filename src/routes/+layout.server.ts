import type { LayoutServerLoad } from "./$types.js";
import { prisma } from "$lib/server/prisma";

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  let subscription = null;
  let mikrotiks: any[] = [];

  if (user) {
    // Fetch subscription with package info
    subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { package: true },
    });

    // Fetch user's mikrotiks
    mikrotiks = await prisma.mikrotik.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });
  }

  return { user, subscription, mikrotiks };
};
