/**
 * API client for interacting with the backend
 */

import type { WikiPage, ApiResponse, PageVersion, Peer } from './types';

// For development, use mock data
const USE_MOCK = true;

// Mock data for development
const mockPeers: Peer[] = [];

const mockPages: WikiPage[] = [
    {
        id: '1',
        title: 'gWikiへようこそ',
        content: '# gWikiへようこそ\n\n**Google Apps Script**と**Google Spreadsheet**で動作する、モダンなWikiアプリケーションです。\n\n## 機能\n\n- 📝 Markdownでページを作成・編集\n- 🎨 Tailwind CSSによる美しいモダンUI\n- ⚡ 高速でレスポンシブ\n- 🔗 Wikiリンク - [ページタイトル] で他のページにリンク\n\n## はじめに\n\n「新規ページ」ボタンをクリックして、最初のWikiページを作成しましょう！\n\n書式のヒントは [Markdown ガイド] を、実例は [テストページ] をご覧ください。',
        tags: ['welcome', 'guide', 'introduction'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Markdown ガイド',
        content: '# Markdown ガイド\n\n## 見出し\n\n# 見出し1\n## 見出し2\n### 見出し3\n\n## 強調\n\n*斜体* または _斜体_\n**太字** または __太字__\n\n## Wikiリンク\n\n[ページタイトル] という記法で、他のWikiページにリンクできます。\n\n例: [gWikiへようこそ] や [テストページ]',
        tags: ['markdown', 'guide', 'syntax'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'テストページ',
        content: '# テストページ\n\nWikiリンク機能を実演するためのテストページです。\n\n## 関連ページ\n\n- [gWikiへようこそ] - メインのウェルカムページ\n- [Markdown ガイド] - Markdown記法について学ぶ',
        tags: ['test', 'demo', 'wiki-link'],
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
     * Get all pages (alias for getAllPages)
     */
    async getPages(): Promise<WikiPage[]> {
        return this.getAllPages();
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
     * Get a page by ID (alias for getPageById)
     */
    async getPage(id: string): Promise<WikiPage> {
        const page = await this.getPageById(id);
        if (!page) {
            throw new Error('Page not found');
        }
        return page;
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
        const pages = await this.getAllPages();
        return pages.find(p => p.title === title) || null;
    }

    /**
     * Get page versions
     */
    async getPageVersions(id: string): Promise<WikiPage[]> {
        if (USE_MOCK) {
            const page = mockPages.find(p => p.id === id);
            if (!page || !page.versions) {
                return Promise.resolve([]);
            }

            // Return version history as array of pages
            return Promise.resolve(
                page.versions.map((v) => ({
                    id,
                    title: page.title,
                    content: v.content,
                    createdAt: v.updatedAt,
                    updatedAt: v.updatedAt,
                    tags: page.tags,
                }))
            );
        }

        // For real API
        const response = await fetch(`${this.baseUrl}?path=page_versions&id=${id}`);
        const data: ApiResponse<WikiPage[]> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get page versions');
        }

        return data.data || [];
    }

    /**
     * Create a new page
     */
    async createPage(title: string, content: string, tags: string[] = []): Promise<WikiPage> {
        if (USE_MOCK) {
            const newPage: WikiPage = {
                id: String(mockPages.length + 1),
                title,
                content,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockPages.push(newPage);
            return Promise.resolve(newPage);
        }

        const response = await fetch(`${this.baseUrl}?path=create`, {
            method: 'POST',
            body: JSON.stringify({ title, content, tags }),
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
    async updatePage(id: string, title: string, content: string, tags: string[] = []): Promise<WikiPage> {
        if (USE_MOCK) {
            const index = mockPages.findIndex(p => p.id === id);
            if (index === -1) {
                throw new Error('Page not found');
            }

            const currentPage = mockPages[index];
            const versions = currentPage.versions || [];

            // Add current version to history before updating
            const newVersion: PageVersion = {
                versionNumber: versions.length + 1,
                content: currentPage.content,
                updatedAt: currentPage.updatedAt,
            };

            // Keep only the last 5 versions
            const updatedVersions = [newVersion, ...versions].slice(0, 5);

            mockPages[index] = {
                ...currentPage,
                title,
                content,
                tags,
                updatedAt: new Date().toISOString(),
                versions: updatedVersions,
            };
            return Promise.resolve(mockPages[index]);
        }

        const response = await fetch(`${this.baseUrl}?path=update`, {
            method: 'POST',
            body: JSON.stringify({ id, title, content, tags }),
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

    /**
     * Get backlinks for a page (pages that link to this page)
     */
    async getBacklinks(pageTitle: string): Promise<WikiPage[]> {
        if (USE_MOCK) {
            // Find all pages that contain a wiki link to the given page title
            const backlinks = mockPages.filter(page => {
                const wikiLinkPattern = /\[([^\]]+)\](?!\()/g;
                const matches = [...page.content.matchAll(wikiLinkPattern)];
                return matches.some(match => match[1] === pageTitle);
            });
            return Promise.resolve(backlinks);
        }

        const response = await fetch(`${this.baseUrl}?path=backlinks&title=${encodeURIComponent(pageTitle)}`);
        const data: ApiResponse<WikiPage[]> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get backlinks');
        }

        return data.data || [];
    }

    /**
     * Get broken links
     */
    async getBrokenLinks(): Promise<Array<{ page: WikiPage; brokenLinks: string[] }>> {
        if (USE_MOCK) {
            const broken: Array<{ page: WikiPage; brokenLinks: string[] }> = [];

            for (const page of mockPages) {
                const wikiLinkPattern = /\[([^\]]+)\](?!\()/g;
                const matches = [...page.content.matchAll(wikiLinkPattern)];
                const missing: string[] = [];

                for (const match of matches) {
                    const linkedPageTitle = match[1];
                    const linkedPage = await this.getPageByTitle(linkedPageTitle);
                    if (!linkedPage) {
                        missing.push(linkedPageTitle);
                    }
                }

                if (missing.length > 0) {
                    broken.push({ page, brokenLinks: missing });
                }
            }

            return Promise.resolve(broken);
        }

        const response = await fetch(`${this.baseUrl}?path=broken_links`);
        const data: ApiResponse<Array<{ page: WikiPage; brokenLinks: string[] }>> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get broken links');
        }

        return data.data || [];
    }

    /**
     * Get orphaned pages
     */
    async getOrphanedPages(): Promise<WikiPage[]> {
        if (USE_MOCK) {
            // Find all pages that are not linked to by any other page
            const orphaned: WikiPage[] = [];

            for (const page of mockPages) {
                const hasBacklinks = await this.hasBacklinks(page.title);
                if (!hasBacklinks) {
                    orphaned.push(page);
                }
            }

            return Promise.resolve(orphaned);
        }

        const response = await fetch(`${this.baseUrl}?path=orphaned_pages`);
        const data: ApiResponse<WikiPage[]> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get orphaned pages');
        }

        return data.data || [];
    }

    /**
     * Check if a page has backlinks
     */
    private async hasBacklinks(pageTitle: string): Promise<boolean> {
        const backlinks = await this.getBacklinks(pageTitle);
        return backlinks.length > 0;
    }

    /**
     * Get stats
     */
    async getStats(): Promise<{
        totalPages: number;
        totalLinks: number;
        totalTags: number;
        brokenLinks: number;
        orphanedPages: number;
    }> {
        if (USE_MOCK) {
            const pages = await this.getPages();
            const broken = await this.getBrokenLinks();
            const orphaned = await this.getOrphanedPages();

            // Count total links
            let totalLinks = 0;
            for (const page of pages) {
                const wikiLinkPattern = /\[([^\]]+)\](?!\()/g;
                const matches = page.content.match(wikiLinkPattern);
                totalLinks += matches ? matches.length : 0;
            }

            // Count total unique tags
            const allTags = new Set<string>();
            for (const page of pages) {
                if (page.tags) {
                    page.tags.forEach(tag => allTags.add(tag));
                }
            }

            return Promise.resolve({
                totalPages: pages.length,
                totalLinks,
                totalTags: allTags.size,
                brokenLinks: broken.length,
                orphanedPages: orphaned.length,
            });
        }

        const response = await fetch(`${this.baseUrl}?path=stats`);
        const data: ApiResponse<{
            totalPages: number;
            totalLinks: number;
            totalTags: number;
            brokenLinks: number;
            orphanedPages: number;
        }> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get stats');
        }

        return data.data || {
            totalPages: 0,
            totalLinks: 0,
            totalTags: 0,
            brokenLinks: 0,
            orphanedPages: 0,
        };
    }

    /**
     * Get all peers
     */
    async getPeers(): Promise<Peer[]> {
        if (USE_MOCK) {
            return Promise.resolve(mockPeers);
        }

        const response = await fetch(`${this.baseUrl}?path=peers`);
        const data: ApiResponse<Peer[]> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to get peers');
        }

        return data.data || [];
    }

    /**
     * Add a new peer
     */
    async addPeer(url: string, name: string): Promise<Peer> {
        if (USE_MOCK) {
            const newPeer: Peer = {
                id: String(mockPeers.length + 1),
                url,
                name,
                isActive: true,
                lastSyncedAt: new Date().toISOString(),
            };
            mockPeers.push(newPeer);
            return Promise.resolve(newPeer);
        }

        const response = await fetch(`${this.baseUrl}?path=add_peer`, {
            method: 'POST',
            body: JSON.stringify({ url, name }),
        });
        const data: ApiResponse<Peer> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to add peer');
        }

        return data.data!;
    }

    /**
     * Remove a peer
     */
    async removePeer(id: string): Promise<boolean> {
        if (USE_MOCK) {
            const index = mockPeers.findIndex(p => p.id === id);
            if (index === -1) {
                return Promise.resolve(false);
            }
            mockPeers.splice(index, 1);
            return Promise.resolve(true);
        }

        const response = await fetch(`${this.baseUrl}?path=remove_peer`, {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        const data: ApiResponse<{ removed: boolean }> = await response.json();

        return data.success && data.data?.removed === true;
    }
}

export const api = new WikiApi();
