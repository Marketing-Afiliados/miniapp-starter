import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { isJson } from "@/lib/hotmart/types";
import {
  HotmartWebhookError,
  processHotmartWebhook,
} from "@/services/hotmart-webhook";

export const runtime = "nodejs";

function secureTokenMatch(received: string, expected: string) {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

export async function POST(request: Request) {
  const expectedToken = process.env.HOTMART_HOTTOK;
  if (!expectedToken) {
    return NextResponse.json({ ok: false, message: "Webhook no configurado." }, { status: 503 });
  }

  const receivedToken = request.headers.get("x-hotmart-hottok");
  if (!receivedToken || !secureTokenMatch(receivedToken, expectedToken)) {
    return NextResponse.json({ ok: false, message: "Solicitud no autorizada." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1_000_000) {
    return NextResponse.json({ ok: false, message: "Solicitud demasiado grande." }, { status: 413 });
  }

  try {
    const payload: unknown = await request.json();
    if (!isJson(payload)) {
      return NextResponse.json({ ok: false, message: "Evento inválido." }, { status: 400 });
    }

    const result = await processHotmartWebhook(payload);
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      processed: result.processed,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ ok: false, message: "JSON inválido." }, { status: 400 });
    }
    if (error instanceof HotmartWebhookError) {
      return NextResponse.json(
        { ok: false, message: "No fue posible procesar el evento." },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { ok: false, message: "No fue posible procesar el evento." },
      { status: 500 },
    );
  }
}
