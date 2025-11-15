import axios from 'axios';
import { BASE_URL } from '../config/api';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from '../config/currentapp';
const API_URL = `${BASE_URL}/v1/data-records`;

export const registerUser = async (formData) => {
  console.log('register user')
  try {
    console.log('Registering user with data:', formData);
    const response = await axios.post(`${BASE_URL}/v1/auth/register`, formData);
    console.log('Registration response:', response.data);
    return response.data; // return entire response (message + user)
  } catch (error) {
    console.error('Registration failed:', error);
    if (error.response) {
      throw new Error(error.response.data.message); // throw so frontend can catch
    } else {
      throw new Error('Network error. Please try again.');
    }
  }

  

};

export async function updateUser(userId, updates, token) {
  try {
    if (!token) throw new Error("No authentication token found");
    if (!userId) throw new Error("Missing userId");

    console.log("Updating USER:", userId, updates);

    const response = await axios.put(
      `${BASE_URL}/v1/auth/update/${userId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;

  } catch (err) {
    console.error("Error updating user:", err);
    throw err.response?.data || err;
  }
}




export const login = async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/v1/auth/login`, { email, password });
      const { user, token } = response.data;
      return { user, token };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

// ✅ Helper: Get defaults from owner user
function inheritBusinessFields(ownerUser, newUser) {
  return {
    ...newUser,
    // ✅ REQUIRED → Inherit same subscriberId as owner
    subscriberId: ownerUser.subscriberId,

    // ✅ Use owner business info (for non-owners)
    businessName: ownerUser.businessName || null,
    businessWebsite: ownerUser.businessWebsite || null,
    businessAddress: ownerUser.businessAddress || null,
    membershipPlan: ownerUser.membershipPlan || null,

    // ✅ Track parent creator
    parentUserId: ownerUser.userId,
    parentSubscriberId: ownerUser.subscriberId,
  };
}

export async function createRecord(record, recordType, token, userId, subscriberId, ownerUser) {
  try {
    if (!token) throw new Error("No authentication token found");
console.log(record)
    /* ------------------------------------------------------------
       ✅ SPECIAL CASE: Creating a USER
    ------------------------------------------------------------ */
    if (recordType === "user") {
      if (!ownerUser) {
        throw new Error("Owner user context is required to create sub-users.");
      }

      // ✅ Build basic user object
      let newUser = {
        firstName: record.firstName,
        lastName: record.lastName,
        fullName: `${record.firstName} ${record.lastName}`.trim(),
        email: record.email,
        role: record.role || "barber",
        password: record.password || "Temp123!", // ✅ Temporary password
        phone: record.phone || null,
      };

      // ✅ OWNER role stays standalone
        if (newUser.role !== "owner") {
    newUser = inheritBusinessFields(ownerUser, newUser);

    // ✅ REQUIRED → match backend expectations
    newUser.parentSubscriberId = ownerUser.subscriberId;
    newUser.parentUserId = ownerUser.userId;
  }

      console.log("✅ Creating USER payload:", newUser);

      // ✅ Call backend user registration
      const response = await axios.post(
        `${BASE_URL}/v1/auth/register`,
        newUser,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    }

    /* ------------------------------------------------------------
       ✅ DEFAULT: Create a normal DataRecord
    ------------------------------------------------------------ */
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
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data;

  } catch (err) {
    console.error("❌ Error creating record:", err.response?.data || err);
    throw err.response?.data || err;
  }
}

// --- GET all records with optional filters and pagination
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
  console.log('Getting records with token:', token);
  console.log('Subscriber ID:', subscriberId, 'User ID:', userId);
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }
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

    // Remove undefined values to keep clean query params
    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);
console.log(CURRENT_APP === CURRENT_WHITE_LABEL ? CURRENT_APP : CURRENT_WHITE_LABEL)
    const { data } = await axios.get(API_URL, {
      params,
      headers: {
        'X-App-Name': CURRENT_APP === CURRENT_WHITE_LABEL ? CURRENT_APP : CURRENT_WHITE_LABEL,
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("data",data)
    return data;
  } catch (err) {
    console.error('Error fetching records:', err);
    throw err.response?.data || err;
  }
};

// --- GET a single record by ID
export const getRecordById = async (id, token) => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }
    const appName = 'shears';

    const { data } = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'X-App-Name': appName,
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (err) {
    console.error('Error fetching record:', err);
    throw err.response?.data || err;
  }
};

// --- UPDATE a record by ID
export const updateRecord = async (id, updates, token) => {
  try {
    if (!token) throw new Error("No authentication token found");
console.log("__isUser", updates.__isUser)
    // ✅ If this is a REAL user update → go to user API
    if (updates && updates.__isUser === true) {
      return await updateUser(id, updates, token);
    }

    const { data } = await axios.put(`${API_URL}/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;

  } catch (err) {
    console.error("Error updating record:", err);
    throw err.response?.data || err;
  }
};
// --- HARD DELETE a record by ID
export const deleteRecord = async (id, token, isUser = false) => {
  try {
    if (!token) throw new Error("No authentication token found");

    if (isUser) {
      // Route user deletion to proper API
      return await deleteUser(id, token);
    }

    const { data } = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        'X-App-Name': CURRENT_APP === CURRENT_WHITE_LABEL ? CURRENT_APP : CURRENT_WHITE_LABEL,
        Authorization: `Bearer ${token}`,
      },
    });

    return data;

  } catch (err) {
    console.error("Error deleting:", err);
    throw err.response?.data || err;
  }
};


// ✅ GET sub-users by subscriberId
export async function getSubUsers(subscriberId, token) {
  try {
    if (!subscriberId) throw new Error("Missing subscriberId.");
    if (!token) throw new Error("Missing authentication token.");

    const res = await axios.get(
      `${BASE_URL}/v1/auth/subusers/${subscriberId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return res.data || [];
  } catch (err) {
    console.error("Error getting sub-users:", err);
    throw err.response?.data || err;
  }
}


export async function deleteUser(userId, token) {
  try {
    if (!token) throw new Error("No authentication token found");
    if (!userId) throw new Error("Missing userId");

    console.log("Deleting USER:", userId);

    const response = await axios.delete(
      `${BASE_URL}/v1/auth/delete/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;

  } catch (err) {
    console.error("Error deleting user:", err);
    throw err.response?.data || err;
  }
}


// ✅ REQUEST RESET PASSWORD (send OTP)
export async function requestPasswordReset(email) {
  try {
    const res = await axios.post(`${BASE_URL}/v1/auth/reset-password-request`, {
      email,
    });

    return res.data;
  } catch (err) {
    console.error("Error requesting password reset:", err);
    throw err.response?.data || err;
  }
}

// ✅ VERIFY OTP
export async function verifyResetOtp(email, otp) {
  try {
    const res = await axios.post(`${BASE_URL}/v1/auth/reset-password-verify`, {
      email,
      otp,
    });

    return res.data;
  } catch (err) {
    console.error("Error verifying OTP:", err);
    throw err.response?.data || err;
  }
}

// ✅ RESET PASSWORD
export async function resetPassword(email, otp, newPassword, confirmPassword) {
  try {
    const res = await axios.post(`${BASE_URL}/v1/auth/reset-password`, {
      email,
      otp,
      newPassword,
      confirmPassword,
    });

    return res.data;
  } catch (err) {
    console.error("Error resetting password:", err);
    throw err.response?.data || err;
  }
}
