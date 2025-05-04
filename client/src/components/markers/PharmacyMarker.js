import React, { useEffect, useRef } from 'react';

const PharmacyMarker = ({ map, pharmacy, zoomLevel, onClick }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    let markerOptions = {
      position: new window.naver.maps.LatLng(pharmacy.lat, pharmacy.lng),
      map: map,
      title: pharmacy.name,
    };

    if (zoomLevel >= 12) {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `<div style=\"display: flex; align-items: center; justify-content: center;\"><img src='/images/markers/pharmacy.png' alt='약국' style='width:36px; height:36px;'/></div>`,
          size: new window.naver.maps.Size(36, 36),
          anchor: new window.naver.maps.Point(18, 36),
        }
      };
    } else if (zoomLevel >= 10) {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: `<div style=\"background: white; padding: 3px; border-radius: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);\"><div style=\"color: #00FF00; font-weight: bold;\">${pharmacy.name}</div></div>`,
          size: new window.naver.maps.Size(38, 38),
          anchor: new window.naver.maps.Point(19, 38),
        }
      };
    } else {
      markerOptions = {
        ...markerOptions,
        icon: {
          content: '<div style=\"background: #00FF00; width: 10px; height: 10px; border-radius: 50%;\"></div>',
          size: new window.naver.maps.Size(10, 10),
          anchor: new window.naver.maps.Point(5, 5),
        }
      };
    }

    markerRef.current = new window.naver.maps.Marker(markerOptions);

    // 마커 클릭 이벤트
    window.naver.maps.Event.addListener(markerRef.current, 'click', () => {
      if (onClick) onClick(pharmacy);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, pharmacy, zoomLevel, onClick]);

  return null;
};

export default PharmacyMarker; 