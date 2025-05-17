import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchHospitalDetail } from '../service/api';
import { MdKeyboardArrowLeft } from 'react-icons/md';

const HospitalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);


  // 시간 포맷팅 함수 수정 (08시30분 등도 그대로 반환)
  const formatTime = (time) => {
    if (!time || time === 'null') return "정보 없음";
    // 이미 한글(08시30분 등)로 되어 있으면 그대로 반환
    if (/[시분]/.test(time)) return time;
    // 4자리 숫자(0900 등)만 변환
    const timeStr = time.toString().padStart(4, '0');
    return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
  };

  // 운영 시간 표시 함수 (openTime, closeTime)
  const displayOperatingTime = (openTime, closeTime) => {
    if (!openTime) return "휴무";
    if (openTime === "휴무") return "휴무";
    if (!closeTime) return `${formatTime(openTime)} ~`;
    return `${formatTime(openTime)} ~ ${formatTime(closeTime)}`;
  };

  useEffect(() => {
    const loadHospitalDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchHospitalDetail(id);
        console.log('병원 상세 정보:', data);
        if (data.nearby_pharmacies) {
          console.log('주변 약국 정보:', data.nearby_pharmacies);
        }
        setHospital(data);
      } catch (error) {
        console.error('병원 상세 정보 로딩 실패:', error);
        setError('병원 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadHospitalDetail();
  }, [id]);

  useEffect(() => {
    if (hospital?.location?.lat && hospital?.location?.lon) {
      const script = document.createElement('script');
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
      script.async = true;
      script.onerror = (error) => {
        console.error('네이버 지도 API 로딩 실패:', error);
        setError('지도 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
      };
      script.onload = () => {
        try {
          const mapOptions = {
            center: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
            zoom: 15,
            zoomControl: true,
            zoomControlOptions: {
              position: window.naver.maps.Position.TOP_RIGHT
            },
            scaleControl: true,
            mapDataControl: true,
            minZoom: 10,
            maxZoom: 18
          };
          const map = new window.naver.maps.Map(mapRef.current, mapOptions);
          
          // 모든 마커를 포함하는 bounds 설정
          const bounds = new window.naver.maps.LatLngBounds();
          bounds.extend(new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon));
          
          // 마커와 라벨을 저장할 배열
          const markers = [];
          const labels = [];
          
          // 병원 마커 추가
          const hospitalMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
            map: map,
            title: hospital.yadmNm,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              size: new window.naver.maps.Size(32, 32),
              scaledSize: new window.naver.maps.Size(32, 32),
              origin: new window.naver.maps.Point(0, 0),
              anchor: new window.naver.maps.Point(16, 32)
            }
          });
          markers.push(hospitalMarker);

          // 병원 마커 클릭 이벤트 추가
          window.naver.maps.Event.addListener(hospitalMarker, 'click', () => {
            const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(hospital.yadmNm)}/place/${hospital.location.lat},${hospital.location.lon}`;
            const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${hospital.location.lat},${hospital.location.lon}`;
            
            const infoWindow = new window.naver.maps.InfoWindow({
              content: [
                '<div style="padding: 10px; min-width: 150px;">',
                '<div style="font-weight: bold; margin-bottom: 5px;">지도로 이동</div>',
                `<div style="margin-bottom: 5px;"><a href="${naverMapUrl}" target="_blank" style="color: #03C75A; text-decoration: none;">네이버 지도</a></div>`,
                `<div><a href="${googleMapUrl}" target="_blank" style="color: #4285F4; text-decoration: none;">구글 지도</a></div>`,
                '</div>'
              ].join('')
            });
            
            infoWindow.open(map, hospitalMarker);
          });

          // 주변 약국 마커 추가
          if (hospital.nearby_pharmacies && hospital.nearby_pharmacies.length > 0) {
            hospital.nearby_pharmacies.forEach(pharmacy => {
              if (pharmacy.Xpos && pharmacy.Ypos) {
                bounds.extend(new window.naver.maps.LatLng(pharmacy.Ypos, pharmacy.Xpos));
                
                const pharmacyMarker = new window.naver.maps.Marker({
                  position: new window.naver.maps.LatLng(pharmacy.Ypos, pharmacy.Xpos),
                  map: map,
                  title: pharmacy.yadmNm,
                  icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    size: new window.naver.maps.Size(32, 32),
                    scaledSize: new window.naver.maps.Size(32, 32),
                    origin: new window.naver.maps.Point(0, 0),
                    anchor: new window.naver.maps.Point(16, 32)
                  }
                });
                markers.push(pharmacyMarker);

                // 약국 마커 클릭 이벤트 추가
                window.naver.maps.Event.addListener(pharmacyMarker, 'click', () => {
                  const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(pharmacy.yadmNm)}/place/${pharmacy.Ypos},${pharmacy.Xpos}`;
                  const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${pharmacy.Ypos},${pharmacy.Xpos}`;
                  
                  const infoWindow = new window.naver.maps.InfoWindow({
                    content: [
                      '<div style="padding: 10px; min-width: 150px;">',
                      '<div style="font-weight: bold; margin-bottom: 5px;">지도로 이동</div>',
                      `<div style="margin-bottom: 5px;"><a href="${naverMapUrl}" target="_blank" style="color: #03C75A; text-decoration: none;">네이버 지도</a></div>`,
                      `<div><a href="${googleMapUrl}" target="_blank" style="color: #4285F4; text-decoration: none;">구글 지도</a></div>`,
                      '</div>'
                    ].join('')
                  });
                  
                  infoWindow.open(map, pharmacyMarker);
                });
              }
            });
          }

          // 모든 마커가 보이도록 지도 범위 조정
          map.fitBounds(bounds, {
            padding: 50
          });

          // 약간의 지연 후 라벨 추가
          setTimeout(() => {
            // 병원 라벨 추가
            const hospitalLabel = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
              map: map,
              icon: {
                content: [
                  '<div style="background: white; padding: 2px 5px; border-radius: 3px; border: 1px solid #ccc; font-size: 12px; font-weight: bold;">',
                  hospital.yadmNm,
                  '</div>'
                ].join(''),
                size: new window.naver.maps.Size(38, 38),
                anchor: new window.naver.maps.Point(19, 0)
              }
            });
            labels.push(hospitalLabel);

            // 약국 라벨 추가
            if (hospital.nearby_pharmacies && hospital.nearby_pharmacies.length > 0) {
              hospital.nearby_pharmacies.forEach(pharmacy => {
                if (pharmacy.Xpos && pharmacy.Ypos) {
                  const pharmacyLabel = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(pharmacy.Ypos, pharmacy.Xpos),
                    map: map,
                    icon: {
                      content: [
                        '<div style="background: white; padding: 2px 5px; border-radius: 3px; border: 1px solid #ccc; font-size: 12px; font-weight: bold;">',
                        pharmacy.yadmNm,
                        '</div>'
                      ].join(''),
                      size: new window.naver.maps.Size(38, 38),
                      anchor: new window.naver.maps.Point(19, 0)
                    }
                  });
                  labels.push(pharmacyLabel);
                }
              });
            }
          }, 100);
        } catch (error) {
          console.error('지도 초기화 실패:', error);
          setError('지도 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      };
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [hospital]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">오류 발생!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">병원 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* 상단 네비게이션 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/hospitals')}
            className="flex items-center text-gray-600 hover:text-blue-500 transition-colors"
          >
            <MdKeyboardArrowLeft size={24} />
            <span>돌아가기</span>
          </button>
        </div>
      </div>
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{hospital.yadmNm}</h1>
          <p className="text-lg opacity-90">{hospital.addr}</p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼 */}
          <div className="md:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">병원 유형</p>
                  <p className="font-medium">{hospital.category}</p>
                </div>
                <div>
                  <p className="text-gray-600">지역</p>
                  <p className="font-medium">{hospital.region}</p>
                </div>
                <div>
                  <p className="text-gray-600">전화번호</p>
                  <p className="font-medium">{hospital.telno || "정보 없음"}</p>
                </div>
                <div>
                  <p className="text-gray-600">홈페이지</p>
                  <p className="font-medium">
                    {hospital.hospUrl !== "-" ? (
                      <a href={hospital.hospUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        방문하기
                      </a>
                    ) : (
                      "정보 없음"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 진료과 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">진료과 정보</h2>
              <div className="flex flex-wrap gap-2">
                {hospital.major?.map((subject, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* 운영 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">운영 정보</h2>
              <div className="space-y-4">
                {/* 운영 시간 */}
                <div>
                  <p className="text-gray-600 mb-2">운영 시간</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">월요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtMonStart, hospital.times?.trmtMonEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">화요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtTueStart, hospital.times?.trmtTueEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">수요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtWedStart, hospital.times?.trmtWedEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">목요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtThuStart, hospital.times?.trmtThuEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">금요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtFriStart, hospital.times?.trmtFriEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">토요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtSatStart, hospital.times?.trmtSatEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">일요일</p>
                      <p>{hospital.times?.noTrmtSun || "휴무"}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">공휴일</p>
                      <p>{hospital.times?.noTrmtHoli || "휴무"}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">점심시간</p>
                      <p>{hospital.times?.lunchWeek || "정보 없음"}</p>
                    </div>
                  </div>
                </div>

                {/* 주차 정보 */}
                {hospital.times?.parkQty && (
                  <div>
                    <p className="text-gray-600 mb-2">주차 정보</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">주차 가능 대수</p>
                        <p>{hospital.times.parkQty}대</p>
                      </div>
                      {hospital.times.parkEtc && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">주차 요금 안내</p>
                          <p className="text-sm text-gray-600">{hospital.times.parkEtc}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 위치 안내 */}
                {hospital.times?.plcNm && (
                  <div>
                    <p className="text-gray-600 mb-2">위치 안내</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">가까운 지하철역</p>
                        <p>{hospital.times.plcNm}</p>
                      </div>
                      {hospital.times.plcDir && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">출구 안내</p>
                          <p className="text-sm text-gray-600">{hospital.times.plcDir}</p>
                        </div>
                      )}
                      {hospital.times.plcDist && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">도보 거리</p>
                          <p className="text-sm text-gray-600">{hospital.times.plcDist}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    hospital.times?.emyNgtYn === "Y" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    야간진료: {hospital.times?.emyNgtYn === "Y" ? "가능" : "불가능"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    hospital.times?.trmtSatStart ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    주말진료: {hospital.times?.trmtSatStart ? "가능" : "불가능"}
                  </span>
                </div>
              </div>
            </div>

            {/* 위치 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">위치</h2>
              <div className="w-full h-[600px] rounded-lg overflow-hidden">
                {hospital?.location?.lat && hospital?.location?.lon ? (
                  <div ref={mapRef} className="w-full h-full"></div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">위치 정보가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 장비 정보 */}
            {hospital.equipment && hospital.equipment.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">장비 정보</h2>
                <div className="grid grid-cols-2 gap-4">
                  {hospital.equipment.map((equip) => (
                    <div key={equip.typeCd} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{equip.typeCdNm}</span>
                      <span className="text-gray-600">{equip.typeCnt}개</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 간호등급 정보 */}
            {hospital.nursing_grade && hospital.nursing_grade.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">간호등급 정보</h2>
                <div className="space-y-3">
                  {hospital.nursing_grade.map((grade) => (
                    <div key={grade.typeCd} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{grade.typeCdNm}</span>
                      <span className="text-gray-600">등급: {grade.nursingRt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 인력 정보 */}
            {hospital.personnel && hospital.personnel.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">인력 정보</h2>
                <div className="grid grid-cols-2 gap-4">
                  {hospital.personnel.map((person) => (
                    <div key={person.pharmCd} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{person.pharmCdNm}</span>
                      <span className="text-gray-600">{person.pharmCnt}명</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-6">
            {/* 전문과목 정보 */}
            {hospital.speciality && hospital.speciality.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">전문과목 정보</h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.speciality.map((spec) => (
                    <span key={spec.typeCd} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {spec.typeCdNm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 식이치료 정보 */}
            {hospital.food_treatment && hospital.food_treatment.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">식이치료 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospital.food_treatment.map((food, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-lg">{food.typeCdNm}</span>
                        <p className="text-gray-600 mt-1">인원: {food.psnlCnt}명</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 중환자실 정보 */}
            {hospital.intensive_care && hospital.intensive_care.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">중환자실 및 특수치료 정보</h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.intensive_care.map((care, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {care.typeCdNm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 주변 약국 */}
            {hospital.nearby_pharmacies && hospital.nearby_pharmacies.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">주변 약국</h2>
                <div className="space-y-4">
                  {hospital.nearby_pharmacies.map((pharmacy) => (
                    <div key={pharmacy._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">{pharmacy.yadmNm}</h3>
                        <p className="text-gray-600 text-sm mt-1">{pharmacy.addr}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-gray-600 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {pharmacy.telno}
                          </p>
                          {pharmacy.distance !== undefined && (
                            <p className="text-gray-600 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {pharmacy.distance === 0 ? "건물 내부" :
                                pharmacy.distance < 1000 
                                  ? `${Math.round(pharmacy.distance)}m`
                                  : `${(pharmacy.distance / 1000).toFixed(1)}km`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetailPage;
