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

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AppConfig {
    gasApiUrl: string;
}
