import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  fetchMapTypeData,
  fetchMapSummary,
  fetchMapSummarySggu,
  fetchSidoSummary,
  fetchSgguSummary,
  fetchEmdongSummary
} from '../service/api';
import MapCategoryTabs from './MapCategoryTabs';
import MapFilterBar from './MapFilterBar';
import HospitalMarker from './markers/HospitalMarker';
import PharmacyMarker from './markers/PharmacyMarker';
import DetailedHospitalMarker from './markers/DetailedHospitalMarker';
import DetailedPharmacyMarker from './markers/DetailedPharmacyMarker';
import SimpleHospitalMarker from './markers/SimpleHospitalMarker';
import SimplePharmacyMarker from './markers/SimplePharmacyMarker';
import ClusterMarker from './markers/ClusterMarker';
import hospitalClusters from './cluster/HospitalClusterStats';
import pharmacyClusters from './cluster/PharmacyClusterStats';
import debounce from 'lodash.debounce';
import MapToolbar from './map/MapToolbar';
import InfoSidebar from './InfoSidebar';
import MapSearchBar from './MapSearchBar';
import SgguClusterMarker from './markers/SgguClusterMarker';
import ClinicMarker from './markers/ClinicMarker';
import OrientalHospitalMarker from './markers/OrientalHospitalMarker';
import DentalClinicMarker from './markers/DentalClinicMarker';
import NursingHospitalMarker from './markers/NursingHospitalMarker';
import SuperGeneralHospitalMarker from './markers/SuperGeneralHospitalMarker';
import GeneralHospitalMarker from './markers/GeneralHospitalMarker';
import MentalHospitalMarker from './markers/MentalHospitalMarker';
import DentalHospitalMarker from './markers/DentalHospitalMarker';
import axios from 'axios';
import GeoBoundaryPolygon from './GeoBoundaryPolygon';

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
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(null);

  // 요약 데이터
  const [sidoSummary, setSidoSummary] = useState([]);
  const [sgguSummary, setSgguSummary] = useState([]);
  const [emdongSummary, setEmdongSummary] = useState([]);

  const [markerClusterer, setMarkerClusterer] = useState(null);
  const markersRef = useRef([]);

  const [regionName, setRegionName] = useState(null);
  const [regionNames, setRegionNames] = useState([]);

  const [visibleLayers, setVisibleLayers] = useState({
    hospitals: true,
    pharmacies: true,
    publicTransport: false,
    heatmap: false
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
          console.log('줌 레벨 변경:', newZoom);
          setZoomLevel(newZoom);
        });

        window.naver.maps.Event.addListener(mapInstance, 'idle', () => {
          const currentZoom = mapInstance.getZoom();
          console.log('지도 idle 이벤트 - 현재 줌 레벨:', currentZoom);
          setZoomLevel(currentZoom);
          fetchDataByBoundsDebounced(mapInstance);
        });

        setMap(mapInstance);
        fetchDataByBounds(mapInstance);
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // zoomLevel 값 변경 추적
  useEffect(() => {
    console.log('zoomLevel 상태 변경:', zoomLevel);
  }, [zoomLevel]);

  // 요약 데이터(fetchSido, fetchSggu, fetchEmdong) 호출 로직
  useEffect(() => {
    if (!map) return;
    console.log('요약 데이터 요청 - 현재 줌 레벨:', zoomLevel);
    
    const bounds = map.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    const center = map.getCenter();
    
    const params = {
      swLat: sw.lat(),
      swLng: sw.lng(),
      neLat: ne.lat(),
      neLng: ne.lng(),
      lat: center.lat(),
      lng: center.lng(),
      zoom: zoomLevel.toString() // 줌 레벨을 문자열로 변환
    };

    if (zoomLevel >= 8 && zoomLevel <= 10) {
      console.log('시도 요약 데이터 요청');
      fetchSidoSummary(params).then(setSidoSummary).catch(console.error);
    }
    else if (zoomLevel >= 11 && zoomLevel <= 14) {
      console.log('시군구 요약 데이터 요청');
      fetchSgguSummaryData(params);
    }
    else if (zoomLevel >= 15 && zoomLevel < 16) {
      console.log('읍면동 요약 데이터 요청');
      fetchEmdongSummaryData(params);
    }
  }, [zoomLevel, map]);

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
    hospitals.length && console.log('병원 샘플:', hospitals[0]);
    pharmacies.length && console.log('약국 샘플:', pharmacies[0]);
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
          map: map,
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
          map: map,
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

  // 시군구 요약 데이터 가져오기
  const fetchSgguSummaryData = async (params) => {
    try {
      const data = await fetchSgguSummary(params);
      console.log("시군구 요약 데이터 가져오기:", data);
      setSgguSummary(data);
      
    } catch (error) {
      console.error('시군구 요약 데이터 조회 실패:', error);
    }
  };

  // 읍면동 요약 데이터 가져오기
  const fetchEmdongSummaryData = async (params) => {
    try {
      const data = await fetchEmdongSummary(params);
      setEmdongSummary(data);
    } catch (error) {
      console.error('읍면동 요약 데이터 조회 실패:', error);
    }
  };

  // 지도 클릭 시 regionName을 '경기'로 설정
  useEffect(() => {
    if (!map) return;
    const listener = window.naver.maps.Event.addListener(map, 'click', () => {
      setRegionName('경기');
    });
    return () => window.naver.maps.Event.removeListener(listener);
  }, [map]);

  // 줌 레벨에 따라 regionNames 세팅
  useEffect(() => {
    if (!map) return;
    if (zoomLevel >= 8 && zoomLevel <= 10) {
      setRegionNames(sidoSummary.map(item => item.sidoNm));
    } else if (zoomLevel >= 11 && zoomLevel <= 14) {
      setRegionNames(sgguSummary.map(item => item.sgguNm));
    } else if (zoomLevel >= 15) {
      setRegionNames(emdongSummary.map(item => item.emdongNm));
    } 
  }, [zoomLevel, sidoSummary, sgguSummary, emdongSummary, map]);

  // regionNames 값 콘솔 출력
  useEffect(() => {
    console.log('regionNames:', regionNames);
  }, [regionNames]);

  // sgguSummary 값 콘솔 출력
  useEffect(() => {
    console.log('sgguSummary:', sgguSummary);
  }, [sgguSummary]);

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
    setSidoSummary([]);
    setSgguSummary([]);
    setEmdongSummary([]);
    setRegionNames([]);

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

  return (
    <div className="w-screen h-screen flex flex-col p-0 m-0">
      <MapCategoryTabs />
      <MapFilterBar />
      <MapToolbar onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      <div className="flex flex-row flex-1 h-0">
        <InfoSidebar info={selectedInfo} onClose={handleSidebarClose} />
        <div ref={mapRef} className="flex-1 p-0 m-0 relative">
          <MapSearchBar onSearch={handleSearchResult} />
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
              {/* 줌 8~10: 시도 요약 */}
              {(zoomLevel >= 8 && zoomLevel <= 10) && sidoSummary.map(item => (
                <ClusterMarker
                  key={item.sidoNm}
                  map={map}
                  cluster={{
                    lat: item.YPos,
                    lng: item.XPos,
                    name: item.sidoNm
                  }}
                />
              ))}

              {/* 줌 11~12: 시군구 요약 */}
              {(zoomLevel >= 11 && zoomLevel <= 14) && sgguSummary.map(item => (
                <SgguClusterMarker
                  key={item.sgguNm}
                  map={map}
                  sggu={{
                    ...item,
                    lat: item.YPos,
                    lng: item.XPos,
                    name: item.sgguNm
                  }}
                />
              ))}

              {/* 줌 13~15: 읍면동 요약 */}
              {(zoomLevel >= 13 && zoomLevel < 16) && emdongSummary.map(item => (
                <ClusterMarker
                  key={item.emdongNm}
                  map={map}
                  cluster={{
                    lat: item.YPos,
                    lng: item.XPos,
                    name: item.emdongNm,
                    sidoNm: item.sidoNm,
                    sgguNm: item.sgguNm
                  }}
                />
              ))}

              {/* 줌 16~18: 간단 마커(병원/약국) */}
              {(zoomLevel >= 16 && zoomLevel < 19) && (
                <>
                  {hospitals.map(hospital => (
                    <React.Fragment key={getHospitalUniqueId(hospital)}>
                      {getMarkerComponent(
                        hospital, 
                        selectedHospitalId === getHospitalUniqueId(hospital)
                      )}
                    </React.Fragment>
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
                          zoomLevel={zoomLevel}
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

          {map && regionNames.length > 0 && (
            <GeoBoundaryPolygon map={map} regionNames={regionNames} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
