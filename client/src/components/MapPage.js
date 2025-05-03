import React, { useEffect, useRef, useState } from 'react';
import MapCategoryTabs from './MapCategoryTabs';
import MapFilterBar from './MapFilterBar';
import HospitalMarker from './markers/HospitalMarker';
import PharmacyMarker from './markers/PharmacyMarker';
import FacilityMarker from './markers/FacilityMarker';
import ClusterMarker from './markers/ClusterMarker';
// import { fetchMapData } from '../service/api';

const clusters = [
  { name: '서울특별시', lat: 37.5665, lng: 126.9780, value: '4.4억' },
  { name: '경기도', lat: 37.4138, lng: 127.5183, value: '6.1억' },
  { name: '인천광역시', lat: 37.4563, lng: 126.7052, value: '5억' },
  { name: '강원특별자치도', lat: 37.8228, lng: 128.1555, value: '3억' },
  { name: '충청북도', lat: 36.6357, lng: 127.4917, value: '3.2억' },
  { name: '충청남도', lat: 36.5184, lng: 126.8000, value: '3억' },
  { name: '세종특별자치시', lat: 36.4801, lng: 127.2890, value: '4.3억' },
  { name: '대전광역시', lat: 36.3504, lng: 127.3845, value: '4.3억' },
  { name: '전라북도', lat: 35.7175, lng: 127.1530, value: '2.9억' },
  { name: '광주광역시', lat: 35.1595, lng: 126.8526, value: '3.5억' },
  { name: '전라남도', lat: 34.8161, lng: 126.4630, value: '2.5억' },
  { name: '경상북도', lat: 36.4919, lng: 128.8889, value: '2.6억' },
  { name: '대구광역시', lat: 35.8714, lng: 128.6014, value: '3.9억' },
  { name: '울산광역시', lat: 35.5384, lng: 129.3114, value: '4억' },
  { name: '경상남도', lat: 35.4606, lng: 128.2132, value: '3억' },
  { name: '부산광역시', lat: 35.1796, lng: 129.0756, value: '4.6억' },
  { name: '제주특별자치도', lat: 33.4996, lng: 126.5312, value: '2.5억' },
];

const districtClusters = [
  { name: '강남구', lat: 37.5172, lng: 127.0473, value: '10.2억' },
  { name: '서초구', lat: 37.4837, lng: 127.0324, value: '9.8억' },
  { name: '수원시 권선구', lat: 37.2635, lng: 127.0286, value: '5.2억' },
  { name: '성남시 분당구', lat: 37.3781, lng: 127.1159, value: '14.4억' },
  { name: '용인시 수지구', lat: 37.3226, lng: 127.1087, value: '8.1억' },
  { name: '화성시', lat: 37.2009, lng: 126.8169, value: '5.8억' },
  { name: '안양시 동안구', lat: 37.3943, lng: 126.9568, value: '7.4억' },
  { name: '고양시 일산서구', lat: 37.6762, lng: 126.7476, value: '6.4억' },
  { name: '평택시', lat: 36.9946, lng: 127.0885, value: '3.9억' },
  { name: '오산시', lat: 37.1452, lng: 127.0662, value: '4억' },
  { name: '여주시', lat: 37.2982, lng: 127.6371, value: '3.3억' },
  { name: '원주시', lat: 37.3422, lng: 127.9207, value: '2.9억' },
  { name: '춘천시', lat: 37.8813, lng: 127.7298, value: '3.4억' },
  { name: '청주시', lat: 36.6424, lng: 127.4890, value: '3억' },
  { name: '천안시', lat: 36.8151, lng: 127.1139, value: '3.2억' },
  { name: '전주시', lat: 35.8242, lng: 127.1480, value: '2.9억' },
  { name: '광주시', lat: 35.1595, lng: 126.8526, value: '3.5억' },
  { name: '포항시', lat: 36.0190, lng: 129.3435, value: '2.8억' },
  { name: '창원시', lat: 35.2279, lng: 128.6811, value: '3.2억' },
  { name: '제주시', lat: 33.4996, lng: 126.5312, value: '2.5억' },
];

const MapPage = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [hospitals, setHospitals] = useState([
    { name: '서울대학교병원', lat: 37.5796, lng: 126.9980 },
    { name: '부산대학교병원', lat: 35.1796, lng: 129.0756 },
    { name: '대전대학교병원', lat: 36.3504, lng: 127.3845 },
    { name: '대구대학교병원', lat: 35.8714, lng: 128.6014 }
  ]);
  const [pharmacies, setPharmacies] = useState([
    { name: '서울약국', lat: 37.5665, lng: 126.9780 },
    { name: '부산약국', lat: 35.1796, lng: 129.0756 },
    { name: '대전약국', lat: 36.3504, lng: 127.3845 },
    { name: '대구약국', lat: 35.8714, lng: 128.6014 }
  ]);
  const [facilities, setFacilities] = useState([
    { name: '서울의료시설', lat: 37.5665, lng: 126.9780 },
    { name: '부산의료시설', lat: 35.1796, lng: 129.0756 },
    { name: '대전의료시설', lat: 36.3504, lng: 127.3845 },
    { name: '대구의료시설', lat: 35.8714, lng: 128.6014 }
  ]);

  // 데이터 불러오기
  useEffect(() => {
    // fetchMapData().then(data => {
    //   setHospitals(data.hospitals || []);
    //   setPharmacies(data.pharmacies || []);
    //   setFacilities(data.facilities || []);
    // });
  }, []);

  // 네이버 지도 API 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (mapRef.current) {
        const mapInstance = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(36.5, 127.8),
          zoom: 8,
          minZoom: 8
        });

        // zoom 이벤트 리스너 추가
        window.naver.maps.Event.addListener(mapInstance, 'zoom_changed', () => {
          setZoomLevel(mapInstance.getZoom());
        });

        setMap(mapInstance);
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col p-0 m-0">
      <MapCategoryTabs />
      <MapFilterBar />
      <div ref={mapRef} className="w-full flex-1 p-0 m-0">
        {map && (
          zoomLevel === 8 ? (
            clusters.map((cluster, idx) => (
              <ClusterMarker
                key={idx}
                map={map}
                cluster={cluster}
              />
            ))
          ) : zoomLevel >= 9 && zoomLevel <= 10 ? (
            districtClusters.map((cluster, idx) => (
              <ClusterMarker
                key={idx}
                map={map}
                cluster={cluster}
              />
            ))
          ) : (
            <>
              {hospitals.map((hospital, index) => (
                <HospitalMarker
                  key={index}
                  map={map}
                  hospital={hospital}
                  zoomLevel={zoomLevel}
                />
              ))}
              {pharmacies.map((pharmacy, index) => (
                <PharmacyMarker
                  key={index}
                  map={map}
                  pharmacy={pharmacy}
                  zoomLevel={zoomLevel}
                />
              ))}
              {facilities.map((facility, index) => (
                <FacilityMarker
                  key={index}
                  map={map}
                  facility={facility}
                  zoomLevel={zoomLevel}
                />
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default MapPage; 