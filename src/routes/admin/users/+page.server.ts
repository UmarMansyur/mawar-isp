import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async () => {
  const users = await prisma.user.findMany({
    where: { role: "MITRA" },
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: { package: true },
      },
    },
  });

  const packages = await prisma.package.findMany({
    orderBy: { price: "asc" },
  });

  return { users, packages };
};

export const actions: Actions = {
  approve: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.user.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    return { success: true };
  },

  suspend: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.user.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.user.delete({
      where: { id },
    });

    return { success: true };
  },
};
