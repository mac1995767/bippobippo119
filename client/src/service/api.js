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
export const fetchAutoComplete = async ({ query, latitude, longitude }) => {
  try {
    // params 객체 조립
    const params = { query };
    if (latitude != null)  params.latitude  = latitude;
    if (longitude != null) params.longitude = longitude;

    const response = await axios.get(`${baseUrl}/api/autocomplete`, { params });
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

// 시도 경계 데이터 조회
export const fetchCtpBoundary = async (params) => {
  try {
    if (!params.lat || !params.lng) {
      throw new Error('좌표가 필요합니다.');
    }
    const response = await axios.get(`${baseUrl}/api/geo/ctp/coordinates`, {
      params: {
        lat: params.lat,
        lng: params.lng
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching ctp boundary:', error);
    throw error;
  }
};

// 시군구 경계 데이터 조회
export const fetchSigBoundary = async (params) => {
  try {
    if (!params.lat || !params.lng) {
      throw new Error('좌표가 필요합니다.');
    }
    const response = await axios.get(`${baseUrl}/api/geo/sig/coordinates`, {
      params: {
        lat: params.lat,
        lng: params.lng
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching sig boundary:', error);
    throw error;
  }
};

// 읍면동 경계 데이터 조회
export const fetchEmdBoundary = async (params) => {
  try {
    if (!params.lat || !params.lng) {
      throw new Error('좌표가 필요합니다.');
    }
    const response = await axios.get(`${baseUrl}/api/geo/emd/coordinates`, {
      params: {
        lat: params.lat,
        lng: params.lng
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching emd boundary:', error);
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

// 리 경계 데이터 조회
export const fetchLiBoundary = async (params) => {
  try {
    if (!params.lat || !params.lng) {
      throw new Error('좌표가 필요합니다.');
    }
    const response = await axios.get(`${baseUrl}/api/geo/li/coordinates`, {
      params: {
        lat: params.lat,
        lng: params.lng
      }
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching li boundary:', error);
    throw error;
  }
};

// 줌 레벨에 따른 행정구역 타입 결정
const getAreaTypeByZoom = (zoom) => {
  if (zoom >= 15) return 'ri';
  if (zoom >= 13) return 'emd';
  if (zoom >= 11) return 'sig';
  return 'ctp';
};

// 통합된 지역 요약 데이터 조회 함수
export const fetchAreaSummary = async (bounds, zoom) => {
  try {
    const areaType = getAreaTypeByZoom(zoom);
    const response = await axios.get(`${baseUrl}/api/map-summary/${areaType}`, {
      params: {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng
      }
    });
    return response.data;
  } catch (error) {
    console.error('지역 요약 데이터 조회 실패:', error);
    throw error;
  }
};

// 지역 요약 데이터 캐시 상태 확인
export const checkAreaSummaryCacheStatus = async (bounds, zoom) => {
  try {
    const areaType = getAreaTypeByZoom(zoom);
    const response = await axios.get(`${baseUrl}/api/map-summary/cache-status`, {
      params: {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng,
        zoomLevel: zoom
      }
    });
    return response.data;
  } catch (error) {
    console.error('지역 요약 데이터 캐시 상태 확인 실패:', error);
    throw error;
  }
};

// 캐시된 지역 요약 데이터 조회
export const fetchCachedAreaSummary = async (bounds, zoom) => {
  try {
    const areaType = getAreaTypeByZoom(zoom);
    const response = await axios.get(`${baseUrl}/api/map-summary/cached`, {
      params: {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng,
        zoomLevel: zoom
      }
    });
    return response.data;
  } catch (error) {
    console.error('캐시된 지역 요약 데이터 조회 실패:', error);
    throw error;
  }
};

// 경계 데이터 조회 (Redis 캐시 활용)
export const fetchBoundaryWithCache = async (boundaryId, type) => {
    try {
        const response = await axios.get(`${baseUrl}/api/boundaries/${type}/${boundaryId}`);
        return response.data;
    } catch (error) {
        console.error('경계 데이터 조회 실패:', error);
        throw error;
    }
};

// 경계 데이터 캐시 상태 확인
export const checkBoundaryCacheStatus = async (boundaryId, type) => {
    try {
        const response = await axios.get(`${baseUrl}/api/boundaries/cache-status/${type}/${boundaryId}`);
        return response.data;
    } catch (error) {
        console.error('캐시 상태 확인 실패:', error);
        throw error;
    }
};

// 경계 데이터 일괄 캐싱
export const cacheBoundariesBatch = async (boundaryIds) => {
    try {
        const response = await axios.post(`${baseUrl}/api/boundaries/cache-batch`, {
            boundaryIds
        });
        return response.data;
    } catch (error) {
        console.error('일괄 캐싱 실패:', error);
        throw error;
    }
};

// 클러스터 데이터 조회
export const fetchClusterData = async (bounds) => {
  try {
    const { sw, ne } = bounds;
    const centerLat = (sw.lat + ne.lat) / 2;
    const centerLng = (sw.lng + ne.lng) / 2;
    
    const response = await axios.get(`${baseUrl}/api/map-summary/clusters`, {
      params: {
        swLat: sw.lat,
        swLng: sw.lng,
        neLat: ne.lat,
        neLng: ne.lng,
        centerLat,
        centerLng,
        radius: 5
      }
    });
    return response.data;
  } catch (error) {
    console.error('클러스터 데이터 조회 실패:', error);
    return [];
  }
};

// 맵 클러스터 데이터 조회
export const fetchMapClusterData = async (bounds, zoomLevel) => {
  try {
    const response = await axios.get(`${baseUrl}/api/map-summary/mapCluster`, {
      params: {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng,
        zoomLevel
      }
    });
    return response.data;
  } catch (error) {
    console.error('맵 클러스터 데이터 조회 실패:', error);
    throw error;
  }
};

// 경계 geometry 데이터 조회
export const fetchBoundaryGeometry = async (boundaryType, name) => {
  try {
    const response = await axios.get(`${baseUrl}/api/map-summary/boundary-geometry`, {
      params: {
        boundaryType,
        name
      }
    });
    return response.data;
  } catch (error) {
    console.error('경계 geometry 데이터 조회 실패:', error);
    throw error;
  }
};

// 활성 공지사항 목록 가져오기
export const fetchActiveAnnouncements = async () => {
  try {
    const response = await axios.get(`${baseUrl}/api/announcements/active`);
    // 데이터 정렬은 호출하는 쪽에서 필요에 따라 수행하도록 여기서 제거할 수 있습니다.
    // 또는 여기서 정렬된 데이터를 반환할 수도 있습니다.
    // 여기서는 정렬 로직을 포함하여 반환하겠습니다.
    return response.data.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error('활성 공지사항 로딩 실패:', error);
    throw error; // 오류를 다시 throw하여 호출하는 쪽에서 처리할 수 있도록 함
  }
};

//console.log(`🔗 API Base URL: ${baseURL}`);
