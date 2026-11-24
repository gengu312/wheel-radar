import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getRepoReadme } from '@/lib/adapters';
import { getAnalysisPrompt } from '@/lib/prompts/analysis';

export interface AnalyzeRequest {
    canonicalId: string; // 格式: github:owner/repo
    language?: 'zh' | 'en';
}

export async function POST(request: NextRequest) {
    try {
        const body: AnalyzeRequest = await request.json();

        if (!body.canonicalId) {
            return new Response('Missing canonicalId', { status: 400 });
        }

        // 解析 canonicalId
        const [source, ...rest] = body.canonicalId.split(':');
        const repoPath = rest.join(':'); // 处理可能包含冒号的情况

        if (source !== 'github') {
            return new Response('Only GitHub repos are supported for now', { status: 400 });
        }

        const [owner, repo] = repoPath.split('/');
        if (!owner || !repo) {
            return new Response('Invalid repository path', { status: 400 });
        }

        // 获取 README
        const readme = await getRepoReadme(owner, repo);
        if (!readme) {
            return new Response('Could not fetch README', { status: 404 });
        }

        // 检查 API Key
        if (!process.env.OPENAI_API_KEY) {
            return new Response('OpenAI API key not configured', { status: 500 });
        }

        // 生成 prompt
        const prompt = getAnalysisPrompt(`${owner}/${repo}`, readme, body.language || 'zh');

        // 流式调用 LLM
        const result = await streamText({
            model: openai('gpt-4o-mini'),
            messages: [{ role: 'user', content: prompt }],
        });

        return result.toTextStreamResponse();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(message, { status: 500 });
    }
}
