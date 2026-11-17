import { RULES } from "@/lib/core";

export async function GET() {
  return Response.json({
    rules: RULES,
    permittedTools: [
      "read_document",
      "get_task_state",
      "create_agenda"
    ],
    policyVersion: "1.0.0"
  });
}
