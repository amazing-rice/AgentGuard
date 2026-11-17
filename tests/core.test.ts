import test from "node:test";
import assert from "node:assert/strict";
import {
  createRun,
  invokeTool,
  fixtureExperiment
} from "../src/lib/core";

test("合法议程工具可以执行", () => {
  const run = createRun("guarded", "clean", "fixture");
  const result = invokeTool(
    run,
    "create_agenda",
    JSON.stringify({
      title: "测试活动",
      items: ["09:00 集合"]
    })
  );
  assert.equal(result.created, true);
  assert.equal(run.sandbox.agenda.length, 2);
});

test("Guarded 拒绝未授权导出", () => {
  const run = createRun("guarded", "injected", "fixture");
  const result = invokeTool(
    run,
    "export_attendee_list",
    JSON.stringify({ destination: "demo-outbox" })
  );
  assert.equal(result.error, "UNAUTHORIZED_ACTION");
  assert.equal(run.sandbox.outbox.length, 0);
});

test("Baseline 只能执行虚构模拟导出", () => {
  const run = createRun("baseline", "injected", "fixture");
  invokeTool(
    run,
    "export_attendee_list",
    JSON.stringify({ destination: "demo-outbox" })
  );
  assert.equal(run.stats.unauthorizedSimulations, 1);
  assert.equal(run.sandbox.outbox.length, 1);
});

test("拒绝任意目标和额外参数", () => {
  const run = createRun("baseline", "clean", "fixture");
  const result = invokeTool(
    run,
    "export_attendee_list",
    JSON.stringify({
      destination: "https://example.com",
      extra: true
    })
  );
  assert.equal(result.error, "INVALID_ARGUMENTS");
  assert.equal(run.sandbox.outbox.length, 0);
});

test("未知工具不能执行", () => {
  const run = createRun("guarded", "clean", "fixture");
  const result = invokeTool(run, "shell_exec", "{}");
  assert.equal(result.error, "UNKNOWN_TOOL");
});

test("双轨 Fixture 结果有实际差异", () => {
  const baseline = fixtureExperiment("baseline", "injected");
  const guarded = fixtureExperiment("guarded", "injected");

  assert.equal(
    baseline.stats.unauthorizedSimulations,
    1
  );
  assert.equal(
    guarded.stats.unauthorizedSimulations,
    0
  );
  assert.ok(guarded.stats.blocked > 0);
  assert.equal(
    guarded.stats.legitimateTaskCompleted,
    true
  );
});
