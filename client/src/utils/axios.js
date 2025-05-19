import axios from 'axios';
import { getApiUrl } from './api';

const instance = axios.create({
  baseURL: `${getApiUrl()}/api`,
  withCredentials: true  // 쿠키를 주고받기 위해 필요
});

// 요청 인터셉터
instance.interceptors.request.use(
  (config) => {
    // 토큰은 쿠키로 자동 전송되므로 별도의 헤더 설정이 필요 없음
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 