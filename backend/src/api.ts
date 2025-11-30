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
                response = { success: true, data: getAllPages() };
                break;
            case 'page':
                if (!id) {
                    response = { success: false, error: 'ID is required' };
                } else {
                    const page = getPageById(id);
                    if (page) {
                        response = { success: true, data: page };
                    } else {
                        response = { success: false, error: 'Page not found' };
                    }
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
                    response = { success: true, data: page };
                }
                break;
            case 'update':
                if (!body.id || !body.title || !body.content) {
                    response = { success: false, error: 'ID, title, and content are required' };
                } else {
                    const page = updatePage(body.id, body.title, body.content);
                    if (page) {
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
            default:
                response = { success: false, error: 'Invalid endpoint' };
        }
    } catch (error) {
        response = { success: false, error: String(error) };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}
