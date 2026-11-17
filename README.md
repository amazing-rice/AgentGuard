# AgentGuard｜让 AI 的权限边界看得见

> 面向 AI 初学者的安全教育与受控智能体实验 Web 平台。通过互动课程、情境挑战、Baseline / Guarded 双轨沙箱、可解释审计以及真实大模型学习伙伴，让抽象的 AI 安全原则能够被看见、操作和复盘。

**参赛项目：** 2026 年第九届传智杯 AI WEB 网页开发挑战赛 · 省赛。

## 1. 项目背景与目标

AI 助手可能读取网页、邮件、文档等外部内容，而这些内容并不等同于用户或系统授权的高优先级指令。AgentGuard 以提示注入、最小权限和操作审计为核心教学主题，让学习者从理解风险、完成练习，到观察不同防护策略下的结果。

**主要受众：** AI 应用初学者、Web 开发学习者，以及希望了解智能体工具使用安全边界的用户。

## 2. 主要功能

| 功能 | 页面或模块 | 说明 |
| --- | --- | --- |
| 安全课程 | `/academy` | 交互式微课、知识讲解和学习进度；当前版本提供 4 门课程 |
| 情境挑战 | `/challenges` | 风险识别练习与学习反馈；当前版本提供 2 项挑战 |
| AI 安全习惯自测 | `/checkup` | 8 道题的行为习惯反馈；不等同于真实系统安全扫描 |
| 双轨安全实验 | `/workshop` | 对比 Baseline（教学基线）与 Guarded（受控策略）在虚构场景中的行为 |
| 安全故事 | `/stories` | 社区、旅行、学习和邮件等虚构情境的交互教学 |
| DeepSeek 学习伙伴 | `/ai-tutor`、悬浮窗 | 服务端接入真实大模型 API 的安全问答；支持限额等保护措施 |
| 学习档案 | `/account` | 学习进度、徽章、实验记录和相关报告 |

> **演示模式必须区分：** 工作坊的 Fixture 双轨运行是预定义的教学模拟，展示策略与受控工具行为；它**不是**每次都实时调用大模型的自主 Agent。AI 学习伙伴的问答使用真实 DeepSeek API（需要配置自己的密钥）。

## 3. 技术架构

- **前端：** Next.js 16、React 19、TypeScript；基于 App Router 的页面及交互组件。
- **服务端接口：** Next.js Route Handlers（账号、学习、实验及 AI 助教相关接口）。
- **持久化：** Prisma 6 + SQLite，保存账号、学习进度及业务数据（以数据库 Schema 为准）。
- **AI 集成：** DeepSeek API 由服务端调用，私有 API Key 不下发浏览器；支持使用额度与请求相关控制。
- **安全实验：** 虚构 Fixture、Baseline / Guarded 策略比较、工具执行审计与结果展示。
- **工程质量：** ESLint、TypeScript、`tsx --test`、Next.js 生产构建。

```text
浏览器（Next.js 页面与组件）
  ├─ 课程 / 挑战 / 自测 / 账号 → Route Handlers → Prisma → SQLite
  ├─ 双轨实验 → Fixture 场景 + 策略执行 → 审计记录 / 对照报告
  └─ AI 学习伙伴 → 服务端 AI API → DeepSeek 大模型
```

## 4. 安装与运行

**环境要求：** Node.js、npm；可运行 Next.js 16 的开发环境。Windows PowerShell 示例：

```powershell
# 从公开 Git 仓库克隆后进入项目根目录
npm.cmd ci

# 创建自己的本地环境配置（不要提交 .env）
Copy-Item .env.example .env
# 使用本地编辑器修改 .env 中的配置，填入自己的 DEEPSEEK_API_KEY

# 建立 SQLite 数据表并生成 Prisma Client
npx.cmd prisma migrate deploy
npx.cmd prisma generate

npm.cmd run dev
# 打开 http://localhost:3000
```

配置说明（以仓库根目录 `.env.example` 为模板）：

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | SQLite 数据库连接，例如 `file:./dev.db` |
| `DEEPSEEK_API_KEY` | 用户自行提供的 DeepSeek API 密钥；不得提交到 Git |
| `DEEPSEEK_MODEL` | 模型名称；模板示例为 `deepseek-chat` |
| `AI_TUTOR_ENABLED` | 是否启用真实 AI 助教 |
| `AI_TUTOR_USER_DAILY_LIMIT` | 每用户每日请求额度 |
| `AI_TUTOR_GLOBAL_DAILY_LIMIT` | 全站每日请求额度 |

如果未配置有效的 API Key，Fixture 教学演示可以与真实模型问答分开体验；不得将 Mock 回答当作真实 DeepSeek 运行结果。

## 5. 工程检查

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

**验收记录（历史版本，不代表最新代码自动通过）：**

- V2.7.2 曾完成 76 项自动化测试并通过生产构建。
- 2026-11-17 的 V2.7.2 五项浏览器专项复测结果为 **4 PASS / 1 FAIL**：旧会话清理、历史隔离、延迟回复隔离和既有界面回归通过；跨标签切换后的首次打开失败。
- V2.7.3 的首次点击恢复补丁需要依据**最终实际运行版本**完成本机检查与人工 A→B→A 验证后，再更新最终状态；此处不预先声称已全面修复。

## 6. 数据安全与能力边界

1. Baseline / Guarded 实验运行在**虚构沙箱环境**中，不连接真实邮箱、外部工作系统或私人账户，不会真实执行敏感外部操作。
2. Fixture 是可复现的教学对照，**不能**计入实时大模型安全评测；真实 DeepSeek 问答与 Fixture 实验分别标注。
3. AI 助教不等同于可以自主规划并执行真实外部工具的智能体；本项目不宣称已完成完整 RAG、多模态融合或 MCP 标准接入。
4. API 密钥只在本地环境变量中配置；公共仓库不得包括 `.env`、真实 SQLite 数据库、Cookie、密码、Token 或实际用户数据。
5. SQLite 的本地示例部署不代表已验证高并发多实例生产运营能力；公网部署需额外考虑持久化、安全和评审期间可用性。

## 7. 代码结构

```text
src/app/         Next.js 页面与 API 路由
src/components/  UI、互动课程、工作坊与 AI 学习伙伴
src/lib/         领域逻辑、权限策略及 AI 集成
src/data/        课程与情境教学资料
prisma/          数据模型及数据库迁移
tests/           自动化测试
```

版本历史以真实 Git commit 为准；没有使用 Git 记录的早期开发过程只在项目变更说明中如实记载，不补造提交日期。

## 8. 参赛团队与交付材料

- **学校：** 〔参赛者填写〕
- **队伍 / 队员：** 〔参赛者填写；可只填比赛要求公开的姓名〕
- **赛事组别：** 〔研究生组 / A 组 / B 组 / C 组，按实际报名填写〕
- **指导老师：** 〔如有则填写〕
- **技术文档：** 随省赛平台提交的 PDF，页数不超过 30 页
- **演示视频：** 随省赛平台提交的 5–8 分钟、1080p 及以上 MP4
- **在线演示：** 〔可选；如实际部署再填写〕

## 9. 原创与第三方依赖

项目包含第三方 npm 依赖和大模型 API 接入，请按照各自许可证和服务条款使用；参赛者应核实图片、图标和引用素材的授权情况。AI 辅助开发工具可以参与工程实现，但作品内容及代码责任由参赛团队承担。
