import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return { notifications: [], templates: [] };

  // Get notification logs for this user
  const notifications = await prisma.notificationLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      device: { select: { name: true } }
    }
  });

  // Get templates
  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { trigger: "asc" }
  });

  return { notifications, templates };
};

export const actions: Actions = {
  saveTemplates: async ({ request }) => {
    const formData = await request.formData();

    const templatesData = [
      {
        trigger: "H-3",
        name: "Pengingat H-3",
        isActive: formData.get("h3_enabled") === "on",
        message: formData.get("h3_message") as string || "",
      },
      {
        trigger: "H-0",
        name: "Jatuh Tempo H-0",
        isActive: formData.get("h0_enabled") === "on",
        message: formData.get("h0_message") as string || "",
      },
      {
        trigger: "H+1",
        name: "Peringatan Isolir H+1",
        isActive: formData.get("h1_enabled") === "on",
        message: formData.get("h1_message") as string || "",
      },
    ];

    // Upsert each template
    for (const t of templatesData) {
      await prisma.notificationTemplate.upsert({
        where: { trigger: t.trigger },
        update: { isActive: t.isActive, message: t.message },
        create: t,
      });
    }

    return { success: true };
  },
};
