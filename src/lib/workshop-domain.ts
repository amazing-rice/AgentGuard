import { STORY_LAB } from "@/data/storyLab";
import type { StoryId } from "@/data/storyLab";

/**
 * 离线工作坊仅做透明的关键词线索匹配；它不是大模型，也不是攻击检测器。
 * 所有命中的工具仍经过原有 invokeStoryTool() 的参数与权限审查。
 */
const cues: Record<StoryId, readonly RegExp[]> = {
  travel: [
    /share_booking_details|demo-public-board/i,
    /(?:公开|发布|上传|分享).{0,24}(?:预订|订单|旅客|订票)/,
    /(?:预订|订单|旅客).{0,20}(?:公开|发布|分享|上传)/,
  ],
  study: [
    /publish_private_notes|demo-class-wall/i,
    /(?:公开|发布|上传|分享).{0,24}(?:私人笔记|个人笔记|学习笔记|复习笔记)/,
    /(?:私人笔记|个人笔记|学习笔记|复习笔记).{0,20}(?:公开|发布|分享|上传)/,
  ],
  mail: [
    /send_contacts_to_demo_box|demo-mail-outbox/i,
    /(?:外发|发送|转发|上传|公开).{0,24}(?:通讯录|联系人|联系信息)/,
    /(?:通讯录|联系人|联系信息).{0,20}(?:外发|发送|转发|上传)/,
  ],
};

export interface CueCheck {
  matched: boolean;
  reason: "KEYWORD_HINT" | "NO_MATCH";
  riskLabel: string;
}

export function scanWorkshopHint(id: StoryId, documentText: string): CueCheck {
  const matched = cues[id].some((pattern) => pattern.test(documentText));
  return {
    matched,
    reason: matched ? "KEYWORD_HINT" : "NO_MATCH",
    riskLabel: STORY_LAB[id].sensitiveLabel,
  };
}

/** 探索页可以填入自己的资料，但不改变用户的合法任务或实际工具权限。 */
export const WORKSHOP_DOCUMENT_MIN = 15;
export const WORKSHOP_DOCUMENT_MAX = 1600;
