/**
 * GitHub 数据源适配器
 * 使用 GitHub REST API 搜索仓库并转换为 Candidate 格式
 */

import type { Candidate, CandidateBucket, CautionFlag } from '@/types/candidate';
import type { SearchAdapter, AdapterSearchResult, SearchOptions } from './types';
import { DEFAULT_SEARCH_OPTIONS } from './types';

// GitHub API 响应类型
interface GitHubRepo {
    id: number;
    full_name: string;
    name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    license: { spdx_id: string; name: string } | null;
    pushed_at: string;
    created_at: string;
    topics: string[];
    language: string | null;
    fork: boolean;
    archived: boolean;
    owner: {
        login: string;
        avatar_url: string;
    };
}

interface GitHubSearchResponse {
    total_count: number;
    incomplete_results: boolean;
    items: GitHubRepo[];
}

// 分桶关键词映射
const BUCKET_KEYWORDS: Record<CandidateBucket, string[]> = {
    ready_to_use: [
        'app',
        'desktop',
        'gui',
        'webapp',
        'website',
        'tool',
        'editor',
        'viewer',
        'windows',
        'macos',
        'linux',
        'electron',
        'tauri',
    ],
    self_hosted: [
        'docker',
        'self-hosted',
        'selfhosted',
        'server',
        'service',
        'deploy',
        'kubernetes',
        'k8s',
        'compose',
    ],
    integratable: [
        'library',
        'lib',
        'sdk',
        'api',
        'cli',
        'package',
        'module',
        'framework',
        'npm',
        'pypi',
        'pip',
    ],
};

// 高风险许可证
const HIGH_RISK_LICENSES = ['GPL-3.0', 'GPL-2.0', 'AGPL-3.0', 'LGPL-3.0', 'LGPL-2.1'];

/**
 * 根据仓库信息判断分桶
 */
function determineBucket(repo: GitHubRepo): CandidateBucket {
    const text = [
        repo.name,
        repo.description || '',
        ...repo.topics,
        repo.language || '',
    ]
        .join(' ')
        .toLowerCase();

    // 优先检查可集成（库/SDK）
    if (BUCKET_KEYWORDS.integratable.some((kw) => text.includes(kw))) {
        return 'integratable';
    }

    // 检查自部署
    if (BUCKET_KEYWORDS.self_hosted.some((kw) => text.includes(kw))) {
        return 'self_hosted';
    }

    // 检查直接可用
    if (BUCKET_KEYWORDS.ready_to_use.some((kw) => text.includes(kw))) {
        return 'ready_to_use';
    }

    // 默认根据是否有 homepage 判断
    if (repo.homepage) {
        return 'ready_to_use';
    }

    // 兜底：可集成
    return 'integratable';
}

/**
 * 生成注意事项标记
 */
function generateCautionFlags(repo: GitHubRepo): CautionFlag[] {
    const flags: CautionFlag[] = [];

    // 许可证风险
    if (!repo.license) {
        flags.push('license:unknown');
    } else if (HIGH_RISK_LICENSES.includes(repo.license.spdx_id)) {
        if (repo.license.spdx_id.includes('AGPL')) {
            flags.push('license:agpl');
        } else {
            flags.push('license:gpl');
        }
    }

    // 停更检测（超过 180 天未更新）
    const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 180) {
        flags.push('stale');
    }

    return flags;
}

/**
 * 计算 WheelScore（开源轮子评分）
 * 基于：活跃度 35% + 风险 30% + 可用性 20% + 适配度 15%
 */
function calculateWheelScore(repo: GitHubRepo): number {
    let score = 100;

    // 活跃度 (35%)
    const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 365) score -= 35;
    else if (daysSinceUpdate > 180) score -= 25;
    else if (daysSinceUpdate > 90) score -= 15;
    else if (daysSinceUpdate > 30) score -= 5;

    // 风险 (30%) - 许可证
    if (!repo.license) score -= 15;
    else if (HIGH_RISK_LICENSES.includes(repo.license.spdx_id)) score -= 20;

    // 可用性 (20%) - 基于 star 和 description
    if (repo.stargazers_count < 10) score -= 15;
    else if (repo.stargazers_count < 100) score -= 10;
    else if (repo.stargazers_count < 500) score -= 5;

    if (!repo.description || repo.description.length < 20) score -= 5;

    // 适配度 (15%) - 基于 topics
    if (repo.topics.length === 0) score -= 10;

    // 额外扣分
    if (repo.archived) score -= 30;
    if (repo.fork) score -= 10;

    return Math.max(0, Math.min(100, score));
}

/**
 * 将 GitHub 仓库转换为 Candidate
 */
function repoToCandidate(repo: GitHubRepo): Candidate {
    const bucket = determineBucket(repo);
    const cautionFlags = generateCautionFlags(repo);
    const wheelScore = calculateWheelScore(repo);

    const reasons: string[] = [];

    // 生成理由
    if (repo.stargazers_count >= 1000) {
        reasons.push(`⭐ ${repo.stargazers_count.toLocaleString()} stars`);
    }
    if (repo.topics.length > 0) {
        reasons.push(`📦 ${repo.topics.slice(0, 3).join(', ')}`);
    }
    if (repo.license) {
        reasons.push(`📄 ${repo.license.spdx_id}`);
    }

    return {
        canonicalId: `github:${repo.full_name}`,
        entityId: `github:${repo.full_name}`,
        name: repo.name,
        description: repo.description || undefined,
        source: 'github',
        bucket,
        url: repo.html_url,
        licenseSpdx: repo.license?.spdx_id,
        lastUpdatedAt: repo.pushed_at,
        wheelScore,
        reasons,
        cautionFlags: cautionFlags.length > 0 ? cautionFlags : undefined,
        evidenceLinks: [
            { label: 'GitHub', url: repo.html_url },
            ...(repo.homepage ? [{ label: 'Homepage', url: repo.homepage }] : []),
        ],
    };
}

/**
 * GitHub 适配器实现
 */
export const githubAdapter: SearchAdapter = {
    source: 'github',

    async search(query: string, options?: SearchOptions): Promise<AdapterSearchResult> {
        const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

            // 构建搜索 URL
            const searchParams = new URLSearchParams({
                q: query,
                sort: 'stars',
                order: 'desc',
                per_page: String(opts.maxItems),
            });

            const headers: HeadersInit = {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            };

            // 如果有 Token 则添加
            if (process.env.GITHUB_TOKEN) {
                headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
            }

            const response = await fetch(
                `https://api.github.com/search/repositories?${searchParams}`,
                {
                    headers,
                    signal: controller.signal,
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const data: GitHubSearchResponse = await response.json();

            // 过滤 fork 和 archived
            const filtered = data.items.filter((repo) => !repo.fork && !repo.archived);

            // 转换为 Candidate
            const candidates = filtered.map(repoToCandidate);

            return {
                source: 'github',
                candidates,
                complete: !data.incomplete_results,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                source: 'github',
                candidates: [],
                complete: false,
                error: message,
            };
        }
    },

    async hydrate(candidate: Candidate): Promise<Candidate> {
        // TODO: 获取 README 内容用于 AI 分析
        // 目前直接返回原候选项
        return candidate;
    },
};

/**
 * 获取仓库 README 内容
 */
export async function getRepoReadme(owner: string, repo: string): Promise<string | null> {
    try {
        const headers: HeadersInit = {
            Accept: 'application/vnd.github.raw+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };

        if (process.env.GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers,
        });

        if (!response.ok) {
            return null;
        }

        return await response.text();
    } catch {
        return null;
    }
}
