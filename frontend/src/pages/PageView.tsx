/**
 * Page view component for displaying a single wiki page
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { WikiContent } from '../components/WikiContent';
import { api } from '../api';
import type { WikiPage } from '../types';

export function PageView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [page, setPage] = useState<WikiPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            loadPage(id);
        }
    }, [id]);

    const loadPage = async (pageId: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getPageById(pageId);
            if (data) {
                setPage(data);
            } else {
                setError('Page not found');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load page');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!page || !confirm(`Are you sure you want to delete "${page.title}"?`)) {
            return;
        }

        try {
            setDeleting(true);
            await api.deletePage(page.id);
            navigate('/');
        } catch (err) {
            alert('Failed to delete page: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading page...</p>
                </div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card max-w-md text-center">
                    <p className="text-red-600 text-xl mb-4">❌ {error || 'Page not found'}</p>
                    <Link to="/" className="btn-primary inline-block">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="btn-secondary">
                        ← Back
                    </Link>
                    <div className="flex items-center space-x-3">
                        <Link to={`/edit/${page.id}`} className="btn-secondary">
                            ✏️ Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-6 py-3 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-all duration-300 disabled:opacity-50"
                        >
                            {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
                        </button>
                    </div>
                </div>

                <div className="card animate-fade-in">
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">
                            {page.title}
                        </h1>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                            <span className="flex items-center space-x-1">
                                <span>📅</span>
                                <span>作成: {formatDate(page.createdAt)}</span>
                            </span>
                            {page.updatedAt !== page.createdAt && (
                                <span className="flex items-center space-x-1">
                                    <span>✏️</span>
                                    <span>更新: {formatDate(page.updatedAt)}</span>
                                </span>
                            )}
                        </div>

                        {page.tags && page.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {page.tags.map((tag, index) => (
                                    <Link
                                        key={index}
                                        to={`/?search=${encodeURIComponent(tag)}`}
                                        className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <WikiContent content={page.content} />
                </div>
            </div>
        </div>
    );
}
