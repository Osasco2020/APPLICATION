/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  MOCK_CUSTOMERS,
  MOCK_ACCOUNTS,
  MOCK_LOANS,
  MOCK_TRANSACTIONS,
  MOCK_AUDIT_LOGS,
  MOCK_LEDGERS
} from "./src/utils/mockData.js"; // note: using relative path with tsx support

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Parse JSON request payloads
app.use(express.json({ limit: "50mb" }));

// Helper to get default initial state
function getInitialState() {
  return {
    customers: MOCK_CUSTOMERS,
    accounts: MOCK_ACCOUNTS,
    loans: MOCK_LOANS,
    transactions: MOCK_TRANSACTIONS,
    auditLogs: MOCK_AUDIT_LOGS,
    tellerSessions: {
      SID001: {
        staffId: "SID001",
        drawerBalance: 500000,
        dailyLimit: 2000000,
        vaultTransferPending: 0,
        status: "Open",
        differenceReported: 0
      }
    },
    ledgers: MOCK_LEDGERS
  };
}

// Read database from file
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Failed to read persistent database file, falling back to seed", error);
  }
  
  // Seed database
  const seed = getInitialState();
  writeDatabase(seed);
  return seed;
}

// Write database to file
function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write to persistent database file", error);
    return false;
  }
}

// ==========================================
// CORE CORE-BANKING API ENDPOINTS
// ==========================================

// Get health check status
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "connected", file: DB_FILE });
});

// Fetch complete CBS state
app.get("/api/state", (req, res) => {
  const dbState = readDatabase();
  res.json(dbState);
});

// Sync / update complete state
app.post("/api/state", (req, res) => {
  const newState = req.body;
  if (!newState || typeof newState !== "object") {
    res.status(400).json({ error: "Invalid payload state structure" });
    return;
  }
  const ok = writeDatabase(newState);
  if (ok) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Failed to persist database updates" });
  }
});

// Hard Reset database back to default seed state
app.post("/api/reset", (req, res) => {
  const seed = getInitialState();
  const ok = writeDatabase(seed);
  if (ok) {
    res.json({ success: true, state: seed });
  } else {
    res.status(500).json({ error: "Failed to reset database" });
  }
});

// Set up Vite development middleware or production static files serving
async function setupFrontend() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Core Banking Server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Core Banking Server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Osarumwense CBS Core Backend Server running on http://localhost:${PORT}`);
  });
}

setupFrontend().catch((err) => {
  console.error("Failed to boot full-stack server middleware:", err);
});
