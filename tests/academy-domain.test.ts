import test from "node:test";
import assert from "node:assert/strict";
import { academyLessons, isAcademyLessonId, scoreAcademyLesson } from "../src/data/academy";

test("三门新增课程均包含四道题", () => {
  assert.equal(Object.keys(academyLessons).length, 3);
  for (const lesson of Object.values(academyLessons)) assert.equal(lesson.questions.length, 4);
});

test("三门课程标准答案均可得到满分并通过", () => {
  for (const lesson of Object.values(academyLessons)) {
    const score = scoreAcademyLesson(lesson.id, lesson.questions.map(question => question.answer));
    assert.deepEqual(score, { correct: 4, total: 4, passed: true });
  }
});

test("三门课程全错不能通过", () => {
  for (const lesson of Object.values(academyLessons)) {
    const score = scoreAcademyLesson(lesson.id, lesson.questions.map(question => question.choices.find(choice => choice.value !== question.answer)!.value));
    assert.deepEqual(score, { correct: 0, total: 4, passed: false });
  }
});

test("三分通过、两分不通过", () => {
  const lesson = academyLessons["least-privilege"];
  const answers = lesson.questions.map(question => question.answer);
  answers[0] = "deny";
  assert.equal(scoreAcademyLesson(lesson.id, answers).passed, true);
  answers[1] = "allow";
  assert.equal(scoreAcademyLesson(lesson.id, answers).passed, false);
});

test("课程必须完整作答", () => {
  assert.throws(() => scoreAcademyLesson("external-content", []), /INVALID_ANSWER_COUNT/);
});

test("伪造选项不能被计分", () => {
  assert.throws(() => scoreAcademyLesson("audit-and-confirm", ["logs", "recipient", "this", "DELETE_ALL"]), /INVALID_ANSWER_OPTION/);
});

test("未知课程 ID 不在白名单内", () => {
  assert.equal(isAcademyLessonId("least-privilege"), true);
  assert.equal(isAcademyLessonId("constructor"), false);
  assert.equal(isAcademyLessonId("__proto__"), false);
  assert.equal(isAcademyLessonId("fake"), false);
});

test("每个选项有唯一值且答案存在", () => {
  for (const lesson of Object.values(academyLessons)) for (const question of lesson.questions) {
    assert.equal(new Set(question.choices.map(choice => choice.value)).size, question.choices.length);
    assert.ok(question.choices.some(choice => choice.value === question.answer));
  }
});
