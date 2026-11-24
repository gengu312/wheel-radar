/**
 * WheelRadar Core Types
 * 跨源统一字段，确保"分桶/去重/评分/导出"都依赖这套 schema
 */

// 数据来源
export type CandidateSource = 'github' | 'npm' | 'pypi' | 'docker_hub' | 'cse';

// 分桶类型
export type CandidateBucket = 'ready_to_use' | 'self_hosted' | 'integratable';

// 分桶标签（用于 UI 展示）
export const BUCKET_LABELS: Record<CandidateBucket, { en: string; zh: string }> = {
    ready_to_use: { en: 'Ready to Use', zh: '直接可用' },
    self_hosted: { en: 'Self-hosted', zh: '开源可自部署' },
    integratable: { en: 'Integratable', zh: '可集成' },
};

// 数据源标签
export const SOURCE_LABELS: Record<CandidateSource, string> = {
    github: 'GitHub',
    npm: 'NPM',
    pypi: 'PyPI',
    docker_hub: 'Docker Hub',
    cse: 'Web',
};

// 注意事项类型
export type CautionFlag =
    | 'license:gpl'
    | 'license:agpl'
    | 'license:unknown'
    | 'privacy:uploads'
    | 'stale'
    | 'paid_or_opaque'
    | 'no_docs';

// 证据链接
export interface EvidenceLink {
    label: string;
    url: string;
}

// 核心候选项类型
export interface Candidate {
    /** 唯一标识符，格式：source:id (e.g., github:owner/repo, npm:package-name) */
    canonicalId: string;

    /** 跨源合并键（优先用 GitHub repo），用于去重 */
    entityId?: string;

    /** 显示名称 */
    name: string;

    /** 描述 */
    description?: string;

    /** 数据来源 */
    source: CandidateSource;

    /** 分桶类型 */
    bucket: CandidateBucket;

    /** 主要链接 */
    url: string;

    /** SPDX License 标识符 */
    licenseSpdx?: string;

    /** 最后更新时间（ISO 字符串） */
    lastUpdatedAt?: string;

    /** 成品工具评分 (0-100)，用于 "直接可用" 桶 */
    toolScore?: number;

    /** 开源轮子评分 (0-100)，用于 "可集成/自部署" 桶 */
    wheelScore?: number;

    /** 评分理由（简短、有证据支撑） */
    reasons?: string[];

    /** 注意事项标记 */
    cautionFlags?: CautionFlag[];

    /** 证据链接 */
    evidenceLinks?: EvidenceLink[];
}

// 搜索结果类型
export interface SearchResult {
    query: string;
    timestamp: string;
    candidates: Candidate[];
    /** 按桶分组后的候选项 */
    buckets: {
        ready_to_use: Candidate[];
        self_hosted: Candidate[];
        integratable: Candidate[];
    };
    /** 有注意事项的候选项 */
    cautions: Candidate[];
}
