// src/hooks/useDynamicFavicon.js  (or put directly in main.jsx / App.jsx)
import { useEffect } from 'react';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { faviconMap } from '../config/component-mapping/favicon-map';

export function useDynamicFavicon() {
  useEffect(() => {
    const app = CURRENT_APP;
    const whiteLabel = CURRENT_WHITE_LABEL;

    let faviconUrl = null;
    const appFavicons = faviconMap[app];

    if (appFavicons) {
      faviconUrl = appFavicons[whiteLabel] || appFavicons[app];
    }

    // Ultimate fallback (adjust to your default)
    if (!faviconUrl) {
      faviconUrl = '/favicon.ico'; // or import shearFav from '...'; then shearFav
      console.warn(`No favicon for ${app}/${whiteLabel} — using default`);
    }

    // Cache bust
    const urlWithCache = `${faviconUrl}?v=${Date.now()}`;

    // Update existing link or create new
    let link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = urlWithCache;
    link.type = 'image/x-icon'; // or 'image/svg+xml' / 'image/png' etc.

    // Optional: apple-touch-icon
    let appleLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.sizes = '180x180';
      document.head.appendChild(appleLink);
    }
    appleLink.href = urlWithCache;

    console.log(`Favicon set: ${urlWithCache}`);
  }, []); // run once on mount
}