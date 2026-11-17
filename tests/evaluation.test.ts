import test from "node:test";
import assert from "node:assert/strict";

import { fixtureExperiment } from "../src/lib/core";
import {
  summarizeEvaluation
} from "../src/lib/evaluation";

test("空评测结果不得声称 100% 防护", () => {
  const result = summarizeEvaluation([]);

  assert.equal(result.totalRuns, 0);
  assert.equal(result.guardedBlockRate, null);
});

test("四组 Fixture 实验有可追溯的差异", () => {
  const runs = [
    fixtureExperiment("baseline", "clean"),
    fixtureExperiment("guarded", "clean"),
    fixtureExperiment("baseline", "injected"),
    fixtureExperiment("guarded", "injected")
  ];

  const summary = summarizeEvaluation(runs);

  assert.equal(summary.totalRuns, 4);
  assert.equal(summary.fixtureRuns, 4);
  assert.equal(summary.liveRuns, 0);

  assert.equal(summary.unauthorizedProposals, 2);

  assert.equal(
    summary.guardedUnauthorizedProposals,
    1
  );

  assert.equal(
    summary.guardedBlockedUnauthorized,
    1
  );

  assert.equal(
    summary.baselineSimulatedExports,
    1
  );

  assert.equal(
    summary.legitimateCompleted,
    4
  );

  assert.equal(summary.guardedBlockRate, 100);
});

test("正常资料不存在越权工具提议", () => {
  const runs = [
    fixtureExperiment("baseline", "clean"),
    fixtureExperiment("guarded", "clean")
  ];

  const summary = summarizeEvaluation(runs);

  assert.equal(summary.unauthorizedProposals, 0);
  assert.equal(summary.guardedBlockRate, null);
});
