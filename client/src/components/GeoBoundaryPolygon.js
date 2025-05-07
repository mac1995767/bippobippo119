import { useEffect } from 'react';
import { fetchGeoBoundary } from '../service/api';

const GeoBoundaryPolygon = ({ map, regionNames }) => {
  useEffect(() => {
    if (!map || !regionNames || regionNames.length === 0) return;
    regionNames.forEach(regionName => {
      fetchGeoBoundary()
        .then(geojson => {
          console.log('geojson:', geojson); // 추가
          // GeoJSON이 객체가 아니라면 파싱
          if (typeof geojson === 'string') geojson = JSON.parse(geojson);
          geojson.features.forEach(feature => {
            const geomType = feature.geometry.type;
            console.log('feature:', feature); // 추가
            const coordsArr = geomType === 'MultiPolygon'
              ? feature.geometry.coordinates.flat(1)
              : [feature.geometry.coordinates[0]];
            coordsArr.forEach(coords => {
              console.log('coords:', coords); // 추가
              const path = coords.map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng));
              new window.naver.maps.Polygon({
                map,
                paths: path,
                strokeColor: '#FF0000', // 더 진하게
                strokeWeight: 3,
                fillColor: '#FF0000',
                fillOpacity: 0.5,
              });
            });
          });
        })
        .catch(console.error);
    });
  }, [map, regionNames]);
  return null;
};

export default GeoBoundaryPolygon;