import { fail, redirect } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";
import { hashPassword, createSession } from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, locals.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/mitra/dashboard");
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return fail(400, { error: "Email dan password harus diisi", email });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.password !== hashPassword(password)) {
      return fail(400, { error: "Email atau password salah", email });
    }

    if (user.status !== "ACTIVE") {
      return fail(400, { error: "Akun Anda belum aktif atau diblokir", email });
    }

    await createSession(user.id, cookies);

    throw redirect(302, user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/mitra/dashboard");
  },
};
