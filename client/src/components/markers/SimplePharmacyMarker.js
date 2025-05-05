import React, { useEffect, useRef } from 'react';

const SimplePharmacyMarker = ({ map, pharmacy, onClick, selected }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !pharmacy) return;

    const markerOptions = {
      position: new window.naver.maps.LatLng(pharmacy.lat, pharmacy.lng),
      map: map,
      title: pharmacy.name,
      icon: {
        content: `<div style="width:18px;height:18px;border-radius:50%;background:${selected ? '#00C853' : '#fff'};border:2px solid #00C853;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);">
          <span style="font-size:13px;">💊</span>
        </div>`,
        size: new window.naver.maps.Size(18, 18),
        anchor: new window.naver.maps.Point(9, 9),
      }
    };

    markerRef.current = new window.naver.maps.Marker(markerOptions);

    window.naver.maps.Event.addListener(markerRef.current, 'click', () => {
      if (onClick) onClick(pharmacy);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, pharmacy, onClick, selected]);

  return null;
};

export default SimplePharmacyMarker; 