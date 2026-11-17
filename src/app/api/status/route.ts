export async function GET() {
  return Response.json({
    application: "AgentGuard",
    modelConfigured: Boolean(
      process.env.DEEPSEEK_API_KEY
    ),
    model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
    tools: 6,
    mode: "local-sandbox"
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
