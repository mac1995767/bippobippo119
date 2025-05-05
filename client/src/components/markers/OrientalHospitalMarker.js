import React, { useEffect, useRef } from 'react';

const OrientalHospitalMarker = ({ map, hospital, onClick, selected }) => {
  const markerRef = useRef(null);

  // 좌표를 유연하게 가져오는 헬퍼
  const getLat = h => parseFloat(h.YPos ?? h.lat ?? h.location?.lat);
  const getLng = h => parseFloat(h.XPos ?? h.lng ?? h.location?.lon);

  useEffect(() => {
    if (!map || !hospital) return;

    const lat = getLat(hospital);
    const lng = getLng(hospital);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coords for OrientalHospital:', hospital);
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);
    const size = selected ? 32 : 24;

    markerRef.current = new window.naver.maps.Marker({
      position,
      map,
      title: hospital.yadmNm || hospital.name,
      icon: {
        content: `<img src="/images/markers/${selected ? 's-herbalClinic.png' : 'herbalClinic.png'}" width="${size}" height="${size}" />`,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size / 2, size / 2),
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

export default OrientalHospitalMarker;