import { prisma } from "$lib/server/prisma";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ params }) => {
  const mikrotik = await prisma.mikrotik.findUnique({
    where: { id: params.id },
  });

  if (!mikrotik) {
    throw error(404, "Mikrotik not found");
  }

  return { mikrotik };
};
