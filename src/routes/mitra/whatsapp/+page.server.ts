import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";
import { initWithQR, initWithPhone, disconnectWhatsApp, getQRCode, getConnectionStatus, cleanupSession } from "$lib/server/whatsapp";
import { randomUUID } from "crypto";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return { devices: [] };

  const devices = await prisma.whatsAppDevice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { notifications: true }
      }
    }
  });

  // Attach QR codes and real-time status
  const devicesWithStatus = devices.map(device => ({
    ...device,
    qrCode: getQRCode(device.sessionId),
    liveStatus: getConnectionStatus(device.sessionId)
  }));

  return { devices: devicesWithStatus };
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

    const sessionId = `wa_${user.id}_${randomUUID()}`;

    const device = await prisma.whatsAppDevice.create({
      data: {
        name,
        sessionId,
        userId: user.id,
        status: "disconnected"
      }
    });

    return { success: true, deviceId: device.id };
  },

  // Start pairing with QR code
  startPairing: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    const device = await prisma.whatsAppDevice.findFirst({
      where: { id: deviceId, userId: user.id }
    });

    if (!device) {
      return fail(404, { error: "Device not found" });
    }

    const result = await initWithQR(device.sessionId, user.id);

    if (result.success) {
      return { success: true, message: "QR Code sedang dibuat..." };
    }
    return fail(500, { error: result.error });
  },

  // Start pairing with phone number
  startPhonePairing: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (!phoneNumber) {
      return fail(400, { error: "Nomor telepon harus diisi" });
    }

    const device = await prisma.whatsAppDevice.findFirst({
      where: { id: deviceId, userId: user.id }
    });

    if (!device) {
      return fail(404, { error: "Device not found" });
    }

    const result = await initWithPhone(device.sessionId, user.id, phoneNumber);

    if (result.success) {
      return { success: true, pairingCode: result.pairingCode };
    }
    return fail(500, { error: result.error });
  },

  // Get QR code for polling
  getQR: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    const device = await prisma.whatsAppDevice.findFirst({
      where: { id: deviceId, userId: user.id }
    });

    if (!device) {
      return fail(404, { error: "Device not found" });
    }

    const qrCode = getQRCode(device.sessionId);
    const status = getConnectionStatus(device.sessionId);

    // Also get DB status
    const dbDevice = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
      select: { status: true }
    });

    return {
      success: true,
      qrCode,
      device,
      status: dbDevice?.status || status
    };
  },

  // Disconnect device
  disconnect: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    const device = await prisma.whatsAppDevice.findFirst({
      where: { id: deviceId, userId: user.id }
    });

    if (!device) {
      return fail(404, { error: "Device not found" });
    }

    await disconnectWhatsApp(device.sessionId);
    return { success: true };
  },

  // Delete device
  deleteDevice: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;

    const device = await prisma.whatsAppDevice.findFirst({
      where: { id: deviceId, userId: user.id }
    });

    if (device) {
      await cleanupSession(device.sessionId);
    }

    await prisma.whatsAppDevice.delete({
      where: { id: deviceId }
    });

    return { success: true };
  }
};
