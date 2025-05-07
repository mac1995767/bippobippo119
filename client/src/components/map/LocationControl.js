import React, { useState, useCallback } from 'react';
import { FaLocationArrow } from 'react-icons/fa';

function LocationControl({ map, onLocationClick }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationClick = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 위치 정보를 사용할 수 없습니다.');
      return;
    }

    if (!window.naver || !window.naver.maps) {
      alert('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    if (!map || typeof map.setCenter !== 'function') {
      console.error('지도 객체가 올바르게 전달되지 않았습니다.');
      alert('지도 객체를 찾을 수 없습니다.');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // 네이버 지도 좌표로 변환
          const naverCoord = new window.naver.maps.LatLng(latitude, longitude);
          
          // 지도 이동
          map.setCenter(naverCoord);
          map.setZoom(17);

          // 마커 생성
          new window.naver.maps.Marker({
            position: naverCoord,
            map: map,
            icon: {
              content: '<div class="current-location-marker"></div>',
              anchor: new window.naver.maps.Point(15, 15)
            }
          });

          if (onLocationClick) {
            onLocationClick(naverCoord);
          }
        } catch (error) {
          console.error('지도 조작 중 오류 발생:', error);
          alert('지도 조작 중 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('위치 정보를 가져오는데 실패했습니다:', error);
        alert('위치 정보를 가져오는데 실패했습니다.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  }, [map, onLocationClick]);

  return (
    <button
      onClick={handleLocationClick}
      disabled={isLoading}
      aria-label="내 위치"
      className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition disabled:opacity-50"
    >
      <div className="flex flex-col items-center text-sm">
        <div className="mb-1">
          <FaLocationArrow size={18} className={isLoading ? 'animate-spin' : ''} />
        </div>
        <span className="text-xs">내 위치</span>
      </div>
    </button>
  );
}

export default LocationControl; 