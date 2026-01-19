// WhatsApp Service using Baileys (stable version)
// Switched from whatsapp-web.js due to compatibility issues

import { prisma } from "./prisma";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import type { ConnectionState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { Boom } from "@hapi/boom";
import pino from "pino";

// Session directory
const SESSION_DIR = join(process.cwd(), ".wa_sessions");

// Ensure directory exists
if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR, { recursive: true });
}

// Silent logger
const logger = pino({ level: "silent" });

// Store clients, QR codes, and status
const clients: Map<string, any> = new Map();
const qrCodes: Map<string, string> = new Map();
const initializingSet: Set<string> = new Set();

function getSafeId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Cleanup session
 */
export async function cleanupSession(sessionId: string): Promise<void> {
  console.log(`[WA] Cleanup: ${sessionId}`);

  const client = clients.get(sessionId);
  if (client) {
    try { client.end(undefined); } catch (e) { }
    clients.delete(sessionId);
  }

  qrCodes.delete(sessionId);
  initializingSet.delete(sessionId);

  const path = join(SESSION_DIR, getSafeId(sessionId));
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * Initialize with QR code
 */
export async function initWithQR(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Already connected?
    const existing = clients.get(sessionId);
    if (existing?.user) {
      return { success: true };
    }

    // Already initializing?
    if (initializingSet.has(sessionId)) {
      return { success: true };
    }

    // Cleanup first
    await cleanupSession(sessionId);
    initializingSet.add(sessionId);

    // Update DB
    await prisma.whatsAppDevice.update({
      where: { sessionId },
      data: { status: "qr_pending" }
    });

    // Setup session
    const sessionPath = join(SESSION_DIR, getSafeId(sessionId));
    mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    console.log(`[WA] Creating socket: ${sessionId}`);

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      logger,
      browser: ["MawarISP", "Chrome", "1.0.0"],
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    clients.set(sessionId, sock);

    // Handle events
    sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`[WA] QR for: ${sessionId}`);
        try {
          const qrUrl = await QRCode.toDataURL(qr, { width: 256, margin: 2 });
          qrCodes.set(sessionId, qrUrl);
        } catch (e) {
          console.error("[WA] QR error:", e);
        }
      }

      if (connection === "close") {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        console.log(`[WA] Closed: ${sessionId}, code: ${code}`);

        clients.delete(sessionId);
        qrCodes.delete(sessionId);
        initializingSet.delete(sessionId);

        if (code === DisconnectReason.loggedOut) {
          await cleanupSession(sessionId);
          await prisma.whatsAppDevice.update({
            where: { sessionId },
            data: { status: "disconnected", phone: null }
          });
        }
      }

      if (connection === "open") {
        console.log(`[WA] Connected: ${sessionId}`);

        initializingSet.delete(sessionId);
        qrCodes.delete(sessionId);

        const phone = sock.user?.id?.split(":")[0] || null;

        await prisma.whatsAppDevice.update({
          where: { sessionId },
          data: { status: "connected", phone, lastActive: new Date() }
        });
      }
    });

    sock.ev.on("creds.update", saveCreds);

    return { success: true };
  } catch (error: any) {
    console.error("[WA] Init error:", error);
    initializingSet.delete(sessionId);
    return { success: false, error: error.message };
  }
}

/**
 * Get QR code
 */
export function getQRCode(sessionId: string): string | null {
  return qrCodes.get(sessionId) || null;
}

/**
 * Get connection status
 */
export async function getConnectionStatus(
  sessionId: string
): Promise<"connected" | "initializing" | "disconnected"> {
  const client = clients.get(sessionId);
  if (client?.user) return "connected";
  if (initializingSet.has(sessionId)) return "initializing";
  return "disconnected";
}

/**
 * Disconnect
 */
export async function disconnectWhatsApp(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = clients.get(sessionId);
    if (client) {
      await client.logout();
    }
    await cleanupSession(sessionId);

    await prisma.whatsAppDevice.update({
      where: { sessionId },
      data: { status: "disconnected", phone: null }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send message
 */
export async function sendWhatsAppMessage(
  deviceId: string,
  phone: string,
  message: string,
  metadata: { type: string; recipientName?: string; userId: string; customerId?: string }
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    const device = await prisma.whatsAppDevice.findUnique({ where: { id: deviceId } });
    if (!device) return { success: false, error: "Device not found" };

    const client = clients.get(device.sessionId);

    // Check if client exists and connected
    if (!client?.user) {
      // Sync DB status if needed
      if (device.status === "connected") {
        await prisma.whatsAppDevice.update({
          where: { id: deviceId },
          data: { status: "disconnected" }
        });
      }
      return { success: false, error: "Device tidak terhubung. Silakan hubungkan ulang." };
    }

    // Format phone
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "62" + formatted.slice(1);
    else if (!formatted.startsWith("62")) formatted = "62" + formatted;

    const jid = `${formatted}@s.whatsapp.net`;

    // Check exists
    const [exists] = await client.onWhatsApp(jid);
    if (!exists?.exists) return { success: false, error: "Number not on WhatsApp" };

    // Send
    await client.sendMessage(jid, { text: message });

    // Log
    const log = await prisma.notificationLog.create({
      data: {
        type: metadata.type,
        recipient: formatted,
        recipientName: metadata.recipientName,
        message,
        status: "sent",
        userId: metadata.userId,
        customerId: metadata.customerId,
        deviceId,
        sentAt: new Date()
      }
    });

    await prisma.whatsAppDevice.update({
      where: { id: deviceId },
      data: { lastActive: new Date() }
    });

    return { success: true, logId: log.id };
  } catch (error: any) {
    console.error("[WA] Send error:", error);
    return { success: false, error: error.message };
  }
}

export function isConnected(sessionId: string): boolean {
  return clients.get(sessionId)?.user != null;
}

// Phone pairing
export async function initWithPhone(
  sessionId: string,
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
  try {
    await cleanupSession(sessionId);
    initializingSet.add(sessionId);

    await prisma.whatsAppDevice.update({
      where: { sessionId },
      data: { status: "pairing" }
    });

    const sessionPath = join(SESSION_DIR, getSafeId(sessionId));
    mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      logger,
      browser: ["MawarISP", "Chrome", "1.0.0"],
      printQRInTerminal: false,
    });

    clients.set(sessionId, sock);

    sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        clients.delete(sessionId);
        initializingSet.delete(sessionId);
      }

      if (connection === "open") {
        initializingSet.delete(sessionId);
        const phone = sock.user?.id?.split(":")[0] || null;
        await prisma.whatsAppDevice.update({
          where: { sessionId },
          data: { status: "connected", phone, lastActive: new Date() }
        });
      }
    });

    sock.ev.on("creds.update", saveCreds);

    // Wait for socket ready
    await new Promise(r => setTimeout(r, 1500));

    const formatted = phoneNumber.replace(/\D/g, "");
    const code = await sock.requestPairingCode(formatted);

    return { success: true, pairingCode: code };
  } catch (error: any) {
    console.error("[WA] Phone pairing error:", error);
    initializingSet.delete(sessionId);
    return { success: false, error: error.message };
  }
}
