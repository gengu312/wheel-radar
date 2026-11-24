# WheelRadar（轮子雷达）

> 原始开发时间：2025-11 ~ 2026-01

面向独立开发者与办公人群的「工具选型器」。输入一个需求或想法（如“PDF 转 Markdown”“批量压缩图片”），自动检索可直接使用的成品工具与可复用的开源轮子，输出结构化对比与可解释的选型结论，避免重复造轮子。

## 技术栈

- Next.js + React + TypeScript
- Tailwind CSS + Radix UI + Lucide Icons
- Vercel AI SDK (`ai` / `@ai-sdk/openai`)

## 快速开始

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

详细设计说明见 [docs/项目说明书.md](./docs/项目说明书.md)。
