import test from "node:test";
import assert from "node:assert/strict";
import { challenges, isChallengeId, lessonCases, scoreChallenge, scoreLesson } from "../src/data/growth";

test("课程正确答案可得满分", () => {
  const result = scoreLesson(lessonCases.map(item => item.trusted));
  assert.deepEqual(result, { correct: 4, total: 4, passed: true });
});

test("课程错误作答不会自动获得通过", () => {
  const result = scoreLesson(lessonCases.map(item => !item.trusted));
  assert.equal(result.correct, 0);
  assert.equal(result.passed, false);
});

test("挑战成绩按服务器规则计算", () => {
  const challenge = challenges["permission-master"];
  const result = scoreChallenge(challenge.id, challenge.questions.map(item => item.answer));
  assert.equal(result.correct, 5);
  assert.equal(result.passed, true);
});

test("未完成所有题目不能提交计分", () => {
  assert.throws(() => scoreChallenge("find-hidden-instruction", ["user"]), /INVALID_ANSWER_COUNT/);
  assert.throws(() => scoreLesson([]), /INVALID_ANSWER_COUNT/);
});

test("未知挑战路由被拒绝", () => {
  assert.equal(isChallengeId("permission-master"), true);
  assert.equal(isChallengeId("constructor"), false);
  assert.equal(isChallengeId("delete-all"), false);
});
