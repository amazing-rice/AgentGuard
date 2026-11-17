/** 安全体检只处理用户选择的选项，不采集真实文档或账号信息。 */
export const checkupDimensions = [
  { id: "privacy", title: "资料隐私", icon: "🔒", advice: "处理私人资料前先脱敏，只向 AI 提供当前任务所需的片段。" },
  { id: "sharing", title: "外发权限", icon: "📤", advice: "发送、公开、导出等操作默认关闭，确有需要时逐项确认。" },
  { id: "approval", title: "执行确认", icon: "🖐️", advice: "删除、修改重要文件和对外操作必须经过明确的人类确认。" },
  { id: "audit", title: "操作追溯", icon: "🧾", advice: "使用能查看工具调用与执行记录的产品，定期复核异常操作。" },
] as const;

export type CheckupDimension = typeof checkupDimensions[number]["id"];
export interface CheckupQuestion {
  title: string;
  detail: string;
  dimension: CheckupDimension;
  options: readonly { label: string; value: 0 | 1 | 2 }[];
}

export const checkupQuestions: readonly CheckupQuestion[] = [
  { title: "你会让 AI 接触个人或私人资料吗？", detail: "例如身份信息、学习笔记、私人文档或联系方式。", dimension: "privacy", options: [{ label: "经常直接提供原文", value: 2 }, { label: "偶尔提供部分内容", value: 1 }, { label: "先脱敏并只给必要内容", value: 0 }] },
  { title: "AI 读取文件时，通常可以访问多大范围？", detail: "只看当前指定资料，还是整个文件夹甚至所有文档？", dimension: "privacy", options: [{ label: "可以读取大量无关文件", value: 2 }, { label: "有时会开放整个文件夹", value: 1 }, { label: "只允许读取指定文件", value: 0 }] },
  { title: "你的 AI 能否主动发送、发布或导出信息？", detail: "例如发消息、共享文件、发布文章或导出名单。", dimension: "sharing", options: [{ label: "可以直接执行", value: 2 }, { label: "部分操作需要确认", value: 1 }, { label: "默认关闭，逐项批准", value: 0 }] },
  { title: "如果网页要求 AI 分享你的私人信息，你会怎么处理？", detail: "这条要求出现在 AI 正在阅读的外部资料中。", dimension: "sharing", options: [{ label: "按网页要求执行", value: 2 }, { label: "不确定时先尝试", value: 1 }, { label: "拒绝把网页文字当作授权", value: 0 }] },
  { title: "AI 执行重要操作前，会先询问你吗？", detail: "如编辑重要文件、删除内容、共享私人资料。", dimension: "approval", options: [{ label: "通常不会", value: 2 }, { label: "有时会", value: 1 }, { label: "每次都需要明确确认", value: 0 }] },
  { title: "你会核对 AI 请求执行的具体内容吗？", detail: "例如收件人、文件名称和操作范围。", dimension: "approval", options: [{ label: "通常直接点同意", value: 2 }, { label: "只看一部分", value: 1 }, { label: "会核对目标与内容", value: 0 }] },
  { title: "你能看到 AI 曾执行过哪些操作吗？", detail: "例如工具调用历史或文件修改记录。", dimension: "audit", options: [{ label: "完全看不到", value: 2 }, { label: "只能看到部分", value: 1 }, { label: "能查看完整执行记录", value: 0 }] },
  { title: "当 AI 的结果看起来可疑时，你会怎么做？", detail: "比如它声称没有发送文件，但结果不符合预期。", dimension: "audit", options: [{ label: "只相信它的文字回答", value: 2 }, { label: "偶尔检查记录", value: 1 }, { label: "查看工具记录并暂停授权", value: 0 }] },
];

export function evaluateCheckup(answers: readonly number[]) {
  if (answers.length !== checkupQuestions.length) throw new Error("INVALID_ANSWER_COUNT");
  if (answers.some((value, index) => !checkupQuestions[index].options.some(option => option.value === value))) {
    throw new Error("INVALID_ANSWER_OPTION");
  }
  const score = answers.reduce((sum, value) => sum + value, 0);
  const dimensions = checkupDimensions.map(dimension => {
    const points = checkupQuestions.reduce((sum, question, index) => sum + (question.dimension === dimension.id ? answers[index] : 0), 0);
    return { ...dimension, points, max: 4, status: points >= 3 ? "优先改善" : points >= 1 ? "可以优化" : "习惯谨慎" };
  });
  const level = score >= 10 ? "需要重点关注" : score >= 5 ? "有一些可优化的地方" : "当前习惯较为谨慎";
  const recommendations: string[] = dimensions.filter(d => d.points > 0).sort((a, b) => b.points - a.points).map(d => d.advice);
  if (recommendations.length === 0) recommendations.push("继续保持最小授权、重要操作确认与定期检查执行记录的习惯。");
  return { score, max: 16, level, dimensions, recommendations };
}

export function formatCheckupReport(answers: readonly number[]): string {
  const report = evaluateCheckup(answers);
  const sections = [
    "# AgentGuard · AI 安全使用习惯体检报告",
    "",
    `- 使用习惯风险提示：${report.level}`,
    `- 提示分：${report.score} / ${report.max}（越高表示需要改善的习惯越多）`,
    "",
    "## 四个维度",
    ...report.dimensions.map(d => `- ${d.title}：${d.points}/${d.max} · ${d.status}`),
    "",
    "## 优先行动清单",
    ...report.recommendations.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## 说明",
    "本报告仅根据你选择的使用习惯生成，不是对任何真实 AI 软件的漏洞扫描或安全认证。",
    "问卷选择仅在当前页面内计算；下载报告由浏览器本地生成，网站不会因体检而保存这些回答。",
  ];
  return sections.join("\n");
}
