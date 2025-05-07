import { useEffect } from 'react';
import { fetchGeoBoundary } from '../service/api';

const GeoBoundaryPolygon = ({ map, regionNames }) => {
  useEffect(() => {
    // 네이버 지도 API가 로드되었는지 확인
    if (!window.naver || !window.naver.maps) {
      console.error('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    if (!map || !regionNames || regionNames.length === 0) {
      console.log('지도 또는 지역 이름이 없습니다.');
      return;
    }
    
    console.log('지도 객체:', map);
    console.log('지역 이름들:', regionNames);
    
    // 이전 폴리곤 제거
    const polygons = [];
    
    const createPolygon = (paths) => {
      try {
        if (!Array.isArray(paths) || paths.length === 0) {
          console.error('유효하지 않은 paths:', paths);
          return null;
        }

        console.log('폴리곤 생성 시도 - paths:', paths);

        // 모든 좌표가 유효한지 확인
        const validPaths = paths.map(ring => {
          if (!Array.isArray(ring)) {
            console.error('유효하지 않은 ring:', ring);
            return null;
          }
          return ring.map(coord => {
            if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
              console.error('유효하지 않은 좌표:', coord);
              return null;
            }
            return new window.naver.maps.LatLng(coord.lat, coord.lng);
          }).filter(Boolean);
        }).filter(ring => ring && ring.length > 0);

        if (validPaths.length === 0) {
          console.error('유효한 paths가 없습니다.');
          return null;
        }

        console.log('유효한 paths:', validPaths);

        const polygon = new window.naver.maps.Polygon({
          map,
          paths: validPaths,
          strokeColor: '#FF0000',
          strokeWeight: 3,
          fillColor: '#FF0000',
          fillOpacity: 0.5,
        });

        console.log('폴리곤 객체 생성됨:', polygon);
        return polygon;
      } catch (error) {
        console.error('폴리곤 생성 중 오류:', error);
        return null;
      }
    };
    
    regionNames.forEach(regionName => {
      console.log('지역 이름으로 API 호출:', regionName);
      
      fetchGeoBoundary(regionName)
        .then(geojson => {
          console.log('API 응답:', geojson);
          
          if (typeof geojson === 'string') {
            try {
              geojson = JSON.parse(geojson);
            } catch (error) {
              console.error('GeoJSON 파싱 오류:', error);
              return;
            }
          }
          
          if (!geojson.features || !Array.isArray(geojson.features)) {
            console.error('잘못된 GeoJSON 형식:', geojson);
            return;
          }

          geojson.features.forEach(feature => {
            if (!feature.geometry || !feature.geometry.coordinates) {
              console.error('잘못된 feature:', feature);
              return;
            }

            const geomType = feature.geometry.type;
            console.log('지오메트리 타입:', geomType);
            
            try {
              let paths;
              if (geomType === 'MultiPolygon') {
                paths = feature.geometry.coordinates.map(polygon => {
                  console.log('MultiPolygon 좌표:', polygon);
                  return polygon.map(ring => {
                    return ring.map(([lng, lat]) => ({
                      lat: parseFloat(lat),
                      lng: parseFloat(lng)
                    }));
                  });
                });
              } else if (geomType === 'Polygon') {
                paths = feature.geometry.coordinates.map(ring => {
                  console.log('Polygon 좌표:', ring);
                  return ring.map(([lng, lat]) => ({
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                  }));
                });
              } else {
                console.error('지원하지 않는 지오메트리 타입:', geomType);
                return;
              }

              console.log('생성된 paths:', paths);
              const polygon = createPolygon(paths);
              
              if (polygon) {
                console.log('폴리곤 생성됨:', polygon);
                polygons.push(polygon);
              }
            } catch (error) {
              console.error('폴리곤 생성 중 오류:', error);
            }
          });
        })
        .catch(error => {
          console.error('GeoJSON 데이터 가져오기 실패:', error);
        });
    });

    // cleanup 함수
    return () => {
      console.log('이전 폴리곤 제거');
      polygons.forEach(polygon => {
        if (polygon && polygon.setMap) {
          polygon.setMap(null);
        }
      });
    };
  }, [map, regionNames]);

  return null;
};

export default GeoBoundaryPolygon;