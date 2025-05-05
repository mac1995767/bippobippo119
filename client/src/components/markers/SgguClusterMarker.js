import React, { useEffect, useRef } from 'react';

const SgguClusterMarker = ({ map, sggu }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !sggu) return;
    markerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(sggu.YPos, sggu.XPos),
      map,
      icon: {
        content: `
          <div style="
            background: #fff;
            border: 2px solid #3b82f6;
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            white-space: nowrap;
          ">
            ${sggu.sgguNm}
          </div>
        `,
        size: new window.naver.maps.Size(100, 44),
        anchor: new window.naver.maps.Point(50, 22),
      }
    });
    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, [map, sggu]);

  return null;
};

export default SgguClusterMarker; 