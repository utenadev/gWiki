/**
 * API client for communicating with GAS backend
 */

import type { WikiPage, ApiResponse } from './types';

// For development, use mock data
const USE_MOCK = true;

// Mock data for development
const mockPages: WikiPage[] = [
    {
        id: '1',
        title: 'gWiki3へようこそ',
        content: '# gWiki3へようこそ\n\n**Google Apps Script**と**Google Spreadsheet**で動作する、モダンなWikiアプリケーションです。\n\n## 機能\n\n- 📝 Markdownでページを作成・編集\n- 🎨 Tailwind CSSによる美しいモダンUI\n- ⚡ 高速でレスポンシブ\n- 🔒 Googleアカウントによる安全な認証\n- 🔗 Wikiリンク - [ページタイトル] で他のページにリンク\n\n## はじめに\n\n「新規ページ」ボタンをクリックして、最初のWikiページを作成しましょう！\n\n書式のヒントは [Markdown ガイド] を、実例は [テストページ] をご覧ください。\n\nまだ存在しないページ（例: [未作成ページ]）へのリンクも作成できます。赤色で表示されます。',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Markdown ガイド',
        content: '# Markdown ガイド\n\n## 見出し\n\n# 見出し1\n## 見出し2\n### 見出し3\n\n## 強調\n\n*斜体* または _斜体_\n**太字** または __太字__\n\n## リスト\n\n- 項目 1\n- 項目 2\n  - ネストした項目\n\n1. 最初\n2. 次\n\n## コード\n\nインライン `コード` はバッククォートで囲みます。\n\n```javascript\nconst hello = \"world\";\nconsole.log(hello);\n```\n\n## リンク\n\n[リンクテキスト](https://example.com)\n\n## 引用\n\n> これは引用です。\n\n## Wikiリンク\n\n[ページタイトル] という記法で、他のWikiページにリンクできます。\n\n例: [gWiki3へようこそ] や [テストページ]',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'テストページ',
        content: '# テストページ\n\nWikiリンク機能を実演するためのテストページです。\n\n## このページについて\n\nこのページはWikiリンク機能をテストするために作成されました。他のページから [テストページ] という記法でこのページにリンクできます。\n\n## 関連ページ\n\n- [gWiki3へようこそ] - メインのウェルカムページ\n- [Markdown ガイド] - Markdown記法について学ぶ\n\nWikiリンクを使うと、関連するコンテンツを簡単に結びつけることができます！',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

class WikiApi {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Get all pages
     */
    async getAllPages(): Promise<WikiPage[]> {
        if (USE_MOCK) {
            return Promise.resolve(mockPages);
        }

        const response = await fetch(`${this.baseUrl}?path=pages`);
        const data: ApiResponse<WikiPage[]> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch pages');
        }

        return data.data || [];
    }

    /**
     * Get a page by ID
     */
    async getPageById(id: string): Promise<WikiPage | null> {
        if (USE_MOCK) {
            return Promise.resolve(mockPages.find(p => p.id === id) || null);
        }

        const response = await fetch(`${this.baseUrl}?path=page&id=${id}`);
        const data: ApiResponse<WikiPage> = await response.json();

        if (!data.success) {
            return null;
        }

        return data.data || null;
    }

    /**
     * Get a page by title
     */
    async getPageByTitle(title: string): Promise<WikiPage | null> {
        if (USE_MOCK) {
            return Promise.resolve(mockPages.find(p => p.title === title) || null);
        }

        // For real API, we'll get all pages and filter
        // In production, you might want to add a dedicated endpoint
        const pages = await this.getAllPages();
        return pages.find(p => p.title === title) || null;
    }

    /**
     * Create a new page
     */
    async createPage(title: string, content: string): Promise<WikiPage> {
        if (USE_MOCK) {
            const newPage: WikiPage = {
                id: String(mockPages.length + 1),
                title,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockPages.push(newPage);
            return Promise.resolve(newPage);
        }

        const response = await fetch(`${this.baseUrl}?path=create`, {
            method: 'POST',
            body: JSON.stringify({ title, content }),
        });
        const data: ApiResponse<WikiPage> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to create page');
        }

        return data.data!;
    }

    /**
     * Update an existing page
     */
    async updatePage(id: string, title: string, content: string): Promise<WikiPage> {
        if (USE_MOCK) {
            const index = mockPages.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Page not found');
            }
            mockPages[index] = {
                ...mockPages[index],
                title,
                content,
                updatedAt: new Date().toISOString(),
            };
            return Promise.resolve(mockPages[index]);
        }

        const response = await fetch(`${this.baseUrl}?path=update`, {
            method: 'POST',
            body: JSON.stringify({ id, title, content }),
        });
        const data: ApiResponse<WikiPage> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to update page');
        }

        return data.data!;
    }

    /**
     * Delete a page
     */
    async deletePage(id: string): Promise<boolean> {
        if (USE_MOCK) {
            const index = mockPages.findIndex(p => p.id === id);
            if (index === -1) {
                return Promise.resolve(false);
            }
            mockPages.splice(index, 1);
            return Promise.resolve(true);
        }

        const response = await fetch(`${this.baseUrl}?path=delete`, {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        const data: ApiResponse<{ deleted: boolean }> = await response.json();

        return data.success && data.data?.deleted === true;
    }
}

export const api = new WikiApi();
