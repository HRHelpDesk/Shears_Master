import axios from 'axios';
// import { CURRENT_APP, CURRENT_WHITE_LABEL } from './currentapp';
// import { BASE_URL } from './api';

const API_URL = `${BASE_URL}/v1/data-records`;

// --- CREATE a new record
export const createDataRecord = async (recordData, token) => {
    console.log('Creating data record with data:', recordData);
}