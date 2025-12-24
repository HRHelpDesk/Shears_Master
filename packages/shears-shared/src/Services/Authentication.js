import axios from 'axios';
import { BASE_URL } from '../config/api';
import { getAppHeaders } from '../config/appHeaders';

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
    time: {
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
    title: "New Scheduled Live Assignment",
    message: `You have been assigned a new live slot on ${request.date}.`,
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
