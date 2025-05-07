import React, { useState } from 'react';
import { FaShareAlt } from 'react-icons/fa';

function ShareControl({ map }) {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    if (!map) return;

    // 현재 지도의 상태 정보 가져오기
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    // 공유할 URL 생성
    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${center.lat()}&lng=${center.lng()}&zoom=${zoom}`;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('지도 링크가 클립보드에 복사되었습니다.');
      })
      .catch((err) => {
        console.error('클립보드 복사 실패:', err);
        alert('링크 복사에 실패했습니다.');
      });
  };

  return (
    <button
      onClick={handleShare}
      aria-label="공유하기"
      className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
    >
      <div className="flex flex-col items-center text-sm">
        <div className="mb-1">
          <FaShareAlt size={18} />
        </div>
        <span className="text-xs">공유</span>
      </div>
    </button>
  );
}

export default ShareControl; 