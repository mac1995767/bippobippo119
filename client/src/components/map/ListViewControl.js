import React, { useState, useCallback } from 'react';
import { FaListUl, FaTimes } from 'react-icons/fa';

function ListViewControl({ hospitals, pharmacies, onItemClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleItemClick = useCallback((item) => {
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label="목록 보기"
        className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
      >
        <div className="flex flex-col items-center text-sm">
          <div className="mb-1">
            <FaListUl size={18} />
          </div>
          <span className="text-xs">목록</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-16 top-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">주변 의료기관 목록</h3>
            <button
              onClick={handleToggle}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {/* 병원 목록 */}
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">병원 ({hospitals.length})</h4>
              <div className="space-y-2">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.ykiho || `${hospital.yadmNm}_${hospital.location?.lat}_${hospital.location?.lon}`}
                    onClick={() => handleItemClick(hospital)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="font-medium text-gray-900">{hospital.yadmNm || hospital.name}</div>
                    <div className="text-sm text-gray-600">{hospital.addr || hospital.address}</div>
                    <div className="text-xs text-gray-500 mt-1">{hospital.clCdNm || '병원'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 약국 목록 */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">약국 ({pharmacies.length})</h4>
              <div className="space-y-2">
                {pharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.ykiho || `${pharmacy.name}_${pharmacy.lat}_${pharmacy.lng}`}
                    onClick={() => handleItemClick(pharmacy)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="font-medium text-gray-900">{pharmacy.name}</div>
                    <div className="text-sm text-gray-600">{pharmacy.addr || pharmacy.address}</div>
                    <div className="text-xs text-gray-500 mt-1">약국</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ListViewControl; 