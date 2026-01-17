import Alpine from 'alpinejs'
import { marked } from 'marked'
import type { Page, ApiError } from './types'
import { api } from './api'

// ========================================
// Global Store: Theme
// ========================================
Alpine.store('theme', {
  dark: false,

  init(this: { dark: boolean; apply: () => void }) {
    // Check localStorage or system preference
    const stored = localStorage.getItem('theme')
    if (stored) {
      this.dark = stored === 'dark'
    } else {
      this.dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    this.apply()
  },

  toggle(this: { dark: boolean; apply: () => void }) {
    this.dark = !this.dark
    this.apply()
    localStorage.setItem('theme', this.dark ? 'dark' : 'light')
  },

  apply(this: { dark: boolean }) {
    document.documentElement.classList.toggle('dark', this.dark)
  }
})

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
      })
    },

    parseRoute(hash: string) {
      return hash
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
        this.error = (e as ApiError).message || 'Failed to load pages'
      } finally {
        this.loading = false
      }
    },

    formatDate(dateStr: string): string {
      return new Date(dateStr).toLocaleDateString('ja-JP')
    }
  }
}

// ========================================
// Page View
// ========================================
function pageView(pageId: string) {
  return {
    pageId,
    page: null as Page | null,
    versions: [] as Page[],
    loading: true,
    error: null as string | null,
    showingVersions: false,

    async init() {
      try {
        this.page = await api.getPage(this.pageId)
        this.versions = await api.getPageVersions(this.pageId)
      } catch (e) {
        this.error = (e as ApiError).message || 'Failed to load page'
      } finally {
        this.loading = false
      }
    },

    async renderContent(content: string): Promise<string> {
      return await marked.parse(content)
    },

    formatDate(dateStr: string): string {
      return new Date(dateStr).toLocaleDateString('ja-JP')
    },

    toggleVersions() {
      this.showingVersions = !this.showingVersions
    },

    async deletePage() {
      if (!this.page || !confirm(`Are you sure you want to delete "${this.page.title}"?`)) {
        return
      }
      try {
        await api.deletePage(this.pageId)
        location.hash = '#/'
      } catch (e) {
        alert('Failed to delete page: ' + (e as ApiError).message)
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
          this.error = (e as ApiError).message || 'Failed to load page'
        } finally {
          this.loading = false
        }
      }
    },

    async renderContent(content: string): Promise<string> {
      return await marked.parse(content)
    },

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

        // Navigate to page view
        location.hash = `#/page/${this.pageId}`
      } catch (e) {
        this.error = (e as ApiError).message || 'Failed to save page'
        this.saving = false
      }
    },

    cancel() {
      if (this.isEditMode && this.pageId) {
        location.hash = `#/page/${this.pageId}`
      } else {
        location.hash = '#/'
      }
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
        this.error = (e as ApiError).message || 'Failed to load broken links'
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
        this.error = (e as ApiError).message || 'Failed to load orphaned pages'
      } finally {
        this.loading = false
      }
    }
  }
}

// ========================================
// Admin: Stats
// ========================================
function statsAdmin() {
  return {
    stats: null as { totalPages: number; totalLinks: number; totalTags: number; brokenLinks: number; orphanedPages: number } | null,
    loading: true,
    error: null as string | null,

    async init() {
      try {
        this.stats = await api.getStats()
      } catch (e) {
        this.error = (e as ApiError).message || 'Failed to load stats'
      } finally {
        this.loading = false
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

// Start Alpine
Alpine.start()

// Declare global window types for Alpine
declare global {
  interface Window {
    wikiApp: typeof wikiApp
    homePage: typeof homePage
    pageView: typeof pageView
    pageEditor: typeof pageEditor
    brokenLinksAdmin: typeof brokenLinksAdmin
    orphanedPagesAdmin: typeof orphanedPagesAdmin
    statsAdmin: typeof statsAdmin
  }
}

// Export for type checking
export {
  wikiApp,
  homePage,
  pageView,
  pageEditor,
  brokenLinksAdmin,
  orphanedPagesAdmin,
  statsAdmin
}
