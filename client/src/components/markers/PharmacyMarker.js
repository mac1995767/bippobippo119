import React, { useEffect, useRef } from 'react';

const PharmacyMarker = ({ map, pharmacy, zoomLevel }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // zoom 레벨에 따른 마커 스타일 결정
    let markerOptions = {
      position: new window.naver.maps.LatLng(pharmacy.lat, pharmacy.lng),
      map: map,
      title: pharmacy.name,
    };

    // zoom 레벨에 따른 마커 스타일 설정
    if (zoomLevel >= 12) {
      // 상세 정보 표시
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `
            <div style="background: white; padding: 5px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              <div style="color: #00FF00; font-weight: bold;">${pharmacy.name}</div>
              <div style="font-size: 12px; color: #666;">약국</div>
            </div>
          `,
          size: new window.naver.maps.Size(38, 58),
          anchor: new window.naver.maps.Point(19, 58),
        }
      };
    } else if (zoomLevel >= 10) {
      // 중간 정보 표시
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `
            <div style="background: white; padding: 3px; border-radius: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              <div style="color: #00FF00; font-weight: bold;">${pharmacy.name}</div>
            </div>
          `,
          size: new window.naver.maps.Size(38, 38),
          anchor: new window.naver.maps.Point(19, 38),
        }
      };
    } else {
      // 기본 마커
      markerOptions = {
        ...markerOptions,
        icon: {
          content: '<div style="background: #00FF00; width: 10px; height: 10px; border-radius: 50%;"></div>',
          size: new window.naver.maps.Size(10, 10),
          anchor: new window.naver.maps.Point(5, 5),
        }
      };
    }

    // 마커 생성
    markerRef.current = new window.naver.maps.Marker(markerOptions);

    // 마커 클릭 이벤트
    window.naver.maps.Event.addListener(markerRef.current, 'click', () => {
      // 약국 상세 정보 표시 로직
      console.log('약국 클릭:', pharmacy);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, pharmacy, zoomLevel]);

  return null;
};

export default PharmacyMarker; 