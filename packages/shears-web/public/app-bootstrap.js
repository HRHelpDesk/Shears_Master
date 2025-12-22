// src/app-bootstrap.js (or wherever you want to place this logic)
// ... other imports ...

import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { faviconMap } from '../src/config/component-mapping/favicon-map';



/**
 * Sets the favicon based on CURRENT_APP and CURRENT_WHITE_LABEL.
 * Falls back to a default if no match is found.
 */
function setFavicon() {
  // Get the current app and white-label
  const app = CURRENT_APP;                // e.g., 'shear' or 'influencerapp'
  const whiteLabel = CURRENT_WHITE_LABEL; // e.g., 'shear', 'purpose', 'influencerapp'

  // Look up in the map
  const appFavicons = faviconMap[app];
  let faviconUrl = null;

  if (appFavicons) {
    // First try exact white-label match
    faviconUrl = appFavicons[whiteLabel];
    
    // If not found, fall back to the default (often same as the app name)
    if (!faviconUrl && appFavicons[app]) {
      faviconUrl = appFavicons[app];
    }
  }

  // Optional: Ultimate fallback to a generic favicon
  if (!faviconUrl) {
    faviconUrl = shearFav; // or a default like '/favicon.ico'
    console.warn(`No favicon found for app=${app}, whiteLabel=${whiteLabel}. Using default.`);
  }

  // Cache-busting to force browser reload on white-label change
  const cacheBustedUrl = `${faviconUrl}?v=${Date.now()}`;

  // Update or create the favicon link
  let link = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.href = cacheBustedUrl;
  link.type = 'image/x-icon'; // Adjust if using PNG/SVG etc.

  // Optional: Add apple-touch-icon support (same logic)
  const appleLink = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleLink) {
    appleLink.href = cacheBustedUrl; // Or provide a separate apple icon if needed
  } else {
    // Create if you want to support iOS
    const newApple = document.createElement('link');
    newApple.rel = 'apple-touch-icon';
    newApple.sizes = '180x180';
    newApple.href = cacheBustedUrl;
    document.head.appendChild(newApple);
  }

  console.log(`Set favicon for ${app}/${whiteLabel}: ${cacheBustedUrl}`);
}

// Call this function during bootstrap
setFavicon();

// ... rest of your bootstrap code ...