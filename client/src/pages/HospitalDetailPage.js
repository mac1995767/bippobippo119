import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { fetchHospitalDetail } from '../service/api';
import { getApiUrl } from '../utils/api';

const HospitalDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // 시간 포맷팅 함수 추가
  const formatTime = (time) => {
    if (!time) return "정보 없음";
    const timeStr = time.toString().padStart(4, '0');
    return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
  };

  // 운영 시간 표시 함수 추가
  const displayOperatingTime = (startTime, endTime) => {
    if (!startTime || !endTime) return "정보 없음";
    return `${formatTime(startTime)} ~ ${formatTime(endTime)}`;
  };

  useEffect(() => {
    const loadHospitalDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchHospitalDetail(id);
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
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.REACT_APP_NAVER_MAP_CLIENT_ID}`;
      script.async = true;
      script.onload = () => {
        const mapOptions = {
          center: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
          zoom: 15
        };
        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        
        // 병원 마커 추가
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(hospital.location.lat, hospital.location.lon),
          map: map,
          title: hospital.yadmNm,
          icon: {
            content: [
              '<div style="background-color: #4285F4; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">',
              '<div style="color: white; font-weight: bold;">병</div>',
              '</div>'
            ].join(''),
            size: new window.naver.maps.Size(30, 30),
            anchor: new window.naver.maps.Point(15, 15)
          }
        });

        // 주변 약국 마커 추가
        if (hospital.nearby_pharmacies && hospital.nearby_pharmacies.length > 0) {
          hospital.nearby_pharmacies.forEach(pharmacy => {
            if (pharmacy.location?.lat && pharmacy.location?.lon) {
              new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(pharmacy.location.lat, pharmacy.location.lon),
                map: map,
                title: pharmacy.yadmNm,
                icon: {
                  content: [
                    '<div style="background-color: #34A853; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">',
                    '<div style="color: white; font-weight: bold;">약</div>',
                    '</div>'
                  ].join(''),
                  size: new window.naver.maps.Size(30, 30),
                  anchor: new window.naver.maps.Point(15, 15)
                }
              });
            }
          });
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
                {hospital.subjects?.map((subject, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {subject.dgsbjtCdNm}
                  </span>
                ))}
              </div>
            </div>

            {/* 운영 정보 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">운영 정보</h2>
              <div className="space-y-4">
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
                      <p>{displayOperatingTime(hospital.times?.trmtSunStart, hospital.times?.trmtSunEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">점심시간</p>
                      <p>{hospital.times?.lunchWeek ? hospital.times.lunchWeek.replace('~', ' ~ ') : "정보 없음"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    hospital.nightCare ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    야간진료: {hospital.nightCare ? "가능" : "불가능"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    hospital.weekendCare ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    주말진료: {hospital.weekendCare ? "가능" : "불가능"}
                  </span>
                </div>
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
            {/* 지도 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">위치</h2>
              <div className="aspect-w-16 aspect-h-9">
                {hospital?.location?.lat && hospital?.location?.lon ? (
                  <div ref={mapRef} className="w-full h-full rounded-lg" style={{ height: '400px' }}></div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">위치 정보가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

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
                <div className="space-y-3">
                  {hospital.food_treatment.map((food) => (
                    <div key={food.typeCd} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{food.typeCdNm}</span>
                        <p className="text-sm text-gray-600">인원: {food.psnlCnt}명</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        food.genMealAddYn === "Y" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {food.genMealAddYn === "Y" ? "일반식 추가" : "일반식 없음"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 병원 정보 */}
            {hospital.intensive_care && hospital.intensive_care.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">병원 정보</h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.intensive_care.map((care) => (
                    <span key={care.typeCd} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
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
