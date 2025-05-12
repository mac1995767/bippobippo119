import React, { useEffect, useRef, useState } from 'react';
import { fetchAreaSummary } from '../service/api';

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

  // 요약 데이터를 마커로 표시
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

      // 마커 생성
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(data.center.lat, data.center.lng),
        map,
        icon: {
          content: `
            <div class="bg-white rounded-full p-1 shadow-md">
              <div class="text-xs font-bold text-gray-800">
                ${data.hospitalCount + data.pharmacyCount}
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
          <div class="p-2 bg-white rounded shadow-lg">
            <h3 class="font-bold text-sm">${data.name}</h3>
            <p class="text-xs">병원: ${data.hospitalCount}개</p>
            <p class="text-xs">약국: ${data.pharmacyCount}개</p>
          </div>
        `,
        position: new window.naver.maps.LatLng(data.center.lat, data.center.lng),
        pixelOffset: new window.naver.maps.Point(0, -10),
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
  }, [map, summaryData]);

  return null;
};

export default AreaSummaryPolygon; 