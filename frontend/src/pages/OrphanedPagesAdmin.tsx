/**
 * Admin page for orphaned pages (pages with no incoming links)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { WikiPage } from '../types';

export function OrphanedPagesAdmin() {
    const [orphanedPages, setOrphanedPages] = useState<WikiPage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        findOrphanedPages();
    }, []);

    const findOrphanedPages = async () => {
        try {
            setLoading(true);
            const allPages = await api.getAllPages();

            // Find pages that have no backlinks
            const orphaned: WikiPage[] = [];
            for (const page of allPages) {
                const backlinks = await api.getBacklinks(page.title);
                if (backlinks.length === 0) {
                    orphaned.push(page);
                }
            }

            setOrphanedPages(orphaned);
        } catch (err) {
            console.error('Failed to find orphaned pages:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-12">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">孤立ページを検索中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link to="/" className="btn-secondary inline-block mb-4">
                        ← ホームに戻る
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2">🔍 孤立ページ</h1>
                    <p className="text-white/80">
                        他のページからリンクされていないページの一覧です
                    </p>
                </div>

                {orphanedPages.length === 0 ? (
                    <div className="card text-center">
                        <div className="text-6xl mb-4">✨</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                            孤立ページはありません
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            すべてのページが他のページからリンクされています!
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        <div className="mb-4 text-gray-600 dark:text-gray-400">
                            {orphanedPages.length}件の孤立ページが見つかりました
                        </div>
                        <div className="space-y-3">
                            {orphanedPages.map((page) => (
                                <div
                                    key={page.id}
                                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Link
                                        to={`/page/${page.id}`}
                                        className="text-lg font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                    >
                                        {page.title}
                                    </Link>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        最終更新: {new Date(page.updatedAt).toLocaleDateString('ja-JP')}
                                    </div>
                                    {page.tags && page.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {page.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
