const GA_ID = 'G-7GPK6JVHS2'

export function initAnalytics() {
  if (window.location.hostname === 'localhost') return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  const w = window as typeof window & { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function (...args: unknown[]) { w.dataLayer.push(args) }
  w.gtag('js', new Date())
  w.gtag('config', GA_ID)
}
