import React, { useEffect, useRef, useState } from 'react';
import { fetchAreaSummary, checkAreaSummaryCacheStatus, fetchCachedAreaSummary } from '../service/api';

const AreaSummaryPolygon = ({ map, zoomLevel }) => {
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [summaryData, setSummaryData] = useState([]);
  const eventListenersRef = useRef([]);

  // 요약 데이터 가져오기
  const fetchSummaryData = async () => {
    if (!map) return;
    
    const bounds = map.getBounds();
    const sw = bounds.getSW();
    const ne = bounds.getNE();
    
    try {
      // Redis 캐시 상태 확인
      const cacheStatus = await checkAreaSummaryCacheStatus(
        {
          sw: { lat: sw.lat(), lng: sw.lng() },
          ne: { lat: ne.lat(), lng: ne.lng() }
        },
        zoomLevel
      );

      let data;
      if (cacheStatus.isCached) {
        // 캐시된 데이터가 있으면 캐시에서 조회
        data = await fetchCachedAreaSummary(
          {
            sw: { lat: sw.lat(), lng: sw.lng() },
            ne: { lat: ne.lat(), lng: ne.lng() }
          },
          zoomLevel
        );
        console.log('Redis 캐시에서 데이터 조회 완료');
      } else {
        // 캐시된 데이터가 없으면 일반 API 호출
        data = await fetchAreaSummary(
          {
            sw: { lat: sw.lat(), lng: sw.lng() },
            ne: { lat: ne.lat(), lng: ne.lng() }
          },
          zoomLevel
        );
        console.log('일반 API에서 데이터 조회 완료');
      }
      
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
      });

      const mouseoutListener = window.naver.maps.Event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
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
    };
  }, [map, summaryData, zoomLevel]);

  return null;
};

export default AreaSummaryPolygon; 