import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user?.id;

  if (!userId) {
    return { pakets: [] };
  }

  // Get mitra's pakets
  const pakets = await prisma.paket.findMany({
    where: { userId },
    include: {
      _count: {
        select: { customers: true },
      },
    },
    orderBy: { price: "asc" },
  });

  return { pakets };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId) return fail(401, { unauthorized: true });

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const speed = formData.get("speed") as string;
    const price = Number(formData.get("price")) || 0;

    if (!name || price <= 0) {
      return fail(400, { missing: true });
    }

    await prisma.paket.create({
      data: {
        name,
        description,
        speed,
        price,
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
    const speed = formData.get("speed") as string;
    const price = Number(formData.get("price")) || 0;

    if (!id || !name) {
      return fail(400, { missing: true });
    }

    await prisma.paket.update({
      where: { id },
      data: { name, description, speed, price },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.paket.delete({
      where: { id },
    });

    return { success: true };
  },

  toggle: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";

    await prisma.paket.update({
      where: { id },
      data: { isActive: !isActive },
    });

    return { success: true };
  },
};
