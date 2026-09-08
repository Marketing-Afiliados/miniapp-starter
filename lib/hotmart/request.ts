import { createHash, timingSafeEqual } from "node:crypto";
export function validHotmartToken(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  return timingSafeEqual(createHash("sha256").update(received).digest(), createHash("sha256").update(expected).digest());
}
export async function readWebhookBody(request: Request, maxBytes = 1_000_000) {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Empty body");
  let size = 0;
  let body = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new RangeError("Body too large"); }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode()) as unknown;
  } finally { reader.releaseLock(); }
}
