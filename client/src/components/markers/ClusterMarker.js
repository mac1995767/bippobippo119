import React, { useEffect, useRef } from 'react';

const ClusterMarker = ({ map, cluster }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !cluster) return;

    markerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(cluster.lat, cluster.lng),
      map,
      icon: {
        content: `
          <div style="
            position: relative;
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            white-space: nowrap;
          ">
            ${cluster.name}
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: 8px solid #3b82f6;
            "></div>
          </div>
        `,
        size: new window.naver.maps.Size(100, 44),
        anchor: new window.naver.maps.Point(50, 22),
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, cluster]);

  return null;
};

export default ClusterMarker;
