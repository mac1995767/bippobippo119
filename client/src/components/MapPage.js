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
import MapSearchBar from './MapSearchBar';
// import { fetchMapData } from '../service/api';

const MapPage = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [hospitals, setHospitals] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadingTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

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

  // 검색 결과 처리 핸들러
  const handleSearchResult = async (result) => {
    if (!map || !result) return;

    try {
      setIsLoading(true);
      setLoadingMessage('위치로 이동 중...');

      const { lat, lng } = result;
      const point = new window.naver.maps.LatLng(lat, lng);
      
      // 먼저 지도 이동
      map.setCenter(point);
      map.setZoom(18);

      // 지도 이동이 완료될 때까지 기다림
      await new Promise(resolve => {
        window.naver.maps.Event.addListenerOnce(map, 'idle', resolve);
      });

      // 현재 지도 범위 내 데이터 로드
      const bounds = map.getBounds();
      const sw = bounds.getSW();
      const ne = bounds.getNE();

      // 검색 범위를 현재 위치 주변 1km로 제한
      const center = map.getCenter();
      const distance = 0.01; // 약 1km
      const searchBounds = {
        swLat: center.lat() - distance,
        swLng: center.lng() - distance,
        neLat: center.lat() + distance,
        neLng: center.lng() + distance
      };

      setLoadingMessage('데이터를 불러오는 중...');

      // 병원 데이터만 먼저 로드
      const hospRes = await fetchMapTypeData('hospital', searchBounds);
      setHospitals(hospRes);

      // 약국 데이터 로드
      const pharmRes = await fetchMapTypeData('pharmacy', searchBounds);
      setPharmacies(
        pharmRes.map(pharm => ({
          ...pharm,
          lat: pharm.lat || (pharm.location && pharm.location.lat),
          lng: pharm.lng || (pharm.location && pharm.location.lon),
        }))
      );

    } catch (err) {
      console.error('지도 데이터 불러오기 오류:', err);
      setLoadingMessage('데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col p-0 m-0">
      <MapCategoryTabs />
      <MapFilterBar />
      <MapZoomControl onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      {/* 지도+사이드바 flex row로 묶기 */}
      <div className="flex flex-row flex-1 h-0">
        <InfoSidebar info={selectedInfo} onClose={handleSidebarClose} />
        <div ref={mapRef} className="flex-1 p-0 m-0 relative">
          <MapSearchBar onSearch={handleSearchResult} />
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center min-w-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-gray-700 font-medium">{loadingMessage}</span>
              </div>
            </div>
          )}
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