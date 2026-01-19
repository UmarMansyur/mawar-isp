import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async () => {
  const packages = await prisma.package.findMany({
    orderBy: { price: "asc" },
  });

  return { packages };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const maxMikrotik = Number(formData.get("maxMikrotik"));
    const maxCustomers = Number(formData.get("maxCustomers"));
    const features = formData.get("features") as string;
    const isPopular = formData.get("isPopular") === "on";

    if (!name || isNaN(price)) {
      return fail(400, { missing: true });
    }

    await prisma.package.create({
      data: {
        name,
        price,
        maxMikrotik,
        maxCustomers,
        features,
        isPopular,
      },
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const maxMikrotik = Number(formData.get("maxMikrotik"));
    const maxCustomers = Number(formData.get("maxCustomers"));
    const features = formData.get("features") as string;
    const isPopular = formData.get("isPopular") === "on";

    await prisma.package.update({
      where: { id },
      data: {
        name,
        price,
        maxMikrotik,
        maxCustomers,
        features,
        isPopular,
      },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = Number(formData.get("id"));

    await prisma.package.delete({
      where: { id },
    });

    return { success: true };
  },
};
