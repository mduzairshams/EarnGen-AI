/** Groq inference — OpenAI-compatible, free tier, very fast. */
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

type GroqMessage = { role: "system" | "user" | "assistant"; content: string };
export type GroqResult = { text: string; error?: string };

function httpsPost(urlStr: string, apiKey: string, body: any): Promise<GroqResult> {
  return new Promise((resolve) => {
    import("node:https").then((https) => {
      const url = new URL(urlStr);
      const postData = JSON.stringify(body);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            resolve({ text: "", error: `Groq ${res.statusCode}: ${rawData.slice(0, 400)}` });
            return;
          }
          try {
            const json = JSON.parse(rawData);
            if (json.error?.message) {
              resolve({ text: "", error: json.error.message });
              return;
            }
            const text = json.choices?.[0]?.message?.content?.trim() ?? "";
            if (!text) {
              resolve({ text: "", error: "Empty model response" });
              return;
            }
            resolve({ text });
          } catch (e: any) {
            resolve({ text: "", error: `JSON parse failed: ${e.message}` });
          }
        });
      });

      req.on("error", (e) => {
        resolve({ text: "", error: `HTTPS Request failed: ${e.message}` });
      });

      req.write(postData);
      req.end();
    }).catch((err) => {
      resolve({ text: "", error: `Failed to load node:https module: ${err.message}` });
    });
  });
}

export async function groqGenerateContent(opts: {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  userText: string;
  /** When true, asks Groq to return valid JSON (json_object mode). */
  jsonMode?: boolean;
}): Promise<GroqResult> {
  const model = (opts.model ?? DEFAULT_GROQ_MODEL).trim() || DEFAULT_GROQ_MODEL;
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const messages: GroqMessage[] = [];
  if (opts.systemInstruction) {
    messages.push({ role: "system", content: opts.systemInstruction });
  }
  messages.push({ role: "user", content: opts.userText });

  const body: Record<string, unknown> = { model, messages, temperature: 0.7 };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  // Use robust httpsPost on server, fallback to fetch if window is defined (browser env)
  if (typeof window === "undefined") {
    return httpsPost(url, opts.apiKey, body);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      return { text: "", error: `Groq ${res.status}: ${raw.slice(0, 400)}` };
    }

    const json = JSON.parse(raw);
    if (json.error?.message) {
      return { text: "", error: json.error.message };
    }

    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { text: "", error: "Empty model response" };
    return { text };
  } catch (e) {
    return { text: "", error: e instanceof Error ? e.message : "Groq request failed" };
  }
}
