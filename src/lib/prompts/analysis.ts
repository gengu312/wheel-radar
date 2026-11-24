/**
 * AI 分析 Prompt 模板
 */

export function getAnalysisPrompt(
    repoName: string,
    readme: string,
    language: 'zh' | 'en' = 'zh'
): string {
    const prompts = {
        zh: `你是一个专业的技术选型顾问。请分析以下 GitHub 仓库的 README，并给出结构化的选型建议。

## 仓库名称
${repoName}

## README 内容
${readme.slice(0, 8000)}

---

请用以下格式输出分析报告：

## 📋 功能概述
（一句话总结这个项目是做什么的）

## ✅ 优点
- （列出 3-5 个主要优点）

## ⚠️ 局限性
- （列出 2-3 个可能的局限或注意事项）

## 🎯 适用场景
（描述最适合使用这个项目的场景）

## 🚀 快速上手
\`\`\`bash
（给出最简单的安装/使用命令，如有）
\`\`\`

## 📊 选型建议
（给出一句话的选型建议：推荐/谨慎使用/不推荐，以及理由）`,

        en: `You are a professional technical advisor. Analyze the following GitHub repository's README and provide structured recommendations.

## Repository Name
${repoName}

## README Content
${readme.slice(0, 8000)}

---

Please output analysis in the following format:

## 📋 Overview
(One-sentence summary of what this project does)

## ✅ Strengths
- (List 3-5 main advantages)

## ⚠️ Limitations
- (List 2-3 potential limitations or caveats)

## 🎯 Best Use Cases
(Describe scenarios where this project is most suitable)

## 🚀 Quick Start
\`\`\`bash
(Provide the simplest installation/usage commands, if available)
\`\`\`

## 📊 Recommendation
(One-line recommendation: Recommended / Use with caution / Not recommended, with reasoning)`,
    };

    return prompts[language];
}
