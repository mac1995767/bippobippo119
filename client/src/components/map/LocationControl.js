import React, { useState, useCallback } from 'react';
import { FaLocationArrow } from 'react-icons/fa';

function LocationControl({ map }) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);

  const handleLocate = useCallback(async () => {
    if (!map) {
      console.error('지도 인스턴스가 없습니다.');
      return;
    }

    try {
      setIsLocating(true);
      setError(null);

      // 현재 위치 가져오기
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('이 브라우저에서는 위치 정보를 지원하지 않습니다.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('위치 정보 접근 권한이 거부되었습니다.'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('위치 정보를 사용할 수 없습니다.'));
                break;
              case error.TIMEOUT:
                reject(new Error('위치 정보 요청 시간이 초과되었습니다.'));
                break;
              default:
                reject(new Error('위치 정보를 가져오는데 실패했습니다.'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // 지도 중심 이동
      const newCenter = new window.naver.maps.LatLng(latitude, longitude);
      map.setCenter(newCenter);
      map.setZoom(17);

      // 현재 위치 마커 생성
      const marker = new window.naver.maps.Marker({
        position: newCenter,
        map: map,
        icon: {
          content: '<div class="current-location-marker"></div>',
          anchor: new window.naver.maps.Point(10, 10)
        }
      });

      // 3초 후 마커 제거
      setTimeout(() => {
        marker.setMap(null);
      }, 3000);

    } catch (err) {
      console.error('위치 정보를 가져오는데 실패했습니다:', err);
      setError(err.message || '위치 정보를 가져오는데 실패했습니다. 위치 권한을 확인해주세요.');
    } finally {
      setIsLocating(false);
    }
  }, [map]);

  return (
    <div className="location-control-wrapper">
      <button
        onClick={handleLocate}
        disabled={isLocating}
        aria-label="내 위치 찾기"
        className={`flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition ${isLocating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center text-sm">
          <div className="mb-1">
            <FaLocationArrow size={18} />
          </div>
          <span className="text-xs">내 위치</span>
        </div>
      </button>

      {error && (
        <div className="absolute right-16 top-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
          {error}
        </div>
      )}

      <style jsx>{`
        .current-location-marker {
          width: 20px;
          height: 20px;
          background-color: #4F46E5;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
          }
          70% {
            transform: scale(1.2);
            box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
          }
        }
      `}</style>
    </div>
  );
}

export default LocationControl; 