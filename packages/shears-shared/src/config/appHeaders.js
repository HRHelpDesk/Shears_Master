// src/config/appHeaders.js
import { CURRENT_APP, CURRENT_WHITE_LABEL } from './currentapp';

export function getAppHeaders(token) {
  return {
    'X-App-Name': CURRENT_APP === CURRENT_WHITE_LABEL ? CURRENT_APP : CURRENT_WHITE_LABEL,
    Authorization: token ? `Bearer ${token}` : undefined,
  };
}
