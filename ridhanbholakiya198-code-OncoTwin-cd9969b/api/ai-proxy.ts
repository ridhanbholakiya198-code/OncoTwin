import {
  getAdminServices,
  reserveDailyRun,
  sanitizeErrorMessage,
  verifyUser
} from "./lib/firebaseAdmin.js";

const ENDPOINTS = {
  claude: "https://api.anthropic.com/v1/messages",
  gpt: "https://api.openai.com/v1/chat/completions",
  gemini:
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
  grok: "https://api.x.ai/v1/chat/completions"
};

const burstRequests = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

function burstAllowed(uid) {
  const now = Date.now();
  const recent = (burstRequests.get(uid) || []).filter(
    (time) => now - time < WINDOW_MS
  );

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return false;

  recent.push(now);
  burstRequests.set(uid, recent);
  return true;
}

function cleanLlmJsonText(text) {
  if (typeof text !== "string") return text;
  let cleaned = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  return cleaned;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  let secretForSanitization = "";
  let stage = "start";

  try {
    stage = "verify_auth";
    const uid = await verifyUser(req);

    stage = "burst_check";
    if (!burstAllowed(uid)) {
      return res.status(429).json({
        error: "Too many requests. Please slow down and try again.",
        debug: { stage, timestamp: new Date().toISOString() }
      });
    }

    stage = "parse_request_body";
    let { provider, apiKey, body } = req.body || {};
    apiKey = typeof apiKey === "string" ? apiKey.trim() : "";

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        error: "Invalid AI request body.",
        debug: { stage, timestamp: new Date().toISOString() }
      });
    }

    if (!apiKey) {
      stage = "resolve_default_key";
      const defaultKey =
        process.env.GEMINI_API_KEY ||
        process.env.DEFAULT_GEMINI_API_KEY ||
        process.env.DEFAULT_AI_API_KEY ||
        "";

      if (!defaultKey) {
        return res.status(500).json({
          error: "Shared AI provider is not configured.",
          debug: { stage, timestamp: new Date().toISOString() }
        });
      }

      const defaultProvider =
        process.env.DEFAULT_AI_PROVIDER ||
        ((process.env.GEMINI_API_KEY ||
          process.env.DEFAULT_GEMINI_API_KEY)
          ? "gemini"
          : "claude");

      stage = "firestore_reserve_daily_run";
      const { db } = getAdminServices();
      const allowed = await reserveDailyRun(uid, db);

      if (!allowed) {
        return res.status(429).json({
          error:
            "Free tier limit reached (8 runs/day). Please add your own API key in Settings for unlimited use.",
          debug: { stage, timestamp: new Date().toISOString() }
        });
      }

      provider = defaultProvider;
      apiKey = defaultKey;
    }

    stage = "resolve_endpoint";
    const endpoint = ENDPOINTS[provider];

    if (!endpoint) {
      return res.status(400).json({
        error: `Unsupported provider: ${provider}`,
        debug: { stage, timestamp: new Date().toISOString() }
      });
    }

    secretForSanitization = apiKey;

    const headers = {
      "Content-Type": "application/json"
    };

    if (provider === "claude") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else if (provider === "gemini") {
      headers["x-goog-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    stage = "fetch_upstream_provider";
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    stage = "read_upstream_body";
    let data = {};
    const textBody = await upstream.text().catch(() => "");

    if (textBody) {
      try {
        data = JSON.parse(textBody);
      } catch (e) {
        data = { text: textBody };
      }
    } else {
      data = {};
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: sanitizeErrorMessage(
          data?.error?.message || data?.error || `Upstream ${provider} API error`,
          secretForSanitization
        ),
        debug: {
          stage: "upstream_error",
          timestamp: new Date().toISOString(),
          upstreamStatus: upstream.status,
          upstreamUrl: sanitizeErrorMessage(endpoint, secretForSanitization),
          upstreamBody: sanitizeErrorMessage(textBody, secretForSanitization),
          provider
        }
      });
    }

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      data.candidates[0].content.parts[0].text = cleanLlmJsonText(
        data.candidates[0].content.parts[0].text
      );
    }

    return res.status(200).json(data);
  } catch (error) {
    const status = error?.statusCode === 401 ? 401 : 500;

    const rawMessage = error?.message || String(error);
    const message =
      status === 401 ? "Unauthorized." : sanitizeErrorMessage(rawMessage, secretForSanitization);

    console.error("ai-proxy error at stage:", stage, "-", rawMessage);

    return res.status(status).json({
      error: message,
      debug: {
        stage,
        timestamp: new Date().toISOString(),
        errorName: error?.name || "Unknown",
        errorCode: error?.code || null,
        rawMessage: sanitizeErrorMessage(rawMessage, secretForSanitization),
        stack: sanitizeErrorMessage(String(error?.stack || "").slice(0, 800), secretForSanitization)
      }
    });
  }
}
