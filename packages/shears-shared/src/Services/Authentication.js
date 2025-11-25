import axios from 'axios';
import { BASE_URL } from '../config/api';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from '../config/currentapp';
import { getAppHeaders } from '../config/appHeaders';

const API_URL = `${BASE_URL}/v1/data-records`;

/* -------------------------------------------------------------
   AUTH: Register User
------------------------------------------------------------- */
export const registerUser = async (formData, token = null) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/v1/auth/register`,
      formData,
      { headers: getAppHeaders(token) }
    );

    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw new Error(error.response?.data?.message || 'Network error');
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
      { email, password },
      { headers: getAppHeaders() }
    );

    const { user, token } = response.data;
    return { user, token };

  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
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
   CREATE RECORD (Special case for creating sub-users)
------------------------------------------------------------- */
export async function createRecord(record, recordType, token, userId, subscriberId, ownerUser) {
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
      subscriberId,
      userId,
    };

    Object.keys(params).forEach(
      (key) => params[key] === undefined && delete params[key]
    );

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
   GET SINGLE RECORD BY ID
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

    if (updates.__isUser === true) {
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
   PASSWORD RESET METHODS
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
   AUTH: Upload User Avatar (RN + Web Compatible)
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

    return res.data; // { avatar: "https://cloud/storage/..." }

  } catch (err) {
    console.error("Avatar upload failed:", err.response?.data || err);
    throw err.response?.data || err;
  }
}

/* -------------------------------------------------------------
   MEDIA: Upload Image
------------------------------------------------------------- */
export async function uploadImageBase64(base64, token) {
  const formData = new FormData();
  formData.append("image", {
    uri: base64,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const res = await axios.post(
    `${BASE_URL}/v1/media/upload`,
    formData,
    {
      headers: {
        ...getAppHeaders(token),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data; // { url, public_id }
}

/* -------------------------------------------------------------
   MEDIA: Delete Image
------------------------------------------------------------- */
export async function deleteImage(public_id, token) {
  return axios.delete(`${BASE_URL}/v1/media/delete`, {
    headers: getAppHeaders(token),
    data: { public_id }
  });
}


export async function connectStripeAccount(userId, token) {
  if (!userId) throw new Error("Missing userId");
  if (!token) throw new Error("Missing auth token");

  try {
    const response = await axios.post(
      `${BASE_URL}/v1/stripe/connect/${userId}`,
      {},
      { headers: getAppHeaders(token) }
    );

    if (!response.data?.url) {
      throw new Error("Stripe did not return an onboarding URL");
    }

    return response.data.url;

  } catch (err) {
    console.error("❌ Stripe Connect Error:", err.response?.data || err);
    throw err.response?.data || err;
  }
}

/* -------------------------------------------------------------
   🔵 Verify linked Stripe account
------------------------------------------------------------- */
export async function verifyStripeAccount(userId, token) {
  const res = await axios.get(
    `${BASE_URL}/v1/stripe/verify/${userId}`,
    { headers: getAppHeaders(token) }
  );

  return res.data;
}

/* -------------------------------------------------------------
   🔵 Disconnect Stripe
------------------------------------------------------------- */
export async function disconnectStripeAccount(userId, token) {
  const res = await axios.post(
    `${BASE_URL}/v1/stripe/disconnect/${userId}`,
    {},
    { headers: getAppHeaders(token) }
  );

  return res.data;
}

/* -------------------------------------------------------------
   🔵 Create Payment Intent (Manual Card Entry)
------------------------------------------------------------- */
export async function createManualPaymentIntent({
  amount,
  stripeAccountId,
  token,
}) {
  if (!amount) throw new Error("Missing amount");
  if (!stripeAccountId) throw new Error("Missing stripeAccountId");
  if (!token) throw new Error("Missing authentication token");

  const res = await axios.post(
    `${BASE_URL}/v1/stripe/payment-intent-manual`,
    { amount, stripeAccountId },
    { headers: getAppHeaders(token) }
  );

  return res.data; // { clientSecret }
}

/* -------------------------------------------------------------
   🔵 Create Terminal Payment Intent (Tap / Reader)
------------------------------------------------------------- */
export async function createTerminalPaymentIntent({
  amount,
  stripeAccountId,
  token,
}) {
  if (!amount) throw new Error("Missing amount");
  if (!stripeAccountId) throw new Error("Missing stripeAccountId");
  if (!token) throw new Error("Missing authentication token");

  const res = await axios.post(
    `${BASE_URL}/v1/stripe/payment-intent`,
    { amount, stripeAccountId },
    { headers: getAppHeaders(token) }
  );

  return res.data; 
  // { client_secret, paymentIntentId }
}

/* -------------------------------------------------------------
   🔵 Create Platform Payment Intent (App-level billing)
------------------------------------------------------------- */
export async function createPlatformPaymentIntent({
  amount,
  membershipPlan,
}) {
  const res = await axios.post(
    `${BASE_URL}/v1/stripe/create-payment-intent`,
    { amount, membershipPlan },
    { headers: getAppHeaders() }
  );

  return res.data; 
  // { clientSecret }
}


/* -------------------------------------------------------------
   🔵 Fetch Stripe Terminal Connection Token
------------------------------------------------------------- */
export async function getStripeTerminalToken(stripeAccountId, token) {
  if (!stripeAccountId) throw new Error("Missing stripeAccountId");
  if (!token) throw new Error("Missing authentication token");

  const payload = { stripeAccountId };

  console.log("🟦 [Shared] Sending Terminal Token Request:", payload);

  try {
    const res = await axios.post(
      `${BASE_URL}/v1/stripe/connection-token`,
      payload,
      { headers: getAppHeaders(token) }
    );

    console.log("🟩 [Shared] Terminal Token Response:", res.data);

    if (!res.data?.secret) {
      throw new Error("Stripe did not return a connection secret");
    }

    return res.data.secret;

  } catch (err) {
    console.error("❌ [Shared] Terminal Token Error:", err.response?.data || err);
    throw err.response?.data || err;
  }
}
