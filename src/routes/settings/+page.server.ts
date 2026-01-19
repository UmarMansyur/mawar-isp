import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import bcrypt from "bcryptjs";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  return { user: locals.user };
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId) {
      return fail(401, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) {
      return fail(400, { error: "Nama dan email wajib diisi" });
    }

    // Check if email is already used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return fail(400, { error: "Email sudah digunakan" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });

    return { success: true, message: "Profil berhasil diperbarui" };
  },

  updatePassword: async ({ request, locals }) => {
    const userId = locals.user?.id;
    if (!userId) {
      return fail(401, { error: "Unauthorized" });
    }

    const formData = await request.formData();
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return fail(400, { error: "Semua field password wajib diisi" });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, { error: "Password baru tidak cocok" });
    }

    if (newPassword.length < 6) {
      return fail(400, { error: "Password minimal 6 karakter" });
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return fail(404, { error: "User tidak ditemukan" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return fail(400, { error: "Password saat ini salah" });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password berhasil diperbarui" };
  },
};
