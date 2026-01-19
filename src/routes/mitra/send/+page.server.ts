import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";
import { sendWhatsAppMessage, sendBlastMessages } from "$lib/server/whatsapp";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return { devices: [], customers: [] };

  // Get connected devices
  const devices = await prisma.whatsAppDevice.findMany({
    where: { userId: user.id, status: "connected" },
    orderBy: { name: "asc" }
  });

  // Get customers with phone numbers
  const customers = await prisma.customer.findMany({
    where: {
      mikrotik: { userId: user.id },
      phone: { not: null }
    },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true
    },
    orderBy: { name: "asc" }
  });

  // Get notification templates
  const templates = await prisma.notificationTemplate.findMany({
    where: { isActive: true },
    orderBy: { trigger: "asc" }
  });

  return { devices, customers, templates };
};

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

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer || !customer.phone) {
      return fail(400, { error: "Customer tidak ditemukan atau tidak punya nomor HP" });
    }

    const result = await sendWhatsAppMessage(
      deviceId,
      customer.phone,
      message,
      {
        type: "MANUAL",
        recipientName: customer.name,
        userId: user.id,
        customerId: customer.id
      }
    );

    if (result.success) {
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

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds }, phone: { not: null } }
    });

    const recipients = customers.map(c => ({
      phone: c.phone!,
      name: c.name,
      customerId: c.id,
      message: message.replace("{nama}", c.name)
    }));

    const result = await sendBlastMessages(deviceId, recipients, user.id);

    return {
      success: true,
      message: `Terkirim: ${result.sent}, Gagal: ${result.failed}`,
      sent: result.sent,
      failed: result.failed
    };
  }
};
