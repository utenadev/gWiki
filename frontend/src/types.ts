/**
 * Type definitions for the application
 */

export interface WikiPage {
    id: string;
    title: string;
    content: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface AppConfig {
    gasApiUrl: string;
}
