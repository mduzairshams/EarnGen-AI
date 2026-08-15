// Lightweight CORS-enabled Cross-Origin fetch-based public key-value store helper
const BUCKET = "eg_chats_v3_8d9a2b5";
const BASE = `https://kvdb.io/${BUCKET}`;

export async function getKV<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}/${key}`);
    if (!res.ok) {
      if (res.status === 404) return defaultValue;
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    if (!text || text.trim() === "") return defaultValue;
    return JSON.parse(text) as T;
  } catch (e) {
    console.warn(`[KV Read Error for ${key}]:`, e);
    return defaultValue;
  }
}

export async function setKV<T>(key: string, value: T): Promise<void> {
  try {
    const res = await fetch(`${BASE}/${key}`, {
      method: "POST", // kvdb.io accepts POST or PUT to write
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.error(`[KV Write Error for ${key}]:`, e);
  }
}
