import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync, rmSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SESSION_DIR = join(__dirname, "sessions");

// Ensure sessions directory exists
if (!existsSync(SESSION_DIR)) {
  mkdirSync(SESSION_DIR, { recursive: true });
}

class WhatsAppManager {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map();
    this.pairingCodes = new Map(); // Add pairing codes map
    this.initializingDevices = new Set();
    this.eventEmitter = new Map(); // Add event emitter for callbacks
  }

  /**
   * Initialize a WhatsApp client for a session
   */
  async initClient(sessionId, onStatusChange) {
    // Already initializing?
    if (this.initializingDevices.has(sessionId)) {
      console.log(`[WA] ${sessionId} already initializing`);
      return this.clients.get(sessionId);
    }

    // Already connected?
    if (this.clients.has(sessionId)) {
      const existingClient = this.clients.get(sessionId);
      try {
        if (existingClient.pupPage && !existingClient.pupPage.isClosed()) {
          console.log(`[WA] ${sessionId} already connected`);
          return existingClient;
        }
      } catch (e) {
        console.log(`[WA] ${sessionId} not usable, reinitializing`);
      }

      // Cleanup existing
      try {
        await existingClient.destroy();
      } catch (e) {}
      this.clients.delete(sessionId);
      this.qrCodes.delete(sessionId);
      this.pairingCodes.delete(sessionId);
    }

    this.initializingDevices.add(sessionId);
    console.log(`[WA] Initializing ${sessionId}`);

    // Find Chrome executable
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.CHROME_PATH,
    ].filter(Boolean);

    let executablePath;
    for (const p of chromePaths) {
      if (existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId.replace(/[^a-zA-Z0-9_-]/g, "_"),
        dataPath: SESSION_DIR,
      }),
      puppeteer: {
        headless: true,
        executablePath, // Use system Chrome if found
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-default-browser-check",
        ],
        timeout: 120000,
      },
    });

    this.clients.set(sessionId, client);

    // Store onStatusChange callback
    if (onStatusChange) {
      this.eventEmitter.set(sessionId, onStatusChange);
    }

    // QR code
    client.on("qr", async (qr) => {
      console.log(`[WA] QR received for ${sessionId}`);
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        this.qrCodes.set(sessionId, qrDataUrl);
        const cb = this.eventEmitter.get(sessionId);
        if (cb) cb(sessionId, "qr_pending", null);
      } catch (e) {
        console.error(`[WA] QR error:`, e);
      }
    });

    // Ready
    client.on("ready", async () => {
      console.log(`[WA] ${sessionId} ready`);
      this.qrCodes.delete(sessionId);
      this.pairingCodes.delete(sessionId);
      this.initializingDevices.delete(sessionId);

      const phone = client.info?.wid?.user || null;
      const cb = this.eventEmitter.get(sessionId);
      if (cb) cb(sessionId, "connected", phone);
    });

    // Authenticated
    client.on("authenticated", () => {
      console.log(`[WA] ${sessionId} authenticated`);
    });

    // Auth failure
    client.on("auth_failure", (msg) => {
      console.error(`[WA] ${sessionId} auth failed:`, msg);
      this.initializingDevices.delete(sessionId);
      const cb = this.eventEmitter.get(sessionId);
      if (cb) cb(sessionId, "disconnected", null);
    });

    // Disconnected
    client.on("disconnected", (reason) => {
      console.log(`[WA] ${sessionId} disconnected:`, reason);
      this.clients.delete(sessionId);
      this.qrCodes.delete(sessionId);
      this.pairingCodes.delete(sessionId);
      this.initializingDevices.delete(sessionId);
      const cb = this.eventEmitter.get(sessionId);
      if (cb) cb(sessionId, "disconnected", null);
    });

    // Initialize
    try {
      await client.initialize();
    } catch (error) {
      console.error(`[WA] Init error ${sessionId}:`, error.message);
      this.clients.delete(sessionId);
      this.initializingDevices.delete(sessionId);
      throw error;
    }

    this.initializingDevices.delete(sessionId);
    return client;
  }

  /**
   * Request a pairing code for phone number-based authentication
   * @param {string} sessionId - Session ID
   * @param {string} phoneNumber - Phone number in format 628xxx (without + or spaces)
   * @returns {Promise<string>} - 8-character pairing code
   */
  async requestPairingCode(sessionId, phoneNumber) {
    // Clean phone number - remove any non-numeric characters
    const cleanPhone = phoneNumber.replace(/[^\d]/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error("Invalid phone number format. Use format: 628xxx");
    }

    // Check if client exists and is ready
    let client = this.clients.get(sessionId);

    if (!client) {
      throw new Error("Client not initialized. Please connect first.");
    }

    // Wait for client to be ready if needed
    if (!client.pupPage || client.pupPage.isClosed()) {
      throw new Error("Client is not ready. Please wait for initialization.");
    }

    try {
      console.log(
        `[WA] Requesting pairing code for ${sessionId} with phone ${cleanPhone}`,
      );

      // Request pairing code from WhatsApp
      const pairingCode = await client.requestPairingCode(cleanPhone);

      // Store the pairing code
      this.pairingCodes.set(sessionId, pairingCode);

      // Update status
      const cb = this.eventEmitter.get(sessionId);
      if (cb) cb(sessionId, "waiting_pair", null);

      console.log(
        `[WA] Pairing code generated for ${sessionId}: ${pairingCode}`,
      );

      return pairingCode;
    } catch (error) {
      console.error(
        `[WA] Error requesting pairing code for ${sessionId}:`,
        error,
      );
      throw new Error(`Failed to generate pairing code: ${error.message}`);
    }
  }

  getQRCode(sessionId) {
    return this.qrCodes.get(sessionId) || null;
  }

  getPairingCode(sessionId) {
    return this.pairingCodes.get(sessionId) || null;
  }

  getStatus(sessionId) {
    const client = this.clients.get(sessionId);
    if (client?.info) return "connected";
    if (this.pairingCodes.has(sessionId)) return "waiting_pair";
    if (this.initializingDevices.has(sessionId)) return "initializing";
    if (this.qrCodes.has(sessionId)) return "qr_pending";
    return "disconnected";
  }

  isConnected(sessionId) {
    const client = this.clients.get(sessionId);
    return client?.info != null;
  }

  getConnectedPhone(sessionId) {
    const client = this.clients.get(sessionId);
    return client?.info?.wid?.user || null;
  }

  async sendMessage(sessionId, phone, message) {
    const client = this.clients.get(sessionId);
    if (!client?.info) {
      throw new Error("Client not connected");
    }

    // Format phone
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "62" + formatted.slice(1);
    else if (!formatted.startsWith("62")) formatted = "62" + formatted;

    const chatId = `${formatted}@c.us`;
    await client.sendMessage(chatId, message);
    return { success: true, phone: formatted };
  }

  async disconnect(sessionId) {
    const client = this.clients.get(sessionId);
    if (client) {
      try {
        await client.logout();
        await client.destroy();
      } catch (e) {}
      this.clients.delete(sessionId);
      this.qrCodes.delete(sessionId);
      this.pairingCodes.delete(sessionId);
    }

    // Remove session files
    const sessionPath = join(
      SESSION_DIR,
      `session-${sessionId.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    );
    if (existsSync(sessionPath)) {
      try {
        rmSync(sessionPath, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  async destroyAll() {
    console.log("[WA] Destroying all clients...");
    for (const [sessionId, client] of this.clients) {
      try {
        await client.destroy();
      } catch (e) {}
    }
    this.clients.clear();
    this.qrCodes.clear();
    this.pairingCodes.clear();
    this.initializingDevices.clear();
    this.eventEmitter.clear();
    console.log("[WA] All clients destroyed");
  }
}

export const waManager = new WhatsAppManager();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await waManager.destroyAll();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await waManager.destroyAll();
  process.exit(0);
});

export default waManager;
