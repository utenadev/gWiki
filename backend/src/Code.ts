/**
 * Main entry point for Google Apps Script
 * This file aggregates all functionality
 */

// Import all functions (in GAS, these will be available globally)
// Note: GAS doesn't support ES6 imports, so we use triple-slash references

/// <reference path="./db.ts" />
/// <reference path="./api.ts" />

/**
 * Test function to verify the setup
 */
function test() {
    Logger.log('gWiki3 Backend is running!');

    // Test database operations
    const testPage = createPage('Test Page', '# Hello World\n\nThis is a test page.');
    Logger.log('Created page:', testPage);

    const allPages = getAllPages();
    Logger.log('All pages:', allPages);
}

/**
 * Initialize the spreadsheet
 */
function initialize() {
    const ss = getSpreadsheet();
    Logger.log('Spreadsheet initialized:', ss.getUrl());
    return ss.getUrl();
}
