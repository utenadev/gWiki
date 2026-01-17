# gWiki 📚

A federated wiki application powered by Google Apps Script and Google Spreadsheet.

## Features

- ✨ **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 📝 **Markdown Support**: Write content in Markdown with live preview
- 🔗 **Wiki Links**: Link pages using `[PageTitle]` syntax - existing pages show in purple, missing pages in red
- 🏷️ **Tags**: Organize pages with tags for easy categorization and discovery
- 🔙 **Backlinks**: See which pages link to the current page
- 📜 **Version History**: Track changes and restore previous versions
- 🌓 **Dark/Light Theme**: Toggle between dark and light modes
- 📊 **Admin Tools**: Manage broken links, orphaned pages, and view statistics
- 🌐 **Federated**: Exchange pages with trusted peer nodes using a push/gossip protocol
- ☁️ **Cloud-Powered**: Backend runs on Google Apps Script with Spreadsheet as database
- ⚡ **Fast Build**: Uses Bun for lightning-fast package management and builds
- 🔒 **Secure**: Leverages Google's authentication and security

## Tech Stack

### Backend
- **Google Apps Script** (TypeScript)
- **Google Spreadsheet** (Database)
- **clasp** (Deployment tool)

### Frontend
- **Alpine.js** 3.x (Lightweight reactive framework)
- **Vite** (Build tool)
- **TypeScript**
- **Tailwind CSS** (Styling)
- **marked** (Markdown rendering)

### Build Tools
- **Bun** (Package manager & build tool)

## Project Structure

```
gWiki/
├── backend/          # Google Apps Script backend
│   ├── src/
│   │   ├── Code.ts   # Main entry point
│   │   ├── api.ts    # API endpoints
│   │   └── db.ts     # Database operations
│   ├── appsscript.json
│   └── package.json
├── frontend/         # Alpine.js frontend
│   ├── src/
│   │   ├── main.ts   # Alpine.js components and logic
│   │   ├── api.ts    # API client
│   │   └── types.ts  # TypeScript types
│   ├── index.html    # Alpine.js templates
│   └── package.json
├── docs/             # Documentation
└── package.json      # Root package
```

## Setup

### Prerequisites

- [Bun](https://bun.sh/) installed
- [clasp](https://github.com/google/clasp) installed and configured
- Google account

### Installation

1. Install dependencies:
```bash
bun install
```

2. Set up the backend:
```bash
cd backend
clasp login
clasp create --type webapp --title "gWiki Backend"
```

3. Deploy the backend:
```bash
bun run backend:push
```

4. Run the initialization function in Apps Script to create the spreadsheet:
   - Open the Apps Script project: `bun run backend:open`
   - Run the `initialize()` function
   - Note the spreadsheet URL

5. Deploy as Web App and configure frontend:
   - Deploy the Web App with access "Anyone"
   - Copy the Web App URL
   - Update `frontend/src/api.ts` with your URL (set `USE_MOCK = false`)

See [docs/GAS_SETUP.md](docs/GAS_SETUP.md) for detailed setup instructions.

### Development

Start the development server:
```bash
bun run dev
```

The app will open at `http://localhost:3000`

### Build

Build the frontend for production:
```bash
bun run build
```

Preview the production build:
```bash
bun run preview
```

## Usage

### Creating a Page

1. Click "Create New Page" on the home page
2. Enter a title, content (Markdown supported), and optional tags
3. Click "Save"

### Editing a Page

1. Open a page
2. Click "Edit"
3. Modify the content
4. Click "Save"

### Using Wiki Links

Link to other pages using the `[PageTitle]` syntax:

```markdown
Check out the [Markdown Guide] for formatting tips.
See [TestPage] for an example.
```

- **Existing pages**: Display as purple, clickable links
- **Missing pages**: Display in red with dotted underline

For more details, see [docs/WIKI_LINKS.md](docs/WIKI_LINKS.md).

### Version History

Each page maintains a version history. Click "Version History" on any page to view previous versions.

### Admin Pages

Access admin features through the navigation:
- **Peers**: Manage trusted peer nodes for federation
- **Stats**: View wiki statistics (total pages, links, tags, broken links, orphaned pages)

## Federation

gWiki uses a **push/gossip protocol** inspired by Nostr and ActivityPub. Instead of pulling data on demand, nodes actively exchange information.

### How It Works

1. **Outbox**: When you create or update a page, it's automatically broadcast to all trusted peers
2. **Inbox**: Each node can receive updates from peers via the gossip endpoint
3. **Cache**: External pages are stored locally in a separate cache sheet

### Benefits

- **Performance**: Data is cached locally, no remote calls needed for viewing
- **Resilience**: Content available even if the original node is down
- **GAS-Optimized**: Works within Google Apps Script execution time limits

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed federation architecture.

## API Endpoints

The GAS backend provides the following endpoints:

### Pages
- `GET ?path=pages` - Get all pages (local + cached)
- `GET ?path=page&id={id}` - Get a specific page
- `POST ?path=create` - Create a new page
- `POST ?path=update` - Update an existing page
- `POST ?path=delete` - Delete a page

### Federation
- `GET ?path=peers` - Get list of trusted peers
- `POST ?path=add_peer` - Add a new peer node
- `POST ?path=gossip` - Receive updates from peers (Inbox)

## Roadmap

See [docs/PLAN.md](docs/PLAN.md) for the full development plan.

### Phase 1: Federation Basics ✅
- [x] Peer management (Backend)
- [x] Inbox & Outbox (Gossip protocol)
- [ ] Basic authentication/security

### Phase 2: Frontend Integration
- [x] Peer management UI
- [ ] Federation content display with attribution
- [ ] WikiLink resolution for external content

### Phase 3: Reliability & Scalability
- [ ] Asynchronous propagation queues
- [ ] Conflict resolution
- [ ] Digital signatures

### Phase 4: Relay Nodes
- [ ] Dedicated relay server mode
- [ ] Community hub functionality

## Documentation

- [GAS Setup Guide](docs/GAS_SETUP.md) - Backend deployment instructions
- [Wiki Links Guide](docs/WIKI_LINKS.md) - Using wiki links
- [Architecture](docs/ARCHITECTURE.md) - Federation architecture details
- [Plan](docs/PLAN.md) - Development roadmap

## License

MIT
