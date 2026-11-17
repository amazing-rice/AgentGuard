import assert from "node:assert/strict";
import test from "node:test";
import { AI_TUTOR_MODEL, AI_TUTOR_MAX_OUTPUT_TOKENS, estimatePeakCny, readLimit, buildTutorSystemPrompt } from "../src/lib/ai-tutor";

test("仅使用成本较低的 Flash 模型", () => {
  assert.equal(AI_TUTOR_MODEL, "deepseek-flash");
  assert.equal(AI_TUTOR_MAX_OUTPUT_TOKENS, 700);
});

test("高峰缓存未命中与输出单价计算正确", () => {
  const cost = estimatePeakCny({ prompt_tokens: 1000, completion_tokens: 500, prompt_cache_hit_tokens: 0 });
  assert.equal(cost, 0.006);
});

test("缓存命中使用更低的输入价格", () => {
  assert.equal(estimatePeakCny({ prompt_tokens: 1000, completion_tokens: 500, prompt_cache_hit_tokens: 1000 }), 0.00404);
});

test("缺少 token 用量时不伪造费用", () => {
  assert.equal(estimatePeakCny(null), null);
  assert.equal(estimatePeakCny({}), null);
});

test("恶意或过大的配额环境变量不会突破硬上限", () => {
  assert.equal(readLimit("20000", 12, 30), 30);
  assert.equal(readLimit("-5", 12, 30), 12);
  assert.equal(readLimit("foo", 12, 30), 12);
});

test("学习建议只包含课程及最高分，不包含账号信息", () => {
  const prompt = buildTutorSystemPrompt([
    { lessonId: "least-privilege", bestScore: 3 },
    { lessonId: "unknown-lesson", bestScore: 100 },
  ]);
  assert.match(prompt, /只给 AI 必需的权限：最高 3\/4/);
  assert.doesNotMatch(prompt, /unknown-lesson/);
  assert.match(prompt, /外部资料信任边界/);
});
