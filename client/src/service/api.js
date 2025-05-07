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
    console.error('병원 상세 정보 조회 실패:', error);
    throw error;
  }
};

// 자동완성 API
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
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/reviews`, {
      params: { page, limit, sort }
    });
    return response.data;
  } catch (error) {
    console.error('병원 리뷰 조회 실패:', error);
    throw error;
  }
};

// 요양병원 리뷰 작성
export const submitHospitalReview = async (hospitalId, reviewData) => {
  try {
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
    return response.data;
  } catch (error) {
    console.error('리뷰 작성 실패:', error);
    throw error;
  }
};

// 요양병원 리뷰 수정
export const updateHospitalReview = async (hospitalId, reviewId, reviewData) => {
  try {
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
    return response.data;
  } catch (error) {
    console.error('리뷰 수정 실패:', error);
    throw error;
  }
};

// 요양병원 리뷰 삭제
export const deleteHospitalReview = async (hospitalId, reviewId) => {
  try {
    const response = await axios.delete(
      `${baseUrl}/api/nursing-hospitals/hospital/${hospitalId}/reviews/${reviewId}`,
      {
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('리뷰 삭제 실패:', error);
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

// 위치 기반 병원 검색
export const fetchNearbyHospitals = async (latitude, longitude, distance = 1000) => {
  try {
    const response = await axios.post(`${baseUrl}/api/autocomplete/nearby`, {
      latitude,
      longitude,
      radius: distance
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching nearby hospitals:", error);
    throw error;
  }
};

// 요양병원 자동완성 API
export const fetchNursingHospitalAutoComplete = async (query) => {
  try {
    const response = await axios.get(`${baseUrl}/api/nursing-hospitals/autoComplete`, {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching nursing hospital autocomplete:", error);
    throw error;
  }
};

export const fetchMapData = async () => {
  const res = await axios.get('/api/map-data');
  return res.data;
};

// type별 map 데이터 조회
export const fetchMapTypeData = async (type, bounds = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/map/map-data`, { params: { type, ...bounds } });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching map type data:', error);
    throw error;
  }
};

// 지도 검색 API
export const searchLocation = async (query) => {
  try {
    const response = await axios.get(`${baseUrl}/api/map/search?query=${query}`);
    return response.data;
  } catch (error) {
    console.error('위치 검색 실패:', error);
    throw error;
  }
};

// 시도별 병원/약국 요약 데이터 가져오기
export const fetchMapSummary = async () => {
  try {
    const response = await axios.get(`${baseUrl}/api/map/summary`);
    return response.data;
  } catch (error) {
    console.error('지도 요약 데이터 조회 실패:', error);
    throw error;
  }
};

// 시군구별 병원/약국 요약 데이터 가져오기
export const fetchMapSummarySggu = async () => {
  try {
    const response = await axios.get(`${baseUrl}/api/map/summary-sggu`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching map summary sggu:', error);
    throw error;
  }
};

// 시도별 좌표+집계
export const fetchSidoSummary = async () => {
  const res = await axios.get(`${baseUrl}/api/map/sido-summary`);
  return res.data;
};

// 시군구별 좌표+집계 (바운드 파라미터 지원)
export const fetchSgguSummary = async (params = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/map/sggu-summary`, { 
      params: {
        swLat: params.swLat,
        swLng: params.swLng,
        neLat: params.neLat,
        neLng: params.neLng,
        lat: params.lat,
        lng: params.lng,
        zoom: params.zoom
      }
    });
    return response.data;
  } catch (error) {
    console.error('시군구 요약 데이터 조회 실패:', error);
    throw error;
  }
};

// 읍면동별 좌표+집계 (바운드 파라미터 지원)
export const fetchEmdongSummary = async (params = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/map/emdong-summary`, { 
      params: {
        swLat: params.swLat,
        swLng: params.swLng,
        neLat: params.neLat,
        neLng: params.neLng,
        lat: params.lat,
        lng: params.lng,
        zoom: params.zoom
      }
    });
    return response.data;
  } catch (error) {
    console.error('읍면동 요약 데이터 조회 실패:', error);
    throw error;
  }
};

// GeoJSON 경계 데이터 받아오기
export const fetchGeoBoundary = async (regionName) => {
  try {
    const response = await axios.get(`${baseUrl}/api/geo/sggu`, {
      params: { regionName }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching geo boundary:', error);
    throw error;
  }
};

export const fetchMedicalStats = async () => {
  try {
    const response = await axios.get(`${baseUrl}/api/map_data/stats`);
    console.log('의료기관 통계 데이터:', response.data);
    return response.data;
  } catch (error) {
    console.error('의료기관 통계 데이터 조회 실패:', error);
    throw error;
  }
};

//console.log(`🔗 API Base URL: ${baseURL}`);
