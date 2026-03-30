export interface NavPage {
  slug: string
  title: string
  href: string
}

export interface NavTrack {
  title: string
  pages: NavPage[]
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function href(path: string): string {
  return path === '/' ? `${BASE}/` : `${BASE}${path}`
}

export const tracks: NavTrack[] = [
  {
    title: 'Foundations',
    pages: [
      { slug: 'home', title: 'Home', href: href('/') },
      { slug: 'why-pretext', title: 'Why Pretext', href: href('/pages/why-pretext.html') },
      { slug: 'getting-started', title: 'Getting Started', href: href('/pages/getting-started.html') },
    ],
  },
  {
    title: 'Core Patterns',
    pages: [
      { slug: 'accordion', title: 'Accordion', href: href('/pages/accordion.html') },
      { slug: 'bubbles', title: 'Chat Bubbles', href: href('/pages/bubbles.html') },
      { slug: 'masonry', title: 'Masonry', href: href('/pages/masonry.html') },
      { slug: 'balanced-text', title: 'Balanced Text', href: href('/pages/balanced-text.html') },
      { slug: 'pipeline', title: 'The Pipeline', href: href('/pages/pipeline.html') },
    ],
  },
  {
    title: 'Advanced',
    pages: [
      { slug: 'rich-api', title: 'Rich API', href: href('/pages/rich-api.html') },
      { slug: 'editorial', title: 'Editorial Layout', href: href('/pages/editorial.html') },
      { slug: 'virtualized', title: 'Virtualized Lists', href: href('/pages/virtualized.html') },
      { slug: 'canvas', title: 'Canvas Rendering', href: href('/pages/canvas.html') },
      { slug: 'i18n', title: 'i18n Deep Dive', href: href('/pages/i18n.html') },
    ],
  },
  {
    title: 'Creative',
    pages: [
      { slug: 'kinetic', title: 'Kinetic Typography', href: href('/pages/kinetic.html') },
      { slug: 'ascii-art', title: 'ASCII Art', href: href('/pages/ascii-art.html') },
      { slug: 'text-physics', title: 'Text Physics', href: href('/pages/text-physics.html') },
      { slug: 'ascii-tanks', title: 'ASCII Tanks', href: href('/pages/ascii-tanks.html') },
      { slug: 'text-rain', title: 'Text Rain', href: href('/pages/text-rain.html') },
    ],
  },
  {
    title: 'Reference',
    pages: [
      { slug: 'api-reference', title: 'API Reference', href: href('/pages/api-reference.html') },
      { slug: 'performance', title: 'Performance Guide', href: href('/pages/performance.html') },
      { slug: 'caveats', title: 'Caveats & Recipes', href: href('/pages/caveats.html') },
      { slug: 'accessibility', title: 'Accessibility', href: href('/pages/accessibility.html') },
      { slug: 'about', title: 'About This Site', href: href('/pages/about.html') },
    ],
  },
]

const allPages = tracks.flatMap(t => t.pages)

export function getBase(): string {
  return BASE
}

export function getCurrentSlug(): string {
  const path = window.location.pathname
  const stripped = path.replace(BASE, '')
  if (stripped === '/' || stripped === '/index.html' || stripped === '') return 'home'
  const match = stripped.match(/\/pages\/(.+)\.html/)
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
