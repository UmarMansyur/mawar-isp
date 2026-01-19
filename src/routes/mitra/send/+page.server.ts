import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

const WA_API_URL = "http://localhost:3001";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return { devices: [], customers: [], templates: [] };

  // Get connected devices
  const devices = await prisma.whatsAppDevice.findMany({
    where: { userId: user.id, status: "connected" },
    orderBy: { name: "asc" },
  });

  // Get customers with phone numbers
  const customers = await prisma.customer.findMany({
    where: {
      mikrotik: { userId: user.id },
      phone: { not: null },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
    },
    orderBy: { name: "asc" },
  });

  // Get notification templates
  const templates = await prisma.notificationTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return { devices, customers, templates };
};

// Helper function to send message via API
async function sendMessage(sessionId: string, phone: string, message: string) {
  try {
    const res = await fetch(`${WA_API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, phone, message }),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export const actions: Actions = {
  // Send individual message
  sendMessage: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;
    const customerId = formData.get("customerId") as string;
    const message = formData.get("message") as string;

    if (!deviceId || !customerId || !message) {
      return fail(400, { error: "Semua field harus diisi" });
    }

    // Get device
    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return fail(400, { error: "Device tidak ditemukan" });
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.phone) {
      return fail(400, {
        error: "Customer tidak ditemukan atau tidak punya nomor HP",
      });
    }

    // Send via API
    const result = await sendMessage(device.sessionId, customer.phone, message);

    // Log the message
    await prisma.notificationLog.create({
      data: {
        type: "MANUAL",
        recipient: customer.phone.replace(/\D/g, ""),
        recipientName: customer.name,
        message,
        status: result.success ? "sent" : "failed",
        errorMsg: result.error,
        userId: user.id,
        customerId: customer.id,
        deviceId,
        sentAt: result.success ? new Date() : null,
      },
    });

    if (result.success) {
      await prisma.whatsAppDevice.update({
        where: { id: deviceId },
        data: { lastActive: new Date() },
      });
      return { success: true, message: "Pesan berhasil dikirim" };
    }
    return fail(500, { error: result.error || "Gagal mengirim pesan" });
  },

  // Send blast messages
  sendBlast: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const deviceId = formData.get("deviceId") as string;
    const customerIds = formData.getAll("customerIds") as string[];
    const message = formData.get("message") as string;

    if (!deviceId || customerIds.length === 0 || !message) {
      return fail(400, { error: "Pilih device, penerima, dan tulis pesan" });
    }

    // Get device
    const device = await prisma.whatsAppDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return fail(400, { error: "Device tidak ditemukan" });
    }

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds }, phone: { not: null } },
    });

    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      const personalMessage = message.replace("{nama}", customer.name);
      const result = await sendMessage(
        device.sessionId,
        customer.phone!,
        personalMessage,
      );

      // Log each message
      await prisma.notificationLog.create({
        data: {
          type: "BLAST",
          recipient: customer.phone!.replace(/\D/g, ""),
          recipientName: customer.name,
          message: personalMessage,
          status: result.success ? "sent" : "failed",
          errorMsg: result.error,
          userId: user.id,
          customerId: customer.id,
          deviceId,
          sentAt: result.success ? new Date() : null,
        },
      });

      if (result.success) sent++;
      else failed++;

      // Delay between messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await prisma.whatsAppDevice.update({
      where: { id: deviceId },
      data: { lastActive: new Date() },
    });

    return {
      success: true,
      message: `Terkirim: ${sent}, Gagal: ${failed}`,
      sent,
      failed,
    };
  },
};
