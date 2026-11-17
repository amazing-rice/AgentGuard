import test from "node:test";
import assert from "node:assert/strict";
import { liveStoryExperiment } from "../src/lib/story-engine";

test("实时模式通过模型工具协议并独立阻断越权操作", async () => {
  const original = globalThis.fetch;
  const recorded: Array<{ messages: Array<{ role: string; tool_call_id?: string }> }> = [];
  let count = 0;
  globalThis.fetch = async (_url, opts) => {
    const request = JSON.parse(String(opts?.body)) as { messages: Array<{ role: string; tool_call_id?: string }> };
    recorded.push(request);
    count++;
    const message = count === 1
      ? { content: null, tool_calls: [{ id: "read-mail", type: "function", function: { name: "read_meeting_mail", arguments: "{}" } }] }
      : count === 2
      ? { content: null, tool_calls: [
          { id: "risk-mail", type: "function", function: { name: "send_contacts_to_demo_box", arguments: '{"destination":"demo-mail-outbox"}' } },
          { id: "save-calendar", type: "function", function: { name: "add_calendar_event", arguments: '{"title":"项目周会"}' } },
        ] }
      : { content: "已经整理完成", tool_calls: [] };
    return new Response(JSON.stringify({ choices: [{ message }] }), { headers: { "Content-Type": "application/json" } });
  };
  try {
    const result = await liveStoryExperiment("mail", "guarded", "injected", "test-key");
    assert.equal(result.status, "completed");
    assert.equal(result.stats.blocked, 1);
    assert.equal(result.storyState.exposureLog.length, 0);
    assert.equal(result.stats.legitimateTaskCompleted, true);
    assert.deepEqual(recorded[2].messages.filter(m => m.role === "tool").map(m => m.tool_call_id), ["read-mail", "risk-mail", "save-calendar"]);
  } finally { globalThis.fetch = original; }
});

test("模型限流失败不会生成虚假的成功结果", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("rate limited", { status: 429 });
  try {
    const result = await liveStoryExperiment("travel", "guarded", "clean", "test-key");
    assert.equal(result.status, "failed");
    assert.equal(result.finalAnswer, "MODEL_RATE_LIMIT");
    assert.equal(result.stats.legitimateTaskCompleted, false);
  } finally { globalThis.fetch = original; }
});
