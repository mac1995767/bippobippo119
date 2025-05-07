import React from 'react';
import { FaExpand, FaCompress } from 'react-icons/fa';

function FullscreenControl({ isFullscreen, onToggleFullscreen }) {
  return (
    <button
      onClick={onToggleFullscreen}
      aria-label="전체화면"
      className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
    >
      <div className="flex flex-col items-center text-sm">
        <div className="mb-1">
          {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
        </div>
        <span className="text-xs">풀스크린</span>
      </div>
    </button>
  );
}

export default FullscreenControl; 