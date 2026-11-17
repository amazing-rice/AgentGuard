import test from "node:test";
import assert from "node:assert/strict";
import { checkupQuestions, checkupDimensions, evaluateCheckup, formatCheckupReport } from "../src/data/checkup";

test("八道题覆盖四个维度，每维两题", () => {
  assert.equal(checkupQuestions.length, 8);
  for (const dimension of checkupDimensions) assert.equal(checkupQuestions.filter(question => question.dimension === dimension.id).length, 2);
});

test("全部谨慎答案得到 0 分", () => {
  const report = evaluateCheckup(Array(8).fill(0));
  assert.equal(report.score, 0);
  assert.equal(report.max, 16);
  assert.equal(report.level, "当前习惯较为谨慎");
  assert.equal(report.dimensions.reduce((sum, item) => sum + item.points, 0), 0);
});

test("全部高风险习惯得到 16 分", () => {
  const report = evaluateCheckup(Array(8).fill(2));
  assert.equal(report.score, 16);
  assert.equal(report.level, "需要重点关注");
  assert.ok(report.dimensions.every(item => item.points === 4));
});

test("单个维度较高时，建议只覆盖需要改善的维度", () => {
  const report = evaluateCheckup([2, 2, 0, 0, 0, 0, 0, 0]);
  assert.equal(report.dimensions[0].points, 4);
  assert.equal(report.dimensions[1].points, 0);
  assert.equal(report.recommendations.length, 1);
  assert.match(report.recommendations[0], /脱敏/);
});

test("分数阈值按 5 和 10 分类", () => {
  assert.equal(evaluateCheckup([2, 2, 0, 0, 0, 0, 0, 0]).level, "当前习惯较为谨慎");
  assert.equal(evaluateCheckup([2, 2, 1, 0, 0, 0, 0, 0]).level, "有一些可优化的地方");
  assert.equal(evaluateCheckup([2, 2, 2, 2, 2, 0, 0, 0]).level, "需要重点关注");
});

test("漏答与非法答案被拒绝", () => {
  assert.throws(() => evaluateCheckup([]), /INVALID_ANSWER_COUNT/);
  assert.throws(() => evaluateCheckup([0, 0, 0, 0, 0, 0, 0, 9]), /INVALID_ANSWER_OPTION/);
});

test("报告明确声明不是软件安全扫描", () => {
  const markdown = formatCheckupReport(Array(8).fill(0));
  assert.match(markdown, /不是对任何真实 AI 软件的漏洞扫描/);
  assert.match(markdown, /不会因体检而保存这些回答/);
  assert.match(markdown, /资料隐私/);
});

test("每道题选项均合法且唯一", () => {
  for (const question of checkupQuestions) {
    assert.equal(new Set(question.options.map(option => option.value)).size, 3);
    assert.deepEqual(question.options.map(option => option.value).sort(), [0, 1, 2]);
  }
});
