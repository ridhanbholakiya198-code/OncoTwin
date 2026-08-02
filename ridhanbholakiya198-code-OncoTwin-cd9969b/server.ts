import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

let firebaseConfig;
try {
  firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
} catch (e) {
  console.warn("Could not read firebase-applet-config.json");
}

let adminApp;
try {
  adminApp = getApp();
} catch (e) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    try {
      adminApp = initializeApp({
        credential: cert(JSON.parse(serviceAccountJson)),
        ...(projectId ? { projectId } : {}),
      });
    } catch (err) {
      console.warn("FIREBASE_SERVICE_ACCOUNT could not be loaded; falling back to application credentials.");
      adminApp = initializeApp(projectId ? { projectId } : undefined);
    }
  } else {
    adminApp = initializeApp(projectId ? { projectId } : undefined);
  }
}

const dbId = firebaseConfig?.firestoreDatabaseId || "(default)";
const db = getFirestore(adminApp, dbId);
const auth = getAuth(adminApp);

function sanitizeErrorMessage(msg, secretKey = "") {
  if (!msg || typeof msg !== "string") return "An error occurred during AI processing.";
  let cleaned = msg
    .replace(/key=[^&\s]+/gi, "key=[REDACTED]")
    .replace(/x-goog-api-key\s*[:=]\s*[^,\s]+/gi, "x-goog-api-key=[REDACTED]")
    .replace(/authorization\s*[:=]\s*bearer\s+\S+/gi, "authorization=[REDACTED]");
  if (secretKey && secretKey.length > 5) cleaned = cleaned.split(secretKey).join("[REDACTED]");
  return cleaned;
}

async function reserveDailyRun(uid, firestore) {
  const today = new Date().toISOString().slice(0, 10);
  const usageRef = firestore.collection("users").doc(uid).collection("usage").doc("daily");

  return firestore.runTransaction(async (transaction) => {
    const snap = await transaction.get(usageRef);
    const data = snap.exists ? snap.data() || {} : {};
    const count = data.date === today ? Number(data.count || 0) : 0;
    if (count >= 8) return false;
    transaction.set(usageRef, { date: today, count: count + 1 }, { merge: true });
    return true;
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ENDPOINTS = {
    claude: 'https://api.anthropic.com/v1/messages',
    gpt: 'https://api.openai.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    grok: 'https://api.x.ai/v1/chat/completions',
  };

  app.post("/api/ai-proxy", async (req, res) => {
    let apiKeyForSanitization = "";
    try {
      let { provider, apiKey, body } = req.body;
      apiKeyForSanitization = typeof apiKey === "string" ? apiKey : "";
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: missing or invalid authorization header.' });
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(idToken);
      } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: invalid token.' });
      }
      const uid = decodedToken.uid;

      if (!apiKey || apiKey.trim() === '') {
        const defaultKey = process.env.GEMINI_API_KEY || process.env.DEFAULT_GEMINI_API_KEY || process.env.DEFAULT_AI_API_KEY;
        const defaultProvider = (process.env.GEMINI_API_KEY || process.env.DEFAULT_GEMINI_API_KEY) ? 'gemini' : (process.env.DEFAULT_AI_PROVIDER || 'claude');
        
        if (!defaultKey) {
          return res.status(400).json({ error: "No API key provided and no default key configured on server." });
        }

        let allowed;
        try {
          allowed = await reserveDailyRun(uid, db);
        } catch (err) {
          console.error("Usage transaction error:", err);
          return res.status(500).json({ error: "Failed to verify daily usage limits." });
        }

        if (!allowed) {
          return res.status(429).json({ error: 'Free tier limit reached (8 runs/day). Please add your own API key in Settings for unlimited use.' });
        }

        provider = defaultProvider;
        apiKey = defaultKey;
      }

      const endpoint = ENDPOINTS[provider];
      if (!endpoint) {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }

      const headers = { 'Content-Type': 'application/json' };
      
      if (provider === 'claude') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = apiKey;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        const rawMessage = data?.error?.message || data?.error || `Upstream ${provider} API error`;
        return res.status(upstream.status).json({ error: sanitizeErrorMessage(rawMessage, apiKeyForSanitization) });
      }
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: sanitizeErrorMessage(err?.message || "Internal server error", apiKeyForSanitization) });
    }
  });

  app.get("/api/config", (req, res) => {
    res.json({
      defaultProvider: (process.env.GEMINI_API_KEY || process.env.DEFAULT_GEMINI_API_KEY) ? 'gemini' : (process.env.DEFAULT_AI_PROVIDER || 'claude')
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
