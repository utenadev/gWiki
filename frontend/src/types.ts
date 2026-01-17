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
}

// Alias for WikiPage for convenience
export type Page = WikiPage;

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
