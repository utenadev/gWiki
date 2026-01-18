/**
 * Database operations using Google Spreadsheet
 */

interface WikiPage {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    origin?: string; // URL of the original node (undefined for local)
    author?: string; // Author name
}

interface Peer {
    url: string;
    name: string;
    isActive: boolean;
    lastSyncedAt: string;
}

interface ExternalWiki {
    wikiId: string;
    title: string;
    description: string;
    accessUrl: string;
    registeredAt: string;
    updatedAt: string;
    tags: string;
}

/**
 * Get or create the spreadsheet for wiki data
 */
function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    const scriptProperties = PropertiesService.getScriptProperties();
    let spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');

    if (!spreadsheetId) {
        // Create new spreadsheet
        const ss = SpreadsheetApp.create('gWiki3 Database');
        spreadsheetId = ss.getId();
        scriptProperties.setProperty('SPREADSHEET_ID', spreadsheetId);

        // Initialize Pages sheet
        const sheet = ss.getActiveSheet();
        sheet.setName('Pages');
        sheet.getRange(1, 1, 1, 5).setValues([
            ['ID', 'Title', 'Content', 'Created At', 'Updated At']
        ]);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold');

        // Initialize Peers sheet
        const peersSheet = ss.insertSheet('Peers');
        peersSheet.getRange(1, 1, 1, 4).setValues([
            ['URL', 'Name', 'Is Active', 'Last Synced At']
        ]);
        peersSheet.getRange(1, 1, 1, 4).setFontWeight('bold');

        // Initialize Cache sheet (for external pages)
        const cacheSheet = ss.insertSheet('Cache');
        cacheSheet.getRange(1, 1, 1, 7).setValues([
            ['ID', 'Title', 'Content', 'Created At', 'Updated At', 'Origin', 'Author']
        ]);
        cacheSheet.getRange(1, 1, 1, 7).setFontWeight('bold');

        // Initialize External_Index sheet
        const externalIndexSheet = ss.insertSheet('External_Index');
        externalIndexSheet.getRange(1, 1, 1, 7).setValues([
            ['WikiID', 'Title', 'Description', 'AccessURL', 'Registered At', 'Updated At', 'Tags']
        ]);
        externalIndexSheet.getRange(1, 1, 1, 7).setFontWeight('bold');

        return ss;
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);

    // Ensure sheets exist (migration support)
    if (!ss.getSheetByName('Peers')) {
        const peersSheet = ss.insertSheet('Peers');
        peersSheet.getRange(1, 1, 1, 4).setValues([['URL', 'Name', 'Is Active', 'Last Synced At']]);
        peersSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    if (!ss.getSheetByName('Cache')) {
        const cacheSheet = ss.insertSheet('Cache');
        cacheSheet.getRange(1, 1, 1, 7).setValues([['ID', 'Title', 'Content', 'Created At', 'Updated At', 'Origin', 'Author']]);
        cacheSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    if (!ss.getSheetByName('External_Index')) {
        const externalIndexSheet = ss.insertSheet('External_Index');
        externalIndexSheet.getRange(1, 1, 1, 7).setValues([['WikiID', 'Title', 'Description', 'AccessURL', 'Registered At', 'Updated At', 'Tags']]);
        externalIndexSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }

    return ss;
}

/**
 * Get the Pages sheet
 */
function getPagesSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = getSpreadsheet();
    return ss.getSheetByName('Pages') || ss.getActiveSheet();
}

/**
 * Get the Peers sheet
 */
function getPeersSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = getSpreadsheet();
    return ss.getSheetByName('Peers')!;
}

/**
 * Get the Cache sheet
 */
function getCacheSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = getSpreadsheet();
    return ss.getSheetByName('Cache')!;
}

/**
 * Get the External_Index sheet
 */
function getExternalIndexSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = getSpreadsheet();
    return ss.getSheetByName('External_Index')!;
}

// --- Page Management (Local) ---

/**
 * Get all wiki pages (Local)
 */
function getAllPages(): WikiPage[] {
    const sheet = getPagesSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return [];

    return data.slice(1).map(row => ({
        id: row[0],
        title: row[1],
        content: row[2],
        createdAt: row[3],
        updatedAt: row[4]
    }));
}

/**
 * Get all cached pages (External)
 */
function getAllCachedPages(): WikiPage[] {
    const sheet = getCacheSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return [];

    return data.slice(1).map(row => ({
        id: row[0],
        title: row[1],
        content: row[2],
        createdAt: row[3],
        updatedAt: row[4],
        origin: row[5],
        author: row[6]
    }));
}

/**
 * Get a wiki page by ID
 */
function getPageById(id: string): WikiPage | null {
    const pages = getAllPages();
    return pages.find(p => p.id === id) || null;
}

/**
 * Create a new wiki page
 */
function createPage(title: string, content: string): WikiPage {
    const sheet = getPagesSheet();
    const id = Utilities.getUuid();
    const now = new Date().toISOString();

    const page: WikiPage = {
        id,
        title,
        content,
        createdAt: now,
        updatedAt: now
    };

    sheet.appendRow([id, title, content, now, now]);

    return page;
}

/**
 * Update an existing wiki page
 */
function updatePage(id: string, title: string, content: string): WikiPage | null {
    const sheet = getPagesSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            const now = new Date().toISOString();
            sheet.getRange(i + 1, 2, 1, 4).setValues([[title, content, data[i][3], now]]);

            return {
                id,
                title,
                content,
                createdAt: data[i][3],
                updatedAt: now
            };
        }
    }

    return null;
}

/**
 * Delete a wiki page
 */
function deletePage(id: string): boolean {
    const sheet = getPagesSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 1);
            return true;
        }
    }

    return false;
}

// --- Peer Management ---

function getPeers(): Peer[] {
    const sheet = getPeersSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    return data.slice(1).map(row => ({
        url: row[0],
        name: row[1],
        isActive: row[2],
        lastSyncedAt: row[3]
    }));
}

function addPeer(url: string, name: string): Peer {
    const sheet = getPeersSheet();
    // Check if exists
    const peers = getPeers();
    const existing = peers.find(p => p.url === url);
    if (existing) return existing;

    const now = new Date().toISOString();
    sheet.appendRow([url, name, true, now]);
    return { url, name, isActive: true, lastSyncedAt: now };
}

function removePeer(url: string): boolean {
    const sheet = getPeersSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === url) {
            sheet.deleteRow(i + 1);
            return true;
        }
    }
    return false;
}

// --- Cache Management (Inbox) ---

function upsertCachedPage(page: WikiPage): boolean {
    const sheet = getCacheSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();

    // Check if exists in cache
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === page.id && data[i][5] === page.origin) {
            // Update existing
            sheet.getRange(i + 1, 2, 1, 6).setValues([[
                page.title,
                page.content,
                page.createdAt,
                page.updatedAt,
                page.origin,
                page.author || ''
            ]]);
            return true;
        }
    }

    // Insert new
    sheet.appendRow([
        page.id,
        page.title,
        page.content,
        page.createdAt,
        page.updatedAt,
        page.origin || '',
        page.author || ''
    ]);
    return true;
}

// --- External Index Management ---

/**
 * Get all external indexed wikis
 */
function getExternalIndex(): ExternalWiki[] {
    const sheet = getExternalIndexSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return [];

    return data.slice(1).map(row => ({
        wikiId: row[0],
        title: row[1],
        description: row[2],
        accessUrl: row[3],
        registeredAt: row[4],
        updatedAt: row[5],
        tags: row[6] || ''
    }));
}

/**
 * Register an external wiki in External_Index
 * Returns true if successful, false otherwise
 */
function addExternalWiki(
    wikiId: string,
    title: string,
    description: string,
    accessUrl: string,
    tags: string = ''
): boolean {
    const sheet = getExternalIndexSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date().toISOString();

    if (data.length <= 1) {
        // Empty sheet, just add
        sheet.appendRow([wikiId, title, description, accessUrl, now, now, tags]);
        return true;
    }

    // Check if already exists by URL
    for (let i = 1; i < data.length; i++) {
        if (data[i][3] === accessUrl) {
            // Update existing entry
            sheet.getRange(i + 1, 6).setValue(now);
            return true;
        }
    }

    // Add new entry
    sheet.appendRow([wikiId, title, description, accessUrl, now, now, tags]);
    return true;
}

/**
 * Remove an external wiki from External_Index
 * Returns true if found and removed, false otherwise
 */
function removeExternalWiki(accessUrl: string): boolean {
    const sheet = getExternalIndexSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][3] === accessUrl) {
            sheet.deleteRow(i + 1);
            return true;
        }
    }
    return false;
}
