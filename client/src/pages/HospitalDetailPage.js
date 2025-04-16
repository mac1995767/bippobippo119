import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { fetchHospitalDetail } from '../service/api';
import { getApiUrl } from '../utils/api';

const HospitalDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [hospital, setHospital] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isNursingHospital, setIsNursingHospital] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  // 환경 변수에서 API URL 가져오기
  const baseUrl = getApiUrl();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    const type = params.get('type');

    if (lat && lng) {
      setUserLocation({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
    }

    if (type === 'nursing') {
      setIsNursingHospital(true);
    }

    const loadHospitalDetail = async () => {
      try {
        const data = await fetchHospitalDetail(id, {
          lat: lat || null,
          lng: lng || null,
          type: type || null
        });
        setHospital(data);
      } catch (error) {
        console.error('병원 상세 정보 로딩 실패:', error);
        setError('병원 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadHospitalDetail();
  }, [id, location.search]);

  if (loading) return <div className="text-center mt-10">로딩 중...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
  if (!hospital) return <div className="text-center mt-10">병원 정보를 찾을 수 없습니다.</div>;

  // ✅ 요일 매핑 및 추가 정보 항목
  const dayMap = {
    Monday: "월요일",
    Tuesday: "화요일",
    Wednesday: "수요일",
    Thursday: "목요일",
    Friday: "금요일",
    Saturday: "토요일",
    Sunday: "일요일",
  };

  const extraInfo = [
    { label: "점심시간", key: "lunch" },
    { label: "평일 접수", key: "receptionWeek" },
    { label: "토요일 접수", key: "receptionSat" },
    { label: "휴진", key: "noTreatmentHoliday" },
    { label: "응급실(주간)", key: "emergencyDay" },
    { label: "응급실(야간)", key: "emergencyNight" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{hospital.yadmNm}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">주소: {hospital.addr}</p>
            <p className="text-gray-600">전화번호: {hospital.telno}</p>
            <p className="text-gray-600">홈페이지: {hospital.hospUrl}</p>
          </div>
          <div>
            <p className="text-gray-600">지역: {hospital.region}</p>
            <p className="text-gray-600">병원 유형: {hospital.category}</p>
          </div>
        </div>
      </div>

      {/* 진료과 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">진료과</h2>
        <div className="flex flex-wrap gap-2">
          {hospital.subjects?.map((subject, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {subject.dgsbjtCdNm}
            </span>
          ))}
        </div>
      </div>

      {/* 운영 시간 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">운영 시간</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">평일</h3>
            <p>진료 시작: {hospital.times?.trmtMonStart || '정보 없음'}</p>
            <p>진료 종료: {hospital.times?.trmtMonEnd || '정보 없음'}</p>
            <p>점심 시간: {hospital.times?.lunchWeek || '정보 없음'}</p>
            <p>응급실 운영: {hospital.times?.emyNgtYn === 'Y' ? '운영' : '미운영'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">토요일</h3>
            <p>진료 시작: {hospital.times?.trmtSatStart || '정보 없음'}</p>
            <p>진료 종료: {hospital.times?.trmtSatEnd || '정보 없음'}</p>
            <p>토요일 운영: {hospital.times?.noTrmtSat === '휴무' ? '휴무' : '운영'}</p>
            <p>일요일 운영: {hospital.times?.noTrmtSun === '휴무' ? '휴무' : '운영'}</p>
          </div>
        </div>
      </div>

      {/* 근처 약국 */}
      {hospital.nearby_pharmacies && hospital.nearby_pharmacies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">근처 약국</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospital.nearby_pharmacies.map((pharmacy, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold">{pharmacy.yadmNm}</h3>
                <p className="text-gray-600">주소: {pharmacy.addr}</p>
                <p className="text-gray-600">전화번호: {pharmacy.telno}</p>
                <p className="text-gray-600">거리: {pharmacy.distance.toFixed(2)}m</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 특수 진료 정보 */}
      {hospital.intensive_care_info && hospital.intensive_care_info.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">특수 진료 정보</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.intensive_care_info.map((care, index) => (
              <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                {care.typeCdNm}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 식이요법 정보 */}
      {hospital.food_treatment_info && hospital.food_treatment_info.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">식이요법 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospital.food_treatment_info.map((food, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold">{food.typeCdNm}</h3>
                <p className="text-gray-600">인원: {food.psnlCnt}명</p>
                {food.treatMealGrd && (
                  <p className="text-gray-600">급식 등급: {food.treatMealGrd}급</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDetailPage;
