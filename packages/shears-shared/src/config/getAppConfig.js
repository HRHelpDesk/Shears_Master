import { AppData } from '../AppData/AppNavigation.js';


export function getAppConfig(appName, whiteLabelName = null) {
  const app = AppData.find(a => a.appName === appName);
  if (!app) return null;

  const whiteLabel = app.whiteLabels.find(w => w.whiteLabel === (whiteLabelName || app.defaultWhiteLabel));
  return {
    ...app,
    logo: whiteLabel.logo,
    themeColors: whiteLabel.themeColors,
  };
}
