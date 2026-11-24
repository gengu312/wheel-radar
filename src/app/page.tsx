'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CandidateCard } from '@/components/CandidateCard';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import type { Candidate, CandidateBucket } from '@/types/candidate';
import type { SearchResponse } from './api/search/route';

export default function Home() {
  const { t, locale, setLocale } = useI18n();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExportMarkdown = () => {
    if (!results) return;

    const allCandidates = [
      ...results.buckets.ready_to_use,
      ...results.buckets.self_hosted,
      ...results.buckets.integratable,
    ];

    const markdown = generateMarkdown(results.query, allCandidates, results.cautions, locale);

    // 下载文件
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wheelradar-${results.query.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderBucket = (bucket: CandidateBucket | 'cautions') => {
    if (!results) return null;

    const candidates =
      bucket === 'cautions' ? results.cautions : results.buckets[bucket];

    if (candidates.length === 0) {
      return (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-center text-muted-foreground">
              {t('common.noResults')}
            </CardTitle>
            <CardDescription className="text-center">
              {locale === 'zh'
                ? '该分类下暂无结果'
                : 'No results in this category'}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return candidates.map((candidate) => (
      <CandidateCard
        key={candidate.canonicalId}
        candidate={candidate}
        onAnalyze={setSelectedCandidate}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-lg font-bold">{t('nav.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('nav.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {results && (
              <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
                📄 {t('common.exportMarkdown')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={toggleLocale}>
              {locale === 'zh' ? 'EN' : '中文'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <section className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            {locale === 'zh' ? '发现最适合的工具和轮子' : 'Discover the Best Tools & Wheels'}
          </h2>
          <p className="mb-8 text-muted-foreground">
            {locale === 'zh'
              ? '输入你的需求，我们帮你搜索、评估、对比，避免重复造轮子'
              : 'Describe your needs, we search, evaluate, and compare for you'}
          </p>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.search')}
            </Button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </section>

        {/* Results Section */}
        <section className="mt-12">
          <Tabs defaultValue="ready_to_use" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ready_to_use">
                {t('buckets.ready_to_use')}
                {results && ` (${results.buckets.ready_to_use.length})`}
              </TabsTrigger>
              <TabsTrigger value="self_hosted">
                {t('buckets.self_hosted')}
                {results && ` (${results.buckets.self_hosted.length})`}
              </TabsTrigger>
              <TabsTrigger value="integratable">
                {t('buckets.integratable')}
                {results && ` (${results.buckets.integratable.length})`}
              </TabsTrigger>
              <TabsTrigger value="cautions">
                {t('buckets.cautions')}
                {results && ` (${results.cautions.length})`}
              </TabsTrigger>
            </TabsList>

            {(['ready_to_use', 'self_hosted', 'integratable', 'cautions'] as const).map(
              (bucket) => (
                <TabsContent key={bucket} value={bucket}>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                      // Skeleton loading state
                      Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                          <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="mt-2 h-4 w-1/2" />
                          </CardHeader>
                          <div className="p-4 pt-0">
                            <Skeleton className="h-16 w-full" />
                          </div>
                        </Card>
                      ))
                    ) : results ? (
                      renderBucket(bucket)
                    ) : (
                      <Card className="col-span-full">
                        <CardHeader>
                          <CardTitle className="text-center text-muted-foreground">
                            {t('common.noResults')}
                          </CardTitle>
                          <CardDescription className="text-center">
                            {locale === 'zh'
                              ? '输入需求开始搜索，例如："PDF 转 Markdown"'
                              : 'Enter a query to search, e.g., "PDF to Markdown"'}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )
            )}
          </Tabs>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            WheelRadar © 2026 -{' '}
            {locale === 'zh' ? '找工具，不造轮子' : 'Find tools, not rebuild wheels'}
          </p>
        </div>
      </footer>

      {/* Analysis Panel */}
      <AnalysisPanel
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}

// Markdown 导出生成器
function generateMarkdown(
  query: string,
  candidates: Candidate[],
  cautions: Candidate[],
  locale: 'zh' | 'en'
): string {
  const title = locale === 'zh' ? 'WheelRadar 选型报告' : 'WheelRadar Selection Report';
  const queryLabel = locale === 'zh' ? '需求' : 'Query';
  const resultsLabel = locale === 'zh' ? '搜索结果' : 'Results';
  const cautionsLabel = locale === 'zh' ? '注意事项' : 'Cautions';

  let md = `# ${title}\n\n`;
  md += `## ${queryLabel}\n\n${query}\n\n`;

  // 结果表格
  md += `## ${resultsLabel}\n\n`;
  md += `| ${locale === 'zh' ? '项目' : 'Project'} | ${locale === 'zh' ? '分桶' : 'Bucket'} | ${locale === 'zh' ? '评分' : 'Score'} | ${locale === 'zh' ? '许可证' : 'License'} | ${locale === 'zh' ? '链接' : 'Link'} |\n`;
  md += `|---|---|---:|---|---|\n`;

  for (const c of candidates.slice(0, 10)) {
    const bucket =
      c.bucket === 'ready_to_use'
        ? locale === 'zh'
          ? '直接可用'
          : 'Ready'
        : c.bucket === 'self_hosted'
          ? locale === 'zh'
            ? '自部署'
            : 'Self-hosted'
          : locale === 'zh'
            ? '可集成'
            : 'Integratable';
    md += `| ${c.name} | ${bucket} | ${c.wheelScore || '-'} | ${c.licenseSpdx || '-'} | [→](${c.url}) |\n`;
  }

  // 注意事项
  if (cautions.length > 0) {
    md += `\n## ${cautionsLabel}\n\n`;
    for (const c of cautions.slice(0, 5)) {
      md += `- **${c.name}**: ${c.cautionFlags?.join(', ')}\n`;
    }
  }

  md += `\n---\n\n${locale === 'zh' ? '由 WheelRadar 生成' : 'Generated by WheelRadar'} | ${new Date().toISOString().split('T')[0]}\n`;

  return md;
}
