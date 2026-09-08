import { validHotmartToken, readWebhookBody } from "@/lib/hotmart/request";
import { processOneTimePayment } from "@/services/one-time-payment";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.HOTMART_HOTTOK || !process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ ok: false }, { status: 503 });
  if (!validHotmartToken(request.headers.get("x-hotmart-hottok"), process.env.HOTMART_HOTTOK)) return Response.json({ ok: false }, { status: 401 });
  try {
    const result = await processOneTimePayment(await readWebhookBody(request));
    return Response.json({ ok: result.ok, duplicate: result.duplicate ?? false }, { status: result.status });
  } catch (error) {
    return Response.json({ ok: false }, { status: error instanceof RangeError ? 413 : error instanceof SyntaxError ? 400 : 500 });
  }
}
