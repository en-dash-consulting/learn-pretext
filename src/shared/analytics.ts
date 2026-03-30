const GA_ID = 'G-7GPK6JVHS2'

export function initAnalytics() {
  if (window.location.hostname === 'localhost') return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  // gtag requires pushing the raw arguments object, not a spread array
  const w = window as typeof window & { dataLayer: IArguments[]; gtag: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  // eslint-disable-next-line prefer-rest-params
  w.gtag = function () { w.dataLayer.push(arguments as unknown as IArguments) }
  w.gtag('js', new Date())
  w.gtag('config', GA_ID)
}
