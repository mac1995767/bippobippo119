import React, { useEffect, useRef } from 'react';

// 의원
const ClinicMarker = ({ map, hospital, onClick, selected }) => {
  const markerRef = useRef(null);

  // 좌표 getter
  const getLat = h =>
    parseFloat(h.YPos ?? h.lat ?? h.location?.lat);
  const getLng = h =>
    parseFloat(h.XPos ?? h.lng ?? h.location?.lon);

  useEffect(() => {
    if (!map || !hospital) return;

    const lat = getLat(hospital);
    const lng = getLng(hospital);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coords for hospital:', hospital);
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);
    const size = selected ? 36 : 28;
    const imgSrc = selected ? '/images/markers/s-clinic.png' : '/images/markers/clinic.png';

    const markerHtml = `
      <div style="display: flex; align-items: center; justify-content: center;">
        <img src='${imgSrc}' alt='의원' style='width:${size}px; height:${size}px;' />
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

export default ClinicMarker;
