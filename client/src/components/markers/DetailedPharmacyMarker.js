import React, { useEffect, useRef } from 'react';

const DetailedPharmacyMarker = ({ map, pharmacy, onClick, selected }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !pharmacy) return;

    const markerOptions = {
      position: new window.naver.maps.LatLng(pharmacy.lat, pharmacy.lng),
      map: map,
      title: pharmacy.name,
      icon: {
        content: `
          <div class="detailed-marker ${selected ? 'selected' : ''}" style="
            background: white;
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            min-width: 200px;
            border: ${selected ? '2px solid #00FF00' : '1px solid #ddd'};
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${selected ? '/images/markers/s-pharmacy.png' : '/images/markers/pharmacy.png'}" 
                   alt="약국" 
                   style="width: 32px; height: 32px;"/>
              <div>
                <div style="font-weight: bold; color: #333; margin-bottom: 4px;">
                  ${pharmacy.name || pharmacy.yadmNm || '약국명 없음'}
                </div>
                <div style="font-size: 12px; color: #666;">
                  ${pharmacy.addr || pharmacy.address || '주소 정보 없음'}
                </div>
                ${pharmacy.telno ? `
                  <div style="font-size: 12px; color: #666; margin-top: 2px;">
                    ☎️ ${pharmacy.telno}
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
      if (onClick) onClick(pharmacy);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, pharmacy, onClick, selected]);

  return null;
};

export default DetailedPharmacyMarker; 