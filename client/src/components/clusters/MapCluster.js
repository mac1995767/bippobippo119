import React, { useEffect, useState } from 'react';
import { fetchMapClusterData } from '../../service/api';

const MapCluster = ({ map, zoomLevel, onClusterClick }) => {
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    if (!map) return;

    const loadClusters = async () => {
      try {
        const bounds = map.getBounds();
        const sw = bounds.getSW();
        const ne = bounds.getNE();
        
        const clusterData = await fetchMapClusterData(
          {
            sw: { lat: sw.lat(), lng: sw.lng() },
            ne: { lat: ne.lat(), lng: ne.lng() }
          },
          zoomLevel
        );
        
        console.log('받아온 클러스터 데이터:', clusterData);
        setClusters(clusterData);
      } catch (error) {
        console.error('클러스터 데이터 로드 실패:', error);
      }
    };

    // 지도 이동 이벤트 리스너
    const idleListener = window.naver.maps.Event.addListener(map, 'idle', loadClusters);
    const zoomListener = window.naver.maps.Event.addListener(map, 'zoom_changed', loadClusters);
    
    // 초기 로드
    loadClusters();

    return () => {
      window.naver.maps.Event.removeListener(idleListener);
      window.naver.maps.Event.removeListener(zoomListener);
    };
  }, [map, zoomLevel]);

  // 클러스터 색상 결정 (119 컨셉)
  const getClusterColor = (total) => {
    if (total > 100) return '#E63946'; // 진한 응급차 레드
    if (total > 50) return '#FF4B4B';  // 밝은 응급차 레드
    if (total > 20) return '#FF6B6B';  // 연한 레드
    return '#FF8585';  // 아주 연한 레드
  };

  // 클러스터 마커 생성 및 관리
  useEffect(() => {
    if (!map) return;

    console.log('마커 생성할 클러스터 데이터:', clusters);

    // 기존 마커 제거
    clusters.forEach(cluster => {
      if (cluster.marker) {
        cluster.marker.setMap(null);
      }
    });

    // 새로운 마커 생성
    clusters.forEach(cluster => {
      console.log('개별 클러스터 데이터:', {
        name: cluster.name,
        hospitalCount: cluster.hospitalCount,
        pharmacyCount: cluster.pharmacyCount
      });

      const position = new window.naver.maps.LatLng(
        cluster.location.lat,
        cluster.location.lon
      );

      const total = cluster.hospitalCount + cluster.pharmacyCount;
      const size = Math.min(32 + Math.floor(Math.log2(total + 1) * 3), 48);

      const markerContent = `
        <div style="position: relative;">
          <div class="cluster-marker" style="
            width: ${size}px;
            height: ${size}px;
            line-height: ${size}px;
            background-color: ${getClusterColor(total)};
            color: white;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: max-content;
            padding: 0 8px;
            white-space: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
          ">
            ${cluster.name}
          </div>
          <div class="cluster-info" style="
            display: none;
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            padding: 4px 8px;
            background: #E63946;
            border: 1.5px solid white;
            border-radius: 4px;
            font-size: 12px;
            color: white;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 2;
          ">
            병원 ${cluster.hospitalCount || 0} · 약국 ${cluster.pharmacyCount || 0}
          </div>
        </div>
        <style>
          .cluster-marker:hover {
            transform: scale(1.1);
          }
          .cluster-marker:hover + .cluster-info {
            display: block !important;
          }
        </style>
      `;

      console.log('생성할 마커 내용:', markerContent);

      const marker = new window.naver.maps.Marker({
        position,
        map,
        icon: {
          content: markerContent,
          anchor: new window.naver.maps.Point(size/2, size/2)
        }
      });

      // 클릭 이벤트 추가
      window.naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedCluster(cluster);
        if (onClusterClick) {
          onClusterClick(cluster, position);
        }
      });

      // 마커 참조 저장
      cluster.marker = marker;
    });

    return () => {
      clusters.forEach(cluster => {
        if (cluster.marker) {
          cluster.marker.setMap(null);
        }
      });
    };
  }, [clusters, map, selectedCluster, onClusterClick]);

  return null; // 렌더링은 지도에 직접 수행됨
};

export default MapCluster; 