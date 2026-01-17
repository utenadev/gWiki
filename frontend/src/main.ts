import Alpine from 'alpinejs'
import { marked } from 'marked'
import type { Page, Peer, ApiError } from './types'
import { api } from './api'

// ========================================
// Shared Utilities
// ========================================
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

async function renderMarkdown(content: string): Promise<string> {
  return await marked.parse(content)
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
        this.page = await api.getPage(this.pageId)
        this.versions = await api.getPageVersions(this.pageId)
      } catch (e) {
        this.error = getErrorMessage(e)
      } finally {
        this.loading = false
      }
    },

    renderContent: renderMarkdown,
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

// Register Alpine components
Alpine.data('wikiApp', wikiApp)
Alpine.data('homePage', homePage)
Alpine.data('pageView', pageView)
Alpine.data('pageEditor', pageEditor)
Alpine.data('brokenLinksAdmin', brokenLinksAdmin)
Alpine.data('orphanedPagesAdmin', orphanedPagesAdmin)
Alpine.data('statsAdmin', statsAdmin)
Alpine.data('peerManagement', peerManagement)

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
  peerManagement
}
