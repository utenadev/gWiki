/**
 * Admin page for broken links (links to non-existent pages)
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { WikiPage } from '../types';

interface BrokenLink {
    sourcePage: WikiPage;
    missingPageTitle: string;
}

export function BrokenLinksAdmin() {
    const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        findBrokenLinks();
    }, []);

    const findBrokenLinks = async () => {
        try {
            setLoading(true);
            const allPages = await api.getAllPages();
            const broken: BrokenLink[] = [];

            for (const page of allPages) {
                // Find all wiki links in the content
                const wikiLinkPattern = /\[([^\]]+)\](?!\()/g;
                const matches = [...page.content.matchAll(wikiLinkPattern)];

                for (const match of matches) {
                    const linkedPageTitle = match[1];
                    // Check if the linked page exists
                    const linkedPage = await api.getPageByTitle(linkedPageTitle);
                    if (!linkedPage) {
                        broken.push({
                            sourcePage: page,
                            missingPageTitle: linkedPageTitle,
                        });
                    }
                }
            }

            setBrokenLinks(broken);
        } catch (err) {
            console.error('Failed to find broken links:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-12">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">リンク切れを検索中...</p>
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
                    <h1 className="text-4xl font-bold text-white mb-2">🔗 リンク切れ</h1>
                    <p className="text-white/80">
                        存在しないページへのリンクの一覧です
                    </p>
                </div>

                {brokenLinks.length === 0 ? (
                    <div className="card text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                            リンク切れはありません
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            すべてのWikiリンクが正常です!
                        </p>
                    </div>
                ) : (
                    <div className="card">
                        <div className="mb-4 text-gray-600 dark:text-gray-400">
                            {brokenLinks.length}件のリンク切れが見つかりました
                        </div>
                        <div className="space-y-4">
                            {brokenLinks.map((broken, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                リンク元:
                                            </div>
                                            <Link
                                                to={`/page/${broken.sourcePage.id}`}
                                                className="text-lg font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                            >
                                                {broken.sourcePage.title}
                                            </Link>
                                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                存在しないページ: <span className="font-mono text-red-600 dark:text-red-400">[{broken.missingPageTitle}]</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/new?title=${encodeURIComponent(broken.missingPageTitle)}`}
                                            className="btn-primary text-sm ml-4"
                                        >
                                            ページを作成
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
