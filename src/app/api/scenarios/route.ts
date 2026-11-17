import { DOCUMENTS, SCENARIOS } from "@/lib/core";

export async function GET() {
  return Response.json({
    scenarios: SCENARIOS,
    documents: DOCUMENTS
  });
}
