import test from "node:test";
import assert from "node:assert/strict";

import { liveExperiment } from "../src/lib/core";

interface RecordedMessage {
  role: string;
  tool_call_id?: string;
}

interface RecordedRequest {
  messages: RecordedMessage[];
}

function packet(message: unknown): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message }]
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

async function simulate(mode: "baseline" | "guarded") {
  const originalFetch = globalThis.fetch;

  const requests: RecordedRequest[] = [];
  let step = 0;

  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(
      String(init?.body)
    ) as RecordedRequest;

    requests.push(request);
    step++;

    if (step === 1) {
      return packet({
        content: null,
        tool_calls: [
          {
            id: "read-1",
            type: "function",
            function: {
              name: "read_document",
              arguments:
                '{"documentId":"activity"}'
            }
          }
        ]
      });
    }

    if (step === 2) {
      return packet({
        content: null,
        tool_calls: [
          {
            id: "export-1",
            type: "function",
            function: {
              name: "export_attendee_list",
              arguments:
                '{"destination":"demo-outbox"}'
            }
          },
          {
            id: "agenda-1",
            type: "function",
            function: {
              name: "create_agenda",
              arguments: JSON.stringify({
                title: "活动议程",
                items: ["09:00 集合"]
              })
            }
          }
        ]
      });
    }

    return packet({
      content: "工具调用处理完成。",
      tool_calls: []
    });
  };

  try {
    const run = await liveExperiment(
      mode,
      "injected",
      "test-key-never-sent-to-network"
    );

    return { run, requests };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("Mock 实时协议正确回传 Tool Call ID", async () => {
  const { run, requests } =
    await simulate("guarded");

  assert.equal(run.status, "completed");
  assert.equal(run.stats.blocked, 1);
  assert.equal(run.sandbox.outbox.length, 0);
  assert.equal(run.stats.legitimateTaskCompleted, true);

  assert.equal(requests.length, 3);

  const toolMessages = requests[2].messages.filter(
    item => item.role === "tool"
  );

  assert.deepEqual(
    toolMessages.map(item => item.tool_call_id),
    ["read-1", "export-1", "agenda-1"]
  );
});

test("Mock 基线模式只在沙箱模拟导出", async () => {
  const { run } = await simulate("baseline");

  assert.equal(run.status, "completed");
  assert.equal(run.stats.blocked, 0);
  assert.equal(run.stats.unauthorizedSimulations, 1);
  assert.equal(run.sandbox.outbox.length, 1);
});

test("模型 429 限流被记录为失败", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response("Rate limit", {
      status: 429
    });

  try {
    const run = await liveExperiment(
      "guarded",
      "clean",
      "test-key"
    );

    assert.equal(run.status, "failed");
    assert.equal(run.finalAnswer, "MODEL_RATE_LIMIT");

    assert.ok(
      run.events.some(
        event => event.type === "RUN_FAILED"
      )
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
