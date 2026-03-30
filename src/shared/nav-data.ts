export interface NavPage {
  slug: string
  title: string
  href: string
}

export interface NavTrack {
  title: string
  pages: NavPage[]
}

export const tracks: NavTrack[] = [
  {
    title: 'Foundations',
    pages: [
      { slug: 'home', title: 'Home', href: '/' },
      { slug: 'why-pretext', title: 'Why Pretext', href: '/pages/why-pretext.html' },
      { slug: 'getting-started', title: 'Getting Started', href: '/pages/getting-started.html' },
    ],
  },
  {
    title: 'Core Patterns',
    pages: [
      { slug: 'accordion', title: 'Accordion', href: '/pages/accordion.html' },
      { slug: 'bubbles', title: 'Chat Bubbles', href: '/pages/bubbles.html' },
      { slug: 'masonry', title: 'Masonry', href: '/pages/masonry.html' },
      { slug: 'balanced-text', title: 'Balanced Text', href: '/pages/balanced-text.html' },
      { slug: 'pipeline', title: 'The Pipeline', href: '/pages/pipeline.html' },
    ],
  },
  {
    title: 'Advanced',
    pages: [
      { slug: 'rich-api', title: 'Rich API', href: '/pages/rich-api.html' },
      { slug: 'editorial', title: 'Editorial Layout', href: '/pages/editorial.html' },
      { slug: 'virtualized', title: 'Virtualized Lists', href: '/pages/virtualized.html' },
      { slug: 'canvas', title: 'Canvas Rendering', href: '/pages/canvas.html' },
      { slug: 'i18n', title: 'i18n Deep Dive', href: '/pages/i18n.html' },
    ],
  },
  {
    title: 'Creative',
    pages: [
      { slug: 'kinetic', title: 'Kinetic Typography', href: '/pages/kinetic.html' },
      { slug: 'ascii-art', title: 'ASCII Art', href: '/pages/ascii-art.html' },
    ],
  },
  {
    title: 'Reference',
    pages: [
      { slug: 'api-reference', title: 'API Reference', href: '/pages/api-reference.html' },
      { slug: 'performance', title: 'Performance Guide', href: '/pages/performance.html' },
      { slug: 'caveats', title: 'Caveats & Recipes', href: '/pages/caveats.html' },
      { slug: 'about', title: 'About This Site', href: '/pages/about.html' },
    ],
  },
]

const allPages = tracks.flatMap(t => t.pages)

export function getCurrentSlug(): string {
  const path = window.location.pathname
  if (path === '/' || path === '/index.html') return 'home'
  const match = path.match(/\/pages\/(.+)\.html/)
  return match?.[1] ?? 'home'
}

export function getPageIndex(slug: string): number {
  return allPages.findIndex(p => p.slug === slug)
}

export function getPrevPage(slug: string): NavPage | null {
  const idx = getPageIndex(slug)
  return idx > 0 ? allPages[idx - 1]! : null
}

export function getNextPage(slug: string): NavPage | null {
  const idx = getPageIndex(slug)
  return idx < allPages.length - 1 ? allPages[idx + 1]! : null
}

export function getTrackForSlug(slug: string): NavTrack | null {
  return tracks.find(t => t.pages.some(p => p.slug === slug)) ?? null
}
