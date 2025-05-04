import React, { useEffect, useRef, useState } from 'react';
import { fetchMapTypeData } from '../service/api';
import MapCategoryTabs from './MapCategoryTabs';
import MapFilterBar from './MapFilterBar';
import HospitalMarker from './markers/HospitalMarker';
import PharmacyMarker from './markers/PharmacyMarker';
import FacilityMarker from './markers/FacilityMarker';
import ClusterMarker from './markers/ClusterMarker';
import hospitalClusters from './cluster/HospitalClusterStats';
import pharmacyClusters from './cluster/PharmacyClusterStats';
import debounce from 'lodash.debounce';
import MapZoomControl from './MapZoomControl';
import InfoSidebar from './InfoSidebar';
// import { fetchMapData } from '../service/api';

const MapPage = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [hospitals, setHospitals] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedInfo, setSelectedInfo] = useState(null);

  // 지도 영역 내 데이터 불러오기 함수
  const fetchDataByBounds = async (mapInstance) => {
    if (!mapInstance) return;
    const bounds = mapInstance.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    try {
      const [hospRes, pharmRes] = await Promise.all([
        fetchMapTypeData('hospital', {
          swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng()
        }),
        fetchMapTypeData('pharmacy', {
          swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng()
        })
      ]);
      setHospitals(hospRes);
      setPharmacies(
        pharmRes.map(pharm => ({
          ...pharm,
          lat: pharm.lat || (pharm.location && pharm.location.lat),
          lng: pharm.lng || (pharm.location && pharm.location.lon),
        }))
      );
    } catch (err) {
      console.error('지도 데이터 불러오기 오류:', err);
    }
  };

  // 디바운스 적용 (300ms)
  const fetchDataByBoundsDebounced = debounce(fetchDataByBounds, 300);

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

        // zoom/idle(이동) 이벤트 리스너 추가 (debounce 적용)
        window.naver.maps.Event.addListener(mapInstance, 'idle', () => {
          setZoomLevel(mapInstance.getZoom());
          fetchDataByBoundsDebounced(mapInstance);
        });

        setMap(mapInstance);
        // 최초 로딩 시 데이터 fetch
        fetchDataByBounds(mapInstance);
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 지도 확대/축소 버튼 핸들러
  const handleZoomIn = () => {
    if (map) map.setZoom(map.getZoom() + 1);
  };
  const handleZoomOut = () => {
    if (map) map.setZoom(map.getZoom() - 1);
  };

  // 마커 클릭 핸들러
  const handleHospitalClick = (hospital) => setSelectedInfo(hospital);
  const handlePharmacyClick = (pharmacy) => setSelectedInfo(pharmacy);
  const handleSidebarClose = () => setSelectedInfo(null);

  return (
    <div className="w-screen h-screen flex flex-col p-0 m-0">
      <MapCategoryTabs />
      <MapFilterBar />
      <MapZoomControl onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      {/* 지도+사이드바 flex row로 묶기 */}
      <div className="flex flex-row flex-1 h-0">
        <InfoSidebar info={selectedInfo} onClose={handleSidebarClose} />
        <div ref={mapRef} className="flex-1 p-0 m-0">
          {map && (
            zoomLevel < 18 ? (
              <>
                {hospitalClusters.map((cluster, idx) => (
                  <ClusterMarker
                    key={`hospital-${idx}`}
                    map={map}
                    cluster={{ ...cluster, type: 'hospital' }}
                  />
                ))}
                {pharmacyClusters.map((cluster, idx) => (
                  <ClusterMarker
                    key={`pharmacy-${idx}`}
                    map={map}
                    cluster={{ ...cluster, type: 'pharmacy' }}
                  />
                ))}
              </>
            ) : (
              <>
                {hospitals.map((hospital, index) => (
                  <HospitalMarker
                    key={index}
                    map={map}
                    hospital={hospital}
                    zoomLevel={zoomLevel}
                    onClick={() => handleHospitalClick(hospital)}
                  />
                ))}
                {pharmacies.map((pharmacy, index) => (
                  <PharmacyMarker
                    key={index}
                    map={map}
                    pharmacy={pharmacy}
                    zoomLevel={zoomLevel}
                    onClick={() => handlePharmacyClick(pharmacy)}
                  />
                ))}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage; 