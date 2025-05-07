import React, { useState, useCallback } from 'react';
import { FaMap } from 'react-icons/fa';

function MapStyleControl({ map, onSwitchStyle }) {
  const [mapStyle, setMapStyle] = useState('normal'); // normal, satellite, terrain

  const handleStyleChange = useCallback(() => {
    if (!map) return;
    
    const styles = ['normal', 'satellite', 'terrain'];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    const nextStyle = styles[nextIndex];
    
    setMapStyle(nextStyle);
    
    // 네이버 지도 스타일 변경
    const mapTypeId = {
      normal: window.naver.maps.MapTypeId.NORMAL,
      satellite: window.naver.maps.MapTypeId.SATELLITE,
      terrain: window.naver.maps.MapTypeId.TERRAIN
    }[nextStyle];
    
    map.setMapTypeId(mapTypeId);
    onSwitchStyle?.(nextStyle);
  }, [map, mapStyle, onSwitchStyle]);

  return (
    <button
      onClick={handleStyleChange}
      aria-label="지도스타일"
      className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
    >
      <div className="flex flex-col items-center text-sm">
        <div className="mb-1">
          <FaMap size={18} />
        </div>
        <span className="text-xs">지도스타일</span>
      </div>
    </button>
  );
}

export default MapStyleControl; 