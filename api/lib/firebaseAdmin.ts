import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export function getAdminServices(): { db: Firestore; auth: Auth } {
  let app = getApps()[0];

  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured.");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({
      credential: cert(serviceAccount),
      ...(projectId ? { projectId } : {}),
    });
  }

  return {
    db: getFirestore(app),
    auth: getAuth(app),
  };
}

export function sanitizeErrorMessage(msg: unknown, secretKey = ""): string {
  if (!msg || typeof msg !== "string") {
    return "An error occurred during AI processing.";
  }

  let cleaned = msg
    .replace(/key=[^&\s]+/gi, "key=[REDACTED]")
    .replace(/x-goog-api-key\s*[:=]\s*[^,\s]+/gi, "x-goog-api-key=[REDACTED]")
    .replace(/authorization\s*[:=]\s*bearer\s+\S+/gi, "authorization=[REDACTED]");

  if (secretKey.length > 5) {
    cleaned = cleaned.split(secretKey).join("[REDACTED]");
  }

  return cleaned;
}

export async function verifyUser(req: any): Promise<string> {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error: any = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    const error: any = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const { auth } = getAdminServices();

  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    const error: any = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
}

export async function reserveDailyRun(uid: string, db: Firestore): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const usageRef = db.collection("users").doc(uid).collection("usage").doc("daily");

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usageRef);
    const data = snapshot.exists ? snapshot.data() || {} : {};
    const count = data.date === today ? Number(data.count || 0) : 0;

    if (count >= 8) return false;

    transaction.set(
      usageRef,
      { date: today, count: count + 1 },
      { merge: true }
    );

    return true;
  });
}
