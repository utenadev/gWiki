/**
 * Database operations using Google Spreadsheet
 */

interface WikiPage {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
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

        // Initialize sheet with headers
        const sheet = ss.getActiveSheet();
        sheet.setName('Pages');
        sheet.getRange(1, 1, 1, 5).setValues([
            ['ID', 'Title', 'Content', 'Created At', 'Updated At']
        ]);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold');

        return ss;
    }

    return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Get the Pages sheet
 */
function getPagesSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = getSpreadsheet();
    return ss.getSheetByName('Pages') || ss.getActiveSheet();
}

/**
 * Get all wiki pages
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
