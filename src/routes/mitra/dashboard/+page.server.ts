import { prisma } from "$lib/server/prisma";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
  // Get stats
  const totalMikrotik = await prisma.mikrotik.count();
  const totalCustomers = await prisma.customer.count();
  const activeCustomers = await prisma.customer.count({
    where: { status: "ACTIVE" },
  });
  const isolatedCustomers = await prisma.customer.count({
    where: { status: "SUSPENDED" },
  });

  // Get recent invoices
  const recentInvoices = await prisma.invoice.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // Calculate revenue this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: "PAID",
      paidAt: { gte: thisMonth },
    },
  });
  const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return {
    stats: {
      totalMikrotik,
      totalCustomers,
      activeCustomers,
      isolatedCustomers,
      monthlyRevenue,
    },
    recentInvoices,
  };
};
