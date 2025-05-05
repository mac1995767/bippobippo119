import React, { useEffect, useRef } from 'react';

const DetailedHospitalMarker = ({ map, hospital, onClick, selected }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !hospital || !hospital.location) return;

    const markerOptions = {
      position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
      map: map,
      title: hospital.yadmNm || hospital.name,
      icon: {
        content: `
          <div class="detailed-marker ${selected ? 'selected' : ''}" style="
            background: white;
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            min-width: 200px;
            border: ${selected ? '2px solid #FF0000' : '1px solid #ddd'};
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${selected ? '/images/markers/s-hospital.png' : '/images/markers/hospital.png'}" 
                   alt="병원" 
                   style="width: 32px; height: 32px;"/>
              <div>
                <div style="font-weight: bold; color: #333; margin-bottom: 4px;">
                  ${hospital.yadmNm || hospital.name || '병원명 없음'}
                </div>
                <div style="font-size: 12px; color: #666;">
                  ${hospital.addr || hospital.address || '주소 정보 없음'}
                </div>
                ${hospital.telno ? `
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">
                    ☎️ ${hospital.telno}
                  </div>
                ` : ''}
                ${hospital.clCdNm ? `
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">
                    🏷️ ${hospital.clCdNm}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `,
        size: new window.naver.maps.Size(200, 60),
        anchor: new window.naver.maps.Point(100, 30),
      }
    };

    markerRef.current = new window.naver.maps.Marker(markerOptions);

    window.naver.maps.Event.addListener(markerRef.current, 'click', () => {
      if (onClick) onClick(hospital);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, hospital, onClick, selected]);

  return null;
};

export default DetailedHospitalMarker; 