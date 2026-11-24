/**
 * 数据源适配器接口定义
 * 所有数据源（GitHub、NPM、PyPI、Docker Hub）都需要实现此接口
 */

import type { Candidate, CandidateSource } from '@/types/candidate';

// 搜索选项
export interface SearchOptions {
    /** 最大返回数量 */
    maxItems?: number;
    /** 超时时间（毫秒） */
    timeout?: number;
    /** 语言偏好 */
    language?: string;
}

// 搜索结果
export interface AdapterSearchResult {
    source: CandidateSource;
    candidates: Candidate[];
    /** 是否完整返回（未超时/未达限流） */
    complete: boolean;
    /** 错误信息（如有） */
    error?: string;
}

// 数据源适配器接口
export interface SearchAdapter {
    /** 数据源标识 */
    readonly source: CandidateSource;

    /** 搜索候选项 */
    search(query: string, options?: SearchOptions): Promise<AdapterSearchResult>;

    /** 补全候选项详情（README、Release 等） */
    hydrate?(candidate: Candidate): Promise<Candidate>;
}

// 默认搜索选项
export const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions> = {
    maxItems: 20,
    timeout: 10000,
    language: 'zh',
};
