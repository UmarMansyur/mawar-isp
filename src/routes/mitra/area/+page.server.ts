import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user?.id;

  if (!userId) {
    return { areas: [] };
  }

  const areas = await prisma.area.findMany({
    where: { userId },
    include: {
      _count: {
        select: { customers: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return { areas };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId) return fail(401, { unauthorized: true });

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      return fail(400, { missing: true });
    }

    await prisma.area.create({
      data: {
        name,
        description,
        userId,
      },
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!id || !name) {
      return fail(400, { missing: true });
    }

    await prisma.area.update({
      where: { id },
      data: { name, description },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.area.delete({
      where: { id },
    });

    return { success: true };
  },
};
