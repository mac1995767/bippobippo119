import React, { useEffect, useRef } from 'react';

const NursingHospitalMarker = ({ map, hospital, onClick, selected }) => {
  const markerRef = useRef(null);

  // 좌표를 유연하게 가져오는 헬퍼
  const getLat = h => parseFloat(h.YPos ?? h.lat ?? h.location?.lat);
  const getLng = h => parseFloat(h.XPos ?? h.lng ?? h.location?.lon);

  useEffect(() => {
    if (!map || !hospital) return;

    const lat = getLat(hospital);
    const lng = getLng(hospital);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coords for NursingHospital:', hospital);
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);
    const size = selected ? 24 : 20;
    const color = selected ? '#9C27B0' : '#BA68C8';

    const markerHtml = `
      <div style="display: flex; align-items: center; justify-content: center; font-size: ${size}px;">
        🛌
      </div>
    `;

    markerRef.current = new window.naver.maps.Marker({
      position,
      map,
      title: hospital.yadmNm || hospital.name,
      icon: {
        content: markerHtml,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size / 2, size),
        origin: new window.naver.maps.Point(0, 0)
      }
    });

    window.naver.maps.Event.addListener(markerRef.current, 'click', onClick);

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, hospital, selected, onClick]);

  return null;
};

export default NursingHospitalMarker;