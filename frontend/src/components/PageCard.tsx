/**
 * Page card component for displaying wiki pages in a list
 */

import { Link } from 'react-router-dom';
import type { WikiPage } from '../types';

interface PageCardProps {
    page: WikiPage;
}

export function PageCard({ page }: PageCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Extract first paragraph from content
    const getPreview = (content: string) => {
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        return lines[0]?.substring(0, 150) + (lines[0]?.length > 150 ? '...' : '') || '';
    };

    return (
        <Link to={`/page/${page.id}`} className="block">
            <div className="card group animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                        {page.title}
                    </h2>
                    <span className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        →
                    </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                    {getPreview(page.content)}
                </p>

                {page.tags && page.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {page.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
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
                </div>
            </div>
        </Link>
    );
}
