import React from 'react';
import { FaSchool, FaRuler, FaPlane, FaStreetView, FaEdit, FaStore, FaHandshake, FaSatellite } from 'react-icons/fa';
import { BsFillPinAngleFill } from 'react-icons/bs';
import { MdOutlineKeyboardArrowUp } from 'react-icons/md';

function MapToolbar({ onZoomIn, onZoomOut }) {
  const buttons = [
    { label: '개발', icon: <BsFillPinAngleFill size={18} /> },
    { label: '학군', icon: <FaSchool size={18} /> },
    { label: '편의', icon: <FaStore size={18} /> },
    { label: '중개사', icon: <FaHandshake size={18} /> },
    { label: '거리재기', icon: <FaRuler size={18} /> },
    { label: '항공뷰', icon: <FaPlane size={18} /> },
    { label: '거리뷰', icon: <FaStreetView size={18} /> },
    { label: '지적편집도', icon: <FaEdit size={18} /> },
    { label: '위성뷰', icon: <FaSatellite size={18} /> },
  ];

  return (
    <div className="absolute right-2 top-40 z-30 flex flex-col gap-2">
      {/* 툴바 영역 */}
      <div className="bg-white rounded-md shadow-md border border-gray-300 overflow-hidden">
        <div className="bg-purple-500 text-white text-sm font-semibold text-center py-1">단지</div>
        <div className="flex flex-col">
          {buttons.map((btn, index) => (
            <button
              key={index}
              className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
              aria-label={btn.label}
            >
              <div className="flex flex-col items-center text-sm">
                <div className="mb-1">{btn.icon}</div>
                <span className="text-xs">{btn.label}</span>
              </div>
            </button>
          ))}
          <button className="flex items-center justify-center w-14 h-10 hover:bg-gray-100">
            <MdOutlineKeyboardArrowUp size={20} />
          </button>
        </div>
      </div>

      {/* 확대/축소 버튼 */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onZoomIn}
          className="w-11 h-11 rounded-md bg-white shadow border border-gray-300 flex items-center justify-center text-2xl font-bold active:scale-95 transition"
          aria-label="지도 확대"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className="w-11 h-11 rounded-md bg-white shadow border border-gray-300 flex items-center justify-center text-2xl font-bold active:scale-95 transition"
          aria-label="지도 축소"
        >
          -
        </button>
      </div>
    </div>
  );
}

export default MapToolbar;
