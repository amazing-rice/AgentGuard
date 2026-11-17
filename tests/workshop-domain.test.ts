import test from "node:test";
import assert from "node:assert/strict";
import { STORY_IDS, STORY_LAB } from "../src/data/storyLab";
import { scanWorkshopHint } from "../src/lib/workshop-domain";
import { fixtureWorkshopExperiment } from "../src/lib/story-engine";

for (const id of STORY_IDS) {
  test(`${id}: 教学线索能识别预设例子，但不会把正常资料判作命中`, () => {
    assert.equal(scanWorkshopHint(id, STORY_LAB[id].normalText).matched, false);
    assert.equal(scanWorkshopHint(id, STORY_LAB[id].injectedText).matched, true);
  });

  test(`${id}: 自定义离线双轨使用原策略，允许合法任务并拦截越权`, () => {
    const text = STORY_LAB[id].injectedText;
    const baseline = fixtureWorkshopExperiment(id, "baseline", text);
    const guarded = fixtureWorkshopExperiment(id, "guarded", text);
    assert.equal(baseline.status, "completed");
    assert.equal(guarded.status, "completed");
    assert.equal(baseline.stats.unauthorizedSimulations, 1);
    assert.equal(guarded.stats.unauthorizedSimulations, 0);
    assert.equal(guarded.stats.blocked, 1);
    assert.equal(guarded.stats.legitimateTaskCompleted, true);
    assert.equal(baseline.customDocumentInfo?.sha256.length, 64);
    assert.equal(guarded.customDocumentInfo?.fixtureSignal, true);
    assert.ok(guarded.events.some(event => event.tool === STORY_LAB[id].riskTool && event.reason === "UNAUTHORIZED_ACTION"));
  });

  test(`${id}: 无关键词命中时教学脚本不模拟敏感请求`, () => {
    const run = fixtureWorkshopExperiment(id, "baseline", STORY_LAB[id].normalText);
    assert.equal(run.stats.unauthorizedSimulations, 0);
    assert.equal(run.stats.proposed, 2);
    assert.equal(run.stats.legitimateTaskCompleted, true);
  });

  test(`${id}: 自定义资料不会被原样写入审计事件`, () => {
    const text = `${STORY_LAB[id].injectedText}\n仅用于本次模拟的自定义内容 ABC-EXAMPLE-739`;
    const run = fixtureWorkshopExperiment(id, "guarded", text);
    assert.equal(JSON.stringify(run).includes("ABC-EXAMPLE-739"), false);
    assert.ok(run.events.some(event => event.type === "TOOL_EXECUTED" && typeof event.details === "object" && event.details !== null && "redacted" in event.details));
  });
}
