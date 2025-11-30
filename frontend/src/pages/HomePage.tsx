/**
 * Home page displaying all wiki pages
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { api } from '../api';
import type { WikiPage } from '../types';

export function HomePage() {
    const [pages, setPages] = useState<WikiPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getAllPages();
            setPages(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    const filteredPages = pages.filter(page => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            page.title.toLowerCase().includes(query) ||
            page.content.toLowerCase().includes(query) ||
            page.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading pages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card max-w-md text-center">
                    <p className="text-red-600 text-xl mb-4">❌ {error}</p>
                    <button onClick={loadPages} className="btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="mb-12 text-center animate-fade-in">
                <h1 className="text-5xl font-bold text-white mb-4">
                    Welcome to gWiki<span className="text-purple-300">3</span>
                </h1>
                <p className="text-xl text-white/80">
                    {searchQuery
                        ? `Search results for "${searchQuery}"`
                        : 'A modern wiki powered by Google Apps Script'
                    }
                </p>
            </div>

            {filteredPages.length === 0 ? (
                <div className="card max-w-2xl mx-auto text-center">
                    <div className="text-6xl mb-4">
                        {searchQuery ? '🔍' : '📝'}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {searchQuery ? 'No matching pages found' : 'No pages yet'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {searchQuery
                            ? `We couldn't find any pages matching "${searchQuery}"`
                            : 'Get started by creating your first wiki page!'
                        }
                    </p>
                    <a href="/new" className="btn-primary inline-block">
                        ✨ Create New Page
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPages.map((page) => (
                        <PageCard key={page.id} page={page} />
                    ))}
                </div>
            )}
        </div>
    );
}
