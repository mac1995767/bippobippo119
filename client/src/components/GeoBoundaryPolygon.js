import { useEffect, useState } from 'react';
import { fetchGeoBoundary } from '../service/api';

const GeoBoundaryPolygon = ({ map, regionNames }) => {
  const [polygons, setPolygons] = useState([]);

  useEffect(() => {
    if (!map || !regionNames || regionNames.length === 0) {
      return;
    }

    const createPolygon = (paths) => {
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

      return new window.naver.maps.Polygon({
        map: map,
        paths: validPaths,
        strokeColor: '#5347AA',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: '#5347AA',
        fillOpacity: 0.2
      });
    };

    const fetchAndCreatePolygon = async (regionName) => {
      try {
        const geojson = await fetchGeoBoundary(regionName);
        if (!geojson || !geojson.features || geojson.features.length === 0) {
          return null;
        }

        const feature = geojson.features[0];
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

        return createPolygon(paths);
      } catch (error) {
        console.error('지역 경계 데이터 처리 실패:', error);
        return null;
      }
    };

    const createPolygons = async () => {
      const newPolygons = await Promise.all(
        regionNames.map(regionName => fetchAndCreatePolygon(regionName))
      );
      setPolygons(newPolygons.filter(Boolean));
    };

    createPolygons();

    return () => {
      polygons.forEach(polygon => {
        if (polygon) {
          polygon.setMap(null);
        }
      });
    };
  }, [map, regionNames]);

  return null;
};

export default GeoBoundaryPolygon;