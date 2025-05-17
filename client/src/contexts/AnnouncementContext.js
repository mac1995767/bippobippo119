import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import axios from 'axios'; // axios 직접 사용 안하므로 주석 처리 또는 제거 가능
// import { getApiUrl } from '../utils/api'; // getApiUrl 직접 사용 안하므로 주석 처리 또는 제거 가능
import { fetchActiveAnnouncements } from '../service/api'; // 새로 추가된 함수 import

const AnnouncementContext = createContext();

export const useAnnouncement = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
};

export const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [modalVisible, setModalVisible] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    console.log('fetchAnnouncements called');
    try {
      // const response = await axios.get(`${getApiUrl()}/api/announcements/active`);
      // const activeAnnouncements = response.data.sort((a, b) => b.priority - a.priority);
      const activeAnnouncements = await fetchActiveAnnouncements(); // api.js의 함수 호출
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error('공지사항 로딩 실패 (Context):', error); // 컨텍스트 레벨에서의 에러 로깅
      // 여기서 추가적인 에러 처리 (예: 사용자에게 알림)를 할 수 있습니다.
      // api.js에서 이미 콘솔 로그를 남기므로, 중복을 피하기 위해 여기서는 다른 처리를 하거나 로그를 남기지 않을 수 있습니다.
      // 우선은 컨텍스트 레벨에서도 로그를 남기도록 유지합니다.
    }
  }, []); // 의존성 배열이 비어있으므로 컴포넌트가 마운트될 때만 생성됨

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const closeDayModal = useCallback(() => {
    setModalVisible(false);
    const expiry = new Date();
    const expiryDate = expiry.getDate();
    localStorage.setItem('AnnouncementCookie', expiryDate);
  }, []);

  useEffect(() => {
    console.log('AnnouncementProvider useEffect triggered');
    const VISITED_BEFORE_DATE = localStorage.getItem('AnnouncementCookie');
    const VISITED_NOW_DATE = Math.floor(new Date().getDate());

    if (VISITED_BEFORE_DATE !== null) {
      if (VISITED_BEFORE_DATE === VISITED_NOW_DATE) {
        setModalVisible(false);
      }
    }
    
    fetchAnnouncements();
  }, [fetchAnnouncements]); // fetchAnnouncements를 의존성 배열에 추가

  const value = {
    announcements,
    modalVisible,
    setModalVisible,
    closeModal,
    closeDayModal,
    fetchAnnouncements
  };

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
}; 