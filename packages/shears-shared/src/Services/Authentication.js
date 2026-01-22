import axios from 'axios';
import { BASE_URL } from '../config/api';
import { getAppHeaders } from '../config/appHeaders';
import { formatDateValue } from '../utils/stringHelpers';
const API_URL = `${BASE_URL}/v1/data-records`;

/* -------------------------------------------------------------
   AUTH: Register User
------------------------------------------------------------- */
export const registerUser = async (formData, token = null) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/auth/register`,
      formData,   // 🔥 no appConfig anymore
      { headers: getAppHeaders(token) }
    );

    return response.data;

  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error(error.response?.data?.message || "Network error");
  }
};


/* -------------------------------------------------------------
   AUTH: Update User
------------------------------------------------------------- */
export async function updateUser(userId, updates, token) {
  try {
    if (!token) throw new Error("No authentication token found");

    const response = await axios.put(
      `${BASE_URL}/v1/auth/update/${userId}`,
      updates,
      { headers: getAppHeaders(token) }
    );

    return response.data;

  } catch (err) {
    console.error("Error updating user:", err);
    throw err.response?.data || err;
  }
}


/* -------------------------------------------------------------
   AUTH: Login
------------------------------------------------------------- */
export const login = async (email, password) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/auth/login`,
      { email, password }, // 🔥 no appConfig needed
      { headers: getAppHeaders() }
    );

    return { user: response.data.user, token: response.data.token };

  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};


/* -------------------------------------------------------------
   Helper: Inherit owner fields for sub-users
------------------------------------------------------------- */
function inheritBusinessFields(ownerUser, newUser) {
  return {
    ...newUser,
    subscriberId: ownerUser.subscriberId,
    businessName: ownerUser.businessName || null,
    businessWebsite: ownerUser.businessWebsite || null,
    businessAddress: ownerUser.businessAddress || null,
    membershipPlan: ownerUser.membershipPlan || null,
    parentUserId: ownerUser.userId,
    parentSubscriberId: ownerUser.subscriberId,
  };
}


/* -------------------------------------------------------------
   CREATE RECORD (Special case: sub-users)
------------------------------------------------------------- */
export async function createRecord(
  record,
  recordType,
  token,
  userId,
  subscriberId,
  ownerUser
) {
  try {
    if (!token) throw new Error("No authentication token found");

    /* --- SPECIAL CASE: Creating a REAL USER ---------------- */
    if (recordType === "user") {
      if (!ownerUser) throw new Error("Owner user context is required");

      let newUser = {
        firstName: record.firstName,
        lastName: record.lastName,
        fullName: `${record.firstName} ${record.lastName}`.trim(),
        email: record.email,
        role: record.role || "barber",
        password: record.password || "Temp123!",
        phone: record.phone || null,
      };

      if (newUser.role !== "owner") {
        newUser = inheritBusinessFields(ownerUser, newUser);
      }

      const response = await axios.post(
        `${BASE_URL}/v1/auth/register`,
        newUser, // 🔥 no appConfig here
        { headers: getAppHeaders(token) }
      );

      return response.data;
    }

    /* --- DEFAULT: Create a DataRecord ---------------------- */
    const { data } = await axios.post(
      API_URL,
      {
        userId,
        subscriberId,
        recordType,
        fieldsData: record,
        tags: record.tags || [],
        status: "active",
      },
      { headers: getAppHeaders(token) }
    );

    return data;

  } catch (err) {
    console.error("❌ Error creating record:", err.response?.data || err);
    throw err.response?.data || err;
  }
}


/* -------------------------------------------------------------
   GET ALL RECORDS
------------------------------------------------------------- */
export const getRecords = async ({
  recordType,
  searchField,
  searchValue,
  subscriberId,
  userId,
  status,
  page = 1,
  limit = 20,
  token,
  startDate,
  endDate,
}) => {
  try {
    if (!token) throw new Error('No authentication token found');

    const params = {
      recordType,
      searchField,
      searchValue,
      status,
      page,
      limit,

      // SubscriberId ONLY used for admin
      subscriberId: subscriberId || undefined,

      // userId is NEVER overridden — used for influencer
      userId: userId || undefined,

      startDate: startDate
        ? new Date(startDate).toISOString().split("T")[0]
        : undefined,

      endDate: endDate
        ? new Date(endDate).toISOString().split("T")[0]
        : undefined,
    };
    // Remove undefined
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) delete params[key];
    });

    const { data } = await axios.get(API_URL, {
      params,
      headers: getAppHeaders(token),
    });

    return data;

  } catch (err) {
    console.error('Error fetching records:', err);
    throw err.response?.data || err;
  }
};



/* -------------------------------------------------------------
   GET SINGLE RECORD
------------------------------------------------------------- */
export const getRecordById = async (id, token) => {
  try {
    if (!token) throw new Error('No authentication token found');

    const { data } = await axios.get(
      `${API_URL}/${id}`,
      { headers: getAppHeaders(token) }
    );

    return data;

  } catch (err) {
    console.error('Error fetching record:', err);
    throw err.response?.data || err;
  }
};


/* -------------------------------------------------------------
   UPDATE RECORD
------------------------------------------------------------- */
export const updateRecord = async (id, updates, token) => {
  try {
    if (!token) throw new Error("No authentication token found");

    // Special case: user updates
    if (updates.__isUser === true) {
      console.log("Updating user via auth endpoint...");
      return await updateUser(id, updates, token);
    }

    const { data } = await axios.put(
      `${API_URL}/${id}`,
      updates,
      { headers: getAppHeaders(token) }
    );

    return data;

  } catch (err) {
    console.error("Error updating record:", err);
    throw err.response?.data || err;
  }
};


/* -------------------------------------------------------------
   DELETE RECORD
------------------------------------------------------------- */
export const deleteRecord = async (id, token, isUser = false) => {
  try {
    if (!token) throw new Error("No authentication token found");

    if (isUser) {
      return await deleteUser(id, token);
    }

    const { data } = await axios.delete(
      `${API_URL}/${id}`,
      { headers: getAppHeaders(token) }
    );

    return data;

  } catch (err) {
    console.error("Error deleting:", err);
    throw err.response?.data || err;
  }
};


/* -------------------------------------------------------------
   GET SUB USERS
------------------------------------------------------------- */
export async function getSubUsers(subscriberId, token) {
  try {
    if (!subscriberId) throw new Error("Missing subscriberId.");
    if (!token) throw new Error("Missing authentication token.");

    const res = await axios.get(
      `${BASE_URL}/v1/auth/subusers/${subscriberId}`,
      { headers: getAppHeaders(token) }
    );

    return res.data || [];

  } catch (err) {
    console.error("Error getting sub-users:", err);
    throw err.response?.data || err;
  }
}


/* -------------------------------------------------------------
   DELETE USER
------------------------------------------------------------- */
export async function deleteUser(userId, token) {
  try {
    if (!token) throw new Error("No authentication token found");
    if (!userId) throw new Error("Missing userId");

    const response = await axios.delete(
      `${BASE_URL}/v1/auth/delete/${userId}`,
      { headers: getAppHeaders(token) }
    );

    return response.data;

  } catch (err) {
    console.error("Error deleting user:", err);
    throw err.response?.data || err;
  }
}


/* -------------------------------------------------------------
   PASSWORD RESET FUNCTIONS
------------------------------------------------------------- */
export async function requestPasswordReset(email) {
  console.log(getAppHeaders());
  try {
    const res = await axios.post(
      `${BASE_URL}/v1/auth/reset-password-request`,
      { email },
      { headers: getAppHeaders() }
    );
    return res.data;
  } catch (err) {
    console.error("Error requesting password reset:", err);
    throw err.response?.data || err;
  }
}

export async function verifyResetOtp(email, otp) {
  try {
    const res = await axios.post(
      `${BASE_URL}/v1/auth/reset-password-verify`,
      { email, otp },
      { headers: getAppHeaders() }
    );
    return res.data;
  } catch (err) {
    console.error("Error verifying OTP:", err);
    throw err.response?.data || err;
  }
}

export async function resetPassword(email, otp, newPassword, confirmPassword) {
  try {
    const res = await axios.post(
      `${BASE_URL}/v1/auth/reset-password`,
      { email, otp, newPassword, confirmPassword },
      { headers: getAppHeaders() }
    );
    return res.data;
  } catch (err) {
    console.error("Error resetting password:", err);
    throw err.response?.data || err;
  }
}


/* -------------------------------------------------------------
   UPLOAD AVATAR (NO MORE appConfig!)
------------------------------------------------------------- */
export async function uploadUserAvatar(userId, file, token) {
  try {
    if (!token) throw new Error("No authentication token found");

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await axios.post(
      `${BASE_URL}/v1/avatar/${userId}/avatar`,
      formData,
      {
        headers: {
          ...getAppHeaders(token),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;

  } catch (err) {
    console.error("Avatar upload failed:", err.response?.data || err);
    throw err.response?.data || err;
  }
}


/* -------------------------------------------------------------
   MEDIA UPLOAD + DELETE
------------------------------------------------------------- */
export async function uploadImageBase64(base64, token) {
  const isWeb = typeof window !== "undefined";

  if (isWeb) {
    const res = await axios.post(
      `${BASE_URL}/v1/media/upload`,
      { base64 },
      {
        headers: {
          ...getAppHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  }

  const formData = new FormData();
  formData.append("image", {
    uri: base64,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const res = await axios.post(`${BASE_URL}/v1/media/upload`, formData, {
    headers: {
      ...getAppHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function deleteImage(public_id, token) {
  return axios.delete(`${BASE_URL}/v1/media/delete`, {
    headers: getAppHeaders(token),
    data: { public_id },
  });
}


/* -------------------------------------------------------------
   STRIPE FUNCTIONS (UNCHANGED)
------------------------------------------------------------- */
export async function connectStripeAccount(userId, token) {
  if (!token) throw new Error("Missing auth token");
  if (!userId) throw new Error("Missing userId");

  const response = await axios.post(
    `${BASE_URL}/v1/stripe/connect/${userId}`,
    {},
    { headers: getAppHeaders(token) }
  );

  return response.data.url;
}

export async function verifyStripeAccount(userId, token) {
  const res = await axios.get(
    `${BASE_URL}/v1/stripe/verify/${userId}`,
    { headers: getAppHeaders(token) }
  );
  return res.data;
}

export async function disconnectStripeAccount(userId, token) {
  const res = await axios.post(
    `${BASE_URL}/v1/stripe/disconnect/${userId}`,
    {},
    { headers: getAppHeaders(token) }
  );
  return res.data;
}

export async function createManualPaymentIntent({ amount, stripeAccountId, token }) {
  if (!token) throw new Error("Missing auth token");

  const res = await axios.post(
    `${BASE_URL}/v1/stripe/payment-intent-manual`,
    { amount, stripeAccountId },
    { headers: getAppHeaders(token) }
  );
  return res.data;
}

export async function createTerminalPaymentIntent({ amount, stripeAccountId, token }) {
  if (!token) throw new Error("Missing auth token");

  const res = await axios.post(
    `${BASE_URL}/v1/stripe/payment-intent`,
    { amount, stripeAccountId },
    { headers: getAppHeaders(token) }
  );
  return res.data;
}

export async function createPlatformPaymentIntent({ amount, membershipPlan }) {
  const res = await axios.post(
    `${BASE_URL}/v1/stripe/create-payment-intent`,
    { amount, membershipPlan },
    { headers: getAppHeaders() }
  );
  return res.data;
}

export async function getStripeTerminalToken(stripeAccountId, token) {
  if (!token) throw new Error("Missing auth token");

  const payload = { stripeAccountId };

  const res = await axios.post(
    `${BASE_URL}/v1/stripe/connection-token`,
    payload,
    { headers: getAppHeaders(token) }
  );

  return res.data.secret;
}


export function buildCalendarAndNotification(request, user, notify = true) {
  if (!request) {
    console.warn("❌ No request passed into buildCalendarAndNotification");
    return null;
  }

  console.log("🔧 Normalizing request for calendar + notification:", request);

  // ------------------------------
  // Extract influencer raw object
  // ------------------------------
  const influencer = request.influencerName?.raw || null;

  // ------------------------------
  // Extract start time + timezone
  // ------------------------------
  const startTime = request.startTimeWithZone?.time || null; // "16:00"
  const timezone = request.startTimeWithZone?.timezone || null;

  // ------------------------------
  // Compute end time based on duration
  // ------------------------------
  let endTime = null;
  try {
    if (startTime && request.duration) {
      const [sh, sm] = startTime.split(":").map(Number);
      const addMinutes =
        Number(request.duration.hours || 0) * 60 +
        Number(request.duration.minutes || 0);

      const startDate = new Date(0, 0, 0, sh, sm);
      const end = new Date(startDate.getTime() + addMinutes * 60000);

      endTime =
        `${String(end.getHours()).padStart(2, "0")}:` +
        `${String(end.getMinutes()).padStart(2, "0")}`;
    }
  } catch (err) {
    console.warn("⚠️ Failed calculating endTime:", err);
  }

  // ------------------------------
  // Extract discount code (if any)
  // ------------------------------
  const discountCode =
    request.salesCoupon?.raw?.code ||
    request.salesCoupon?.fieldsData?.code ||
    null;

  // ------------------------------
  // CALENDAR RECORD
  // ------------------------------
  const calendarRecord = {
    date: request.date || null,
    influencerName: request.influencerName,
    timeZoneTime: {
      start: startTime,
      end: endTime,
      timezone,
    },
   platforms: request.socialMediaPlatforms || [],
    assignedInfluencer: influencer
      ? {
          userId: influencer.userId,
          _id: influencer._id,
          firstName: influencer.firstName,
          lastName: influencer.lastName,
          fullName: influencer.fullName,
          avatar: influencer.avatar,
        }
      : null,

    discountCode: discountCode,
    notes: request.notes || "",
    isPrivate: request.isPrivate || false,
    requestId: request._id,

    createdBy: user?.userId || null,

    createdAt: new Date().toISOString(),
  };

  console.log("📅 Built Calendar Record:", calendarRecord);

  // ------------------------------
  // NOTIFICATION RECORD (Optional)
  // ------------------------------
  if (!notify) {
    console.log("⏭️ Notification skipped (notify = false)");
    return { calendarRecord, notificationRecord: null };
  }

  const notificationRecord = {
    forUserId: influencer?.userId || null,
    notificationName: "New Scheduled Live Assignment",
    message: `You have been assigned a new live slot on ${formatDateValue(request.date)}.`,
    relatedRecordId: request._id,
    relatedRecordType: "requests",
    createdAt: new Date().toISOString(),
    read: false,
  };

  console.log("🔔 Built Notification Record:", notificationRecord);

  return { calendarRecord, notificationRecord };
}


export async function saveCalendarAndNotification(request, user, token, notify = true) {
  try {
    // Build objects
    const { calendarRecord, notificationRecord } =
      buildCalendarAndNotification(request, user, notify);

    if (!calendarRecord) {
      console.warn("⚠️ No calendar record created.");
      return null;
    }

    console.log("📌 Saving Calendar Record:", calendarRecord);

    // --------------------------------------------
    // 1️⃣ SAVE CALENDAR RECORD
    // --------------------------------------------
    const savedCalendar = await createRecord(
      calendarRecord,
      "calendar",
      token,
      notificationRecord.userId,
      user.subscriberId,
      user // ownerUser (needed for user logic)
    );

    console.log("✅ Calendar saved:", savedCalendar);

    // --------------------------------------------
    // 2️⃣ SAVE NOTIFICATION RECORD (if notify = true)
    // --------------------------------------------
    let savedNotification = null;

    if (notify && notificationRecord) {
      console.log("🔔 Saving Notification:", notificationRecord);

      savedNotification = await createRecord(
        notificationRecord,
        "notifications",
        token,
        notificationRecord.forUserId,
        user.subscriberId,
        user
      );

      console.log("📨 Notification saved:", savedNotification);
    } else {
      console.log("⏭️ Notification skipped");
    }

    return { savedCalendar, savedNotification };

  } catch (err) {
    console.error("❌ Error saving calendar + notification:", err);
    throw err;
  }
}


// src/utils/normalizeCalendarRecord.js
import { DateTime } from 'luxon';

export function normalizeCalendarRecord(record) {
  const fd = record.fieldsData || {};
  const time = fd.time || {};

  const sourceTZ = time.timezone || 'UTC';
  const userTZ = DateTime.local().zoneName;

  const start = DateTime.fromISO(
    `${fd.date}T${time.start}`,
    { zone: sourceTZ }
  ).setZone(userTZ);

  const end = time.end
    ? DateTime.fromISO(
        `${fd.date}T${time.end}`,
        { zone: sourceTZ }
      ).setZone(userTZ)
    : null;

  return {
    id: record._id?.$oid || record._id,
    dateISO: start.toISODate(), // LOCAL YYYY-MM-DD
    start,
    end,

    startLabel: start.toFormat('h:mm a'),
    endLabel: end?.toFormat('h:mm a'),

    influencer:
      fd.influencerName?.name ||
      fd.assignedInfluencer?.fullName ||
      '—',

    service:
      (fd.platforms || []).map(p => p.platform).join(', ') || '—',

    raw: record,
  };
}

export function canSeeCalendarEvent(event, currentUser) {
  if (!event?.fieldsData || !currentUser?.userId) {
    return false;
  }

  console.log("User Role:", currentUser.role);

  // Admin check first - short circuit for performance & clarity
  if (currentUser.role === 'admin') {
    return true;
  }

  const isPrivate = !!event.fieldsData.isPrivate; // force boolean

  if (!isPrivate) {
    return true;
  }

  // Try to find creator ID from multiple possible locations
  const ownerId = 
    event.fieldsData?.influencerName?.raw?.userId ||
    event.fieldsData?.assignedInfluencer?.userId ||
    event.fieldsData?.createdBy ||
    event.createdById ||
    event.fieldsData?.createdBy; // sometimes it's here too

  // If we can't find an owner, safest is to hide it (private + no owner = suspicious)
  if (!ownerId) {
    console.warn('Private event with no owner ID:', event._id);
    return false;
  }

  return ownerId === currentUser.userId;
}

// shears-shared/src/utils/autofillHelpers.js

// shears-shared/src/utils/autofillHelpers.js

/**
 * Autofills data from a source record based on field definitions
 * @param {Object} sourceItem - The item to copy data from
 * @param {Object} currentItem - The current form data (optional, for preserving dates)
 * @param {Array} fields - Field definitions from schema
 * @param {Object} options - Configuration options
 * @returns {Object} Autofilled data object
 */
export const autofillFromRecordWithFields = (
  sourceItem,
  currentItem = {},
  fields = [],
  options = {}
) => {
  const {
    excludeFields = ["status"],           // ⭐ Explicitly exclude status
    dateFieldPatterns = [
      "date",
      "createdat",
      "updatedat",
      "scheduledat",
      "completedat",
      "startat",
      "endat",
    ],
    systemFieldPatterns = ["_id", "__v", "recordType"], // ⭐ System fields
    preserveCurrentDates = true,
  } = options;

  // Get source data
  const sourceData = sourceItem?.fieldsData || sourceItem;
  const result = { ...currentItem }; // Start with current form state (preserves defaults & existing values)

  /**
   * Check if a field should be excluded
   */
  const shouldExclude = (fieldName, fieldDef) => {
    const lowerKey = fieldName.toLowerCase();

    // System fields (exact match)
    if (systemFieldPatterns.includes(fieldName)) {
      return true;
    }

    // Explicit exclusions (exact match)
    if (excludeFields.includes(fieldName)) {
      return true;
    }

    // Date/time fields (pattern match)
    const isDateField = dateFieldPatterns.some((pattern) =>
      lowerKey.includes(pattern.toLowerCase())
    );
    if (isDateField) return true;

    // Check field definition input type
    if (fieldDef?.input === "date" || fieldDef?.input === "datetime") {
      return true;
    }

    return false;
  };

  /**
   * Process a single field
   */
  const processField = (fieldDef, parentPath = "") => {
    const { field, objectConfig, arrayConfig, input } = fieldDef;

    // ⭐ KEY CHANGE: If excluded → do NOTHING (preserve existing/current/default value)
    if (shouldExclude(field, fieldDef)) {
      console.log(`Preserving existing value for excluded field: ${field}`);
      return;
    }

    const sourceValue = sourceData[field];

    // If source doesn't have this field → also do nothing (don't clear/overwrite)
    if (sourceValue === undefined || sourceValue === null) {
      console.log(`Skipping field with no source value: ${field}`);
      return;
    }

    // Handle OBJECT fields with nested structure
    if (objectConfig && Array.isArray(objectConfig)) {
      const nestedResult = {};

      objectConfig.forEach((nestedField) => {
        const nestedValue = sourceValue[nestedField.field];

        if (nestedValue !== undefined && nestedValue !== null) {
          if (shouldExclude(nestedField.field, nestedField)) {
            return;
          }

          nestedResult[nestedField.field] = nestedValue;
        }
      });

      // Only set if we actually have some nested data
      if (Object.keys(nestedResult).length > 0) {
        result[field] = nestedResult;
      }
      return;
    }

    // Handle ARRAY fields
    if (arrayConfig?.object && Array.isArray(sourceValue)) {
      const arrayResult = [];

      sourceValue.forEach((arrayItem) => {
        const processedItem = {};

        arrayConfig.object.forEach((nestedField) => {
          const nestedValue = arrayItem[nestedField.field];

          if (nestedValue !== undefined && nestedValue !== null) {
            if (shouldExclude(nestedField.field, nestedField)) {
              return;
            }

            processedItem[nestedField.field] = nestedValue;
          }
        });

        // Only add if item has data
        if (Object.keys(processedItem).length > 0) {
          arrayResult.push(processedItem);
        }
      });

      if (arrayResult.length > 0) {
        result[field] = arrayResult;
      }
      return;
    }

    // Handle LINK SELECT fields (preserve raw data)
    if (input === "linkSelect") {
      result[field] = JSON.parse(JSON.stringify(sourceValue));
      return;
    }

    // Handle simple fields
    result[field] = sourceValue;
  };

  // Process all fields from the schema
  fields.forEach((fieldDef) => {
    processField(fieldDef);
  });

  // Preserve current date/time fields if requested (runs after main autofill)
  if (preserveCurrentDates) {
    const preservedFields = {};

    fields.forEach((fieldDef) => {
      const { field, input } = fieldDef;
      const lowerKey = field.toLowerCase();

      const isDateField =
        input === "date" ||
        input === "datetime" ||
        dateFieldPatterns.some((pattern) => lowerKey.includes(pattern.toLowerCase()));

      if (isDateField && currentItem[field]) {
        preservedFields[field] = currentItem[field];
      }
    });

    // Apply preserved dates on top
    Object.assign(result, preservedFields);
  }

  return result;
};

/**
 * Legacy autofill function (for backward compatibility)
 */
export const autofillFromRecord = (
  sourceItem,
  currentItem = {},
  options = {}
) => {
  const {
    excludeFields = ["status"], // ⭐ Explicitly exclude status
    dateFieldPatterns = [
      "date",
      "createdat",
      "updatedat",
      "scheduledat",
      "completedat",
      "startat",
      "endat",
    ],
  } = options;

  const sourceData = sourceItem?.fieldsData || sourceItem;
  const autofillData = JSON.parse(JSON.stringify(sourceData));

  const removeDateFields = (obj) => {
    if (!obj || typeof obj !== "object") return;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const lowerKey = key.toLowerCase();

      const isDateField = dateFieldPatterns.some((pattern) =>
        lowerKey.includes(pattern.toLowerCase())
      );
      const isSystemField = key === "_id" || key === "__v";
      const isExcluded = excludeFields.includes(key);

      if (isDateField || isSystemField || isExcluded) {
        delete obj[key];
      } else if (Array.isArray(value)) {
        value.forEach((item) => removeDateFields(item));
      } else if (typeof value === "object" && value !== null) {
        removeDateFields(value);
      }
    });
  };

  removeDateFields(autofillData);

  const preservedFields = {};
  Object.keys(currentItem).forEach((key) => {
    const lowerKey = key.toLowerCase();
    const isDateField = dateFieldPatterns.some((pattern) =>
      lowerKey.includes(pattern.toLowerCase())
    );

    if (isDateField && currentItem[key]) {
      preservedFields[key] = currentItem[key];
    }
  });

  return {
    ...autofillData,
    ...preservedFields,
  };
};

/**
 * Check if a field should be excluded from autofill
 */
export const isExcludedField = (fieldName, patterns = []) => {
  const lowerKey = fieldName.toLowerCase();
  return patterns.some((pattern) => lowerKey.includes(pattern.toLowerCase()));
};

/**
 * Extract date fields from an object
 */
export const extractDateFields = (obj, datePatterns = ["date"]) => {
  const dateFields = {};

  const extract = (source, target, prefix = "") => {
    if (!source || typeof source !== "object") return;

    Object.keys(source).forEach((key) => {
      const value = source[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const lowerKey = key.toLowerCase();

      const isDateField = datePatterns.some((pattern) =>
        lowerKey.includes(pattern.toLowerCase())
      );

      if (isDateField) {
        target[key] = value;
      } else if (typeof value === "object" && !Array.isArray(value)) {
        if (!target[key]) target[key] = {};
        extract(value, target[key], fullKey);
      }
    });
  };

  extract(obj, dateFields);
  return dateFields;
};