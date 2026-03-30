import { describe, it, expect } from 'vitest'
import { tracks, getPageIndex, getPrevPage, getNextPage } from './nav-data'

describe('nav-data', () => {
  it('has 5 tracks', () => {
    expect(tracks).toHaveLength(5)
  })

  it('has 20 total pages', () => {
    const total = tracks.reduce((sum, t) => sum + t.pages.length, 0)
    expect(total).toBe(23)
  })

  it('track names are correct', () => {
    expect(tracks.map(t => t.title)).toEqual([
      'Foundations',
      'Core Patterns',
      'Advanced',
      'Creative',
      'Reference',
    ])
  })

  it('first page is home', () => {
    expect(tracks[0]!.pages[0]!.slug).toBe('home')
    expect(tracks[0]!.pages[0]!.href).toBe('/')
  })

  it('getPageIndex finds correct index', () => {
    expect(getPageIndex('home')).toBe(0)
    expect(getPageIndex('why-pretext')).toBe(1)
    expect(getPageIndex('accordion')).toBe(3)
  })

  it('getPrevPage returns null for first page', () => {
    expect(getPrevPage('home')).toBeNull()
  })

  it('getPrevPage returns previous page', () => {
    const prev = getPrevPage('why-pretext')
    expect(prev?.slug).toBe('home')
  })

  it('getNextPage returns next page', () => {
    const next = getNextPage('home')
    expect(next?.slug).toBe('why-pretext')
  })

  it('getNextPage crosses track boundaries', () => {
    const next = getNextPage('getting-started')
    expect(next?.slug).toBe('accordion')
  })

  it('getNextPage returns null for last page', () => {
    expect(getNextPage('about')).toBeNull()
  })

  it('all pages have valid hrefs', () => {
    for (const track of tracks) {
      for (const page of track.pages) {
        if (page.slug === 'home') {
          expect(page.href).toBe('/')
        } else {
          expect(page.href).toMatch(/^\/pages\/.+\.html$/)
        }
      }
    }
  })

  it('all slugs are unique', () => {
    const slugs = tracks.flatMap(t => t.pages.map(p => p.slug))
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
