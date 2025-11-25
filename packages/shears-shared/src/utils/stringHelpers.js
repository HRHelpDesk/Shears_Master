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


// shears-shared/src/utils/displayHelpers.js (or wherever you keep shared functions)


/**
 * Dynamically generates a display title from an item's name fields
 * @param {Object} item - The data object to extract name from
 * @param {string} recordTypeName - The type of record (e.g., 'contacts', 'services')
 * @param {string} mode - Current mode: 'add', 'edit', or 'read'
 * @returns {string} Display title for the item
 */
export const getDisplayTitle = (item, recordTypeName, mode = 'read') => {
  // Mode override
  if (mode === 'add') {
    return `Add ${singularize(recordTypeName)}`;
  }

  if (!item) return 'Item Detail';

  // Step 1️⃣: Flatten potential name sources
  const sources = [item, ...(Object.values(item) || [])];

  // Step 2️⃣: Collect all valid name fields (like firstName, lastName, fullName)
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;

    const nameFields = Object.keys(src)
      .filter(
        key =>
          key.toLowerCase().includes('name') &&
          src[key] &&
          typeof src[key] === 'string' &&
          src[key].trim() !== ''
      )
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        // Prioritize fullName > firstName > lastName
        const rank = key => {
          if (key.includes('full')) return 0;
          if (key.includes('first')) return 1;
          if (key.includes('last')) return 2;
          return 3;
        };
        return rank(aLower) - rank(bLower);
      });

    if (nameFields.length > 0) {
      // Handle combined first + last
      if (
        nameFields.length > 1 &&
        nameFields.some(f => f.toLowerCase().includes('first')) &&
        nameFields.some(f => f.toLowerCase().includes('last'))
      ) {
        const first = nameFields.find(f => f.toLowerCase().includes('first'));
        const last = nameFields.find(f => f.toLowerCase().includes('last'));
        return `${src[first]} ${src[last]}`.trim();
      }

      // Prefer fullName if available
      const preferred =
        nameFields.find(f => f.toLowerCase().includes('full')) ||
        nameFields[0];
      return src[preferred].toString().trim();
    }
  }

  // Step 3️⃣: Handle known connected types (contact, service, product)
  const knownKeys = ['contact', 'service', 'product', 'client', 'customer'];
  for (const key of knownKeys) {
    const val = item[key];
    if (!val) continue;

    // Handle arrays like service[]
    if (Array.isArray(val) && val.length > 0 && val[0]?.name) {
      return val[0].name.toString();
    }

    // Handle objects with .name
    if (val?.name) {
      return val.name.toString();
    }
  }

  // Step 4️⃣: Fallback
  return 'Item Detail';
};


  export const formatPhoneNumber = (input = '') => {
    const digits = input.replace(/\D/g, '').slice(0, 10);
    const len = digits.length;

    if (len === 0) return '';
    if (len < 4) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };


  /** Strip non-digits except decimal */
export const cleanCurrencyString = (value = '') => {
  if (!value) return '';
  return value.replace(/[^0-9.]/g, '');
};

/** Format input as currency ($1,234.56) */
export const formatCurrency = (input = '') => {
  if (!input) return '';

  // Remove unwanted chars
  let numeric = cleanCurrencyString(input);

  // Avoid multiple decimals
  const parts = numeric.split('.');
  if (parts.length > 2) {
    numeric = parts[0] + '.' + parts[1];
  }

  // Format dollars
  let [dollars, cents] = numeric.split('.');

  // Add commas
  dollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (cents !== undefined) {
    cents = cents.slice(0, 2); // max 2 decimals
    return `$${dollars}.${cents}`;
  }

  return `$${dollars}`;
};


export const currencyToNumber = (input = '') => {
  if (!input) return 0;

  // Remove currency symbol, commas, spaces, etc.
  const cleaned = input.replace(/[^0-9.]/g, '');

  // Multiple decimal safety (e.g., "10.2.3")
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parseFloat(parts[0] + '.' + parts[1]);
  }

  return parseFloat(cleaned) || 0;
};

// ✅ Fix for YYYY-MM-DD timezone shift
export function formatAsLocalDate(val) {
  if (!val) return '';
  
  // If already in YYYY-MM-DD, do NOT convert to UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }

  // Otherwise treat normally
  const d = new Date(val);
  if (isNaN(d)) return val;

  return d.toISOString().split('T')[0];
}


export const parseYMD = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  const [_, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
};


export const formatDateValue = (value) => {
  if (!value) return "";

  const d = new Date(value);
  if (isNaN(d.getTime())) return value; // not a valid date → return raw

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
};


// shears-shared/src/utils/buildTransaction.js


export function buildTransactionFromAppointment(appointment, paymentUpdate, newID) {
  if (!appointment) {
    throw new Error("Invalid appointment object");
  }

  const fd = appointment;

  /* -------------------------------------------------------------
     1) CLIENT
  ------------------------------------------------------------- */
  const client =
    fd.contact?._id
      ? {
          _id: fd.contact._id,
          name:
            fd.contact.raw?.firstName +
            " " +
            (fd.contact.raw?.lastName || ""),
          raw: fd.contact.raw,
        }
      : null;

  /* -------------------------------------------------------------
     2) LINE ITEMS (services + products)
  ------------------------------------------------------------- */
  const serviceItems = [];

  // Services → add as line items
  if (Array.isArray(fd.service)) {
    fd.service.forEach((svc) => {
      serviceItems.push({
        description: svc.raw?.serviceName || svc.name || "Service",
        qty: svc.quantity ?? 1,
        price: currencyToNumber(svc.raw?.price || "0"),
      });
    });
  }

  // Products → add as line items
  if (Array.isArray(fd.product)) {
    fd.product.forEach((prd) => {
      serviceItems.push({
        description: prd.raw?.productName || prd.name || "Product",
        qty: prd.quantity ?? 1,
        price: currencyToNumber(prd.raw?.price || "0"),
      });
    });
  }

  /* -------------------------------------------------------------
     3) TOTAL AMOUNT
  ------------------------------------------------------------- */
  const totalAmount = currencyToNumber(fd.payment?.amount || "0");

  /* -------------------------------------------------------------
     4) PAYMENT TYPE AND RECEIPT
     paymentUpdate = {
       method: "cash" | "credit" | "venmo" | "cashapp",
       status: "Paid",
       sendReceipt: true/false
     }
  ------------------------------------------------------------- */
  const paymentType = paymentUpdate?.method
    ? paymentUpdate.method.replace(/^\w/, (c) => c.toUpperCase())
    : "Cash";

  const receiptString = paymentUpdate?.sendReceipt ? "Yes" : "No";

  /* -------------------------------------------------------------
     5) PAYMENT NAME
     Your AppData says:
       Quick Pay | Product | Service
     Since Calendar = appointment, we default to Service
  ------------------------------------------------------------- */
  const paymentName = "Service";

  /* -------------------------------------------------------------
     6) TRANSACTION OBJECT
  ------------------------------------------------------------- */
  return {
    paymentName,
    transactionId: newID,
    client,
    paymentType,
    totalAmount,
    transactionDate: new Date().toISOString().split("T")[0],
    sendReceipt: receiptString,
    notes: fd.appointmentNotes || fd.clientNotes || "",
    serviceItems,
  };
}


export const formatMoneyValue = (val) => {
  if (!val) return null;

  // Remove $ and commas
  let cleaned = String(val).replace(/[^0-9.]/g, "");

  if (!cleaned) return null;

  // Ensure two decimals
  let num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  return `$${num.toFixed(2)}`;
};
