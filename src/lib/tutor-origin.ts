/** Server-authored provenance guidance. A user-supplied document must never redefine the answer's origin. */
export const AI_RESPONSE_ORIGIN_NOTE = [
  "当前问答使用真实的 DeepSeek Flash 在线模型生成回答，不是离线 Fixture 回放。",
  "若为解释原理而虚构旅行、邮件或其他案例，只能说『以下案例为虚构教学示例，没有执行真实外部操作』。",
  "不得把这次真实模型生成的回答说成『离线回放』『不是实际模型运行』或暗示已经执行过未发生的工具调用。",
  "只有在用户明确询问沙箱实验来源时，才说明具体实验可能是离线 Fixture 或真实模型流程，且应依可见证据区分，不得编造运行结果。",
].join("\n");
