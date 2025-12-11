import { AppData } from '../AppData/AppNavigation.js';


export function getAppConfig(appName, whiteLabelName = null) {
  console.log(AppData)
  console.log('Getting app config for:', appName, 'with white label:', whiteLabelName); 
  const app = AppData.find(a => a.appName === appName);
  console.log('Found app config:', app);
  if (!app) return null;

  const whiteLabel = app.whiteLabels.find(w => w.whiteLabel === (whiteLabelName || app.defaultWhiteLabel));
  console.log('Found white label:', whiteLabel);
  console.log('Returning app config with white label applied:', {
    ...app,
    logo: whiteLabel ? whiteLabel.logo : null,
    themeColors: whiteLabel ? whiteLabel.themeColors : null,
  });
  if (!whiteLabel) {
    console.log('White label not found, returning app config without white label specifics.');
    return app;
  }
  return {
    ...app,
    logo: whiteLabel.logo,
    themeColors: whiteLabel.themeColors,
  };
}
