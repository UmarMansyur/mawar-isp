import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";
import crypto from "crypto";

const WA_API_URL = "http://localhost:3001";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return { devices: [] };

  // Get all devices for this user
  const devices = await prisma.whatsAppDevice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Enhance with live status from WA server
  const enhancedDevices = await Promise.all(
    devices.map(async (device) => {
      try {
        const res = await fetch(
          `${WA_API_URL}/devices/${device.sessionId}/status`,
        );
        const data = await res.json();
        return {
          ...device,
          liveStatus: data.status || device.status,
          livePhone: data.phone || device.phone,
        };
      } catch {
        return {
          ...device,
          liveStatus: device.status,
          livePhone: device.phone,
        };
      }
    }),
  );

  return { devices: enhancedDevices };
};

export const actions: Actions = {
  // Add new device
  addDevice: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const name = formData.get("name") as string;

    if (!name) {
      return fail(400, { error: "Nama device harus diisi" });
    }

    // Generate unique session ID
    const sessionId = `device_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    try {
      await prisma.whatsAppDevice.create({
        data: {
          name,
          sessionId,
          userId: user.id,
          status: "disconnected",
        },
      });

      return { success: true, message: "Device berhasil ditambahkan" };
    } catch (e: any) {
      return fail(500, { error: e.message });
    }
  },

  // Connect device (start QR)
  connectDevice: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return fail(400, { error: "Device ID required" });
    }

    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== user.id) {
      return fail(404, { error: "Device tidak ditemukan" });
    }

    try {
      const res = await fetch(
        `${WA_API_URL}/devices/${device.sessionId}/connect`,
        {
          method: "POST",
        },
      );
      const data = await res.json();

      if (data.success) {
        return {
          success: true,
          message: "Menghubungkan...",
          sessionId: device.sessionId,
        };
      }
      return fail(500, { error: data.error || "Gagal menghubungkan" });
    } catch (e: any) {
      return fail(500, { error: e.message });
    }
  },

  // Request pairing code
  requestPairingCode: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (!deviceId || !phoneNumber) {
      return fail(400, { error: "Device ID dan nomor HP harus diisi" });
    }

    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== user.id) {
      return fail(404, { error: "Device tidak ditemukan" });
    }

    try {
      const res = await fetch(
        `${WA_API_URL}/devices/${device.sessionId}/pairing-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        },
      );
      const data = await res.json();

      if (data.success) {
        return {
          success: true,
          pairingCode: data.pairingCode,
          message: data.message,
        };
      }
      return fail(500, {
        error: data.error || "Gagal mendapatkan pairing code",
      });
    } catch (e: any) {
      return fail(500, { error: e.message });
    }
  },

  // Disconnect device
  disconnectDevice: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return fail(400, { error: "Device ID required" });
    }

    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== user.id) {
      return fail(404, { error: "Device tidak ditemukan" });
    }

    try {
      await fetch(`${WA_API_URL}/devices/${device.sessionId}/disconnect`, {
        method: "POST",
      });

      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: { status: "disconnected", phone: null },
      });

      return { success: true, message: "Device disconnected" };
    } catch (e: any) {
      return fail(500, { error: e.message });
    }
  },

  // Delete device
  deleteDevice: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    if (!deviceId) {
      return fail(400, { error: "Device ID required" });
    }

    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.userId !== user.id) {
      return fail(404, { error: "Device tidak ditemukan" });
    }

    try {
      // Disconnect first
      await fetch(`${WA_API_URL}/devices/${device.sessionId}/disconnect`, {
        method: "POST",
      });

      // Delete from database
      await prisma.whatsAppDevice.delete({
        where: { id: deviceId },
      });

      return { success: true, message: "Device berhasil dihapus" };
    } catch (e: any) {
      return fail(500, { error: e.message });
    }
  },
};
