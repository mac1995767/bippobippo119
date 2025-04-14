import axios from "axios";
import { getApiUrl } from '../utils/api';

// 환경 변수에서 API URL 가져오기
const baseUrl = getApiUrl();

// 병원 목록 가져오기 (전체 조회)
export const fetchHospitals = async (params) => {
  try {
    const response = await axios.get(`${baseUrl}/api/hospitals/search`, { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching hospitals:", error);
    throw error;
  }
};

// 요양병원 목록 가져오기
export const fetchNursingHospitals = async (params) => {
  try {
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/search`, { params });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching nursing hospitals:", error);
    throw error;
  }
};

// 요양병원 상세 정보 가져오기
export const fetchNursingHospitalDetail = async (id) => {
  try {
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching nursing hospital detail:", error);
    throw error;
  }
};

// 병원 상세 정보 가져오기
export const fetchHospitalDetail = async (id) => {
  try {
    const response = await axios.get(`${baseUrl}/api/hospitals/details/search/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching hospital detail:", error);
    throw error;
  }
};

// 자동완성 API 호출
export const fetchAutoComplete = async (query) => {
  try {
    const response = await axios.get(`${baseUrl}/api/autocomplete`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching autocomplete suggestions:", error);
    throw error;
  }
};

export const fetchHospitalKeywordStats = async (hospitalId) => {
  try {
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/${hospitalId}/keyword-stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching keyword stats:', error);
    throw error;
  }
};

export const fetchHospitalReviews = async (hospitalId) => {
  try {
    console.log('Fetching reviews for hospital:', hospitalId);
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/${hospitalId}/reviews`);
    console.log('Reviews response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

//console.log(`🔗 API Base URL: ${baseURL}`);
