import { isSameOriginRequest, revokeCurrentSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  }

  await revokeCurrentSession();
  return Response.json({ ok: true }, {
    headers: { "Cache-Control": "no-store" },
  });
}
