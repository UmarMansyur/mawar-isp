import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async () => {
  // Fetch all mitra users with their subscriptions
  const users = await prisma.user.findMany({
    where: { role: "MITRA" },
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: { package: true },
      },
      mikrotiks: {
        select: { id: true },
      },
      _count: {
        select: {
          mikrotiks: true,
        },
      },
    },
  });

  // Fetch all available packages
  const packages = await prisma.package.findMany({
    orderBy: { price: "asc" },
  });

  // Calculate stats
  const totalMitra = users.length;
  const activeSubscriptions = users.filter((u) => u.subscription?.isActive).length;
  const expiredSubscriptions = users.filter(
    (u) => u.subscription && !u.subscription.isActive
  ).length;
  const noSubscription = users.filter((u) => !u.subscription).length;

  return {
    users,
    packages,
    stats: {
      totalMitra,
      activeSubscriptions,
      expiredSubscriptions,
      noSubscription,
    },
  };
};

export const actions: Actions = {
  // Assign package to mitra
  assignPackage: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const packageId = Number(formData.get("packageId"));
    const durationMonths = Number(formData.get("durationMonths")) || 1;

    if (!userId || !packageId) {
      return fail(400, { error: "User dan paket harus dipilih" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Check if user already has a subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription) {
      // Update existing subscription
      await prisma.subscription.update({
        where: { userId },
        data: {
          packageId,
          startDate,
          endDate,
          isActive: true,
        },
      });
    } else {
      // Create new subscription
      await prisma.subscription.create({
        data: {
          userId,
          packageId,
          startDate,
          endDate,
          isActive: true,
        },
      });
    }

    // Activate user if pending
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    return { success: true, message: "Paket berhasil diberikan" };
  },

  // Extend subscription
  extendSubscription: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const durationMonths = Number(formData.get("durationMonths")) || 1;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return fail(400, { error: "Langganan tidak ditemukan" });
    }

    // Extend from current end date or today if expired
    const baseDate = subscription.endDate > new Date()
      ? subscription.endDate
      : new Date();

    const newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

    await prisma.subscription.update({
      where: { userId },
      data: {
        endDate: newEndDate,
        isActive: true,
      },
    });

    return { success: true, message: "Langganan berhasil diperpanjang" };
  },

  // Toggle subscription status
  toggleStatus: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const isActive = formData.get("isActive") === "true";

    await prisma.subscription.update({
      where: { userId },
      data: { isActive },
    });

    return { success: true };
  },

  // Cancel subscription
  cancelSubscription: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;

    await prisma.subscription.update({
      where: { userId },
      data: { isActive: false },
    });

    return { success: true, message: "Langganan berhasil dibatalkan" };
  },

  // Change package
  changePackage: async ({ request }) => {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const packageId = Number(formData.get("packageId"));

    await prisma.subscription.update({
      where: { userId },
      data: { packageId },
    });

    return { success: true, message: "Paket berhasil diubah" };
  },
};
