// src/main.jsx
import { StrictMode, useEffect } from 'react'  // ← add useEffect if not already
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Config & maps (adjust import paths as needed)
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp'
import { faviconMap } from '../src/config/component-mapping/favicon-map'
import { titleMap } from '../src/config/component-mapping/title-map' // ← new import

const defaultFavicon = '/favicon.ico'      // adjust to your default
const defaultTitle   = 'Dashboard'         // or whatever base name you want

function configureAppBranding() {
  const app = CURRENT_APP
  const whiteLabel = CURRENT_WHITE_LABEL
  console.log(`Configuring branding for ${app}/${whiteLabel}`)

  // ── Title logic ───────────────────────────────────────
  let pageTitle = defaultTitle

  const appTitles = titleMap[app]
  if (appTitles) {
    pageTitle = appTitles[whiteLabel] || appTitles[app] || appTitles.default || defaultTitle
  } else if (titleMap.default) {
    pageTitle = titleMap.default
  }

  document.title = pageTitle
  console.log(`Page title set to: "${pageTitle}" for ${app}/${whiteLabel}`)

  // ── Favicon logic (same as before) ────────────────────
  let faviconUrl = null
  const appFavicons = faviconMap[app]

  if (appFavicons) {
    faviconUrl = appFavicons[whiteLabel] || appFavicons[app]
  }

  if (!faviconUrl) {
    faviconUrl = defaultFavicon
    console.warn(`No favicon for ${app}/${whiteLabel} — using default`)
  }

  const cacheBustedUrl = `${faviconUrl}?v=${Date.now()}`

  let link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = cacheBustedUrl
  link.type = 'image/x-icon' // or png/svg as appropriate

  // Optional apple-touch-icon
  let appleLink = document.querySelector('link[rel="apple-touch-icon"]')
  if (!appleLink) {
    appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.sizes = '180x180'
    document.head.appendChild(appleLink)
  }
  appleLink.href = cacheBustedUrl

  console.log(`Favicon set: ${cacheBustedUrl}`)
}

// Root wrapper to run once
function Root() {
  useEffect(() => {
    configureAppBranding()
  }, []) // empty deps = run once on mount

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)