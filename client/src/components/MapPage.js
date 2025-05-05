import React, { useEffect, useRef, useState } from 'react';
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
import MapZoomControl from './MapZoomControl';
import InfoSidebar from './InfoSidebar';
import MapSearchBar from './MapSearchBar';
import SgguClusterMarker from './markers/SgguClusterMarker';
import ClinicMarker from './markers/ClinicMarker';
import OrientalHospitalMarker from './markers/OrientalHospitalMarker';
import DentalClinicMarker from './markers/DentalClinicMarker';
import NursingHospitalMarker from './markers/NursingHospitalMarker';

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

  // 고유 ID 생성 함수
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
  const fetchDataByBoundsDebounced = debounce(fetchDataByBounds, 300);

  // 네이버 지도 스크립트 로드
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
        window.naver.maps.Event.addListener(mapInstance, 'idle', () => {
          setZoomLevel(mapInstance.getZoom());
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

  // 요약 데이터(fetchSido, fetchSggu, fetchEmdong) 호출 로직
  useEffect(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    const params = {
      swLat: sw.lat(),
      swLng: sw.lng(),
      neLat: ne.lat(),
      neLng: ne.lng()
    };

    if (zoomLevel >= 8 && zoomLevel <= 10) {
      // 8~10: 시도 요약
      fetchSidoSummary(params).then(setSidoSummary).catch(console.error);
    }
    else if (zoomLevel >= 11 && zoomLevel <= 14) {
      // 11~12: 시군구 요약
      fetchSgguSummary(params).then(setSgguSummary).catch(console.error);
    }
    else if (zoomLevel >= 15 && zoomLevel < 16) {
      // 13~15: 읍면동 요약
      fetchEmdongSummary(params).then(setEmdongSummary).catch(console.error);
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
      default:
        return selected ? 
          <DetailedHospitalMarker {...commonProps} /> : 
          <HospitalMarker {...commonProps} />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col p-0 m-0">
      <MapCategoryTabs />
      <MapFilterBar />
      <MapZoomControl onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

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
                  cluster={{ lat: item.YPos, lng: item.XPos, name: item.sidoNm }}
                />
              ))}

              {/* 줌 11~12: 시군구 요약 */}
              {(zoomLevel >= 11 && zoomLevel <= 14) && sgguSummary.map(item => (
                <SgguClusterMarker
                  key={`${item.sidoNm}-${item.sgguNm}`}
                  map={map}
                  sggu={item}
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
                    hospitalCount: item.hospitalCount,
                    pharmacyCount: item.pharmacyCount
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
        </div>
      </div>
    </div>
  );
};

export default MapPage;
