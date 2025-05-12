import { useEffect, useRef } from 'react';

const BoundarySummaryNumber = ({ map, summary, zoomLevel }) => {
  const markersRef = useRef([]);

  useEffect(() => {
    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (!map || !summary) return;

    summary.forEach(item => {
      // 중심 좌표 계산 (Polygon만 지원)
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
              border: 1px solid #3b82f6;
              border-radius: 12px;
              padding: 2px 8px;
              font-size: 12px;
              font-weight: 600;
              color: #1e293b;
              box-shadow: 0 1px 3px rgba(0,0,0,0.10);
              min-width: 24px;
              text-align: center;
            ">
              ${item.hospitalCount + item.pharmacyCount}
            </div>
          `,
          size: new window.naver.maps.Size(32, 24),
          anchor: new window.naver.maps.Point(16, 12)
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

export default BoundarySummaryNumber; 