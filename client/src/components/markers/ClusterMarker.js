import React, { useEffect, useRef } from 'react';

const ClusterMarker = ({ map, cluster }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    markerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(cluster.lat, cluster.lng),
      map,
      icon: {
        content: `
          <div style="background: #FFA54B; color: #fff; font-weight: bold; border-radius: 20px; padding: 10px 20px; font-size: 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); text-align: center;">
            ${cluster.name}<br/>${cluster.value}
          </div>
        `,
        size: new window.naver.maps.Size(120, 48),
        anchor: new window.naver.maps.Point(60, 24),
      }
    });
    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, [map, cluster]);

  return null;
};

export default ClusterMarker; 