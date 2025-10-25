import axios from 'axios';
import { BASE_URL } from '../config/api';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from '../config/currentapp';
const API_URL = `${BASE_URL}/v1/data-records`;

export const registerUser = async (formData) => {
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

export const login = async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/v1/auth/login`, { email, password });
      const { user, token } = response.data;
      return { user, token };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };


  export async function createRecord(record, recordType, token, userId, subscriberId) {
  try {
    if (!token) throw new Error('No authentication token found');
    console.log(token)
    const { data } = await axios.post(
      API_URL,
      {
        userId,
        subscriberId,
        recordType,
        fieldsData: record,
        tags: record.tags || [],
        status: record.status || 'active',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (err) {
    console.error('Error creating record:', err);
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
  console.log('Updating record ID:', id, 'with updates:', updates);
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }
    const { data } = await axios.put(`${API_URL}/${id}`, updates, {
      headers: {
        'X-App-Name': CURRENT_APP === CURRENT_WHITE_LABEL ? CURRENT_APP : CURRENT_WHITE_LABEL,
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (err) {
    console.error('Error updating record:', err);
    throw err.response?.data || err;
  }
};

// --- HARD DELETE a record by ID
export const deleteRecord = async (id, token) => {
  try {
    if (!token) {
      throw new Error('No authentication token found');
    }
    const { data } = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        'X-App-Name': CURRENT_APP === CURRENT_WHITE_LABEL ? CURRENT_APP : CURRENT_WHITE_LABEL,
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  } catch (err) {
    console.error('Error deleting record:', err);
    throw err.response?.data || err;
  }
};