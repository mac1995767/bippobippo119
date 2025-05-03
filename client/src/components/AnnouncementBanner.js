import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import styled from 'styled-components';
import { useAnnouncement } from '../contexts/AnnouncementContext';

const AnnouncementBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { announcements, modalVisible, closeModal, closeDayModal } = useAnnouncement();

  const handlePrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleBannerClick = (link_url) => {
    if (link_url) {
      navigate(link_url);
    }
  };

  if (location.pathname !== '/' || announcements.length === 0 || !modalVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      <ModalOverlay visible={modalVisible} />
      <ModalWrapper visible={modalVisible}>
        <ModalInner>
          <ModalContent>
            <div 
              className="relative cursor-pointer"
              onClick={() => handleBannerClick(currentAnnouncement.link_url)}
            >
              {currentAnnouncement.image_url ? (
                <img
                  src={currentAnnouncement.image_url}
                  alt={currentAnnouncement.title}
                  className="w-full h-[500px] object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-t-lg">
                  <span className="text-gray-400">이미지 없음</span>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white text-lg font-bold">{currentAnnouncement.title}</h3>
                <p className="text-white/90 text-sm mt-1">{currentAnnouncement.content}</p>
              </div>

              {announcements.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            <ButtonContainer>
              <Button onClick={closeDayModal}>오늘 하루 닫기</Button>
              <Button onClick={closeModal}>닫기</Button>
            </ButtonContainer>
          </ModalContent>
        </ModalInner>
      </ModalWrapper>
    </>
  );
};

const ModalOverlay = styled.div`
  box-sizing: border-box;
  display: ${(props) => (props.visible ? 'block' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
`;

const ModalWrapper = styled.div`
  box-sizing: border-box;
  display: ${(props) => (props.visible ? 'block' : 'none')};
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  overflow: auto;
  outline: 0;
`;

const ModalInner = styled.div`
  box-sizing: border-box;
  position: relative;
  width: 400px;
  max-width: 400px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0 auto;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: #282828;
  padding: 15px;
  border-radius: 0 0 8px 8px;
`;

const Button = styled.button`
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export default AnnouncementBanner; 