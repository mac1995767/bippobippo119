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
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/hospital/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching nursing hospital detail:", error);
    throw error;
  }
};

// 병원 상세 정보 가져오기
export const fetchHospitalDetail = async (id) => {
  try {
    const response = await axios.get(`${baseUrl}/api/hospitals/detail/${id}`);
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
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/keyword-stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching keyword stats:', error);
    throw error;
  }
};

// 요양병원 리뷰 목록 조회 (페이지네이션 및 정렬 포함)
export const fetchHospitalReviews = async (hospitalId, page = 1, limit = 10, sort = 'latest') => {
  try {
    console.log('Fetching reviews for hospital:', hospitalId);
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/reviews`, {
      params: { page, limit, sort }
    });
    console.log('Reviews response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

// 요양병원 리뷰 작성
export const submitHospitalReview = async (hospitalId, reviewData) => {
  try {
    console.log('Submitting review for hospital:', hospitalId);
    const response = await axios.post(
      `${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/reviews`,
      reviewData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    console.log('Review submission response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

// 요양병원 리뷰 수정
export const updateHospitalReview = async (hospitalId, reviewId, reviewData) => {
  try {
    console.log('Updating review:', reviewId);
    const response = await axios.put(
      `${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/reviews/${reviewId}`,
      reviewData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    console.log('Review update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

// 요양병원 리뷰 삭제
export const deleteHospitalReview = async (hospitalId, reviewId) => {
  try {
    console.log('Deleting review:', reviewId);
    const response = await axios.delete(
      `${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/reviews/${reviewId}`,
      {
        withCredentials: true
      }
    );
    console.log('Review delete response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// 건강증진센터 API
export const fetchHealthCenters = async (params = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/health-centers`, { params });
    return response.data;
  } catch (error) {
    console.error('건강증진센터 목록 조회 실패:', error);
    throw error;
  }
};

export const fetchHealthCenterDetail = async (id) => {
  try {
    const response = await axios.get(`${baseUrl}/api/health-centers/${id}`);
    return response.data;
  } catch (error) {
    console.error('건강증진센터 상세 조회 실패:', error);
    throw error;
  }
};

// 전체 약국 데이터 조회 API
export const fetchAllPharmacies = async (params = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/pharmacies`, { params });
    return response.data;
  } catch (error) {
    console.error('약국 데이터 조회 실패:', error);
    throw error;
  }
};

// 약국 검색 API
export const searchPharmacies = async (params = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/pharmacies`, { params });
    return response.data;
  } catch (error) {
    console.error('약국 검색 실패:', error);
    throw error;
  }
};

//console.log(`🔗 API Base URL: ${baseURL}`);
