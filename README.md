# gWiki3 📚

A modern wiki application powered by Google Apps Script and Google Spreadsheet.

## Features

- ✨ **Modern UI**: Beautiful, responsive design with Tailwind CSS and glassmorphism effects
- 📝 **Markdown Support**: Write content in Markdown with live preview
- 🔗 **Wiki Links**: Link pages using `[PageTitle]` syntax - existing pages show in purple, missing pages in red
- ☁️ **Cloud-Powered**: Backend runs on Google Apps Script with Spreadsheet as database
- ⚡ **Fast Build**: Uses Bun for lightning-fast package management and builds
- 🔒 **Secure**: Leverages Google's authentication and security

## Tech Stack

### Backend
- **Google Apps Script** (TypeScript)
- **Google Spreadsheet** (Database)
- **clasp** (Deployment tool)

### Frontend
- **React** 18
- **Vite** (Build tool)
- **TypeScript**
- **Tailwind CSS** (Styling)
- **React Router** (Routing)
- **React Markdown** (Markdown rendering)

### Build Tools
- **Bun** (Package manager & build tool)

## Project Structure

```
gWiki3/
├── backend/          # Google Apps Script backend
│   ├── src/
│   │   ├── Code.ts   # Main entry point
│   │   ├── api.ts    # API endpoints
│   │   └── db.ts     # Database operations
│   ├── appsscript.json
│   └── package.json
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
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
clasp create --type webapp --title "gWiki3 Backend"
```

3. Deploy the backend:
```bash
bun run backend:push
```

4. Run the initialization function in Apps Script to create the spreadsheet:
   - Open the Apps Script project: `bun run backend:open`
   - Run the `initialize()` function
   - Note the spreadsheet URL

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

1. Click "New Page" in the header
2. Enter a title and content (Markdown supported)
3. Click "Save"

### Editing a Page

1. Open a page
2. Click "Edit"
3. Modify the content
4. Click "Save"

### Deleting a Page

1. Open a page
2. Click "Delete"
3. Confirm the deletion

### Using Wiki Links

Link to other pages using the `[PageTitle]` syntax:

```markdown
Check out the [Markdown Guide] for formatting tips.
See [TestPage] for an example.
```

- **Existing pages**: Display as purple, clickable links
- **Missing pages**: Display in red with dotted underline

For more details, see [docs/WIKI_LINKS.md](docs/WIKI_LINKS.md).

## API Endpoints

The GAS backend provides the following endpoints:

- `GET ?path=pages` - Get all pages
- `GET ?path=page&id={id}` - Get a specific page
- `POST ?path=create` - Create a new page
- `POST ?path=update` - Update an existing page
- `POST ?path=delete` - Delete a page

## License

MIT
