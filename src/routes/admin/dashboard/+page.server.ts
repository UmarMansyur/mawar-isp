import { prisma } from "$lib/server/prisma";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async () => {
  // Platform-wide stats
  const totalMitra = await prisma.user.count({
    where: { role: "MITRA" },
  });
  const activeMitra = await prisma.user.count({
    where: { role: "MITRA", status: "ACTIVE" },
  });
  const pendingMitra = await prisma.user.count({
    where: { role: "MITRA", status: "PENDING" },
  });
  const totalMikrotik = await prisma.mikrotik.count();
  const totalCustomers = await prisma.customer.count();
  const totalInvoices = await prisma.invoice.count();
  const paidInvoices = await prisma.invoice.count({
    where: { status: "PAID" },
  });

  // Revenue calculation
  const revenue = await prisma.invoice.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
  });

  // Recent mitra registrations
  const recentMitra = await prisma.user.findMany({
    where: { role: "MITRA" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    stats: {
      totalMitra,
      activeMitra,
      pendingMitra,
      totalMikrotik,
      totalCustomers,
      totalInvoices,
      paidInvoices,
      totalRevenue: revenue._sum.amount || 0,
    },
    recentMitra,
  };
};
