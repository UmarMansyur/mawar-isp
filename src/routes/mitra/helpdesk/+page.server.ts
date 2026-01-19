import { prisma } from "$lib/server/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return { tickets: [] };

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return { tickets };
};

// Generate ticket number
async function generateTicketNo(): Promise<string> {
  const today = new Date();
  const prefix = `TKT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;

  const lastTicket = await prisma.ticket.findFirst({
    where: { ticketNo: { startsWith: prefix } },
    orderBy: { ticketNo: "desc" },
  });

  let seq = 1;
  if (lastTicket) {
    const lastSeq = parseInt(lastTicket.ticketNo.slice(-4), 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export const actions: Actions = {
  createTicket: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: "Unauthorized" });

    const formData = await request.formData();
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const priority = formData.get("priority") as string || "MEDIUM";

    if (!subject || !message) {
      return fail(400, { error: "Subjek dan pesan harus diisi" });
    }

    const ticketNo = await generateTicketNo();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo,
        subject,
        message,
        priority,
        status: "OPEN",
        userId: user.id,
      },
    });

    return { success: true, ticketId: ticket.id };
  },
};
