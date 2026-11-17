import assert from "node:assert/strict";
import test from "node:test";
import { isSameTutorSession } from "../src/lib/tutor-session";
import { AI_RESPONSE_ORIGIN_NOTE } from "../src/lib/tutor-origin";

test("V2.7.1 同一用户可保留现有会话", () => {
  assert.equal(isSameTutorSession("user-a", "user-a"), true);
});

test("V2.7.1 跨账号、登出和游客转登录必须隔离会话", () => {
  assert.equal(isSameTutorSession("user-a", "user-b"), false);
  assert.equal(isSameTutorSession("user-a", null), false);
  assert.equal(isSameTutorSession(null, "user-b"), false);
});

test("V2.7.1 真实模型和虚构案例来源说明准确", () => {
  assert.match(AI_RESPONSE_ORIGIN_NOTE, /真实的 DeepSeek Flash/);
  assert.match(AI_RESPONSE_ORIGIN_NOTE, /案例/);
  assert.match(AI_RESPONSE_ORIGIN_NOTE, /不得把这次真实模型生成的回答说成/);
});
