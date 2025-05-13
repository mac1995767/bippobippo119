import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchMapTypeData, fetchCtpBoundary, fetchSigBoundary, fetchEmdBoundary, fetchLiBoundary } from '../service/api';
import MapCategoryTabs from './MapCategoryTabs';
import MapFilterBar from './MapFilterBar';
import HospitalMarker from './markers/HospitalMarker';
import PharmacyMarker from './markers/PharmacyMarker';
import DetailedHospitalMarker from './markers/DetailedHospitalMarker';
import DetailedPharmacyMarker from './markers/DetailedPharmacyMarker';
import debounce from 'lodash.debounce';
import MapToolbar from './map/MapToolbar';
import InfoSidebar from './InfoSidebar';
import MapSearchBar from './MapSearchBar';
import ClinicMarker from './markers/ClinicMarker';
import OrientalHospitalMarker from './markers/OrientalHospitalMarker';
import DentalClinicMarker from './markers/DentalClinicMarker';
import NursingHospitalMarker from './markers/NursingHospitalMarker';
import SuperGeneralHospitalMarker from './markers/SuperGeneralHospitalMarker';
import GeneralHospitalMarker from './markers/GeneralHospitalMarker';
import MentalHospitalMarker from './markers/MentalHospitalMarker';
import DentalHospitalMarker from './markers/DentalHospitalMarker';
import AreaSummaryPolygon from './AreaSummaryPolygon';

const MapPage = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(8);
  const [hospitals, setHospitals] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);
  const [markerClusterer, setMarkerClusterer] = useState(null);
  const markersRef = useRef([]);

  const [visibleLayers, setVisibleLayers] = useState({
    hospitals: true,
    pharmacies: true,
    publicTransport: false,
    heatmap: false
  });

  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [lastClickedPosition, setLastClickedPosition] = useState(null);

  const [boundaryCache, setBoundaryCache] = useState({
    ctp: new Map(),
    sig: new Map(),
    emd: new Map(),
    li: new Map()
  });

  // 요약 데이터
  const getPharmacyUniqueId = (pharmacy) =>
    pharmacy.ykiho || `${pharmacy.name}_${pharmacy.lat}_${pharmacy.lng}`;

  const getHospitalUniqueId = (hospital) =>
    hospital.ykiho || `${hospital.yadmNm || hospital.name}_${hospital.location.lat}_${hospital.location.lon}`;

  // 지도 영역 내 병원/약국 데이터 fetch
  const fetchDataByBounds = async (mapInstance) => {
    if (!mapInstance) return;
    const bounds = mapInstance.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    try {
      const [hospRes, pharmRes] = await Promise.all([
        fetchMapTypeData('hospital', {
          swLat: sw.lat(), 
          swLng: sw.lng(), 
          neLat: ne.lat(), 
          neLng: ne.lng()
        }),
        fetchMapTypeData('pharmacy', {
          swLat: sw.lat(), 
          swLng: sw.lng(), 
          neLat: ne.lat(), 
          neLng: ne.lng()
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
  const fetchDataByBoundsDebounced = debounce(fetchDataByBounds, 300);

  // 네이버 지도 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}&submodules=geocoder,clustering`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (mapRef.current) {
        const mapInstance = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(36.5, 127.8),
          zoom: 8,
          minZoom: 8
        });

        // 줌 레벨 변경 이벤트 리스너 추가
        window.naver.maps.Event.addListener(mapInstance, 'zoom_changed', () => {
          const newZoom = mapInstance.getZoom();
          setZoomLevel(newZoom);
        });

        window.naver.maps.Event.addListener(mapInstance, 'idle', () => {
          const currentZoom = mapInstance.getZoom();
          setZoomLevel(currentZoom);
          fetchDataByBoundsDebounced(mapInstance);
        });
        
        // 클릭 이벤트 리스너 추가
        window.naver.maps.Event.addListener(mapInstance, 'click', (e) => {
          const coord = e.coord;
          const newPosition = {
            lat: coord.y,
            lng: coord.x
          };

          // 이전 클릭 위치와 현재 클릭 위치가 같은지 확인
          const isSamePosition = lastClickedPosition && 
            Math.abs(lastClickedPosition.lat - newPosition.lat) < 0.0001 && 
            Math.abs(lastClickedPosition.lng - newPosition.lng) < 0.0001;

          if (isSamePosition) {
            // 같은 위치를 클릭한 경우 폴리곤 제거
            if (currentPolygon) {
              currentPolygon.setMap(null);
            }
            setCurrentPolygon(null);
            setLastClickedPosition(null);
          } else {
            // 다른 위치를 클릭한 경우
            if (currentPolygon) {
              currentPolygon.setMap(null);
            }
            setLastClickedPosition(newPosition);
          }
        });

        setMap(mapInstance);
        fetchDataByBounds(mapInstance);
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 확대/축소 버튼
  const handleZoomIn = () => map && map.setZoom(map.getZoom() + 1);
  const handleZoomOut = () => map && map.setZoom(map.getZoom() - 1);

  // 마커 클릭
  const handleHospitalClick = (hospital) => {
    setSelectedHospitalId(getHospitalUniqueId(hospital));
    setSelectedInfo(hospital);
  };
  const handlePharmacyClick = (pharmacy) => {
    setSelectedPharmacyId(getPharmacyUniqueId(pharmacy));
    setSelectedInfo(pharmacy);
  };
  const handleSidebarClose = () => setSelectedInfo(null);

  // 검색 처리
  const handleSearchResult = async (result) => {
    if (!map || !result) return;
    try {
      setIsLoading(true);
      setLoadingMessage('위치로 이동 중...');
      const point = new window.naver.maps.LatLng(result.lat, result.lng);
      map.setCenter(point);
      map.setZoom(18);
      await new Promise(resolve => window.naver.maps.Event.addListenerOnce(map, 'idle', resolve));

      setLoadingMessage('데이터를 불러오는 중...');
      const center = map.getCenter();
      const d = 0.01; // 대략 1km
      const searchBounds = {
        swLat: center.lat() - d,
        swLng: center.lng() - d,
        neLat: center.lat() + d,
        neLng: center.lng() + d
      };

      const hospRes = await fetchMapTypeData('hospital', searchBounds);
      setHospitals(hospRes);
      const pharmRes = await fetchMapTypeData('pharmacy', searchBounds);
      setPharmacies(pharmRes.map(pharm => ({
        ...pharm,
        lat: pharm.lat || (pharm.location && pharm.location.lat),
        lng: pharm.lng || (pharm.location && pharm.location.lon),
      })));
    } catch (err) {
      console.error('지도 데이터 불러오기 오류:', err);
      setLoadingMessage('데이터 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // 언마운트 시 cleanup
  useEffect(() => () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  // 디버그 로그
  useEffect(() => {
    // 병원과 약국 데이터 로깅 제거
  }, [hospitals, pharmacies]);

  // 병원 유형별 마커 컴포넌트 매핑
  const getMarkerComponent = (hospital, selected) => {
    const commonProps = {
      map: map,
      hospital: hospital,
      onClick: () => handleHospitalClick(hospital),
      zoomLevel: zoomLevel,
      selected: selected
    };

    switch (hospital.clCdNm) {
      case '한의원':
        return <OrientalHospitalMarker {...commonProps} />;
      case '치과의원':
        return <DentalClinicMarker {...commonProps} />;
      case '요양병원':
        return <NursingHospitalMarker {...commonProps} />;
      case '의원':
        return <ClinicMarker {...commonProps} />;
      case '병원':
        return <HospitalMarker {...commonProps} />;
      case '종합병원':
        return <GeneralHospitalMarker {...commonProps} />;
      case '상급종합':
        return <SuperGeneralHospitalMarker {...commonProps} />;
      case '정신병원':
        return <MentalHospitalMarker {...commonProps} />;
      case '치과병원':
        return <DentalHospitalMarker {...commonProps} />;
      default:
        return selected ? 
          <DetailedHospitalMarker {...commonProps} /> : 
          <HospitalMarker {...commonProps} />;
    }
  };

  // 클러스터 초기화
  useEffect(() => {
    if (!map || !window.naver.maps.MarkerClustering) return;

    const clusterer = new window.naver.maps.MarkerClustering({
      minClusterSize: 2,
      maxZoom: 15,
      map: map,
      disableClickZoom: false,
      gridSize: 120,
      icons: [
        {
          content: `<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background-color:#4CAF50;border-radius:100%;">1</div>`,
          size: new window.naver.maps.Size(40, 40),
          anchor: new window.naver.maps.Point(20, 20)
        },
        {
          content: `<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background-color:#2196F3;border-radius:100%;">2</div>`,
          size: new window.naver.maps.Size(40, 40),
          anchor: new window.naver.maps.Point(20, 20)
        },
        {
          content: `<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background-color:#FFC107;border-radius:100%;">3</div>`,
          size: new window.naver.maps.Size(40, 40),
          anchor: new window.naver.maps.Point(20, 20)
        }
      ],
      indexGenerator: [10, 100, 200, 500, 1000],
      stylingFunction: function(clusterMarker, count) {
        const element = clusterMarker.getElement();
        const div = element.querySelector('div');
        if (div) {
          div.textContent = count;
        }
      }
    });

    setMarkerClusterer(clusterer);

    return () => {
      if (clusterer) {
        clusterer.destroy();
      }
    };
  }, [map]);

  // 레이어 변경 핸들러
  const handleLayerToggle = useCallback((layers) => {
    setVisibleLayers(layers);
  }, []);

  // 마커 업데이트
  useEffect(() => {
    if (!markerClusterer || !map) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    markerClusterer.clear();

    // 새로운 마커 생성
    const newMarkers = [];

    // 병원 마커 생성 (레이어가 활성화된 경우에만)
    if (visibleLayers.hospitals) {
      hospitals.forEach(hospital => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            hospital.location?.lat || hospital.lat,
            hospital.location?.lon || hospital.lng
          ),
          map: visibleLayers.hospitals ? map : null, // 레이어 상태에 따라 map 설정
          title: hospital.yadmNm || hospital.name,
          icon: {
            content: `<div style="width:16px;height:16px;background-color:#66BB6A;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
            size: new window.naver.maps.Size(16, 16),
            anchor: new window.naver.maps.Point(8, 8)
          }
        });

        window.naver.maps.Event.addListener(marker, 'click', () => handleHospitalClick(hospital));
        newMarkers.push(marker);
      });
    }

    // 약국 마커 생성 (레이어가 활성화된 경우에만)
    if (visibleLayers.pharmacies) {
      pharmacies.forEach(pharmacy => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            pharmacy.lat || pharmacy.location?.lat,
            pharmacy.lng || pharmacy.location?.lon
          ),
          map: visibleLayers.pharmacies ? map : null, // 레이어 상태에 따라 map 설정
          title: pharmacy.name,
          icon: {
            content: `<div style="width:16px;height:16px;background-color:#42A5F5;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
            size: new window.naver.maps.Size(16, 16),
            anchor: new window.naver.maps.Point(8, 8)
          }
        });

        window.naver.maps.Event.addListener(marker, 'click', () => handlePharmacyClick(pharmacy));
        newMarkers.push(marker);
      });
    }

    // 마커를 클러스터에 추가
    markerClusterer.addMarkers(newMarkers);
    markersRef.current = newMarkers;

  }, [hospitals, pharmacies, markerClusterer, map, visibleLayers]);

  // 초기화 함수 추가
  const handleReset = useCallback(() => {
    if (!map) return;
    
    // 초기 중심점과 줌 레벨로 이동
    const initialCenter = new window.naver.maps.LatLng(36.5, 127.8);
    map.setCenter(initialCenter);
    map.setZoom(8);

    // 선택된 정보 초기화
    setSelectedInfo(null);
    setSelectedHospitalId(null);
    setSelectedPharmacyId(null);

    // 데이터 초기화
    setHospitals([]);
    setPharmacies([]);

    // 초기 데이터 로드
    fetchDataByBounds(map);
  }, [map]);


  // 목록 아이템 클릭 핸들러
  const handleListItemClick = useCallback((item) => {
    if (!map) return;

    // 병원인 경우
    if (item.yadmNm || item.clCdNm) {
      const position = new window.naver.maps.LatLng(
        item.location?.lat || item.lat,
        item.location?.lon || item.lng
      );
      map.setCenter(position);
      map.setZoom(19);
      handleHospitalClick(item);
    }
    // 약국인 경우
    else {
      const position = new window.naver.maps.LatLng(item.lat, item.lng);
      map.setCenter(position);
      map.setZoom(19);
      handlePharmacyClick(item);
    }
  }, [map, handleHospitalClick, handlePharmacyClick]);

  // 검색바 토글 핸들러 추가
  const handleSearchToggle = useCallback(() => {
    setIsSearchBarVisible(prev => !prev);
  }, []);

  // 경계 데이터 미리 로딩
  const preloadBoundaryData = async () => {
    try {
      const bounds = map.getBounds();
      const sw = bounds.getSW();
      const ne = bounds.getNE();
      
      // 모든 경계 데이터를 병렬로 로딩
      const [ctpData, sigData, emdData, liData] = await Promise.all([
        fetchCtpBoundary({ lat: sw.lat(), lng: sw.lng() }),
        fetchSigBoundary({ lat: sw.lat(), lng: sw.lng() }),
        fetchEmdBoundary({ lat: sw.lat(), lng: sw.lng() }),
        fetchLiBoundary({ lat: sw.lat(), lng: sw.lng() })
      ]);

      // 데이터를 Map에 저장
      const newCache = { ...boundaryCache };
      
      if (ctpData?.features) {
        ctpData.features.forEach(feature => {
          newCache.ctp.set(feature.properties._id, feature);
        });
      }
      
      if (sigData?.features) {
        sigData.features.forEach(feature => {
          newCache.sig.set(feature.properties._id, feature);
        });
      }
      
      if (emdData?.features) {
        emdData.features.forEach(feature => {
          newCache.emd.set(feature.properties._id, feature);
        });
      }
      
      if (liData?.features) {
        liData.features.forEach(feature => {
          newCache.li.set(feature.properties._id, feature);
        });
      }

      setBoundaryCache(newCache);
    } catch (error) {
      console.error('경계 데이터 로딩 실패:', error);
    }
  };

  // 지도 이동 시 경계 데이터 로딩
  useEffect(() => {
    if (!map) return;

    const handleMapChange = () => {
      preloadBoundaryData();
    };

    const idleListener = window.naver.maps.Event.addListener(map, 'idle', handleMapChange);
    const zoomListener = window.naver.maps.Event.addListener(map, 'zoom_changed', handleMapChange);

    return () => {
      if (map && window.naver.maps.Event) {
        window.naver.maps.Event.removeListener(idleListener);
        window.naver.maps.Event.removeListener(zoomListener);
      }
    };
  }, [map]);

  return (
    <div className="w-screen h-screen flex flex-col p-0 m-0">
      <MapCategoryTabs />
      <MapFilterBar />
      <MapToolbar 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        hospitals={hospitals}
        pharmacies={pharmacies}
        onItemClick={handleListItemClick}
        map={map}
        onReset={handleReset}
        onSearch={handleSearchToggle}
      />

      <div className="flex flex-row flex-1 h-0">
        <InfoSidebar info={selectedInfo} onClose={handleSidebarClose} />
        <div ref={mapRef} className="flex-1 p-0 m-0 relative">
          <MapSearchBar onSearch={handleSearchResult} isVisible={isSearchBarVisible} />
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
                <span className="text-gray-700 font-medium">{loadingMessage}</span>
              </div>
            </div>
          )}

          {map && (
            <>
              {/* 요약 데이터 폴리곤 */}
              <AreaSummaryPolygon
                map={map}
                zoomLevel={zoomLevel}
                boundaryCache={boundaryCache}
              />

              {/* 줌 16~18: 간단 마커(병원/약국) */}
              {(zoomLevel >= 16 && zoomLevel < 19) && (
                <>
                  {hospitals.map(hospital => (
                    selectedHospitalId === getHospitalUniqueId(hospital)
                      ? <DetailedHospitalMarker
                          key={getHospitalUniqueId(hospital)}
                          map={map}
                          hospital={hospital}
                          onClick={() => handleHospitalClick(hospital)}
                          selected
                        />
                      : <HospitalMarker
                          key={getHospitalUniqueId(hospital)}
                          map={map}
                          hospital={hospital}
                          zoomLevel={zoomLevel}
                          onClick={() => handleHospitalClick(hospital)}
                        />
                  ))}
                  {pharmacies.map(pharmacy => (
                    selectedPharmacyId === getPharmacyUniqueId(pharmacy)
                      ? <DetailedPharmacyMarker
                          key={getPharmacyUniqueId(pharmacy)}
                          map={map}
                          pharmacy={pharmacy}
                          onClick={() => handlePharmacyClick(pharmacy)}
                          selected
                        />
                      : <PharmacyMarker
                          key={getPharmacyUniqueId(pharmacy)}
                          map={map}
                          pharmacy={pharmacy}
                          zoomLevel={handleReset}
                          onClick={() => handlePharmacyClick(pharmacy)}
                        />
                  ))}
                </>
              )}

              {/* 줌 19+: 상세 마커 */}
              {zoomLevel >= 19 && (
                <>
                  {hospitals.map(hospital => (
                    <DetailedHospitalMarker
                      key={getHospitalUniqueId(hospital)}
                      map={map}
                      hospital={hospital}
                      onClick={() => handleHospitalClick(hospital)}
                      selected={selectedHospitalId === getHospitalUniqueId(hospital)}
                    />
                  ))}
                  {pharmacies.map(pharmacy => (
                    <DetailedPharmacyMarker
                      key={getPharmacyUniqueId(pharmacy)}
                      map={map}
                      pharmacy={pharmacy}
                      onClick={() => handlePharmacyClick(pharmacy)}
                      selected={selectedPharmacyId === getPharmacyUniqueId(pharmacy)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;