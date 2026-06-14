import { createHash } from "crypto"
import { getDb } from "./firebaseAdmin"

// Shared cache for AI output. There is exactly ONE doc per (repo, entity) — the
// key is SHA-less and the repo tree SHA is stored as a field. When the repo
// changes, a regenerated result OVERWRITES the same doc (no stale buildup), and
// the same file at the same commit is generated once for ALL users.
const COLLECTION = "aiCache"

function docId(key: string): string {
  // Firestore doc IDs can't contain "/", so hash the human-readable key.
  return createHash("sha256").update(key).digest("hex")
}

/** Split `owner/repo@treeSha` into its repo id and tree SHA. */
export function parseRepoToken(token: string): { repoId: string; sha: string } {
  const at = token.lastIndexOf("@")
  if (at === -1) return { repoId: token, sha: "" }
  return { repoId: token.slice(0, at), sha: token.slice(at + 1) }
}

export async function getCachedAi(key: string, sha: string): Promise<string | null> {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await db.collection(COLLECTION).doc(docId(key)).get()
    if (!snap.exists) return null
    const data = snap.data()
    // Stored against a different repo SHA → the repo changed since; treat as a
    // miss so the caller regenerates and overwrites this doc.
    if (data?.sha !== sha) return null
    return typeof data?.text === "string" ? data.text : null
  } catch {
    return null
  }
}

export async function setCachedAi(
  key: string,
  sha: string,
  text: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const db = getDb()
  if (!db || text.trim().length === 0) return
  try {
    // .set() (no merge) replaces the single doc for this (repo, entity).
    await db
      .collection(COLLECTION)
      .doc(docId(key))
      .set({ key, sha, text, ...meta, updatedAt: Date.now() })
  } catch {
    // Best-effort: never let a cache write break the response.
  }
}
