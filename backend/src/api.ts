/**
 * API endpoints for the wiki application
 */

/**
 * Handle GET requests
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
    const path = e.parameter.path || '';
    const id = e.parameter.id || '';

    let response: any;

    try {
        switch (path) {
            case 'pages':
                // Return both local and cached pages for now, or just local?
                // Let's return local + cached so frontend sees everything.
                const localPages = getAllPages();
                const cachedPages = getAllCachedPages();
                response = { success: true, data: [...localPages, ...cachedPages] };
                break;
            case 'page':
                if (!id) {
                    response = { success: false, error: 'ID is required' };
                } else {
                    const page = getPageById(id);
                    if (page) {
                        response = { success: true, data: page };
                    } else {
                        // Check cache if not found locally
                        const cached = getAllCachedPages().find(p => p.id === id);
                        if (cached) {
                            response = { success: true, data: cached };
                        } else {
                            response = { success: false, error: 'Page not found' };
                        }
                    }
                }
                break;
            case 'peers':
                response = { success: true, data: getPeers() };
                break;
            case 'external_index':
                response = { success: true, data: getExternalIndex() };
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

    let response: any;

    try {
        const body = JSON.parse(e.postData.contents);

        switch (path) {
            case 'create':
                if (!body.title || !body.content) {
                    response = { success: false, error: 'Title and content are required' };
                } else {
                    const page = createPage(body.title, body.content);
                    // Broadcast to peers
                    broadcastToPeers(page);
                    response = { success: true, data: page };
                }
                break;
            case 'update':
                if (!body.id || !body.title || !body.content) {
                    response = { success: false, error: 'ID, title, and content are required' };
                } else {
                    const page = updatePage(body.id, body.title, body.content);
                    if (page) {
                        // Broadcast to peers
                        broadcastToPeers(page);
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
                    const deleted = deletePage(body.id);
                    response = { success: deleted, data: { deleted } };
                }
                break;
            // Gossip Protocol: Receive updates from other nodes
            case 'gossip':
                if (!body.page) {
                    response = { success: false, error: 'Page data required' };
                } else {
                    const page = body.page as WikiPage;
                    // Validate: In real world, check signature or if peer is trusted
                    // For now, just save it
                    upsertCachedPage(page);
                    response = { success: true, message: 'Gossip received' };
                }
                break;
            case 'add_peer':
                if(!body.url || !body.name) {
                    response = { success: false, error: 'URL and Name required' };
                } else {
                    const peer = addPeer(body.url, body.name);
                    response = { success: true, data: peer };
                }
                break;
            case 'add_external_wiki':
                if(!body.wikiId || !body.title || !body.accessUrl) {
                    response = { success: false, error: 'WikiID, Title, and AccessURL are required' };
                } else {
                    const added = addExternalWiki(body.wikiId, body.title, body.description || '', body.accessUrl, body.tags || '');
                    response = { success: added };
                }
                break;
            case 'remove_external_wiki':
                if(!body.accessUrl) {
                    response = { success: false, error: 'AccessURL is required' };
                } else {
                    const removed = removeExternalWiki(body.accessUrl);
                    response = { success: removed };
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
function broadcastToPeers(page: WikiPage): void {
    const peers = getPeers();
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
            url: `${peer.url}?path=gossip`,
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
