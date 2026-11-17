import type { ReactNode } from "react";

export function RobotIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? "ag-robot ag-robot-compact" : "ag-robot"} viewBox="0 0 450 410" fill="none" role="img" aria-label="可爱的 AI 安全守护机器人插画">
      <defs>
        <linearGradient id="agBody" x1="90" y1="120" x2="340" y2="365" gradientUnits="userSpaceOnUse"><stop stopColor="#faffff"/><stop offset="1" stopColor="#a8e8ed"/></linearGradient>
        <linearGradient id="agScreen" x1="118" y1="147" x2="342" y2="274" gradientUnits="userSpaceOnUse"><stop stopColor="#164d65"/><stop offset="1" stopColor="#112d56"/></linearGradient>
        <linearGradient id="agShield" x1="280" y1="232" x2="374" y2="341" gradientUnits="userSpaceOnUse"><stop stopColor="#42ddbe"/><stop offset="1" stopColor="#10a48f"/></linearGradient>
      </defs>
      <ellipse cx="225" cy="363" rx="160" ry="23" fill="#a1c5f0" opacity=".28"/>
      <circle cx="73" cy="86" r="31" fill="#fee7be"/><circle cx="384" cy="109" r="47" fill="#d5d5ff"/><circle cx="374" cy="283" r="23" fill="#ffd6be"/>
      <path d="M85 155l8 10-8 11-10-11 10-10ZM341 45l8 10-8 10-9-10 9-10Z" fill="#8edecf"/>
      <path d="M225 126V88" stroke="#264e6b" strokeWidth="13" strokeLinecap="round"/><circle cx="225" cy="74" r="19" fill="#32d9b2" stroke="#1f6380" strokeWidth="7"/>
      <path d="M108 271c-26 2-43-7-43-26s16-34 35-34" stroke="#6fbcd0" strokeWidth="22" strokeLinecap="round"/>
      <path d="M340 251c25-3 44 9 44 28 0 11-6 19-13 23" stroke="#73b9ce" strokeWidth="23" strokeLinecap="round"/>
      <rect x="155" y="284" width="43" height="62" rx="18" fill="#6dacc6"/><rect x="256" y="284" width="43" height="62" rx="18" fill="#6dacc6"/>
      <rect x="91" y="117" width="268" height="201" rx="88" fill="url(#agBody)" stroke="#72bccc" strokeWidth="10"/>
      <rect x="113" y="145" width="225" height="128" rx="50" fill="url(#agScreen)"/>
      <path d="M152 208q17-29 34 0M262 208q17-29 34 0" stroke="#7ef7db" strokeWidth="11" strokeLinecap="round"/>
      <ellipse cx="150" cy="239" rx="17" ry="8" fill="#ff98a5" opacity=".8"/><ellipse cx="300" cy="239" rx="17" ry="8" fill="#ff98a5" opacity=".8"/>
      <path d="M211 228q14 16 29 0" stroke="#7ef7db" strokeWidth="7" strokeLinecap="round"/>
      <rect x="199" y="295" width="53" height="13" rx="7" fill="#5db2bb" opacity=".7"/>
      <path d="M311 252l66 16-8 51c-6 24-27 40-55 52-32-15-47-32-49-55l-5-49 51-15Z" fill="url(#agShield)" stroke="#f3fffd" strokeWidth="8"/>
      <path d="m291 309 16 17 29-34" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="80" cy="305" r="9" fill="#ffad76"/><circle cx="354" cy="75" r="7" fill="#51c8d2"/>
    </svg>
  );
}

export type StoryKind = "community" | "travel" | "study" | "mail";

export function StoryArt({ kind, children }: { kind: StoryKind; children?: ReactNode }) {
  if (kind === "community") return (
    <div className="ag-art ag-art-community">
      <div className="ag-art-orbit ag-art-orbit-one"/><div className="ag-art-orbit ag-art-orbit-two"/>
      <div className="ag-art-note"><span className="ag-art-note-top">社区活动日程</span><span className="ag-art-note-line"/><span className="ag-art-note-line short"/><span className="ag-art-note-line"/><span className="ag-art-note-stamp">✓</span></div>
      <span className="ag-art-mini ag-art-mini-one">📅</span><span className="ag-art-mini ag-art-mini-two">🔒</span><span className="ag-art-character">🌿</span>{children}
    </div>
  );
  if (kind === "travel") return (
    <div className="ag-art ag-art-travel"><div className="ag-art-sun"/><div className="ag-art-travel-card"><span>✈️</span><strong>TRAVEL PLAN</strong><small>DAY 01 — DAY 02</small></div><span className="ag-art-travel-bag">🧳</span><span className="ag-art-travel-cloud">☁️</span>{children}</div>
  );
  if (kind === "mail") return (<div className="ag-art ag-art-mail"><div className="ag-art-travel-card"><span>✉️</span><strong>SMART CALENDAR</strong><small>FRIDAY 15:00</small></div><span className="ag-art-travel-bag">📬</span>{children}</div>);
  return (
    <div className="ag-art ag-art-study"><div className="ag-art-book"><span>MY NOTES</span><i/><i/><i/><i/><i/></div><div className="ag-art-study-lock">🔐</div><span className="ag-art-study-pencil">✏️</span><span className="ag-art-study-star">✦</span>{children}</div>
  );
}
