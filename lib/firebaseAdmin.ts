import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

// Lazily initialise the Firebase Admin SDK from env vars. Returns null (rather
// than throwing) when credentials are absent, so the app runs fine without
// Firebase configured — caching just becomes a no-op.
let cached: Firestore | null | undefined

export function getDb(): Firestore | null {
  if (cached !== undefined) return cached

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Private keys are stored with literal "\n" in .env — restore real newlines.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    cached = null
    return null
  }

  // cert()/initializeApp() throw synchronously on a malformed key — never let
  // that crash a request; just disable caching and log once.
  try {
    const app: App = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
    cached = getFirestore(app)
  } catch (err) {
    console.warn(
      "[firebaseAdmin] Failed to initialise — caching disabled. Check FIREBASE_* env vars.",
      err instanceof Error ? err.message : err
    )
    cached = null
  }
  return cached
}
