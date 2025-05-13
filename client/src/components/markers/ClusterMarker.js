import React, { useState } from 'react';
import DetailedHospitalMarker from './DetailedHospitalMarker';
import HospitalMarker from './HospitalMarker';
import DetailedPharmacyMarker from './DetailedPharmacyMarker';
import PharmacyMarker from './PharmacyMarker';
import OrientalHospitalMarker from './OrientalHospitalMarker';
import DentalClinicMarker from './DentalClinicMarker';
import NursingHospitalMarker from './NursingHospitalMarker';
import ClinicMarker from './ClinicMarker';
import GeneralHospitalMarker from './GeneralHospitalMarker';
import SuperGeneralHospitalMarker from './SuperGeneralHospitalMarker';
import MentalHospitalMarker from './MentalHospitalMarker';
import DentalHospitalMarker from './DentalHospitalMarker';
import ClusterInfoWindow from './ClusterInfoWindow';

const ClusterMarker = ({ 
  map, 
  position, 
  cluster,
  onHospitalClick = () => {}, 
  onPharmacyClick = () => {},
  onClusterClick = () => {},
  selectedHospitalId,
  selectedPharmacyId,
  getHospitalUniqueId = (hospital) => hospital?.ykiho,
  getPharmacyUniqueId = (pharmacy) => pharmacy?.ykiho,
  zoomLevel
}) => {
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // 병원 유형별 마커 컴포넌트 매핑
  const getMarkerComponent = (hospital, selected) => {
    if (!hospital) return null;

    const commonProps = {
      map: map,
      hospital: hospital,
      onClick: () => onHospitalClick(hospital),
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

  if (!cluster) return null;

  // 단일 마커인 경우
  if (cluster.type) {
    if (cluster.type === 'hospital') {
      const hospital = cluster.details.hospitals[0];
      return getMarkerComponent(
        hospital,
        selectedHospitalId === getHospitalUniqueId(hospital)
      );
    } else if (cluster.type === 'pharmacy') {
      const pharmacy = cluster.details.pharmacies[0];
      return selectedPharmacyId === getPharmacyUniqueId(pharmacy) ? (
        <DetailedPharmacyMarker
          key={getPharmacyUniqueId(pharmacy)}
          map={map}
          pharmacy={pharmacy}
          onClick={() => onPharmacyClick(pharmacy)}
          selected
        />
      ) : (
        <PharmacyMarker
          key={getPharmacyUniqueId(pharmacy)}
          map={map}
          pharmacy={pharmacy}
          onClick={() => onPharmacyClick(pharmacy)}
        />
      );
    }
  }

  // 클러스터 마커인 경우
  const { clusterCount, hospitals = [], pharmacies = [] } = cluster;
  console.log('Cluster Data:', { clusterCount, hospitals, pharmacies }); // 디버깅용 로그

  const size = Math.min(36 + (clusterCount * 1.5), 48);
  const fontSize = Math.min(12 + (clusterCount / 10), 16);

  const marker = new window.naver.maps.Marker({
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

  // 정보창 생성
  const infoWindow = new window.naver.maps.InfoWindow({
    content: '',
    maxWidth: 300,
    backgroundColor: "white",
    borderColor: "#ccc",
    borderWidth: 1,
    anchorSize: new window.naver.maps.Size(10, 10),
    anchorSkew: true,
    anchorColor: "white",
    pixelOffset: new window.naver.maps.Point(10, -10)
  });

  // 클릭 이벤트 처리
  window.naver.maps.Event.addListener(marker, 'click', (e) => {
    const point = map.getProjection().fromCoordToOffset(position);
    onClusterClick(cluster, { x: point.x, y: point.y });
  });

  // 마우스 이벤트 처리
  window.naver.maps.Event.addListener(marker, 'mouseover', () => {
    marker.setIcon({
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

  window.naver.maps.Event.addListener(marker, 'mouseout', () => {
    marker.setIcon({
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

  return showInfoWindow ? (
    <ClusterInfoWindow
      cluster={cluster}
      onHospitalClick={(hospital) => {
        onHospitalClick(hospital);
        infoWindow.close();
        setShowInfoWindow(false);
      }}
      onPharmacyClick={(pharmacy) => {
        onPharmacyClick(pharmacy);
        infoWindow.close();
        setShowInfoWindow(false);
      }}
    />
  ) : null;
};

export default ClusterMarker; 