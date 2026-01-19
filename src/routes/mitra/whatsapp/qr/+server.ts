import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getQRCode, getConnectionStatus } from "$lib/server/whatsapp";
import { prisma } from "$lib/server/prisma";

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceId = url.searchParams.get("deviceId");
  if (!deviceId) {
    return json({ error: "Device ID required" }, { status: 400 });
  }

  const device = await prisma.whatsAppDevice.findFirst({
    where: { id: deviceId, userId: user.id }
  });

  if (!device) {
    return json({ error: "Device not found" }, { status: 404 });
  }

  const qrCode = getQRCode(device.sessionId);
  const liveStatus = await getConnectionStatus(device.sessionId);

  return json({
    qrCode,
    status: device.status,
    liveStatus,
    phone: device.phone
  });
};
