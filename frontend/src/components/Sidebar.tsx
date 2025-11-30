/**
 * Sidebar component for navigation and recent updates
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { WikiPage } from '../types';

export function Sidebar() {
    const [recentPages, setRecentPages] = useState<WikiPage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecentPages();
    }, []);

    const loadRecentPages = async () => {
        try {
            setLoading(true);
            const pages = await api.getAllPages();
            // Sort by updatedAt descending and take top 10
            const sorted = [...pages].sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            setRecentPages(sorted.slice(0, 10));
        } catch (err) {
            console.error('Failed to load recent pages:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'たった今';
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    };

    return (
        <aside className="w-64 flex-shrink-0">
            <div className="sticky top-20 space-y-6">
                {/* Recent Changes */}
                <div className="glass-dark rounded-xl p-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="mr-2">🕒</span>
                        最近の更新
                    </h3>
                    {loading ? (
                        <div className="text-white/60 text-sm">読み込み中...</div>
                    ) : (
                        <div className="space-y-2">
                            {recentPages.map((page) => (
                                <Link
                                    key={page.id}
                                    to={`/page/${page.id}`}
                                    className="block p-2 rounded-lg hover:bg-white/10 transition-colors group"
                                >
                                    <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                                        {page.title}
                                    </div>
                                    <div className="text-xs text-white/60 mt-1">
                                        {formatRelativeTime(page.updatedAt)}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Keywords/Tags Cloud */}
                <div className="glass-dark rounded-xl p-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="mr-2">🏷️</span>
                        タグ
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(recentPages.flatMap(p => p.tags || []))).map((tag) => (
                            <Link
                                key={tag}
                                to={`/?search=${encodeURIComponent(tag)}`}
                                className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/30 text-purple-200 hover:bg-purple-500/50 transition-colors"
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RSS Feed */}
                <div className="glass-dark rounded-xl p-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="mr-2">📡</span>
                        フィード
                    </h3>
                    <div className="space-y-2">
                        <a
                            href="/api/feed/rss"
                            className="flex items-center text-sm text-white/80 hover:text-white transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className="mr-2">📰</span>
                            RSS Feed
                        </a>
                        <a
                            href="/api/feed/atom"
                            className="flex items-center text-sm text-white/80 hover:text-white transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className="mr-2">⚛️</span>
                            Atom Feed
                        </a>
                    </div>
                </div>

                {/* Admin/Maintenance */}
                <div className="glass-dark rounded-xl p-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <span className="mr-2">⚙️</span>
                        管理
                    </h3>
                    <div className="space-y-2">
                        <Link
                            to="/admin/orphaned"
                            className="flex items-center text-sm text-white/80 hover:text-white transition-colors"
                        >
                            <span className="mr-2">🔍</span>
                            孤立ページ
                        </Link>
                        <Link
                            to="/admin/broken-links"
                            className="flex items-center text-sm text-white/80 hover:text-white transition-colors"
                        >
                            <span className="mr-2">🔗</span>
                            リンク切れ
                        </Link>
                        <Link
                            to="/admin/stats"
                            className="flex items-center text-sm text-white/80 hover:text-white transition-colors"
                        >
                            <span className="mr-2">📊</span>
                            統計情報
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
