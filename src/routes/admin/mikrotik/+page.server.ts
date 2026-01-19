import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async () => {
  const mikrotiks = await prisma.mikrotik.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { mikrotiks };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const ip = formData.get("ip") as string;
    const port = Number(formData.get("port")) || 8728;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const userId = formData.get("userId") as string;

    if (!name || !ip || !username || !password) {
      return fail(400, { missing: true });
    }

    await prisma.mikrotik.create({
      data: {
        name,
        ip,
        port,
        username,
        password,
        userId,
        status: "offline",
      },
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const ip = formData.get("ip") as string;
    const port = Number(formData.get("port")) || 8728;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    await prisma.mikrotik.update({
      where: { id },
      data: {
        name,
        ip,
        port,
        username,
        password,
      },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.mikrotik.delete({
      where: { id },
    });

    return { success: true };
  },

  updateStatus: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;

    await prisma.mikrotik.update({
      where: { id },
      data: {
        status,
        lastSync: new Date(),
      },
    });

    return { success: true };
  },
};
