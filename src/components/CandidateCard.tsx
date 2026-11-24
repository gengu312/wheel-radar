'use client';

import { Candidate, BUCKET_LABELS, SOURCE_LABELS } from '@/types/candidate';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CandidateCardProps {
    candidate: Candidate;
    onAnalyze?: (candidate: Candidate) => void;
}

export function CandidateCard({ candidate, onAnalyze }: CandidateCardProps) {
    const { t, locale } = useI18n();

    // 格式化更新时间
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (days === 0) return locale === 'zh' ? '今天' : 'Today';
        if (days === 1) return locale === 'zh' ? '昨天' : 'Yesterday';
        if (days < 30) return locale === 'zh' ? `${days} 天前` : `${days} days ago`;
        if (days < 365) {
            const months = Math.floor(days / 30);
            return locale === 'zh' ? `${months} 个月前` : `${months} months ago`;
        }
        const years = Math.floor(days / 365);
        return locale === 'zh' ? `${years} 年前` : `${years} years ago`;
    };

    // 评分颜色
    const getScoreColor = (score?: number) => {
        if (!score) return 'text-muted-foreground';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">
                            <a
                                href={candidate.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                            >
                                {candidate.name}
                            </a>
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                            <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                {SOURCE_LABELS[candidate.source]}
                            </span>
                            <span className="px-1.5 py-0.5 bg-primary/10 rounded text-primary">
                                {BUCKET_LABELS[candidate.bucket][locale]}
                            </span>
                        </CardDescription>
                    </div>
                    {(candidate.wheelScore || candidate.toolScore) && (
                        <div className={`text-lg font-bold ${getScoreColor(candidate.wheelScore || candidate.toolScore)}`}>
                            {candidate.wheelScore || candidate.toolScore}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {candidate.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {candidate.description}
                    </p>
                )}

                {/* 理由标签 */}
                {candidate.reasons && candidate.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.reasons.map((reason, i) => (
                            <span
                                key={i}
                                className="text-xs px-1.5 py-0.5 bg-muted rounded"
                            >
                                {reason}
                            </span>
                        ))}
                    </div>
                )}

                {/* 注意事项 */}
                {candidate.cautionFlags && candidate.cautionFlags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {candidate.cautionFlags.map((flag) => (
                            <span
                                key={flag}
                                className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded"
                            >
                                {t(`cautions.${flag}`)}
                            </span>
                        ))}
                    </div>
                )}

                {/* 底部信息 */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                        {formatDate(candidate.lastUpdatedAt)}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAnalyze?.(candidate)}
                    >
                        {locale === 'zh' ? '🔍 深度分析' : '🔍 Analyze'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
