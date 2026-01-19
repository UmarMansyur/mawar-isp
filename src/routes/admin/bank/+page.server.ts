import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async () => {
  const banks = await prisma.bank.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { banks };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountName = formData.get("accountName") as string;
    const branch = formData.get("branch") as string;
    const isActive = formData.get("isActive") === "on";

    if (!bankName || !accountNumber || !accountName) {
      return fail(400, { missing: true });
    }

    await prisma.bank.create({
      data: {
        bankName,
        accountNumber,
        accountName,
        branch: branch || null,
        isActive,
      },
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountName = formData.get("accountName") as string;
    const branch = formData.get("branch") as string;
    const isActive = formData.get("isActive") === "on";

    await prisma.bank.update({
      where: { id },
      data: {
        bankName,
        accountNumber,
        accountName,
        branch: branch || null,
        isActive,
      },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.bank.delete({
      where: { id },
    });

    return { success: true };
  },
};
