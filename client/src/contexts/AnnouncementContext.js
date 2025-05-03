import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

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

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/announcements/active`, { withCredentials: true });
      const activeAnnouncements = response.data.sort((a, b) => b.priority - a.priority);
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error('공지사항 로딩 실패:', error);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const closeDayModal = () => {
    setModalVisible(false);
    const expiry = new Date();
    const expiryDate = expiry.getDate();
    localStorage.setItem('AnnouncementCookie', expiryDate);
  };

  useEffect(() => {
    const VISITED_BEFORE_DATE = localStorage.getItem('AnnouncementCookie');
    const VISITED_NOW_DATE = Math.floor(new Date().getDate());

    if (VISITED_BEFORE_DATE !== null) {
      if (VISITED_BEFORE_DATE === VISITED_NOW_DATE) {
        setModalVisible(false);
      }
    }
    
    fetchAnnouncements();
  }, []);

  const value = {
    announcements,
    modalVisible,
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