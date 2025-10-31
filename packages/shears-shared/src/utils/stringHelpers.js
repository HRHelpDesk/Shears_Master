// utils/stringHelpers.js

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
export function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts camelCase or snake_case to CapitalizedWords
 * Example: 'firstName' -> 'First Name'
 */
export function humanizeFieldName(str) {
  if (!str) return '';
  // Replace underscores with spaces
  let result = str.replace(/_/g, ' ');
  // Add spaces before uppercase letters (for camelCase)
  result = result.replace(/([A-Z])/g, ' $1');
  // Capitalize first letter of each word
  return result
    .split(' ')
    .map((word) => capitalizeFirstLetter(word))
    .join(' ');
}


export function singularize(word) {
  if (!word) return '';

  // Common irregular plurals
  const irregulars = {
    people: 'person',
    children: 'child',
    men: 'man',
    women: 'woman',
    mice: 'mouse',
    feet: 'foot',
    teeth: 'tooth',
    geese: 'goose',
    oxen: 'ox',
  };
  if (irregulars[word.toLowerCase()]) {
    return irregulars[word.toLowerCase()];
  }

  // Simple rules
  if (word.endsWith('ies')) {
    // e.g., "companies" -> "company"
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('zes') || word.endsWith('ches') || word.endsWith('shes')) {
    // e.g., "boxes" -> "box", "bushes" -> "bush"
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    // generic: "users" -> "user"
    return word.slice(0, -1);
  }

  return word; // already singular
}

export function getContrastingTextColor(hexColor) {
  if (!hexColor) return '#fff';
  const c = hexColor.substring(1);      // remove #
  const rgb = parseInt(c, 16);          // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? '#000' : '#fff';
}


export const normalizeValue = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if ('label' in val && 'value' in val) return val.label;
    return JSON.stringify(val);
  }
  return String(val);
};

/**
 * Converts a 24-hour time string (e.g., "13:45") to 12-hour format with AM/PM.
 * @param {string} time24 - Time in "HH:MM" format (24-hour)
 * @returns {string} - Time in "h:mm AM/PM" format
 */
const formatTime12 = (time24) => {
  if (!time24 || typeof time24 !== 'string') return '12:00 AM';

  const [hours, minutes] = time24.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return '12:00 AM';

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // 0 → 12
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${paddedMinutes} ${period}`;
};

export default formatTime12;