import React, { useEffect, useRef } from 'react';

// 지도 위에 경계별 summary(클러스터) 마커를 표시하는 컴포넌트
const BoundarySummaryCluster = ({ map, summary, zoomLevel }) => {
  const markersRef = useRef([]);

  useEffect(() => {
    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (!map || !summary) return;

    summary.forEach(item => {
      // geometry 중심 계산 (Polygon만 지원)
      let center = null;
      if (item.geometry?.type === 'Polygon') {
        const coords = item.geometry.coordinates[0];
        let latSum = 0, lngSum = 0;
        coords.forEach(([lng, lat]) => {
          latSum += lat;
          lngSum += lng;
        });
        center = {
          lat: latSum / coords.length,
          lng: lngSum / coords.length
        };
      } else if (item.geometry?.type === 'MultiPolygon') {
        // 첫번째 폴리곤만 사용
        const coords = item.geometry.coordinates[0][0];
        let latSum = 0, lngSum = 0;
        coords.forEach(([lng, lat]) => {
          latSum += lat;
          lngSum += lng;
        });
        center = {
          lat: latSum / coords.length,
          lng: lngSum / coords.length
        };
      }
      if (!center) return;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(center.lat, center.lng),
        map,
        icon: {
          content: `
            <div style="
              background: white;
              border: 2px solid #3b82f6;
              border-radius: 20px;
              padding: 6px 14px;
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span>${item.name}</span>
              <span style="color:#2563eb;">🏥${item.hospitalCount}</span>
              <span style="color:#10b981;">💊${item.pharmacyCount}</span>
            </div>
          `,
          size: new window.naver.maps.Size(120, 36),
          anchor: new window.naver.maps.Point(60, 18)
        }
      });
      markersRef.current.push(marker);
    });
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, summary, zoomLevel]);

  return null;
};

export default BoundarySummaryCluster; 