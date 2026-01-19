import { prisma } from "$lib/server/prisma";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ params }) => {
  const mikrotik = await prisma.mikrotik.findUnique({
    where: { id: params.id },
  });

  return { mikrotik };
};
