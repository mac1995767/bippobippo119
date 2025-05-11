import { useEffect, useRef } from 'react';
import { fetchCtpBoundary, fetchSigBoundary, fetchEmdBoundary, fetchLiBoundary } from '../service/api';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

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
  const polygonsRef = useRef([]);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const lastGeoJsonRef = useRef(null);

  useEffect(() => {
    // 항상 최신 객체를 지우기
    polygonsRef.current.forEach(p => p.setMap(null));
    markersRef.current.forEach(m => m.setMap(null));
    infoWindowsRef.current.forEach(w => w.close());
    polygonsRef.current = [];
    markersRef.current = [];
    infoWindowsRef.current = [];

    if (!map || !coordinates) {
      lastGeoJsonRef.current = null;
      return;
    }

    // 기존 폴리곤이 있고, 커서가 그 안에 있으면 fetch 생략
    if (lastGeoJsonRef.current && lastGeoJsonRef.current.features?.length) {
      const feature = lastGeoJsonRef.current.features[0];
      const pt = [coordinates.lng, coordinates.lat];
      if (booleanPointInPolygon(pt, feature)) {
        // 기존 폴리곤을 다시 지도에 그리기
        const geom = feature.geometry;
        const rawArray = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
        const paths = rawArray
          .map(polygon =>
            polygon[0]
              .filter(pt => Array.isArray(pt) && pt.length === 2)
              .map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng))
          )
          .filter(path => path.length >= 3);
        if (paths.length) {
          const polygon = new window.naver.maps.Polygon({
            map,
            paths,
            strokeColor: '#5347AA',
            strokeWeight: 2,
            strokeOpacity: 0.8,
            fillColor: '#5347AA',
            fillOpacity: 0.2,
          });
          polygonsRef.current.push(polygon);
        }
        // 레이블 및 인포윈도우도 필요하다면 추가
        return;
      }
    }

    const fetchAndRender = async () => {
      try {
        console.log('API 호출 좌표:', coordinates);
        console.log('현재 줌 레벨:', zoomLevel);

        let geoJson = null;
        // Emd 정보로 지역 유형 판별
        let emdJsonForType = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        let emdName = '';
        if (emdJsonForType?.features?.length) {
          emdName = emdJsonForType.features[0]?.properties?.EMD_KOR_NM || '';
        }
        const isMetropolitanArea = emdName.endsWith('동');
        console.log('emdName:', emdName);
        console.log('isMetropolitanArea:', isMetropolitanArea);
        if (isMetropolitanArea) {
          // 수도권/광역시(동 단위)
          if (zoomLevel <= 9) {
            geoJson = await fetchCtpBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          } else if (zoomLevel >= 10 && zoomLevel <= 13) {
            geoJson = await fetchSigBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          } else if (zoomLevel >= 14) {
            geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng }); // 동만
          }
        } else {
          // 군/읍/면/리 지역
          if (zoomLevel === 11) {
            geoJson = await fetchSigBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          } else if (zoomLevel === 12) {
            geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          } else if (zoomLevel === 13) {
            geoJson = await fetchLiBoundary({ lat: coordinates.lat, lng: coordinates.lng });
            if (!geoJson?.features?.length) {
              geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
            }
          } else if (zoomLevel >= 14) {
            geoJson = await fetchLiBoundary({ lat: coordinates.lat, lng: coordinates.lng });
            if (!geoJson?.features?.length) {
              geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
            }
          } else if (zoomLevel <= 10) {
            geoJson = await fetchCtpBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          }
        }
        if (!geoJson?.features?.length) {
          lastGeoJsonRef.current = null;
          return;
        }
        lastGeoJsonRef.current = geoJson;

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
          polygonsRef.current.push(polygon);

          // 레이블용 Marker & InfoWindow
          const { lat, lng } = getPolygonCentroid(paths[0]);
          const marker = new window.naver.maps.Marker({
            map,
            position: new window.naver.maps.LatLng(lat, lng),
            visible: false,
          });
          markersRef.current.push(marker);

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
          infoWindowsRef.current.push(infoWindow);
          infoWindow.open(map);
        });
      } catch (err) {
        lastGeoJsonRef.current = null;
      }
    };

    fetchAndRender();

    // 언마운트 시 또는 다음 렌더 전 cleanup
    return () => {
      polygonsRef.current.forEach(p => p.setMap(null));
      markersRef.current.forEach(m => m.setMap(null));
      infoWindowsRef.current.forEach(w => w.close());
      polygonsRef.current = [];
      markersRef.current = [];
      infoWindowsRef.current = [];
    };
  }, [map, coordinates, zoomLevel, apiEndpoint]);

  return null;
};

export default GeoBoundaryPolygon;
