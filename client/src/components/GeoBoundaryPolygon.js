import { useEffect, useState } from 'react';
import { fetchCtpBoundary, fetchSigBoundary, fetchEmdBoundary, fetchLiBoundary } from '../service/api';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';

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

const GeoBoundaryPolygon = ({ map, coordinates, zoomLevel, apiEndpoint }) => {
  const [polygons, setPolygons] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [infoWindows, setInfoWindows] = useState([]);

  useEffect(() => {
    if (!map || !coordinates) {
      console.log('지도 또는 좌표가 없습니다:', { map, coordinates });
      return;
    }

    const fetchAndRender = async () => {
      try {
        console.log('API 호출 좌표:', coordinates);
        console.log('현재 줌 레벨:', zoomLevel);

        // 줌 레벨에 따라 다른 API 호출
        let geoJson;
        if (zoomLevel >= 15) {
          geoJson = await fetchLiBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else if (zoomLevel >= 12) {
          geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else if (zoomLevel >= 9) {
          geoJson = await fetchSigBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else {
          geoJson = await fetchCtpBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        }
        
        if (!geoJson?.features?.length) {
          console.log('GeoJSON features가 없습니다');
          return;
        }

        // 기존 객체 제거
        polygons.forEach(p => p.setMap(null));
        markers.forEach(m => m.setMap(null));
        infoWindows.forEach(w => w.close());

        const newPolygons = [];
        const newMarkers = [];
        const newInfoWindows = [];

        // 각 feature 처리
        geoJson.features.forEach(feature => {
          const geom = feature.geometry;
          if (!geom?.coordinates) {
            console.log('geometry coordinates가 없습니다:', feature);
            return;
          }

          // 경로(paths) 생성 (outer ring만 사용)
          const rawArray = geom.type === 'Polygon'
            ? [geom.coordinates]
            : geom.coordinates;

          const paths = rawArray
            .map(polygon =>
              polygon[0]
                .filter(pt => Array.isArray(pt) && pt.length === 2)
                .map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng))
            )
            .filter(path => path.length >= 3);

          if (!paths.length) {
            console.log('유효한 경로가 없습니다:', feature);
            return;
          }

          // 폴리곤 렌더링
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

          // 레이블용 Marker & InfoWindow
          const { lat, lng } = getPolygonCentroid(paths[0]);
          const marker = new window.naver.maps.Marker({
            map,
            position: new window.naver.maps.LatLng(lat, lng),
            visible: false,
          });
          newMarkers.push(marker);

          // 경계선 타입에 따라 다른 레이블 표시
          let labelText;
          if (feature.properties.CTP_KOR_NM) {
            labelText = feature.properties.CTP_KOR_NM;
          } else if (feature.properties.SIG_KOR_NM) {
            labelText = feature.properties.SIG_KOR_NM;
          } else if (feature.properties.EMD_KOR_NM) {
            labelText = feature.properties.EMD_KOR_NM;
          } else if (feature.properties.LI_KOR_NM) {
            labelText = feature.properties.LI_KOR_NM;
          } else {
            labelText = '알 수 없음';
          }

          const infoWindow = new window.naver.maps.InfoWindow({
            content: `<div style="
              padding:4px 8px;
              background:white;
              border-radius:4px;
              border:1px solid #5347AA;
              color:#5347AA;
              font-size:12px;
              font-weight:bold;
              white-space:nowrap;
            ">${labelText}</div>`,
            position: marker.getPosition(),
            disableAnchor: true,
            borderWidth: 0,
            backgroundColor: 'transparent',
            zIndex: 1000,
          });
          infoWindow.open(map);
          newInfoWindows.push(infoWindow);
        });

        // state 업데이트
        setPolygons(newPolygons);
        setMarkers(newMarkers);
        setInfoWindows(newInfoWindows);

      } catch (err) {
        console.error('폴리곤 렌더링 중 오류:', err);
      }
    };

    fetchAndRender();

    // 언마운트 시 또는 다음 렌더 전 cleanup
    return () => {
      polygons.forEach(p => p.setMap(null));
      markers.forEach(m => m.setMap(null));
      infoWindows.forEach(w => w.close());
    };
  }, [map, coordinates, zoomLevel, apiEndpoint]);

  return null;
};

export default GeoBoundaryPolygon;
