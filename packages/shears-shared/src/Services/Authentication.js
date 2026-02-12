import axios from 'axios';
import { BASE_URL } from '../config/api';
import { getAppHeaders } from '../config/appHeaders';
import { formatDateValue, formatPhoneNumber } from '../utils/stringHelpers';
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

      // Start with all fields from the record
      let newUser = {
        ...record,
        // Ensure required fields are present
        fullName: `${record.firstName || ''} ${record.lastName || ''}`.trim(),
        email: record.email,
        role: record.role || "barber",
        password: record.password || "Temp123!",
      };
console.log('Creating new user:', newUser);
      // Inherit business fields if not owner
      if (newUser.role !== "owner") {
        newUser = inheritBusinessFields(ownerUser, newUser);
      }

      const response = await axios.post(
        `${BASE_URL}/v1/auth/register`,
        newUser,
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


export function buildCalendarAndNotification(request, user, notify = true, message) {
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
  const startTime = request.startTimeWithZone?.time || null;
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
  // Normalize Dates (single or multi)
  // ------------------------------
  const dates = Array.isArray(request.date)
    ? request.date
    : request.date
    ? [request.date]
    : [];

  if (!dates.length) {
    console.warn("⚠️ No dates provided in request.");
    return null;
  }

  // ------------------------------
  // CALENDAR RECORDS (one per date)
  // ------------------------------
  const calendarRecords = dates.map((date) => ({
    date,
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
    products: request.products || [],
    notes: request.notes || "",
    isPrivate: request.isPrivate || false,
    requestId: request._id,
    createdBy: user?.userId || null,
    createdAt: new Date().toISOString(),
  }));

  console.log("📅 Built Calendar Records:", calendarRecords);

  // ------------------------------
  // NOTIFICATION RECORD (Optional)
  // ------------------------------
  if (!notify) {
    console.log("⏭️ Notification skipped (notify = false)");
    return { calendarRecords, notificationRecord: null };
  }

  const notificationRecord = {
    forUserId: influencer?.userId || null,
    notificationName: "New Scheduled Live Assignment",
    message,
    relatedRecordId: request._id,
    relatedRecordType: "requests",
    createdAt: new Date().toISOString(),
    read: false,
  };

  console.log("🔔 Built Notification Record:", notificationRecord);

  return { calendarRecords, notificationRecord };
}



export async function saveCalendarAndNotification(
  request,
  user,
  token,
  notify = true,
  message
) {
  try {
    const result = buildCalendarAndNotification(
      request,
      user,
      notify,
      message
    );

    if (!result || !result.calendarRecords?.length) {
      console.warn("⚠️ No calendar records created.");
      return null;
    }

    const { calendarRecords, notificationRecord } = result;

    console.log("📌 Saving Calendar Records...");

    // --------------------------------------------
    // 1️⃣ SAVE CALENDAR RECORDS (Parallel)
    // --------------------------------------------
    const savedCalendars = await Promise.all(
      calendarRecords.map((record) =>
        createRecord(
          record,
          "calendar",
          token,
          notificationRecord?.forUserId,
          user.subscriberId,
          user
        )
      )
    );

    console.log("✅ All calendar records saved:", savedCalendars);

    // --------------------------------------------
    // 2️⃣ SAVE NOTIFICATION RECORD (Optional)
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

      // --------------------------------------------
      // 3️⃣ SEND EMAIL TRIGGER
      // --------------------------------------------
      try {
        console.log(`📧 Triggering notification email...`);

        const response = await axios.post(
          `${BASE_URL}/v1/notification/send`,
          {
            notification: notificationRecord,
            subscriberId: user.subscriberId,
            forUserId: notificationRecord.forUserId,
          },
          { headers: getAppHeaders(token) }
        );

        console.log("📬 Email trigger response:", response.data);
      } catch (emailErr) {
        console.error("⚠️ Email trigger failed:", emailErr);
        // Do not throw — calendar + notification already saved
      }
    } else {
      console.log("⏭️ Notification skipped");
    }

    return { savedCalendars, savedNotification };

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

export async function sendRejectionNotification(
  request,
  user,
  token,
  message = "Your request was rejected."
) {
  try {
    if (!message || message.trim() === "") {
      console.warn("⚠️ Rejection message is empty. Skipping notification.");
      return null;
    }
console.log("request", request);  
    // Build notification record
    const notificationRecord = {
      title: `Request Rejected: ${
  Array.isArray(request.date) && request.date.length > 0
    ? request.date.map(d => formatDateValue(d)).join(", ")
    : "Your Request"
}`,
      message,
      forUserId: request?.influencerName?.raw?.userId || request?.createdBy,
     relatedRecordType: "requests",
      createdAt: new Date().toISOString(),
      read: false,
    };

    console.log("🔔 Saving Rejection Notification:", notificationRecord);

    // Save notification in DB
    const savedNotification = await createRecord(
      notificationRecord,
      "notifications",
      token,
      notificationRecord.forUserId,
      user.subscriberId,
      user
    );

    console.log("📨 Rejection Notification saved:", savedNotification);

    // Trigger email
    try {
      const response = await axios.post(
        `${BASE_URL}/v1/notification/send`,
        {
          notification: notificationRecord,
          subscriberId: user.subscriberId,
          forUserId: notificationRecord.forUserId,
        },
        { headers: getAppHeaders(token) }
      );

      console.log("📧 Rejection email triggered:", response.data);
    } catch (emailErr) {
      console.error("⚠️ Email trigger failed:", emailErr);
      // Do not throw — record already saved
    }

    return savedNotification;
  } catch (err) {
    console.error("❌ Error sending rejection notification:", err);
    throw err;
  }
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
  const { field, override, objectConfig, arrayConfig, input } = fieldDef;

  // ⭐ Check if field has an override
  const actualFieldName = override?.field || field;

  // ⭐ KEY CHANGE: If excluded → do NOTHING (preserve existing/current/default value)
  if (shouldExclude(actualFieldName, fieldDef)) {
    console.log(`Preserving existing value for excluded field: ${actualFieldName}`);
    return;
  }

  // ⭐ Look for the value using the override field name if it exists
  const sourceValue = sourceData[actualFieldName];

  // If source doesn't have this field → also do nothing (don't clear/overwrite)
  if (sourceValue === undefined || sourceValue === null) {
    console.log(`Skipping field with no source value: ${actualFieldName}`);
    return;
  }

  if (input === "linkSelect" && Array.isArray(sourceValue)) {
  // For linkSelect arrays, copy the full objects (deep clone)
  result[field] = JSON.parse(JSON.stringify(sourceValue));
  return;
}

  // ⭐ Handle IMAGE fields (array of {url, public_id} objects)
  if (input === "image" && Array.isArray(sourceValue)) {
    result[field] = JSON.parse(JSON.stringify(sourceValue));
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


export const searchProducts = async (query, first = 25, token = null) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/shopify/search-products`,
      { query, first },
      { headers: getAppHeaders(token) }
    );

    if (!Array.isArray(response.data)) {
      console.warn("Unexpected searchProducts response:", response.data);
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("searchProducts failed:", error);
    throw new Error(
      error.response?.data?.message || "Failed to search products"
    );
  }
};

/* =========================================================
   GET PRODUCT BY BARCODE
   → POST /v1/shopify/product-by-barcode
========================================================= */
export const getProductByBarcode = async (barcode, token = null) => {
  if (!barcode) {
    throw new Error("Barcode is required");
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/shopify/product-by-barcode`,
      { barcode },
      { headers: getAppHeaders(token) }
    );

    if (!response.data) {
      throw new Error("No data returned from product-by-barcode");
    }

    return response.data;
  } catch (error) {
    console.error("getProductByBarcode failed:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch product by barcode"
    );
  }
};


/* ============================================================
   contactImporter.js
   
   Utility for parsing CSV data and creating contact records
   in the proper fieldsData format.
============================================================ */


/**
 * Split a full name into firstName and lastName
 * Handles various formats and edge cases
 */

/**
 * Score a contact by how complete it is
 * Higher score = better record
 */
function scoreContact(contact) {
  let score = 0;

  if (contact.firstName) score += 1;
  if (contact.lastName) score += 1;

  if (contact.phone?.length) {
    score += contact.phone.length * 3;
  }

  if (contact.email?.length) {
    score += contact.email.length * 2;
  }

  if (contact.notes) score += 1;

  return score;
}

/**
 * Generate a unique key used to detect duplicates
 * Priority: phone > email > name
 */
function getDedupeKey(contact) {
  if (contact.phone?.length) {
    return `phone:${contact.phone[0].value}`;
  }

  if (contact.email?.length) {
    return `email:${contact.email[0].value}`;
  }

  if (contact.firstName && contact.lastName) {
    return `name:${contact.firstName.toLowerCase()}-${contact.lastName.toLowerCase()}`;
  }

  return null;
}

/**
 * Remove duplicates and keep the most complete contact
 */
function deduplicateContacts(contacts) {
  const map = new Map();
  const duplicates = [];

  contacts.forEach((contact) => {
    const key = getDedupeKey(contact);

    if (!key) {
      duplicates.push({
        contact,
        reason: 'No dedupe key',
      });
      return;
    }

    if (!map.has(key)) {
      map.set(key, contact);
      return;
    }

    const existing = map.get(key);

    if (scoreContact(contact) > scoreContact(existing)) {
      duplicates.push({ contact: existing, replacedBy: contact });
      map.set(key, contact);
    } else {
      duplicates.push({ contact });
    }
  });

  return {
    uniqueContacts: Array.from(map.values()),
    duplicates,
  };
}


function splitFullName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }

  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // First part is first name, everything else is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

/**
 * Clean and format phone number
 * Removes common formatting and ensures it's a valid string
 */
/**
 * Normalize phone number using shared formatter
 */
function formatPhone(phone) {
  if (!phone) return null;

  try {
    return formatPhoneNumber(String(phone));
  } catch {
    return null;
  }
}


/**
 * Clean and format email
 */
function formatEmail(email) {
  if (!email) return null;
  
  const cleaned = String(email).trim().toLowerCase();
  if (!cleaned || !cleaned.includes('@')) return null;

  return cleaned;
}

/**
 * Create a fieldsData object from a CSV row based on column mappings
 */
function createContactFromRow(row, columnMappings) {
  const contact = {
    firstName: '',
    lastName: '',
    phone: [],
    email: [],
    notes: '',
  };

  // Process each column mapping
  Object.keys(columnMappings).forEach((csvColumn) => {
    const fieldName = columnMappings[csvColumn];
    const value = row[csvColumn];

    if (!value || fieldName === 'skip') return;

    switch (fieldName) {
      case 'fullName': {
        const { firstName, lastName } = splitFullName(value);
        contact.firstName = firstName;
        contact.lastName = lastName;
        break;
      }

      case 'firstName':
        contact.firstName = String(value).trim();
        break;

      case 'lastName':
        contact.lastName = String(value).trim();
        break;

      case 'phone': {
        const formatted = formatPhone(value);
        if (formatted) {
          contact.phone.push({
            label: 'Mobile',
            value: formatted,
          });
        }
        break;
      }

      case 'email': {
        const formatted = formatEmail(value);
        if (formatted) {
          contact.email.push({
            label: 'Personal',
            value: formatted,
          });
        }
        break;
      }

      case 'notes':
        contact.notes = String(value).trim();
        break;

      default:
        // Unknown field, skip
        break;
    }
  });

  return contact;
}

/**
 * Validate that a contact has required fields
 */
function validateContact(contact) {
  const errors = [];

  if (!contact.firstName || !contact.firstName.trim()) {
    errors.push('First name is required');
  }

  if (!contact.lastName || !contact.lastName.trim()) {
    errors.push('Last name is required');
  }

  if (!contact.phone || contact.phone.length === 0) {
    errors.push('Phone number is required');
  }

  return errors;
}

/**
 * Main function to parse CSV data and create contact records
 * 
 * @param {Array} csvData - Parsed CSV data (array of objects)
 * @param {Object} columnMappings - Mapping of CSV columns to contact fields
 * @param {String} token - Authentication token
 * @param {String} userId - User ID
 * @param {String} subscriberId - Subscriber ID
 * @returns {Object} Results object with successful and failed imports
 */
export async function parseAndCreateContacts(
  csvData,
  columnMappings,
  token,
  userId,
  subscriberId
) {
  const results = {
    total: csvData.length,
    successful: [],
    failed: [],
    deduplicated: 0,
  };

  // ---------------------------------------------
  // 1. Convert CSV rows into contact objects
  // ---------------------------------------------
  const allContacts = csvData.map((row, index) => {
    const contact = createContactFromRow(row, columnMappings);
    contact.__row = index + 1; // track original row number
    return contact;
  });

  // ---------------------------------------------
  // 2. Deduplicate contacts (keep most complete)
  // ---------------------------------------------
  const { uniqueContacts, duplicates } = deduplicateContacts(allContacts);
  results.deduplicated = duplicates.length;

  // Track skipped duplicates
  duplicates.forEach((d) => {
    const c = d.contact;
    results.failed.push({
      name: `${c.firstName} ${c.lastName}`.trim() || `Row ${c.__row}`,
      error: 'Duplicate contact skipped (less complete)',
      row: c.__row || null,
    });
  });

  // ---------------------------------------------
  // 3. Import only unique contacts
  // ---------------------------------------------
  for (let i = 0; i < uniqueContacts.length; i++) {
    const contact = uniqueContacts[i];

    try {
      // Validate the contact
      const validationErrors = validateContact(contact);

      if (validationErrors.length > 0) {
        results.failed.push({
          name:
            `${contact.firstName} ${contact.lastName}`.trim() ||
            `Row ${contact.__row}`,
          error: validationErrors.join(', '),
          row: contact.__row || null,
        });
        continue;
      }

      // Build fieldsData object
      const fieldsData = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        address: [],
        recordType: 'contacts',
      };

      // Add notes if present
      if (contact.notes) {
        fieldsData.notes = contact.notes;
      }

      // Save contact
      const result = await createRecord(
        fieldsData,
        'contacts',
        token,
        userId,
        subscriberId
      );

      results.successful.push({
        name: `${contact.firstName} ${contact.lastName}`,
        id: result?._id || result?.id,
      });
    } catch (error) {
      console.error(
        `Error creating contact for row ${contact.__row}:`,
        error
      );

      results.failed.push({
        name:
          `${contact.firstName} ${contact.lastName}`.trim() ||
          `Row ${contact.__row}`,
        error: error.message || 'Unknown error',
        row: contact.__row || null,
      });
    }
  }

  return results;
}


/**
 * Helper function to generate a sample CSV template
 * Useful for providing users with a template to fill out
 */
export function generateSampleCSV() {
  return `First Name,Last Name,Phone,Email,Notes
John,Doe,555-123-4567,john.doe@example.com,Regular customer
Jane,Smith,555-987-6543,jane.smith@example.com,Prefers morning appointments
Bob,Johnson,555-555-5555,bob.j@example.com,New client`;
}

/**
 * Validate CSV structure before processing
 * Returns an array of issues found
 */
export function validateCSVStructure(csvData, csvHeaders) {
  const issues = [];

  if (!csvData || csvData.length === 0) {
    issues.push('CSV file is empty');
    return issues;
  }

  if (!csvHeaders || csvHeaders.length === 0) {
    issues.push('No column headers found');
    return issues;
  }

  // Check for common required fields
  const headerLower = csvHeaders.map(h => h.toLowerCase());
  const hasName = headerLower.some(h => 
    h.includes('name') || h.includes('first') || h.includes('last')
  );
  const hasPhone = headerLower.some(h => h.includes('phone'));

  if (!hasName) {
    issues.push('No name column detected. Please include First Name, Last Name, or Customer Name');
  }

  if (!hasPhone) {
    issues.push('No phone column detected. Phone number is required for contacts');
  }

  // Check for duplicate headers
  const duplicates = csvHeaders.filter((header, index) => 
    csvHeaders.indexOf(header) !== index
  );

  if (duplicates.length > 0) {
    issues.push(`Duplicate column headers found: ${duplicates.join(', ')}`);
  }

  return issues;
}

// shears-shared/src/Services/Authentication.js

export const markNotificationAsRead = async (notificationId, item, token) => {
  try {
    if (!token) throw new Error("No authentication token found");

    // Merge read into the existing fieldsData
    const updates = {
      ...item.fieldsData,  // existing fields
      read: true           // mark as read
    };

    return await updateRecord(notificationId, updates, token);

  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    throw err.response?.data || err;
  }
};


