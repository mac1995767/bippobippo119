import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { fetchHospitalDetail } from '../service/api';
import { getApiUrl } from '../utils/api';

const HospitalDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">평일</p>
                      <p>{hospital.times?.trmtWeekStart || "정보 없음"} ~ {hospital.times?.trmtWeekEnd || "정보 없음"}</p>
                    </div>
                    <div>
                      <p className="font-medium">토요일</p>
                      <p>{hospital.times?.trmtSatStart || "정보 없음"} ~ {hospital.times?.trmtSatEnd || "정보 없음"}</p>
                    </div>
                    <div>
                      <p className="font-medium">점심시간</p>
                      <p>{hospital.times?.lunchWeek || "정보 없음"}</p>
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
                {hospital.location && hospital.location.lat && hospital.location.lon ? (
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${hospital.location.lat},${hospital.location.lon}`}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  ></iframe>
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
            {hospital.food_treatment_info && hospital.food_treatment_info.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">식이치료 정보</h2>
                <div className="space-y-3">
                  {hospital.food_treatment_info.map((food) => (
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

            {/* 중환자실 정보 */}
            {hospital.intensive_care_info && hospital.intensive_care_info.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">중환자실 정보</h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.intensive_care_info.map((care) => (
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
                    <div key={pharmacy._id} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-medium">{pharmacy.yadmNm}</h3>
                      <p className="text-gray-600 text-sm">{pharmacy.addr}</p>
                      <p className="text-gray-600 text-sm">전화: {pharmacy.telno}</p>
                      {pharmacy.distance && (
                        <p className="text-gray-600 text-sm">거리: {pharmacy.distance.toFixed(2)}m</p>
                      )}
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
