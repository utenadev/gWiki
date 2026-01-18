import Alpine from 'alpinejs'
import { marked } from 'marked'
import type { Page, Peer, ExternalWiki, ApiError } from './types'
import { api } from './api'

// ========================================
// Shared Utilities
// ========================================
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

// WikiLink data structure
interface WikiLink {
  title: string
  origin?: string // External wiki origin (e.g., "https://...")
  exists: boolean
}

// Parse WikiLink from content: [Title] or [Origin/Title]
function parseWikiLinks(content: string, allPages: Page[]): { content: string, links: WikiLink[] } {
  const wikiLinkRegex = /\[([^\]]+)\]/g
  const links: WikiLink[] = []
  let lastIndex = 0
  let parsedContent = ''

  let match
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    // Add content before the link
    parsedContent += content.substring(lastIndex, match.index)

    const linkText = match[1]
    const parts = linkText.split('/')
    let title: string
    let origin: string | undefined

    if (parts.length > 1) {
      // External wiki link: [Origin/Title] or [https://.../Title]
      const possibleOrigin = parts[0]
      if (possibleOrigin.startsWith('http')) {
        origin = possibleOrigin
        title = parts.slice(1).join('/')
      } else {
        // Treat as part of title (e.g. [Admin/Settings] is a path, not external wiki)
        title = linkText
      }
    } else {
      // Local link: [Title]
      title = linkText
    }

    // Check if page exists (local or cached)
    const localPage = allPages.find(p => p.title === title && !p.origin)
    const cachedPage = allPages.find(p => p.title === title && p.origin)

    const exists = !!(localPage || cachedPage)

    links.push({ title, origin, exists })

    // Generate wiki link HTML
    const cssClass = exists ? 'wiki-link-exists' : 'wiki-link-missing'
    const originAttr = origin ? ` data-origin="${origin}"` : ''
    const dataTitle = origin ? ` title="外部Wiki: ${origin}"` : ''

    // Use page ID if exists, otherwise link to new page with pre-filled title
    let href: string
    if (localPage) {
      href = `#/page/${localPage.id}`
    } else if (cachedPage) {
      href = `#/page/${cachedPage.id}`
    } else {
      href = `#/new?title=${encodeURIComponent(title)}`
    }

    parsedContent += `<a href="${href}" ${originAttr} ${dataTitle} class="wiki-link ${cssClass}" data-wiki-link>${linkText}</a>`

    lastIndex = wikiLinkRegex.lastIndex
  }

  // Add remaining content
  parsedContent += content.substring(lastIndex)

  return { content: parsedContent, links }
}

async function renderMarkdown(content: string, allPages: Page[] = []): Promise<string> {
  const { content: parsedContent } = parseWikiLinks(content, allPages)
  const html = await marked.parse(parsedContent)
  return html
}

function getErrorMessage(e: unknown): string {
  return (e as ApiError).message || 'Operation failed'
}

// ========================================
// Global Store: Theme
// ========================================
type ThemeStore = {
  dark: boolean
  init(): void
  toggle(): void
  apply(): void
}

Alpine.store('theme', {
  dark: false,

  init(this: ThemeStore) {
    const stored = localStorage.getItem('theme')
    this.dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    this.apply()
  },

  toggle(this: ThemeStore) {
    this.dark = !this.dark
    this.apply()
    localStorage.setItem('theme', this.dark ? 'dark' : 'light')
  },

  apply(this: ThemeStore) {
    document.documentElement.classList.toggle('dark', this.dark)
  }
} as ThemeStore)

// ========================================
// App Router
// ========================================
function wikiApp() {
  return {
    route: '',

    init() {
      // Parse initial hash
      this.route = this.parseRoute(location.hash.slice(1))

      // Listen for hash changes
      window.addEventListener('hashchange', () => {
        this.route = this.parseRoute(location.hash.slice(1))
        // Dispatch custom event for route changes
        window.dispatchEvent(new CustomEvent('route-change', { detail: { route: this.route } }))
      })
    },

    parseRoute(hash: string) {
      // Remove leading slash for consistent route matching
      return hash.replace(/^\//, '')
    },

    navigate(path: string) {
      location.hash = path
    }
  }
}

// ========================================
// Home Page
// ========================================
function homePage() {
  return {
    pages: [] as Page[],
    loading: true,
    error: null as string | null,

    async init() {
      try {
        this.pages = await api.getPages()
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    formatDate
  }
}

// ========================================
// Page View
// ========================================
function pageView(initialPageId: string) {
  return {
    pageId: initialPageId,
    page: null as Page | null,
    allPages: [] as Page[],
    versions: [] as Page[],
    loading: true,
    error: null as string | null,
    showingVersions: false,

    init() {
      this.loadPage()
      window.addEventListener('route-change', ((e: CustomEvent) => {
        const newRoute = e.detail.route
        if (newRoute?.startsWith('page/')) {
          const newPageId = newRoute.split('/')[1]
          if (newPageId && newPageId !== this.pageId) {
            this.pageId = newPageId
            this.loadPage()
          }
        }
      }) as EventListener)
    },

    async loadPage() {
      this.loading = true
      this.error = null
      try {
        // Load all pages for WikiLink resolution
        this.allPages = await api.getPages()
        this.page = await api.getPage(this.pageId)
        this.versions = await api.getPageVersions(this.pageId)
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    renderContent(content: string) {
      return renderMarkdown(content, this.allPages)
    },
    formatDate,
    toggleVersions() {
      this.showingVersions = !this.showingVersions
    },

    async deletePage() {
      if (!this.page || !confirm(`Delete "${this.page.title}"?`)) return
      try {
        await api.deletePage(this.pageId)
        location.hash = '#/'
      } catch (e) {
        alert('Delete failed: ' + getErrorMessage(e))
      }
    }
  }
}

// ========================================
// Page Editor
// ========================================
function pageEditor(pageId?: string) {
  return {
    pageId: pageId || null,
    title: '',
    content: '',
    tags: '',
    loading: false,
    saving: false,
    showPreview: false,
    error: null as string | null,
    isEditMode: !!pageId,

    async init() {
      if (this.isEditMode && this.pageId) {
        this.loading = true
        try {
          const page = await api.getPage(this.pageId)
          this.title = page.title
          this.content = page.content
          this.tags = page.tags?.join(', ') || ''
        } catch (e) {
          this.error = getErrorMessage(e)
        } finally {
          this.loading = false
        }
      } else {
        // New page: check for title in URL params
        const hash = location.hash
        const urlParams = new URLSearchParams(hash.split('?')[1])
        const titleParam = urlParams.get('title')
        if (titleParam) {
          this.title = decodeURIComponent(titleParam)
        }
      }
    },

    renderContent: renderMarkdown,

    async save() {
      if (!this.title.trim()) {
        this.error = 'Title is required'
        return
      }

      this.saving = true
      this.error = null

      try {
        const tags = this.tags.split(',').map(t => t.trim()).filter(Boolean)

        if (this.isEditMode && this.pageId) {
          await api.updatePage(this.pageId, this.title, this.content, tags)
        } else {
          const newPage = await api.createPage(this.title, this.content, tags)
          this.pageId = newPage.id
          this.isEditMode = true
        }

        location.hash = `#/page/${this.pageId}`
      } catch (e) {
        this.error = getErrorMessage(e)
        this.saving = false
      }
    },

    cancel() {
      location.hash = this.isEditMode && this.pageId ? `#/page/${this.pageId}` : '#/'
    }
  }
}

// ========================================
// Admin: Broken Links
// ========================================
function brokenLinksAdmin() {
  return {
    brokenLinks: [] as Array<{ page: Page; brokenLinks: string[] }>,
    loading: true,
    error: null as string | null,

    async init() {
      try {
        this.brokenLinks = await api.getBrokenLinks()
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    }
  }
}

// ========================================
// Admin: Orphaned Pages
// ========================================
function orphanedPagesAdmin() {
  return {
    orphanedPages: [] as Page[],
    loading: true,
    error: null as string | null,

    async init() {
      try {
        this.orphanedPages = await api.getOrphanedPages()
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    formatDate
  }
}

// ========================================
// Admin: Stats
// ========================================
type Stats = {
  totalPages: number
  totalLinks: number
  totalTags: number
  brokenLinks: number
  orphanedPages: number
}

function statsAdmin() {
  return {
    stats: null as Stats | null,
    loading: true,
    error: null as string | null,

    async init() {
      try {
        this.stats = await api.getStats()
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    }
  }
}

// ========================================
// Peer Management
// ========================================
function peerManagement() {
  return {
    peers: [] as Peer[],
    loading: true,
    error: null as string | null,
    showAddForm: false,
    newPeerUrl: '',
    newPeerName: '',

    async init() {
      try {
        this.peers = await api.getPeers()
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    async addPeer() {
      if (!this.newPeerUrl.trim() || !this.newPeerName.trim()) {
        this.error = 'URL and Name are required'
        return
      }

      this.loading = true
      this.error = null

      try {
        const peer = await api.addPeer(this.newPeerUrl, this.newPeerName)
        this.peers.push(peer)
        this.newPeerUrl = ''
        this.newPeerName = ''
        this.showAddForm = false
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    async removePeer(id: string) {
      if (!confirm('Remove this peer?')) return

      this.loading = true
      try {
        const success = await api.removePeer(id)
        if (success) {
          this.peers = this.peers.filter(p => p.id !== id)
        } else {
          this.error = 'Failed to remove peer'
        }
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    formatDate(dateStr?: string): string {
      return dateStr ? formatDate(dateStr) : 'Never'
    },

    toggleAddForm() {
      this.showAddForm = !this.showAddForm
      if (!this.showAddForm) {
        this.newPeerUrl = ''
        this.newPeerName = ''
      }
    }
  }
}

// ========================================
// External Index Management
// ========================================
function externalIndexManagement() {
  return {
    externalWikis: [] as ExternalWiki[],
    loading: true,
    error: null as string | null,
    showAddForm: false,
    newWikiId: '',
    newTitle: '',
    newDescription: '',
    newAccessUrl: '',
    newTags: '',

    async init() {
      try {
        this.externalWikis = await api.getExternalIndex()
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    async addExternalWiki() {
      if (!this.newWikiId.trim() || !this.newTitle.trim() || !this.newAccessUrl.trim()) {
        this.error = 'WikiID, Title, and AccessURL are required'
        return
      }

      this.loading = true
      this.error = null

      try {
        const success = await api.addExternalWiki(
          this.newWikiId,
          this.newTitle,
          this.newDescription,
          this.newAccessUrl,
          this.newTags
        )
        if (success) {
          // Reload the list
          this.externalWikis = await api.getExternalIndex()
          this.newWikiId = ''
          this.newTitle = ''
          this.newDescription = ''
          this.newAccessUrl = ''
          this.newTags = ''
          this.showAddForm = false
        } else {
          this.error = 'Failed to add external wiki'
        }
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    async removeExternalWiki(accessUrl: string) {
      if (!confirm('Remove this external wiki?')) return

      this.loading = true
      try {
        const success = await api.removeExternalWiki(accessUrl)
        if (success) {
          this.externalWikis = this.externalWikis.filter(w => w.accessUrl !== accessUrl)
        } else {
          this.error = 'Failed to remove external wiki'
        }
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    formatDate(dateStr?: string): string {
      return dateStr ? formatDate(dateStr) : 'Never'
    },

    toggleAddForm() {
      this.showAddForm = !this.showAddForm
      if (!this.showAddForm) {
        this.newWikiId = ''
        this.newTitle = ''
        this.newDescription = ''
        this.newAccessUrl = ''
        this.newTags = ''
      }
    }
  }
}

// Register Alpine components
Alpine.data('wikiApp', wikiApp)
Alpine.data('homePage', homePage)
Alpine.data('pageView', pageView)
Alpine.data('pageEditor', pageEditor)
Alpine.data('brokenLinksAdmin', brokenLinksAdmin)
Alpine.data('orphanedPagesAdmin', orphanedPagesAdmin)
Alpine.data('statsAdmin', statsAdmin)
Alpine.data('peerManagement', peerManagement)
Alpine.data('externalIndexManagement', externalIndexManagement)

// Start Alpine
Alpine.start()

// Export for type checking
export {
  wikiApp,
  homePage,
  pageView,
  pageEditor,
  brokenLinksAdmin,
  orphanedPagesAdmin,
  statsAdmin,
  peerManagement,
  externalIndexManagement
}
