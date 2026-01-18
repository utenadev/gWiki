/**
 * Main entry point for Google Apps Script
 * This file aggregates all functionality
 */

import { DB } from './db';

const db = new DB();

/**
 * Test function to verify the setup
 */
function test() {
    Logger.log('gWiki3 Backend is running!');

    // Test database operations
    const testPage = db.createPage('Test Page', '# Hello World\n\nThis is a test page.');
    Logger.log('Created page:', testPage);

    const allPages = db.getAllPages();
    Logger.log('All pages:', allPages);
}

/**
 * Initialize the spreadsheet
 */
function initialize() {
    // DB constructor already handles getSpreadsheet and initialization
    Logger.log('Database initialized');
}

// Map functions to global scope for GAS
// @ts-ignore
global.doGet = doGet;
// @ts-ignore
global.doPost = doPost;
// @ts-ignore
global.test = test;
// @ts-ignore
global.initialize = initialize;