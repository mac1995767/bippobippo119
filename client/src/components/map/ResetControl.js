import React, { useCallback } from 'react';
import { FaUndo } from 'react-icons/fa';

function ResetControl({ map, onReset }) {
  const handleReset = useCallback(() => {
    if (!map) return;
    
    // 초기 중심점과 줌 레벨로 이동
    const initialCenter = new window.naver.maps.LatLng(36.5, 127.8);
    map.setCenter(initialCenter);
    map.setZoom(8);

    // 부모 컴포넌트의 초기화 함수 호출
    if (onReset) {
      onReset();
    }
  }, [map, onReset]);

  return (
    <button
      onClick={handleReset}
      aria-label="초기화"
      className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
    >
      <div className="flex flex-col items-center text-sm">
        <div className="mb-1">
          <FaUndo size={18} />
        </div>
        <span className="text-xs">초기화</span>
      </div>
    </button>
  );
}

export default ResetControl; 