/**
 * Admin page for wiki statistics
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { WikiPage } from '../types';

interface Stats {
    totalPages: number;
    totalTags: number;
    avgPageLength: number;
    mostLinkedPages: { page: WikiPage; linkCount: number }[];
    recentlyUpdated: WikiPage[];
}

export function StatsAdmin() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        try {
            setLoading(true);
            const allPages = await api.getAllPages();

            // Calculate total tags
            const allTags = new Set(allPages.flatMap(p => p.tags || []));

            // Calculate average page length
            const totalLength = allPages.reduce((sum, p) => sum + p.content.length, 0);
            const avgLength = Math.round(totalLength / allPages.length);

            // Find most linked pages
            const linkCounts: Map<string, number> = new Map();
            for (const page of allPages) {
                const backlinks = await api.getBacklinks(page.title);
                linkCounts.set(page.id, backlinks.length);
            }

            const mostLinked = allPages
                .map(page => ({ page, linkCount: linkCounts.get(page.id) || 0 }))
                .sort((a, b) => b.linkCount - a.linkCount)
                .slice(0, 5);

            // Get recently updated
            const recentlyUpdated = [...allPages]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5);

            setStats({
                totalPages: allPages.length,
                totalTags: allTags.size,
                avgPageLength: avgLength,
                mostLinkedPages: mostLinked,
                recentlyUpdated,
            });
        } catch (err) {
            console.error('Failed to calculate stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-12">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">統計情報を計算中...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to="/" className="btn-secondary inline-block mb-4">
                        ← ホームに戻る
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2">📊 統計情報</h1>
                    <p className="text-white/80">
                        Wikiの統計データと分析
                    </p>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="card text-center">
                        <div className="text-5xl mb-2">📄</div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.totalPages}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                            総ページ数
                        </div>
                    </div>

                    <div className="card text-center">
                        <div className="text-5xl mb-2">🏷️</div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.totalTags}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                            タグ数
                        </div>
                    </div>

                    <div className="card text-center">
                        <div className="text-5xl mb-2">📏</div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.avgPageLength}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                            平均文字数
                        </div>
                    </div>
                </div>

                {/* Most Linked Pages */}
                <div className="card mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        🔗 最も参照されているページ
                    </h2>
                    <div className="space-y-3">
                        {stats.mostLinkedPages.map(({ page, linkCount }) => (
                            <div
                                key={page.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                                <Link
                                    to={`/page/${page.id}`}
                                    className="text-lg font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    {page.title}
                                </Link>
                                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-semibold">
                                    {linkCount} リンク
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recently Updated */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        ⏰ 最近更新されたページ
                    </h2>
                    <div className="space-y-3">
                        {stats.recentlyUpdated.map((page) => (
                            <div
                                key={page.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                                <Link
                                    to={`/page/${page.id}`}
                                    className="text-lg font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    {page.title}
                                </Link>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(page.updatedAt).toLocaleDateString('ja-JP', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
