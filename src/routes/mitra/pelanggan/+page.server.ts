import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user?.id;

  // Get mitra's mikrotiks with their profiles
  const mikrotiks = await prisma.mikrotik.findMany({
    where: { userId },
    include: {
      pppProfiles: true,
    },
  });

  const mikrotikIds = mikrotiks.map((m) => m.id);

  // Get mitra's pakets
  const pakets = await prisma.paket.findMany({
    where: { userId, isActive: true },
    orderBy: { price: "asc" },
  });

  // Get mitra's areas
  const areas = await prisma.area.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  // Get customers from those mikrotiks
  const pelanggan = await prisma.customer.findMany({
    where: {
      mikrotikId: { in: mikrotikIds },
    },
    include: {
      mikrotik: true,
      profile: true,
      paket: true,
      area: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { pelanggan, mikrotiks, pakets, areas };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const connectionType = formData.get("connectionType") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const mikrotikId = formData.get("mikrotikId") as string;
    const profileId = formData.get("profileId") as string | null;
    const paketId = formData.get("paketId") as string | null;
    const areaId = formData.get("areaId") as string | null;
    const ipAddress = formData.get("ipAddress") as string | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;
    const servicePrice = Number(formData.get("servicePrice")) || 0;
    const dueDate = Number(formData.get("dueDate")) || 1;

    if (!name || !username || !mikrotikId) {
      return fail(400, { missing: true });
    }

    await prisma.customer.create({
      data: {
        name,
        address,
        phone,
        connectionType,
        username,
        password,
        mikrotikId,
        profileId: profileId || null,
        paketId: paketId || null,
        areaId: areaId || null,
        ipAddress: ipAddress || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        servicePrice,
        dueDate,
        status: "ACTIVE",
      },
    });

    return { success: true };
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const connectionType = formData.get("connectionType") as string;
    const username = formData.get("username") as string;
    const profileId = formData.get("profileId") as string | null;
    const paketId = formData.get("paketId") as string | null;
    const areaId = formData.get("areaId") as string | null;
    const ipAddress = formData.get("ipAddress") as string | null;
    const latitude = formData.get("latitude") as string | null;
    const longitude = formData.get("longitude") as string | null;
    const servicePrice = Number(formData.get("servicePrice")) || 0;
    const dueDate = Number(formData.get("dueDate")) || 1;
    const status = formData.get("status") as string;

    await prisma.customer.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        connectionType,
        username,
        profileId: profileId || null,
        paketId: paketId || null,
        areaId: areaId || null,
        ipAddress: ipAddress || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        servicePrice,
        dueDate,
        status,
      },
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.customer.delete({
      where: { id },
    });

    return { success: true };
  },

  isolir: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.customer.update({
      where: { id },
      data: { status: "ISOLIR" },
    });

    return { success: true };
  },

  activate: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.customer.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    return { success: true };
  },
};
