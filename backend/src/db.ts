/**
 * Database operations using Google Spreadsheet
 */

export interface WikiPage {
    id: string;
    path: string; // Directory-like path, e.g., "home", "admin/config"
    policyId: string; // "public", "admin", etc.
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    origin?: string; // URL of the original node (undefined for local)
    author?: string; // Author name
}

export interface Peer {
    url: string;
    name: string;
    isActive: boolean;
    lastSyncedAt: string;
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

export class DB {
    private ss: GoogleAppsScript.Spreadsheet.Spreadsheet;

    constructor() {
        this.ss = this.getSpreadsheet();
    }

    /**
     * Get or create the spreadsheet for wiki data
     */
    private getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
        const scriptProperties = PropertiesService.getScriptProperties();
        let spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');

        if (!spreadsheetId) {
            // Create new spreadsheet
            const ss = SpreadsheetApp.create('gWiki3 Database');
            spreadsheetId = ss.getId();
            scriptProperties.setProperty('SPREADSHEET_ID', spreadsheetId);
            this.initializeSpreadsheet(ss);
            return ss;
        }

        const ss = SpreadsheetApp.openById(spreadsheetId);
        this.ensureSheetsExist(ss);
        return ss;
    }

    private initializeSpreadsheet(ss: GoogleAppsScript.Spreadsheet.Spreadsheet) {
        // Initialize Pages sheet (Index)
        // [ID, Path, PolicyID, Title, Created At, Updated At, Tags]
        const sheet = ss.getActiveSheet();
        sheet.setName('Pages');
        sheet.getRange(1, 1, 1, 7).setValues([
            ['ID', 'Path', 'PolicyID', 'Title', 'Created At', 'Updated At', 'Tags']
        ]);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');

        // Initialize Store_Public
        const storePublic = ss.insertSheet('Store_Public');
        storePublic.getRange(1, 1, 1, 2).setValues([['ID', 'Content']]);
        storePublic.getRange(1, 1, 1, 2).setFontWeight('bold');

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
    }

    private ensureSheetsExist(ss: GoogleAppsScript.Spreadsheet.Spreadsheet) {
        const requiredSheets = ['Pages', 'Store_Public', 'Peers', 'Cache', 'External_Index'];
        requiredSheets.forEach(name => {
            if (!ss.getSheetByName(name)) {
                const sheet = ss.insertSheet(name);
                if (name === 'Pages') {
                    sheet.getRange(1, 1, 1, 7).setValues([['ID', 'Path', 'PolicyID', 'Title', 'Created At', 'Updated At', 'Tags']]);
                } else if (name.startsWith('Store_')) {
                    sheet.getRange(1, 1, 1, 2).setValues([['ID', 'Content']]);
                } else if (name === 'Peers') {
                    sheet.getRange(1, 1, 1, 4).setValues([['URL', 'Name', 'Is Active', 'Last Synced At']]);
                } else if (name === 'Cache') {
                    sheet.getRange(1, 1, 1, 7).setValues([['ID', 'Title', 'Content', 'Created At', 'Updated At', 'Origin', 'Author']]);
                } else if (name === 'External_Index') {
                    sheet.getRange(1, 1, 1, 7).setValues([['WikiID', 'Title', 'Description', 'AccessURL', 'Registered At', 'Updated At', 'Tags']]);
                }
                sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
            }
        });
    }

    private getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
        return this.ss.getSheetByName(name) || this.ss.insertSheet(name);
    }

    private getStoreSheet(policyId: string): GoogleAppsScript.Spreadsheet.Sheet {
        const sheetName = `Store_${policyId.charAt(0).toUpperCase() + policyId.slice(1)}`;
        return this.getSheet(sheetName);
    }

    // --- Page Management (Local) ---

    getAllPages(): WikiPage[] {
        const indexSheet = this.getSheet('Pages');
        const indexData = indexSheet.getDataRange().getValues();
        if (indexData.length <= 1) return [];

        // Note: For large datasets, this might be slow because it fetches content for each page.
        // In gWiki, we might want to return only metadata for the list view.
        return indexData.slice(1).map(row => {
            const id = row[0];
            const policyId = row[2];
            const content = this.getPageContent(id, policyId);
            return {
                id,
                path: row[1],
                policyId,
                title: row[3],
                content: content,
                createdAt: row[4],
                updatedAt: row[5],
                tags: row[6]
            } as WikiPage;
        });
    }

    private getPageContent(id: string, policyId: string): string {
        const storeSheet = this.getStoreSheet(policyId);
        const data = storeSheet.getDataRange().getValues();
        const found = data.find(row => row[0] === id);
        return found ? found[1] : '';
    }

    getPageById(id: string): WikiPage | null {
        const indexSheet = this.getSheet('Pages');
        const indexData = indexSheet.getDataRange().getValues();
        const row = indexData.find(r => r[0] === id);
        if (!row) return null;

        const policyId = row[2];
        return {
            id: row[0],
            path: row[1],
            policyId,
            title: row[3],
            content: this.getPageContent(id, policyId),
            createdAt: row[4],
            updatedAt: row[5],
            tags: row[6]
        } as WikiPage;
    }

    createPage(title: string, content: string, tags: string[] = [], path: string = ''): WikiPage {
        const id = Utilities.getUuid();
        const now = new Date().toISOString();
        
        // Auto-determine policy based on path
        let policyId = 'public';
        if (path.startsWith('admin/')) {
            policyId = 'admin';
        }

        const page: WikiPage = {
            id,
            path: path || id, // Default path to ID if not provided
            policyId,
            title,
            content,
            createdAt: now,
            updatedAt: now
        };

        // Write to Index
        const indexSheet = this.getSheet('Pages');
        indexSheet.appendRow([id, page.path, policyId, title, now, now, tags.join(',')]);

        // Write to Store
        const storeSheet = this.getStoreSheet(policyId);
        storeSheet.appendRow([id, content]);

        return page;
    }

    updatePage(id: string, title: string, content: string, tags: string[] = []): WikiPage | null {
        const indexSheet = this.getSheet('Pages');
        const indexData = indexSheet.getDataRange().getValues();

        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][0] === id) {
                const now = new Date().toISOString();
                const path = indexData[i][1];
                const policyId = indexData[i][2];
                const createdAt = indexData[i][4];

                // Update Index
                indexSheet.getRange(i + 1, 4, 1, 4).setValues([[title, createdAt, now, tags.join(',') ]]);

                // Update Store
                const storeSheet = this.getStoreSheet(policyId);
                const storeData = storeSheet.getDataRange().getValues();
                for (let j = 1; j < storeData.length; j++) {
                    if (storeData[j][0] === id) {
                        storeSheet.getRange(j + 1, 2).setValue(content);
                        break;
                    }
                }

                return {
                    id,
                    path,
                    policyId,
                    title,
                    content,
                    createdAt,
                    updatedAt: now
                };
            }
        }
        return null;
    }

    deletePage(id: string): boolean {
        const indexSheet = this.getSheet('Pages');
        const indexData = indexSheet.getDataRange().getValues();

        for (let i = 1; i < indexData.length; i++) {
            if (indexData[i][0] === id) {
                const policyId = indexData[i][2];
                
                // Delete from Store
                const storeSheet = this.getStoreSheet(policyId);
                const storeData = storeSheet.getDataRange().getValues();
                for (let j = 1; j < storeData.length; j++) {
                    if (storeData[j][0] === id) {
                        storeSheet.deleteRow(j + 1);
                        break;
                    }
                }

                // Delete from Index
                indexSheet.deleteRow(i + 1);
                return true;
            }
        }
        return false;
    }

    // --- Peer Management ---

    getPeers(): Peer[] {
        const sheet = this.getSheet('Peers');
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return [];

        return data.slice(1).map(row => ({
            url: row[0],
            name: row[1],
            isActive: row[2],
            lastSyncedAt: row[3]
        }));
    }

    addPeer(url: string, name: string): Peer {
        const peers = this.getPeers();
        const existing = peers.find(p => p.url === url);
        if (existing) return existing;

        const now = new Date().toISOString();
        this.getSheet('Peers').appendRow([url, name, true, now]);
        return { url, name, isActive: true, lastSyncedAt: now };
    }

    removePeer(url: string): boolean {
        const sheet = this.getSheet('Peers');
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === url) {
                sheet.deleteRow(i + 1);
                return true;
            }
        }
        return false;
    }

    // --- Cache Management ---

    getAllCachedPages(): WikiPage[] {
        const sheet = this.getSheet('Cache');
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return [];

        return data.slice(1).map(row => ({
            id: row[0],
            title: row[1],
            content: row[2],
            createdAt: row[3],
            updatedAt: row[4],
            origin: row[5],
            author: row[6],
            path: row[0], // For cache, path is same as ID
            policyId: 'cache'
        }));
    }

    upsertCachedPage(page: WikiPage): boolean {
        const sheet = this.getSheet('Cache');
        const data = sheet.getDataRange().getValues();
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === page.id && data[i][5] === page.origin) {
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

    // --- External Index ---

    getExternalIndex(): ExternalWiki[] {
        const sheet = this.getSheet('External_Index');
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

    addExternalWiki(wikiId: string, title: string, description: string, accessUrl: string, tags: string = ''): boolean {
        const sheet = this.getSheet('External_Index');
        const data = sheet.getDataRange().getValues();
        const now = new Date().toISOString();

        for (let i = 1; i < data.length; i++) {
            if (data[i][3] === accessUrl) {
                sheet.getRange(i + 1, 6).setValue(now);
                return true;
            }
        }

        sheet.appendRow([wikiId, title, description, accessUrl, now, now, tags]);
        return true;
    }

    removeExternalWiki(accessUrl: string): boolean {
        const sheet = this.getSheet('External_Index');
        const data = sheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (data[i][3] === accessUrl) {
                sheet.deleteRow(i + 1);
                return true;
            }
        }
        return false;
    }
}

