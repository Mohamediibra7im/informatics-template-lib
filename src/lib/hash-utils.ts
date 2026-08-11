/**
 * KACTL-style deterministic code hashing for ICPC Team Reference Documents.
 * Strips comments and whitespace, then computes a 4-character hex hash.
 */
export function computeCodeHash(code: string): string {
  if (!code) return "0000";

  // Remove single line comments // ...
  let clean = code.replace(/\/\/.*$/gm, "");
  // Remove multi-line comments /* ... */
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove all whitespace
  clean = clean.replace(/\s+/g, "");

  if (!clean) return "0000";

  // Simple, fast deterministic 32-bit hash (similar to Murmur / FNV-1a)
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Convert to unsigned 32-bit integer and get last 4 hex characters
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return hex.slice(-4).toUpperCase();
}
