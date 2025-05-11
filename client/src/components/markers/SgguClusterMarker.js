import React, { useEffect, useRef } from 'react';

const SgguClusterMarker = ({ map, sggu, onMouseOver, onMouseOut }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !sggu) return;
    markerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(sggu.YPos, sggu.XPos),
      map,
      icon: {
        content: `
          <div style="
            pointer-events: none;
            display: flex;
            align-items: center;
            background: #2563eb;
            border-radius: 24px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            overflow: hidden;
            font-family: 'Pretendard', 'sans-serif';
          ">
            <div style="
              background: #fff;
              color: #2563eb;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: 700;
              border-radius: 50%;
              margin-right: 4px;
              border: 2px solid #2563eb;
              box-sizing: border-box;
            ">
              ${sggu.hospitalCount}
            </div>
            <div style="
              color: #fff;
              font-size: 18px;
              font-weight: 600;
              padding: 0 18px 0 8px;
              height: 40px;
              display: flex;
              align-items: center;
            ">
              ${sggu.sgguNm}
            </div>
          </div>
        `,
        size: new window.naver.maps.Size(120, 44),
        anchor: new window.naver.maps.Point(60, 22),
      }
    });

    // 마우스 이벤트 추가
    if (onMouseOver) {
      window.naver.maps.Event.addListener(markerRef.current, 'mouseover', () => onMouseOver());
    }
    if (onMouseOut) {
      window.naver.maps.Event.addListener(markerRef.current, 'mouseout', () => onMouseOut());
    }

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, [map, sggu, onMouseOver, onMouseOut]);

  return null;
};

export default SgguClusterMarker; 