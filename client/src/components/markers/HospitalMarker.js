import React, { useEffect, useRef } from 'react';

const HospitalMarker = ({ map, hospital, zoomLevel }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !hospital || !hospital.location) return;

    // 값 확인용 로그
    console.log('마커 생성:', hospital.yadmNm, hospital.location);

    // zoom 레벨에 따른 마커 스타일 결정
    let markerOptions = {
      position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
      map: map,
      title: hospital.yadmNm || hospital.name,
    };

    // zoom 레벨에 따른 마커 스타일 설정
    if (zoomLevel >= 12) {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `
            <div style="background: white; padding: 5px; border-radius: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              <div style="color: #FF0000; font-weight: bold;">${hospital.yadmNm || hospital.name}</div>
              <div style="font-size: 12px; color: #666;">병원</div>
            </div>
          `,
          size: new window.naver.maps.Size(38, 58),
          anchor: new window.naver.maps.Point(19, 58),
        }
      };
    } else if (zoomLevel >= 10) {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `
            <div style="background: white; padding: 3px; border-radius: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              <div style="color: #FF0000; font-weight: bold;">${hospital.yadmNm || hospital.name}</div>
            </div>
          `,
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
      console.log('병원 클릭:', hospital);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, hospital, zoomLevel]);

  return null;
};

export default HospitalMarker; 