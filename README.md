# WheelRadar

<p>
  <a href="./README.md"><img src="https://img.shields.io/badge/Docs-English-2563EB?style=flat-square" alt="English" /></a>
  <a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-64748B?style=flat-square" alt="简体中文" /></a>
</p>

> Original development period: 2025-11 ~ 2026-01

A "Tool & Library Selector" built for indie developers and office/knowledge workers. Enter a requirement or idea (such as "PDF to Markdown" or "batch image compression"), and WheelRadar automatically retrieves ready-to-use off-the-shelf tools alongside reusable open-source libraries—producing structured comparisons and explainable recommendations so you don't reinvent the wheel.

## Tech Stack

- Next.js + React + TypeScript
- Tailwind CSS + Radix UI + Lucide Icons
- Vercel AI SDK (`ai` / `@ai-sdk/openai`)

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

For detailed design specifications, see [docs/项目说明书.md](./docs/项目说明书.md).
