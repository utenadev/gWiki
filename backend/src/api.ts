import { DB, WikiPage, WikiMode } from './db';

/**
 * Get DB instance with wikiId from request parameters
 */
function getDBForRequest(wikiId?: string): DB {
    return new DB(wikiId);
}

/**
 * Handle GET requests
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
    const path = e.parameter.path || '';
    const wikiId = e.parameter.wikiId;
    const id = e.parameter.id || '';

    const db = getDBForRequest(wikiId);
    let response: any;

    try {
        switch (path) {
            case 'pages':
                // Return both local and cached pages
                const localPages = db.getAllPages();
                const cachedPages = db.getAllCachedPages();
                response = { success: true, data: [...localPages, ...cachedPages] };
                break;
            case 'page':
                if (!id) {
                    response = { success: false, error: 'ID is required' };
                } else {
                    const page = db.getPageById(id);
                    if (page) {
                        response = { success: true, data: page };
                    } else {
                        // Check cache if not found locally
                        const cached = db.getAllCachedPages().find(p => p.id === id);
                        if (cached) {
                            response = { success: true, data: cached };
                        } else {
                            response = { success: false, error: 'Page not found' };
                        }
                    }
                }
                break;
            case 'peers':
                response = { success: true, data: db.getPeers() };
                break;
            case 'external_index':
                response = { success: true, data: db.getExternalIndex() };
                break;
            case 'wikis':
                // Get all registered wikis
                response = { success: true, data: db.getAllWikis() };
                break;
            case 'mode':
                // Get current wiki mode
                response = { success: true, data: { mode: db.getMode() } };
                break;
            default:
                response = { success: false, error: 'Invalid endpoint' };
        }
    } catch (error) {
        response = { success: false, error: String(error) };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
    const path = e.parameter.path || '';
    const wikiId = e.parameter.wikiId;

    const db = getDBForRequest(wikiId);
    let response: any;

    try {
        const body = JSON.parse(e.postData.contents);

        switch (path) {
            case 'create':
                if (!body.title || !body.content) {
                    response = { success: false, error: 'Title and content are required' };
                } else {
                    const page = db.createPage(body.title, body.content, body.tags || [], body.path || '');
                    // Broadcast to peers (only in internet mode)
                    if (db.getMode() === WikiMode.INTERNET) {
                        broadcastToPeers(page, db);
                    }
                    response = { success: true, data: page };
                }
                break;
            case 'update':
                if (!body.id || !body.title || !body.content) {
                    response = { success: false, error: 'ID, title, and content are required' };
                } else {
                    const page = db.updatePage(body.id, body.title, body.content, body.tags || []);
                    if (page) {
                        // Broadcast to peers (only in internet mode)
                        if (db.getMode() === WikiMode.INTERNET) {
                            broadcastToPeers(page, db);
                        }
                        response = { success: true, data: page };
                    } else {
                        response = { success: false, error: 'Page not found' };
                    }
                }
                break;
            case 'delete':
                if (!body.id) {
                    response = { success: false, error: 'ID is required' };
                } else {
                    const deleted = db.deletePage(body.id);
                    response = { success: deleted, data: { deleted } };
                }
                break;
            // Gossip Protocol: Receive updates from other nodes
            case 'gossip':
                if (db.getMode() !== WikiMode.INTERNET) {
                    response = { success: false, error: 'Gossip protocol is only available in internet mode' };
                } else if (!body.page) {
                    response = { success: false, error: 'Page data required' };
                } else {
                    const page = body.page as WikiPage;
                    db.upsertCachedPage(page);
                    response = { success: true, message: 'Gossip received' };
                }
                break;
            case 'add_peer':
                if (db.getMode() !== WikiMode.INTERNET) {
                    response = { success: false, error: 'Peer management is only available in internet mode' };
                } else if(!body.url || !body.name) {
                    response = { success: false, error: 'URL and Name required' };
                } else {
                    const peer = db.addPeer(body.url, body.name);
                    response = { success: true, data: peer };
                }
                break;
            case 'add_external_wiki':
                if (db.getMode() !== WikiMode.INTERNET) {
                    response = { success: false, error: 'External wiki management is only available in internet mode' };
                } else if(!body.wikiId || !body.title || !body.accessUrl) {
                    response = { success: false, error: 'WikiID, Title, and AccessURL are required' };
                } else {
                    const added = db.addExternalWiki(body.wikiId, body.title, body.description || '', body.accessUrl, body.tags || '');
                    response = { success: added };
                }
                break;
            case 'remove_external_wiki':
                if (db.getMode() !== WikiMode.INTERNET) {
                    response = { success: false, error: 'External wiki management is only available in internet mode' };
                } else if(!body.accessUrl) {
                    response = { success: false, error: 'AccessURL is required' };
                } else {
                    const removed = db.removeExternalWiki(body.accessUrl);
                    response = { success: removed };
                }
                break;
            case 'add_wiki':
                // Register a new wiki (existing spreadsheet)
                if(!body.wikiId || !body.title || !body.spreadsheetId) {
                    response = { success: false, error: 'WikiID, Title, and SpreadsheetID are required' };
                } else {
                    const added = db.addWiki(body.wikiId, body.title, body.spreadsheetId);
                    if (added) {
                        response = { success: true, data: added };
                    } else {
                        response = { success: false, error: 'Failed to add wiki (may already exist or spreadsheet is not accessible)' };
                    }
                }
                break;
            case 'switch_wiki':
                // Switch to a different wiki
                if(!body.wikiId) {
                    response = { success: false, error: 'WikiID is required' };
                } else {
                    const switched = db.switchWiki(body.wikiId);
                    response = { success: switched, data: { currentWikiId: body.wikiId } };
                }
                break;
            case 'set_mode':
                // Set wiki mode
                if(!body.mode) {
                    response = { success: false, error: 'Mode is required (internet or workspace)' };
                } else {
                    const mode = body.mode === 'workspace' ? WikiMode.WORKSPACE : WikiMode.INTERNET;
                    db.setMode(mode);
                    response = { success: true, data: { mode } };
                }
                break;
            default:
                response = { success: false, error: 'Invalid endpoint' };
        }
    } catch (error) {
        response = { success: false, error: String(error) };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Broadcast updates to all known peers
 */
function broadcastToPeers(page: WikiPage, db: DB): void {
    const peers = db.getPeers();
    if (peers.length === 0) return;

    let myUrl = '';
    try {
        myUrl = ScriptApp.getService().getUrl();
    } catch (e) {
        // Fallback or ignore if not deployed
        myUrl = 'unknown-node';
    }

    // Prepare the page with origin info
    const gossipPage = {
        ...page,
        origin: page.origin || myUrl,
        author: page.author || 'Anonymous' // In future, use user identity
    };

    const payload = JSON.stringify({
        page: gossipPage
    });

    const requests = peers.map(peer => {
        return {
            url: `${peer.url}?path=gossip&wikiId=${db.getWikiId()}`,
            method: 'post' as const,
            contentType: 'application/json',
            payload: payload,
            muteHttpExceptions: true // Don't fail if a peer is down
        };
    });

    try {
        // Fire and forget (sort of, we wait for response but ignore errors)
        UrlFetchApp.fetchAll(requests);
    } catch (e) {
        console.error('Broadcast failed:', e);
    }
}