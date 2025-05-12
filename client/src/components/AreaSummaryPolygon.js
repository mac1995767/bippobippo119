import React, { useEffect, useRef, useState } from 'react';
import { fetchAreaSummary } from '../service/api';
import { fetchCtpBoundary, fetchSigBoundary, fetchEmdBoundary, fetchLiBoundary } from '../service/api';

const AreaSummaryPolygon = ({ map, zoomLevel }) => {
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [summaryData, setSummaryData] = useState([]);
  const eventListenersRef = useRef([]);
  const currentPolygonRef = useRef(null);

  // 요약 데이터 가져오기
  const fetchSummaryData = async () => {
    if (!map) return;
    
    const bounds = map.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    
    try {
      const data = await fetchAreaSummary(
        {
          sw: { lat: sw.lat(), lng: sw.lng() },
          ne: { lat: ne.lat(), lng: ne.lng() }
        },
        zoomLevel
      );
      setSummaryData(data);
    } catch (error) {
      console.error('요약 데이터 조회 실패:', error);
    }
  };

  // map이 변경될 때마다 데이터 로드
  useEffect(() => {
    if (map) {
      fetchSummaryData();
    }
  }, [map]);

  // 지도 이동이나 줌 변경 시 데이터 갱신
  useEffect(() => {
    if (!map) return;

    const handleMapChange = () => {
      fetchSummaryData();
    };

    const idleListener = window.naver.maps.Event.addListener(map, 'idle', handleMapChange);
    const zoomListener = window.naver.maps.Event.addListener(map, 'zoom_changed', handleMapChange);
    
    eventListenersRef.current = [idleListener, zoomListener];

    return () => {
      if (map && window.naver.maps.Event) {
        eventListenersRef.current.forEach(listener => {
          try {
            window.naver.maps.Event.removeListener(listener);
          } catch (error) {
            console.error('이벤트 리스너 제거 실패:', error);
          }
        });
      }
    };
  }, [map, zoomLevel]);

  // 경계 데이터 가져오기
  const fetchBoundary = async (coordinates) => {
    try {
      let geoJson = null;
      // Emd 정보로 지역 유형 판별
      let emdJsonForType = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
      let emdName = '';
      if (emdJsonForType?.features?.length) {
        emdName = emdJsonForType.features[0]?.properties?.EMD_KOR_NM || '';
      }
      const isMetropolitanArea = emdName.endsWith('동');

      if (isMetropolitanArea) {
        if (zoomLevel <= 8) {
          geoJson = await fetchCtpBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else if (zoomLevel >= 9 && zoomLevel <= 13) {
          geoJson = await fetchSigBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else if (zoomLevel >= 14) {
          geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        }
      } else {
        if (zoomLevel === 11) {
          geoJson = await fetchSigBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else if (zoomLevel === 12) {
          geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        } else if (zoomLevel === 13) {
          geoJson = await fetchLiBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          if (!geoJson?.features?.length) {
            geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          }
        } else if (zoomLevel >= 14) {
          geoJson = await fetchLiBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          if (!geoJson?.features?.length) {
            geoJson = await fetchEmdBoundary({ lat: coordinates.lat, lng: coordinates.lng });
          }
        } else if (zoomLevel <= 10) {
          geoJson = await fetchCtpBoundary({ lat: coordinates.lat, lng: coordinates.lng });
        }
      }

      if (!geoJson?.features?.length) return;

      // 기존 폴리곤 제거
      if (currentPolygonRef.current) {
        currentPolygonRef.current.setMap(null);
      }

      // 새로운 폴리곤 생성
      const feature = geoJson.features[0];
      const geom = feature.geometry;
      const rawArray = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      const paths = rawArray
        .map(polygon =>
          polygon[0]
            .filter(pt => Array.isArray(pt) && pt.length === 2)
            .map(([lng, lat]) => new window.naver.maps.LatLng(lat, lng))
        )
        .filter(path => path.length >= 3);

      if (paths.length) {
        const polygon = new window.naver.maps.Polygon({
          map,
          paths,
          strokeColor: '#5347AA',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#5347AA',
          fillOpacity: 0.2,
        });
        currentPolygonRef.current = polygon;
      }
    } catch (err) {
      console.error('경계 데이터 조회 실패:', err);
    }
  };

  // 마커 생성 및 이벤트 리스너 설정
  useEffect(() => {
    if (!map || !summaryData.length) return;

    // 기존 마커와 인포윈도우 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    const markerListeners = [];

    // 각 요약 데이터에 대해 마커 생성
    summaryData.forEach(data => {
      if (!data.center) return;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(data.center.lat, data.center.lng),
        map,
        icon: {
          content: `
            <div class="bg-white rounded-full p-1 shadow-md">
              <div class="text-xs font-bold text-gray-800">
                ${data.hospitalCount + data.pharmacyCount} ${data.name}
              </div>
            </div>
          `,
          size: new window.naver.maps.Size(30, 30),
          anchor: new window.naver.maps.Point(15, 15)
        },
        zIndex: 100
      });

      // 인포윈도우 생성
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="
            padding: 6px 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #5347AA;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 11px;
            color: #5347AA;
            white-space: nowrap;
          ">
            <div style="display: flex; gap: 8px;">
              <span style="color: #000000;">병원 ${data.hospitalCount}</span>
              <span style="color: #000000;">약국 ${data.pharmacyCount}</span>
            </div>
          </div>
        `,
        position: marker.getPosition(),
        disableAnchor: true,
        borderWidth: 0,
        backgroundColor: 'transparent',
        zIndex: 1000
      });

      // 마우스 이벤트 리스너 추가
      const mouseoverListener = window.naver.maps.Event.addListener(marker, 'mouseover', () => {
        infoWindow.open(map);
        fetchBoundary(data.center);
      });

      const mouseoutListener = window.naver.maps.Event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
        if (currentPolygonRef.current) {
          currentPolygonRef.current.setMap(null);
          currentPolygonRef.current = null;
        }
      });

      markersRef.current.push(marker);
      markerListeners.push(mouseoverListener, mouseoutListener);
    });

    // 줌 레벨에 따른 표시 여부 설정
    const updateVisibility = () => {
      const currentZoom = map.getZoom();
      markersRef.current.forEach(marker => {
        marker.setMap(currentZoom >= 8 ? map : null);
      });
    };

    const zoomListener = window.naver.maps.Event.addListener(map, 'zoom_changed', updateVisibility);
    markerListeners.push(zoomListener);
    updateVisibility();

    return () => {
      if (map && window.naver.maps.Event) {
        markerListeners.forEach(listener => {
          try {
            window.naver.maps.Event.removeListener(listener);
          } catch (error) {
            console.error('마커 이벤트 리스너 제거 실패:', error);
          }
        });
      }
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (currentPolygonRef.current) {
        currentPolygonRef.current.setMap(null);
        currentPolygonRef.current = null;
      }
    };
  }, [map, summaryData, zoomLevel]);

  return null;
};

export default AreaSummaryPolygon; 