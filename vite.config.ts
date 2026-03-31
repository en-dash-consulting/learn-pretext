import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'why-pretext': resolve(__dirname, 'pages/why-pretext.html'),
        'getting-started': resolve(__dirname, 'pages/getting-started.html'),
        accordion: resolve(__dirname, 'pages/accordion.html'),
        bubbles: resolve(__dirname, 'pages/bubbles.html'),
        masonry: resolve(__dirname, 'pages/masonry.html'),
        'balanced-text': resolve(__dirname, 'pages/balanced-text.html'),
        pipeline: resolve(__dirname, 'pages/pipeline.html'),
        'rich-api': resolve(__dirname, 'pages/rich-api.html'),
        editorial: resolve(__dirname, 'pages/editorial.html'),
        virtualized: resolve(__dirname, 'pages/virtualized.html'),
        canvas: resolve(__dirname, 'pages/canvas.html'),
        i18n: resolve(__dirname, 'pages/i18n.html'),
        kinetic: resolve(__dirname, 'pages/kinetic.html'),
        'ascii-art': resolve(__dirname, 'pages/ascii-art.html'),
        'text-physics': resolve(__dirname, 'pages/text-physics.html'),
        'ascii-tanks': resolve(__dirname, 'pages/ascii-tanks.html'),
        'text-rain': resolve(__dirname, 'pages/text-rain.html'),
        'text-tetris': resolve(__dirname, 'pages/text-tetris.html'),
        'text-flood': resolve(__dirname, 'pages/text-flood.html'),
        'breaking-spaces': resolve(__dirname, 'pages/breaking-spaces.html'),
        'api-reference': resolve(__dirname, 'pages/api-reference.html'),
        performance: resolve(__dirname, 'pages/performance.html'),
        caveats: resolve(__dirname, 'pages/caveats.html'),
        accessibility: resolve(__dirname, 'pages/accessibility.html'),
        about: resolve(__dirname, 'pages/about.html'),
      },
    },
  },
})
