'use client';

import { useCompletion } from '@ai-sdk/react';
import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Candidate } from '@/types/candidate';

interface AnalysisPanelProps {
    candidate: Candidate | null;
    onClose: () => void;
}

export function AnalysisPanel({ candidate, onClose }: AnalysisPanelProps) {
    const { locale } = useI18n();

    const { completion, isLoading, complete, error } = useCompletion({
        api: '/api/analyze',
    });

    // 当候选项变化时触发分析
    useEffect(() => {
        if (candidate) {
            complete('', {
                body: {
                    canonicalId: candidate.canonicalId,
                    language: locale,
                },
            });
        }
    }, [candidate, locale, complete]);

    if (!candidate) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 right-0 w-full max-w-2xl border-l bg-background shadow-lg overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
                    <h2 className="text-lg font-semibold">
                        {locale === 'zh' ? '深度分析' : 'Deep Analysis'}: {candidate.name}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                <div className="p-4">
                    {/* 基本信息卡片 */}
                    <Card className="mb-4">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{candidate.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                                {candidate.description}
                            </p>
                            <div className="flex gap-2">
                                <a
                                    href={candidate.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                >
                                    {locale === 'zh' ? '查看仓库 →' : 'View Repository →'}
                                </a>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI 分析结果 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                🤖 {locale === 'zh' ? 'AI 分析报告' : 'AI Analysis Report'}
                                {isLoading && (
                                    <span className="text-xs text-muted-foreground animate-pulse">
                                        {locale === 'zh' ? '分析中...' : 'Analyzing...'}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="text-red-500 text-sm mb-4">
                                    {locale === 'zh' ? '分析失败: ' : 'Analysis failed: '}
                                    {error.message}
                                </div>
                            )}

                            {isLoading && !completion && (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                    <Skeleton className="h-4 w-3/5" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            )}

                            {completion && (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: completion
                                                .replace(/\n/g, '<br/>')
                                                .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                                                .replace(/##\s+(.+)/g, '<h2>$1</h2>')
                                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/`([^`]+)`/g, '<code>$1</code>')
                                        }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
