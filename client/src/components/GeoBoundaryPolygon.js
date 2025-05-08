import { useEffect, useState } from 'react';
import { fetchGeoBoundary } from '../service/api';

// 폴리곤 중심(centroid) 계산 함수
function getPolygonCentroid(path) {
  let area = 0, x = 0, y = 0;
  const points = path.length;
  for (let i = 0; i < points; i++) {
    const lat1 = path[i].lat(), lng1 = path[i].lng();
    const lat2 = path[(i + 1) % points].lat(), lng2 = path[(i + 1) % points].lng();
    const f = lat1 * lng2 - lat2 * lng1;
    area += f;
    x += (lat1 + lat2) * f;
    y += (lng1 + lng2) * f;
  }
  area /= 2;
  x /= (6 * area);
  y /= (6 * area);
  return { lat: x, lng: y };
}

const GeoBoundaryPolygon = ({ map, coordinates }) => {
  const [polygons, setPolygons] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [infoWindows, setInfoWindows] = useState([]);

  useEffect(() => {
    if (!map || !coordinates?.length) return;

    const fetchAndRender = async () => {
      try {
        // 1) GeoJSON 데이터 호출
        const geoJson = await fetchGeoBoundary(coordinates[0], coordinates[1]);
        console.log('▶️ fetchGeoBoundary returns:', geoJson);

        if (!geoJson?.features?.length) {
          console.warn('GeoJSON 데이터가 없거나 유효하지 않습니다.');
          return;
        }

        // 2) 기존 객체 제거
        polygons.forEach(p => p.setMap(null));
        markers.forEach(m => m.setMap(null));
        infoWindows.forEach(w => w.close());

        const newPolygons = [];
        const newMarkers = [];
        const newInfoWindows = [];

        // 3) 각 feature 처리
        geoJson.features.forEach(feature => {
          console.log('▶️ feature.properties:', feature.properties);

          const geom = feature.geometry;
          if (!geom?.coordinates) {
            console.warn('유효하지 않은 geometry:', feature);
            return;
          }

          // 4) 경로(paths) 생성 (outer ring만 사용)
          const rawArray = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
          const paths = rawArray
            .map(polygon =>
              polygon[0]
                .filter(pt => Array.isArray(pt) && pt.length === 2)
                .map(([lon, lat]) => new window.naver.maps.LatLng(lat - 0.904, lon + 0.0030))
            )
            .filter(path => path.length >= 3);

          if (!paths.length) {
            console.warn('유효한 경로 없음:', feature.properties);
            return;
          }

          // 5) 폴리곤 렌더링
          const polygon = new window.naver.maps.Polygon({
            map,
            paths,
            strokeColor: '#5347AA',
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: '#5347AA',
            fillOpacity: 0.2,
          });
          newPolygons.push(polygon);

          // 6) 레이블용 Marker & InfoWindow
          const centroid = getPolygonCentroid(paths[0]);
          const centerLat = centroid.lat;
          const centerLng = centroid.lng;
          const name = feature.properties.SGG_NM || '알 수 없음';

          // Marker (invisible) for positioning label
          const marker = new window.naver.maps.Marker({
            map,
            position: new window.naver.maps.LatLng(centerLat, centerLng),
            visible: false,
          });
          newMarkers.push(marker);

          // 항상 열린 InfoWindow (라벨처럼)
          const infoWindow = new window.naver.maps.InfoWindow({
            content: `<div style="padding:4px 8px;background:white;border-radius:4px;border:1px solid #5347AA;color:#5347AA;font-size:12px;font-weight:bold;white-space:nowrap;">${name}</div>`,
            position: marker.getPosition(),
            disableAnchor: true,
            borderWidth: 0,
            backgroundColor: 'transparent',
            zIndex: 1000,
          });
          infoWindow.open(map);
          newInfoWindows.push(infoWindow);
        });

        // 7) state 업데이트
        setPolygons(newPolygons);
        setMarkers(newMarkers);
        setInfoWindows(newInfoWindows);
      } catch (err) {
        console.error('폴리곤 렌더링 중 오류:', err);
      }
    };

    fetchAndRender();

    // Cleanup on unmount or before next render
    return () => {
      polygons.forEach(p => p.setMap(null));
      markers.forEach(m => m.setMap(null));
      infoWindows.forEach(w => w.close());
    };
  }, [map, coordinates]);

  return null;
};

export default GeoBoundaryPolygon;