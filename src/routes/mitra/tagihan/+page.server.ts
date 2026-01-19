import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

const PAGE_SIZE = 15;

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user) return { invoices: [], customers: [], stats: { totalUnpaid: 0, totalPaid: 0, totalAmount: 0 }, totalPages: 0, currentPage: 1 };

  // Pagination params
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";

  // Build where clause
  const where: any = { userId: user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { invoiceNo: { contains: search } },
      { description: { contains: search } },
      { customer: { name: { contains: search } } }
    ];
  }

  // Get total count for pagination
  const totalCount = await prisma.invoice.count({ where });
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      customer: {
        select: { id: true, name: true, phone: true }
      }
    }
  });

  const customers = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
      mikrotik: { userId: user.id }
    },
  });

  // Stats for this user
  const totalUnpaid = await prisma.invoice.count({
    where: { status: "UNPAID", userId: user.id },
  });
  const totalPaid = await prisma.invoice.count({
    where: { status: "PAID", userId: user.id },
  });
  const totalAmount = await prisma.invoice.aggregate({
    where: { status: "UNPAID", userId: user.id },
    _sum: { amount: true },
  });

  return {
    invoices,
    customers,
    stats: {
      totalUnpaid,
      totalPaid,
      totalAmount: totalAmount._sum.amount || 0,
    },
    totalPages,
    currentPage: page,
    pageSize: PAGE_SIZE,
    totalCount,
  };
};

export const actions: Actions = {
  generate: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const selectedMonth = parseInt(formData.get("month") as string) || (new Date().getMonth() + 1);
    const selectedYear = parseInt(formData.get("year") as string) || new Date().getFullYear();

    // Get all active customers for this user's mikrotiks
    const customers = await prisma.customer.findMany({
      where: {
        status: "ACTIVE",
        mikrotik: {
          userId: user.id
        }
      },
      include: {
        paket: true
      }
    });

    if (customers.length === 0) {
      return fail(400, { error: "Tidak ada pelanggan aktif untuk digenerate" });
    }

    let generated = 0;
    let skipped = 0;

    // Generate invoice for each customer
    for (const customer of customers) {
      const invoiceNo = `INV-${selectedYear}${selectedMonth.toString().padStart(2, "0")}-${customer.id.slice(-6).toUpperCase()}`;

      // Check duplicate by customerId AND month/year (more robust)
      const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

      const existing = await prisma.invoice.findFirst({
        where: {
          OR: [
            { invoiceNo }, // Check by invoice number
            {
              customerId: customer.id, // Or by customer + month range
              dueDate: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          ]
        }
      });

      if (!existing) {
        const amount = customer.servicePrice || customer.paket?.price || 0;
        const dueDate = customer.dueDate || 10;

        await prisma.invoice.create({
          data: {
            invoiceNo,
            amount,
            status: "UNPAID",
            dueDate: new Date(selectedYear, selectedMonth - 1, dueDate),
            userId: user.id,
            customerId: customer.id, // Link to customer
            description: `Tagihan ${customer.name} - ${selectedMonth}/${selectedYear}`,
          },
        });
        generated++;
      } else {
        skipped++;
      }
    }

    return { success: true, message: `Generated: ${generated}, Skipped: ${skipped}` };
  },

  markPaid: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.invoice.update({
      where: { id, userId: user.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const id = formData.get("id") as string;

    await prisma.invoice.delete({
      where: { id, userId: user.id },
    });

    return { success: true };
  },

  sendNotaWA: async ({ request, locals, url }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const invoiceId = formData.get("invoiceId") as string;
    const phone = formData.get("phone") as string;

    // Get invoice details
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: user.id },
      include: { customer: true }
    });

    if (!invoice) {
      return fail(404, { error: "Invoice tidak ditemukan" });
    }

    if (invoice.status !== "PAID") {
      return fail(400, { error: "Nota hanya tersedia untuk tagihan lunas" });
    }

    // Get connected WhatsApp device
    const device = await prisma.whatsAppDevice.findFirst({
      where: { userId: user.id, status: "connected" },
      orderBy: { lastActive: "desc" }
    });

    if (!device) {
      return fail(400, { error: "Tidak ada WhatsApp yang terhubung" });
    }

    // Import WhatsApp service dynamically
    const { sendWhatsAppMessage } = await import("$lib/server/whatsapp");

    // Build nota URL
    const baseUrl = url.origin;
    const notaUrl = `${baseUrl}/api/nota/${invoice.id}`;

    // Format message
    const message = `🧾 *NOTA PEMBAYARAN*\n\n` +
      `No. Invoice: ${invoice.invoiceNo}\n` +
      `Pelanggan: ${invoice.customer?.name || "-"}\n` +
      `Jumlah: Rp ${invoice.amount.toLocaleString("id-ID")}\n` +
      `Tanggal Bayar: ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString("id-ID") : "-"}\n\n` +
      `📥 Download Nota PDF:\n${notaUrl}\n\n` +
      `Terima kasih atas pembayaran Anda. 🙏`;

    const result = await sendWhatsAppMessage(device.id, phone, message, {
      type: "NOTA",
      recipientName: invoice.customer?.name,
      userId: user.id,
      customerId: invoice.customer?.id
    });

    if (!result.success) {
      return fail(500, { error: result.error || "Gagal mengirim pesan" });
    }

    return { success: true, message: "Nota berhasil dikirim via WhatsApp" };
  },
};
