import { NextRequest, NextResponse } from 'next/server';
import { githubAdapter } from '@/lib/adapters';
import type { Candidate, CandidateBucket } from '@/types/candidate';

export interface SearchRequest {
    query: string;
    maxItems?: number;
}

export interface SearchResponse {
    query: string;
    timestamp: string;
    buckets: Record<CandidateBucket, Candidate[]>;
    cautions: Candidate[];
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: SearchRequest = await request.json();

        if (!body.query || body.query.trim().length === 0) {
            return NextResponse.json(
                { error: '请输入搜索关键词 / Please enter a search query' },
                { status: 400 }
            );
        }

        // 搜索 GitHub
        const result = await githubAdapter.search(body.query, {
            maxItems: body.maxItems || 20,
        });

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // 分桶
        const buckets: Record<CandidateBucket, Candidate[]> = {
            ready_to_use: [],
            self_hosted: [],
            integratable: [],
        };

        for (const candidate of result.candidates) {
            buckets[candidate.bucket].push(candidate);
        }

        // 提取有注意事项的候选项
        const cautions = result.candidates.filter(
            (c) => c.cautionFlags && c.cautionFlags.length > 0
        );

        const response: SearchResponse = {
            query: body.query,
            timestamp: new Date().toISOString(),
            buckets,
            cautions,
        };

        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
