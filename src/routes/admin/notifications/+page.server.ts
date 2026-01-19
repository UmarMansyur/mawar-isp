import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async () => {
  let templates = await prisma.notificationTemplate.findMany({
    orderBy: { createdAt: "asc" },
  });

  // If no templates exist, create default ones
  if (templates.length === 0) {
    const defaultTemplates = [
      {
        name: "H-3 Reminder",
        trigger: "H-3",
        message:
          "Yth. {nama}, ini pengingat bahwa tagihan internet Anda sebesar {nominal} akan jatuh tempo pada tanggal {tanggal}. Silakan lakukan pembayaran. Terima kasih!",
      },
      {
        name: "Hari H",
        trigger: "H-0",
        message:
          "Yth. {nama}, tagihan internet Anda sebesar {nominal} jatuh tempo HARI INI. Segera lakukan pembayaran untuk menghindari pemutusan layanan. Link: {link_bayar}",
      },
      {
        name: "H+1 Isolir",
        trigger: "H+1",
        message:
          "Yth. {nama}, layanan internet Anda telah dinonaktifkan karena belum melakukan pembayaran. Silakan bayar {nominal} untuk mengaktifkan kembali. Link: {link_bayar}",
      },
    ];

    for (const template of defaultTemplates) {
      await prisma.notificationTemplate.create({ data: template });
    }

    templates = await prisma.notificationTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  return { templates };
};

export const actions: Actions = {
  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const message = formData.get("message") as string;

    if (!id || !message) {
      return fail(400, { missing: true });
    }

    await prisma.notificationTemplate.update({
      where: { id },
      data: { message },
    });

    return { success: true };
  },

  updateAll: async ({ request }) => {
    const formData = await request.formData();
    const templatesJson = formData.get("templates") as string;

    try {
      const templates = JSON.parse(templatesJson);

      for (const template of templates) {
        await prisma.notificationTemplate.update({
          where: { id: template.id },
          data: { message: template.message },
        });
      }

      return { success: true };
    } catch (error) {
      return fail(400, { error: "Invalid data" });
    }
  },

  toggleActive: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const isActive = formData.get("isActive") === "true";

    await prisma.notificationTemplate.update({
      where: { id },
      data: { isActive },
    });

    return { success: true };
  },
};
