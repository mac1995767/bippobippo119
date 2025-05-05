import React, { useEffect, useRef } from 'react';

const SimpleHospitalMarker = ({ map, hospital, onClick, selected }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !hospital || !hospital.location) return;

    const markerOptions = {
      position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
      map: map,
      title: hospital.yadmNm || hospital.name,
      icon: {
        content: `<div style="width:18px;height:18px;border-radius:50%;background:${selected ? '#FF0000' : '#fff'};border:2px solid #FF0000;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);">
          <span style="font-size:13px;">🏥</span>
        </div>`,
        size: new window.naver.maps.Size(18, 18),
        anchor: new window.naver.maps.Point(9, 9),
      }
    };

    markerRef.current = new window.naver.maps.Marker(markerOptions);

    window.naver.maps.Event.addListener(markerRef.current, 'click', () => {
      if (onClick) onClick(hospital);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, hospital, onClick, selected]);

  return null;
};

export default SimpleHospitalMarker; 