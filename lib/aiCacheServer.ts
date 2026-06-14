import { createHash } from "crypto"
import { getDb } from "./firebaseAdmin"

// Shared, repo-content-keyed cache for AI output. Keys embed the repo tree SHA
// (`owner/repo@sha`), so entries naturally invalidate when the repo changes, and
// the same file at the same commit is generated once for ALL users.
const COLLECTION = "aiCache"

function docId(key: string): string {
  // Firestore doc IDs can't contain "/", so hash the human-readable key.
  return createHash("sha256").update(key).digest("hex")
}

export async function getCachedAi(key: string): Promise<string | null> {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await db.collection(COLLECTION).doc(docId(key)).get()
    if (!snap.exists) return null
    const text = snap.data()?.text
    return typeof text === "string" ? text : null
  } catch {
    return null
  }
}

export async function setCachedAi(
  key: string,
  text: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const db = getDb()
  if (!db || text.trim().length === 0) return
  try {
    await db
      .collection(COLLECTION)
      .doc(docId(key))
      .set({ key, text, ...meta, createdAt: Date.now() })
  } catch {
    // Best-effort: never let a cache write break the response.
  }
}
