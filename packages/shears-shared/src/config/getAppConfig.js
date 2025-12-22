// shears-shared/src/config/getAppConfig.js
import { AppData } from '../AppData/AppNavigation';

export function getAppConfig(appName, whiteLabelName = null) {
  const app = AppData.find(a => a.appName === appName);
  if (!app) return null;

  const whiteLabel =
    app.whiteLabels?.find(
      w => w.whiteLabel === (whiteLabelName || app.defaultWhiteLabel)
    ) || null;

  if (!whiteLabel) {
    return app;
  }

  return {
    ...app,
    // 🔥 promote whitelabel properties
    displayName: whiteLabel.displayName ?? app.displayName,
    favicon: whiteLabel.favicon ?? null,
    logo: whiteLabel.logo ?? null,
    themeColors: whiteLabel.themeColors ?? null,
    whiteLabel,
  };
}
