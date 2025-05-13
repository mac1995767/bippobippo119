import React, { useEffect, useRef } from 'react';

const PharmacyMarker = ({ map, pharmacy, onClick, selected }) => {
  const markerRef = useRef(null);

  // 좌표 getter
  const getLat = p => parseFloat(p.lat);
  const getLng = p => parseFloat(p.lng);

  useEffect(() => {
    if (!map || !pharmacy) return;

    const lat = getLat(pharmacy);
    const lng = getLng(pharmacy);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coords for pharmacy:', pharmacy);
      return;
    }

    const position = new window.naver.maps.LatLng(lat, lng);
    const size = selected ? 24 : 20;

    const markerHtml = `
      <div style="display: flex; align-items: center; justify-content: center; font-size: ${size}px;">
        💊
      </div>
    `;

    markerRef.current = new window.naver.maps.Marker({
      position,
      map,
      title: pharmacy.name,
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
  }, [map, pharmacy, selected, onClick]);

  return null;
};

export default PharmacyMarker; 