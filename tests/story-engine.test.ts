import test from "node:test";
import assert from "node:assert/strict";
import { createStoryRun, fixtureStoryExperiment, invokeStoryTool, storyToolDefinitions } from "../src/lib/story-engine";
import { STORY_IDS, STORY_LAB } from "../src/data/storyLab";

for (const id of STORY_IDS) {
  test(`${id}: Baseline 仅在虚构状态中执行敏感操作`, () => {
    const run = fixtureStoryExperiment(id, "baseline", "injected");
    assert.equal(run.stats.unauthorizedSimulations, 1);
    assert.equal(run.storyState.exposureLog.length, 1);
    assert.equal(run.stats.legitimateTaskCompleted, true);
    assert.equal(run.status, "completed");
  });
  test(`${id}: Guarded 拒绝敏感操作，合法任务仍完成`, () => {
    const run = fixtureStoryExperiment(id, "guarded", "injected");
    assert.equal(run.stats.unauthorizedSimulations, 0);
    assert.equal(run.storyState.exposureLog.length, 0);
    assert.equal(run.stats.blocked, 1);
    assert.equal(run.stats.legitimateTaskCompleted, true);
    assert.ok(run.events.some(event => event.tool === STORY_LAB[id].riskTool && event.reason === "UNAUTHORIZED_ACTION"));
  });
  test(`${id}: 正常资料不会自动发起敏感操作`, () => {
    const run = fixtureStoryExperiment(id, "guarded", "clean");
    assert.equal(run.stats.blocked, 0);
    assert.equal(run.stats.proposed, 2);
    assert.equal(run.stats.legitimateTaskCompleted, true);
  });
  test(`${id}: 只公开该场景的工具注册表`, () => {
    const definitions = storyToolDefinitions(id);
    const names = definitions.map(t => t.function.name);
    assert.equal(names.length, 4);
    assert.ok(names.includes(STORY_LAB[id].riskTool));
  });
}
test("不同场景工具无法跨场景调用", () => {
  const run = createStoryRun("travel", "baseline", "injected", "fixture");
  const result = invokeStoryTool(run, "publish_private_notes", '{"destination":"demo-class-wall"}');
  assert.equal(result.error, "UNKNOWN_TOOL");
  assert.equal(run.storyState.exposureLog.length, 0);
});
test("敏感工具参数无法改成任意外发网址", () => {
  const run = createStoryRun("mail", "baseline", "injected", "fixture");
  const result = invokeStoryTool(run, "send_contacts_to_demo_box", '{"destination":"https://outside.example","extra":true}');
  assert.equal(result.error, "INVALID_ARGUMENTS");
  assert.equal(run.storyState.exposureLog.length, 0);
});
test("不同运行使用独立沙箱状态", () => {
  const a = fixtureStoryExperiment("study", "baseline", "injected");
  const b = fixtureStoryExperiment("study", "guarded", "clean");
  assert.equal(a.storyState.exposureLog.length, 1);
  assert.equal(b.storyState.exposureLog.length, 0);
  assert.notEqual(a.id, b.id);
});
