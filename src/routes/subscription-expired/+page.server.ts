import type { PageServerLoad } from "./$types.js";
import { prisma } from "$lib/server/prisma";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  let subscription = null;

  if (user) {
    subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { package: true },
    });
  }

  return { subscription };
};
