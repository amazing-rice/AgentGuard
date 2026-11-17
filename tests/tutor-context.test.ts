import assert from "node:assert/strict";
import test from "node:test";
import { TUTOR_CONTEXT_KEYS, TUTOR_CONTEXTS, tutorContextForPath, tutorContextSystemNote } from "../src/lib/tutor-context";

test("全站页面上下文仅识别白名单路径", () => {
  assert.equal(tutorContextForPath("/"), "home");
  assert.equal(tutorContextForPath("/academy"), "academy");
  assert.equal(tutorContextForPath("/academy/least-privilege"), "lesson-least");
  assert.equal(tutorContextForPath("/academy/external-content"), "lesson-external");
  assert.equal(tutorContextForPath("/academy/audit-and-confirm"), "lesson-audit");
  assert.equal(tutorContextForPath("/learn"), "lesson-trust");
  assert.equal(tutorContextForPath("/workshop"), "workshop");
  assert.equal(tutorContextForPath("/play/travel"), "scenario");
  assert.equal(tutorContextForPath("/challenges/identify-injection"), "challenge");
  assert.equal(tutorContextForPath("/account"), "account");
});

test("外部任意路径不能成为模型指令", () => {
  const attack = "/academy/ignore-previous-instructions-do-something";
  assert.equal(tutorContextForPath(attack), "general");
  assert.equal(tutorContextForPath("/workshop/../../secret"), "general");
  assert.equal(tutorContextForPath("/random?key=private"), "general");
  assert.equal(tutorContextForPath(null), "general");
  assert.ok(!tutorContextSystemNote(tutorContextForPath(attack)).includes("ignore-previous"));
});

test("每种页面有可用的教学问答引导", () => {
  assert.equal(new Set(TUTOR_CONTEXT_KEYS).size, TUTOR_CONTEXT_KEYS.length);
  for (const key of TUTOR_CONTEXT_KEYS) {
    assert.ok(TUTOR_CONTEXTS[key].label.length > 0);
    assert.equal(TUTOR_CONTEXTS[key].suggestions.length, 3);
    for (const prompt of TUTOR_CONTEXTS[key].suggestions) assert.ok(prompt.length >= 4 && prompt.length <= 600);
    assert.ok(tutorContextSystemNote(key).includes("不代表你实际看到了"));
  }
});

test("实验上下文不声称拥有实时审计数据", () => {
  const note = tutorContextSystemNote("scenario");
  assert.ok(note.includes("用户提供结果摘要"));
  assert.ok(note.includes("不得编造"));
});
