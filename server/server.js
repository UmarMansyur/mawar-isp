import express from "express";
import cors from "cors";
import { waManager } from "./whatsapp-manager.js";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.WA_SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;

async function connectDB() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set");
    return;
  }

  // Parse MySQL URL
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error("Invalid DATABASE_URL format");
    return;
  }

  const [, user, password, host, port, database] = match;

  db = await mysql.createPool({
    host,
    port: parseInt(port),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  console.log("[DB] Connected to MySQL");
}

// Helper to update device status in DB
async function updateDeviceStatus(sessionId, status, phone) {
  if (!db) return;
  try {
    await db.execute(
      "UPDATE WhatsAppDevice SET status = ?, phone = ?, lastActive = NOW() WHERE sessionId = ?",
      [status, phone, sessionId],
    );
  } catch (e) {
    console.error("[DB] Update error:", e.message);
  }
}

// Routes

app.get("/", (req, res) => {
  res.json({
    name: "MawarISP WhatsApp API",
    version: "1.0.0",
    endpoints: {
      "GET /devices": "List devices for a user",
      "POST /devices/:sessionId/connect": "Start QR code",
      "GET /devices/:sessionId/qr": "Get QR code",
      "POST /devices/:sessionId/pairing-code": "Get pairing code",
      "GET /devices/:sessionId/status": "Get status",
      "POST /devices/:sessionId/disconnect": "Disconnect",
      "POST /send": "Send message",
    },
  });
});

// Get devices for user
app.get("/devices", async (req, res) => {
  const userId = req.query.userId;
  if (!userId || !db) {
    return res.json({ devices: [] });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, name, sessionId, phone, status, lastActive FROM WhatsAppDevice WHERE userId = ?",
      [userId],
    );

    // Enhance with live status
    const devices = rows.map((d) => ({
      ...d,
      liveStatus: waManager.getStatus(d.sessionId),
      hasQR: waManager.getQRCode(d.sessionId) != null,
      hasPairingCode: waManager.getPairingCode(d.sessionId) != null,
    }));

    res.json({ devices });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start QR code / connect
app.post("/devices/:sessionId/connect", async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Update status to connecting
    await updateDeviceStatus(sessionId, "qr_pending", null);

    // Initialize in background
    waManager.initClient(sessionId, updateDeviceStatus).catch((err) => {
      console.error(`[WA] Init failed for ${sessionId}:`, err.message);
      updateDeviceStatus(sessionId, "disconnected", null);
    });

    res.json({ success: true, message: "Connecting..." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get QR code
app.get("/devices/:sessionId/qr", (req, res) => {
  const { sessionId } = req.params;
  const qrCode = waManager.getQRCode(sessionId);
  const pairingCode = waManager.getPairingCode(sessionId);
  const status = waManager.getStatus(sessionId);
  const phone = waManager.getConnectedPhone(sessionId);

  res.json({
    qrCode,
    pairingCode,
    status,
    phone,
    hasQR: qrCode != null,
    hasPairingCode: pairingCode != null,
  });
});

// Request pairing code
app.post("/devices/:sessionId/pairing-code", async (req, res) => {
  const { sessionId } = req.params;
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const pairingCode = await waManager.requestPairingCode(
      sessionId,
      phoneNumber,
    );

    // Update status
    await updateDeviceStatus(sessionId, "waiting_pair", null);

    res.json({
      success: true,
      pairingCode,
      message:
        "Enter this code in WhatsApp > Linked Devices > Link with phone number",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get status
app.get("/devices/:sessionId/status", (req, res) => {
  const { sessionId } = req.params;
  const status = waManager.getStatus(sessionId);
  const phone = waManager.getConnectedPhone(sessionId);

  res.json({
    status,
    phone,
    isConnected: waManager.isConnected(sessionId),
  });
});

// Disconnect
app.post("/devices/:sessionId/disconnect", async (req, res) => {
  const { sessionId } = req.params;

  try {
    await waManager.disconnect(sessionId);
    await updateDeviceStatus(sessionId, "disconnected", null);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send message
app.post("/send", async (req, res) => {
  const { sessionId, phone, message } = req.body;

  if (!sessionId || !phone || !message) {
    return res
      .status(400)
      .json({ error: "sessionId, phone, and message are required" });
  }

  try {
    const result = await waManager.sendMessage(sessionId, phone, message);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start server
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
+------------------------------------------+
|  MawarISP WhatsApp API Server            |
|                                          |
|  Running on: http://localhost:${PORT}       |
|                                          |
|  Features:                               |
|  - QR Code Authentication                |
|  - Pairing Code Authentication           |
|  - Multi-device Support                  |
|                                          |
+------------------------------------------+
    `);
  });
}

start();
