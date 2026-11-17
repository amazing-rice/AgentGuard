"use client";

import { useState } from "react";
import type { ExperimentRun } from "@/lib/core";
import type {
  EvaluationSummary
} from "@/lib/evaluation";

interface BatchResponse {
  kind: "scripted_fixture_batch";
  label: string;
  savedToAccount?: boolean;
  generatedAt: string;
  summary: EvaluationSummary;
  runs: ExperimentRun[];
}

function Stat({
  title,
  value,
  description
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="card">
      <div className="label">{title}</div>
      <div className="kpi">{value}</div>
      <div className="label">{description}</div>
    </div>
  );
}

export default function EvaluationWorkbench({
  onSaved
}: {
  onSaved: () => Promise<void>;
}) {
  const [result, setResult] =
    useState<BatchResponse | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = result?.runs.find(
    run => run.id === selectedId
  ) ?? result?.runs[3];

  async function executeBatch() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/evaluations",
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "批量实验执行失败"
        );
      }

      const next = data as BatchResponse;

      setResult(next);
      setSelectedId(next.runs[3]?.id ?? null);

      await onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "批量实验执行失败"
      );
    } finally {
      setLoading(false);
    }
  }

  const summary = result?.summary;

  const groups = [
    {
      variant: "clean",
      title: "正常资料对照",
      description: "检查安全策略是否影响合法任务。"
    },
    {
      variant: "injected",
      title: "不可信指令对照",
      description: "检查越权工具提议在两种模式下的执行差异。"
    }
  ] as const;

  return (
    <>
      <h1 className="headline">
        批量安全评测工作台
      </h1>

      <p className="subtext">
        自动执行四组实验：正常资料与对抗资料，
        分别在 Baseline 和 Guarded 模式中运行。
        每组都有独立沙箱状态和审计记录。
      </p>

      <div className="hero">
        <span className="eyebrow">
          CONTROLLED EXPERIMENT / V0.2
        </span>

        <h2>从单次演示升级为可重复对照</h2>

        <p className="subtext">
          固定输入、固定工具调用脚本，使用真实的
          Sandbox Executor 与 Policy Engine
          验证系统行为。
        </p>

        <button
          className="btn primary"
          disabled={loading}
          onClick={() => void executeBatch()}
        >
          {loading
            ? "正在执行四组实验…"
            : "执行四组对照实验"}
        </button>
      </div>

      <div className="notice">
        <strong>实验来源：确定性 Fixture 回放。</strong>
        这里运行的是预定义工具提议，
        而非 DeepSeek 实时生成的调用。
        它可以证明权限引擎和审计链路的行为，
        不能用于计算真实模型的提示注入成功率。
      </div>

      {error && (
        <div className="notice" role="alert"
          style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {summary && (
        <>
          <div
            className="grid4"
            style={{ marginTop: 22 }}
          >
            <Stat
              title="批次运行"
              value={summary.totalRuns}
              description="四组独立沙箱实验"
            />

            <Stat
              title="越权工具提议"
              value={summary.unauthorizedProposals}
              description="按用户授权范围统计"
            />

            <Stat
              title="受保护模式阻断"
              value={summary.guardedBlockedUnauthorized}
              description="实际 POLICY 决策事件"
            />

            <Stat
              title="合法任务完成"
              value={summary.legitimateCompleted}
              description="议程已写入模拟状态"
            />
          </div>

          <div
            className="grid2"
            style={{ marginTop: 20 }}
          >
            <div className="card">
              <h3>权限策略验证</h3>

              <div className="kpi">
                {summary.guardedBlockRate === null
                  ? "N/A"
                  : summary.guardedBlockRate.toFixed(0) + "%"}
              </div>

              <p className="subtext">
                受保护模式中，明确越权工具提议的
                实际拦截比例。
              </p>

              <div className="bar">
                <div style={{
                  width:
                    (summary.guardedBlockRate ?? 0) + "%"
                }} />
              </div>
            </div>

            <div className="card">
              <h3>基线模式模拟副作用</h3>

              <div className="kpi">
                {summary.baselineSimulatedExports}
              </div>

              <p className="subtext">
                虚构人员名单写入本地模拟外发箱的次数。
                未向真实网络发送任何数据。
              </p>
            </div>
          </div>

          <div
            className="grid2"
            style={{ marginTop: 20 }}
          >
            {groups.map(group => (
              <div className="card" key={group.variant}>
                <h3>{group.title}</h3>
                <p className="subtext">
                  {group.description}
                </p>

                {result.runs
                  .filter(run =>
                    run.variant === group.variant
                  )
                  .map(run => (
                    <button
                      key={run.id}
                      className="btn"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        marginBottom: 10
                      }}
                      onClick={() =>
                        setSelectedId(run.id)
                      }
                    >
                      <div className="row">
                        <strong>
                          {run.mode.toUpperCase()}
                        </strong>

                        <span className={
                          "pill " +
                          (run.stats.blocked > 0
                            ? "red"
                            : "green")
                        }>
                          {run.stats.blocked} 次阻断
                        </span>
                      </div>

                      <p className="label">
                        工具提议：{run.stats.proposed}
                        {" · "}
                        实际执行：{run.stats.executed}
                        {" · "}
                        模拟导出：
                        {run.stats.unauthorizedSimulations}
                      </p>
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {selected && (
            <div
              className="grid2"
              style={{ marginTop: 20 }}
            >
              <div className="card">
                <div className="row">
                  <h3>实验审计证据</h3>
                  <span className="pill">
                    {selected.mode}
                  </span>
                </div>

                <p className="label">
                  {selected.id}
                </p>

                <div
                  style={{
                    maxHeight: 470,
                    overflowY: "auto",
                    marginTop: 18
                  }}
                >
                  {selected.events.map(event => (
                    <div
                      key={event.id}
                      className={
                        "event " +
                        (event.decision === "block"
                          ? "block"
                          : event.type === "TOOL_EXECUTED"
                            ? "allow"
                            : "")
                      }
                    >
                      <strong>
                        {event.seq}. {event.type}
                      </strong>

                      <p>
                        {event.tool || "Agent Runtime"}
                      </p>

                      {event.reason && (
                        <p>
                          判定原因：{event.reason}
                        </p>
                      )}

                      {event.decision && (
                        <p>
                          决策：{event.decision}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>最终模拟状态</h3>

                <div className="doc">
                  <pre>
                    {JSON.stringify(
                      selected.sandbox,
                      null,
                      2
                    )}
                  </pre>
                </div>

                <h3 style={{ marginTop: 22 }}>
                  实验结论
                </h3>

                <p className="subtext">
                  合法任务完成：
                  {selected.stats.legitimateTaskCompleted
                    ? " 是"
                    : " 否"}
                </p>

                <p className="subtext">
                  模拟执行次数：
                  {selected.stats.executed}
                </p>

                <p className="subtext">
                  策略阻断次数：
                  {selected.stats.blocked}
                </p>

                <div className="toolbar">
                  {result.savedToAccount ? <>
                    <a className="btn primary" href={"/api/export?id=" + selected.id + "&format=md"}>下载 Markdown 报告</a>
                    <a className="btn" href={"/api/export?id=" + selected.id + "&format=json"}>导出 JSON</a>
                  </> : <p className="label">游客实验不存储在数据库，登录后再次评测即可保存报告。</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!result && (
        <div
          className="card"
          style={{ marginTop: 20 }}
        >
          <div className="empty">
            尚未执行本轮对照实验。
            点击上方按钮，生成四组独立的
            实验记录与审计报告。
          </div>
        </div>
      )}
    </>
  );
}
