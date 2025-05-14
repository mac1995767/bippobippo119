import React, { useEffect } from 'react';

const ClusterMarker = ({ 
  map, 
  position, 
  cluster,
  onClusterClick = () => {},
  zoomLevel,
}) => {
  const [marker, setMarker] = React.useState(null);

  useEffect(() => {
    if (!map || !cluster) return;

    // 클러스터 마커인 경우
    const { clusterCount = 1 } = cluster;
    const size = Math.min(36 + (clusterCount * 1.5), 48);
    const fontSize = Math.min(12 + (clusterCount / 10), 16);

    const newMarker = new window.naver.maps.Marker({
      position: position,
      map: map,
      icon: {
        content: `
          <div style="
            cursor: pointer;
            background-color: #FF5252;
            color: white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize}px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 2px solid #FFFFFF;
          ">
            ${clusterCount}
          </div>
        `,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size/2, size/2)
      }
    });

    // 클릭 이벤트 처리
    window.naver.maps.Event.addListener(newMarker, 'click', () => {
      const point = map.getProjection().fromCoordToOffset(position);
      const pixelOffset = new window.naver.maps.Point(0, -size - 10); // 마커 크기 + 여백만큼 위로
      const adjustedPoint = {
        x: point.x + pixelOffset.x,
        y: point.y + pixelOffset.y
      };
      onClusterClick(cluster, adjustedPoint);
    });

    // 마우스 이벤트 처리
    window.naver.maps.Event.addListener(newMarker, 'mouseover', () => {
      newMarker.setIcon({
        content: `
          <div style="
            cursor: pointer;
            background-color: #FF5252;
            color: white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize}px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            border: 2px solid #FFFFFF;
          ">
            ${clusterCount}
          </div>
        `,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size/2, size/2)
      });
    });

    window.naver.maps.Event.addListener(newMarker, 'mouseout', () => {
      newMarker.setIcon({
        content: `
          <div style="
            cursor: pointer;
            background-color: #FF5252;
            color: white;
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${fontSize}px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 2px solid #FFFFFF;
          ">
            ${clusterCount}
          </div>
        `,
        size: new window.naver.maps.Size(size, size),
        anchor: new window.naver.maps.Point(size/2, size/2)
      });
    });

    setMarker(newMarker);

    return () => {
      if (newMarker) {
        newMarker.setMap(null);
      }
    };
  }, [map, position, cluster, onClusterClick]);

};

export default ClusterMarker; 