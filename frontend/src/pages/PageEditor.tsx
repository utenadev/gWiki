/**
 * Page editor component for creating and editing wiki pages
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import type { WikiPage } from '../types';

export function PageEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEditMode = Boolean(id);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (id) {
            loadPage(id);
        } else {
            const titleParam = searchParams.get('title');
            if (titleParam) {
                setTitle(titleParam);
            }
        }
    }, [id, searchParams]);

    const loadPage = async (pageId: string) => {
        try {
            setLoading(true);
            const page = await api.getPageById(pageId);
            if (page) {
                setTitle(page.title);
                setContent(page.content);
            }
        } catch (err) {
            alert('Failed to load page: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            alert('Please enter both title and content');
            return;
        }

        try {
            setSaving(true);
            let savedPage: WikiPage;

            if (isEditMode && id) {
                savedPage = await api.updatePage(id, title, content);
            } else {
                savedPage = await api.createPage(title, content);
            }

            navigate(`/page/${savedPage.id}`);
        } catch (err) {
            alert('Failed to save page: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">
                        {isEditMode ? '✏️ Edit Page' : '✨ New Page'}
                    </h1>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="btn-secondary"
                        >
                            {showPreview ? '📝 Edit' : '👁️ Preview'}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50"
                        >
                            {saving ? '💾 Saving...' : '💾 Save'}
                        </button>
                    </div>
                </div>

                <div className="card animate-fade-in">
                    {!showPreview ? (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter page title..."
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-300 text-lg font-semibold"
                                />
                            </div>

                            <div>
                                <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Content (Markdown)
                                </label>
                                <textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Enter page content in Markdown format..."
                                    rows={20}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-300 font-mono text-sm resize-y"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>💡 Tip:</strong> You can use Markdown syntax for formatting.
                                    Click the Preview button to see how your content will look.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                                {title || 'Untitled Page'}
                            </h2>
                            <div className="markdown-content">
                                <ReactMarkdown>{content || '*No content yet*'}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
