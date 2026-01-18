/**
 * Type definitions for the application
 */

export interface PageVersion {
    versionNumber: number;
    content: string;
    updatedAt: string;
    updatedBy?: string;
}

export interface WikiPage {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    versions?: PageVersion[];
    origin?: string;
    author?: string;
}

// Alias for WikiPage for convenience
export type Page = WikiPage;

export interface Peer {
    id: string;
    url: string;
    name: string;
    isActive: boolean;
    lastSyncedAt?: string;
}

export interface ExternalWiki {
    wikiId: string;
    title: string;
    description: string;
    accessUrl: string;
    registeredAt: string;
    updatedAt: string;
    tags: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ApiError extends Error {
    message: string;
}

export interface AppConfig {
    gasApiUrl: string;
}
