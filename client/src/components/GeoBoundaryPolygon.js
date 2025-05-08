import { useEffect, useState } from 'react';
import { fetchGeoBoundary } from '../service/api';

const GeoBoundaryPolygon = ({ map, coordinates }) => {
  const [polygons, setPolygons] = useState([]);
  const [hoveredPolygon, setHoveredPolygon] = useState(null);
  const [clickedInfoWindow, setClickedInfoWindow] = useState(null);

  useEffect(() => {
    if (!map || !coordinates) {
      return;
    }

    const createPolygon = (paths, properties) => {
      console.log('폴리곤 properties:', properties);

      if (!paths || paths.length === 0) {
        return null;
      }

      const validPaths = paths.filter(path => 
        path && path.length > 0 && 
        path.every(point => 
          point && typeof point.lat === 'number' && typeof point.lng === 'number'
        )
      );

      if (validPaths.length === 0) {
        return null;
      }

      const polygon = new window.naver.maps.Polygon({
        map: map,
        paths: validPaths,
        strokeColor: '#5347AA',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#5347AA',
        fillOpacity: 0.2
      });

      // 마우스 이벤트 리스너 추가
      window.naver.maps.Event.addListener(polygon, 'mouseover', () => {
        setHoveredPolygon(true);
        polygon.setOptions({
          strokeWeight: 4,
          strokeOpacity: 1,
          fillOpacity: 0.4
        });
      });

      window.naver.maps.Event.addListener(polygon, 'mouseout', () => {
        setHoveredPolygon(null);
        polygon.setOptions({
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillOpacity: 0.2
        });
      });

      // 클릭 이벤트 리스너 추가
      window.naver.maps.Event.addListener(polygon, 'click', (e) => {
        console.log('클릭한 폴리곤의 properties:', properties);

        // 이전 인포윈도우 제거
        if (clickedInfoWindow) {
          clickedInfoWindow.close();
        }

        // 새로운 인포윈도우 생성
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 100px; text-align: center;">
              <div style="font-weight: bold; margin-bottom: 5px;">${properties.SGG_NM}</div>
              <div style="font-size: 12px; color: #666;">${properties.SIDO_NM}</div>
            </div>
          `,
          position: e.coord,
          pixelOffset: new window.naver.maps.Point(0, -10)
        });

        infoWindow.open(map);
        setClickedInfoWindow(infoWindow);
      });

      return polygon;
    };

    const fetchAndCreatePolygon = async (coord) => {
      try {
        const geojson = await fetchGeoBoundary({
          lat: coord.lat,
          lng: coord.lng
        });

        console.log('받아온 GeoJSON 데이터:', geojson);

        if (!geojson || !geojson.features || geojson.features.length === 0) {
          return null;
        }

        const feature = geojson.features[0];
        console.log('Feature 데이터:', feature);
        console.log('Properties 데이터:', feature.properties);

        const geometry = feature.geometry;
        const geomType = geometry.type;
        let paths = [];

        if (geomType === 'MultiPolygon') {
          paths = geometry.coordinates.map(polygon => 
            polygon[0].map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }))
          );
        } else if (geomType === 'Polygon') {
          paths = geometry.coordinates[0].map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
        }

        return createPolygon(paths, feature.properties);
      } catch (error) {
        console.error('지역 경계 데이터 처리 실패:', error);
        return null;
      }
    };

    const createPolygons = async () => {
      const newPolygons = await Promise.all(
        coordinates.map(coord => fetchAndCreatePolygon(coord))
      );
      setPolygons(newPolygons.filter(Boolean));
    };

    createPolygons();

    return () => {
      // 이전 인포윈도우 제거
      if (clickedInfoWindow) {
        clickedInfoWindow.close();
      }
      
      // 폴리곤 제거
      polygons.forEach(polygon => {
        if (polygon) {
          polygon.setMap(null);
        }
      });
    };
  }, [map, coordinates]);

  return null;
};

export default GeoBoundaryPolygon;