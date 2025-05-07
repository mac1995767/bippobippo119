import React, { useState, useCallback, useEffect } from 'react';
import { FaThermometerHalf } from 'react-icons/fa';

function HeatmapControl({ map, hospitals, pharmacies }) {
  const [isActive, setIsActive] = useState(false);
  const [heatmap, setHeatmap] = useState(null);

  const toggleHeatmap = useCallback(() => {
    if (!map) return;

    // visualization 라이브러리 확인
    if (!window.naver?.maps?.visualization?.Heatmap) {
      console.error('네이버 지도 visualization 라이브러리가 로드되지 않았습니다.');
      alert('히트맵 기능을 사용하기 위해서는 페이지를 새로고침해주세요.');
      return;
    }

    if (!isActive) {
      try {
        // 히트맵 데이터 생성
        const points = [];
        
        // 병원 데이터 추가
        hospitals.forEach(hospital => {
          const lat = hospital.location?.lat || hospital.lat;
          const lng = hospital.location?.lon || hospital.lng;
          if (lat && lng) {
            points.push(new window.naver.maps.LatLng(lat, lng));
          }
        });

        // 약국 데이터 추가
        pharmacies.forEach(pharmacy => {
          const lat = pharmacy.lat || pharmacy.location?.lat;
          const lng = pharmacy.lng || pharmacy.location?.lon;
          if (lat && lng) {
            points.push(new window.naver.maps.LatLng(lat, lng));
          }
        });

        if (points.length === 0) {
          alert('표시할 데이터가 없습니다.');
          return;
        }

        // 히트맵 옵션 설정
        const heatmapOptions = {
          radius: 50,
          opacity: 0.8,
          gradient: {
            '0.4': 'blue',
            '0.6': 'lime',
            '0.8': 'yellow',
            '1.0': 'red'
          }
        };

        // 히트맵 생성
        const newHeatmap = new window.naver.maps.visualization.Heatmap({
          map: map,
          data: points,
          options: heatmapOptions
        });

        setHeatmap(newHeatmap);
        setIsActive(true);
      } catch (error) {
        console.error('히트맵 생성 중 오류 발생:', error);
        alert('히트맵을 생성하는 중 오류가 발생했습니다.');
      }
    } else {
      // 히트맵 제거
      if (heatmap) {
        heatmap.setMap(null);
        setHeatmap(null);
      }
      setIsActive(false);
    }
  }, [map, hospitals, pharmacies, isActive, heatmap]);

  // 컴포넌트 언마운트 시 히트맵 제거
  useEffect(() => {
    return () => {
      if (heatmap) {
        heatmap.setMap(null);
      }
    };
  }, [heatmap]);

  return (
    <button
      onClick={toggleHeatmap}
      aria-label="히트맵"
      className={`flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition ${isActive ? 'bg-blue-100' : ''}`}
    >
      <div className="flex flex-col items-center text-sm">
        <div className="mb-1">
          <FaThermometerHalf size={18} />
        </div>
        <span className="text-xs">히트맵</span>
      </div>
    </button>
  );
}

export default HeatmapControl; 