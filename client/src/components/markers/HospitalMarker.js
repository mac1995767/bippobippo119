import React, { useEffect, useRef } from 'react';

const HospitalMarker = ({ map, hospital, zoomLevel, onClick }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !hospital || !hospital.location) return;

    // 값 확인용 로그
    console.log('마커 생성:', hospital.yadmNm, hospital.location);

    let markerOptions = {
      position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
      map: map,
      title: hospital.yadmNm || hospital.name,
    };

    if (zoomLevel >= 12) {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `<div style="display: flex; align-items: center; justify-content: center;"><img src='/images/markers/hospital.png' alt='병원' style='width:36px; height:36px;'/></div>`,
          size: new window.naver.maps.Size(36, 36),
          anchor: new window.naver.maps.Point(18, 36),
        }
      };
    } else if (zoomLevel >= 10) {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `<div style="background: white; padding: 3px; border-radius: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"><div style="color: #FF0000; font-weight: bold;">${hospital.yadmNm || hospital.name}</div></div>`,
          size: new window.naver.maps.Size(38, 38),
          anchor: new window.naver.maps.Point(19, 38),
        }
      };
    } else {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: '<div style="background: #FF0000; width: 10px; height: 10px; border-radius: 50%;"></div>',
          size: new window.naver.maps.Size(10, 10),
          anchor: new window.naver.maps.Point(5, 5),
        }
      };
    }

    // 마커 생성
    markerRef.current = new window.naver.maps.Marker(markerOptions);

    // 마커 클릭 이벤트
    window.naver.maps.Event.addListener(markerRef.current, 'click', () => {
      if (onClick) onClick(hospital);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, hospital, zoomLevel, onClick]);

  return null;
};

export default HospitalMarker; 