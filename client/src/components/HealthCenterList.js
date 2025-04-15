import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaClock, FaUserMd, FaRegCalendarAlt } from 'react-icons/fa';

const HealthCenterList = () => {
  const [selectedType, setSelectedType] = useState('전체');
  const [selectedRegion, setSelectedRegion] = useState('전체');

  const centerTypes = ['전체', '건강증진센터', '정신건강복지센터', '중독관리통합지원센터'];
  const regions = ['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

  // 샘플 데이터
  const centers = [
    {
      id: 1,
      name: '포승건강생활지원센터',
      type: '건강증진센터',
      address: '경기도 평택시 포승읍 여술로 47',
      tel: '031-8024-8625',
      operatingHours: '09:00 - 18:00',
      closedDays: '토, 일, 공휴일',
      services: ['만성질환관리', '비만영양관리', '재활운동실운영'],
      staff: '공무원(2), 물리치료사(1)',
      reservation: '내소 및 사전예약',
      organization: '경기도 평택시청 평택보건소'
    },
    {
      id: 2,
      name: '부여군 정신건강복지센터',
      type: '정신건강복지센터',
      address: '충청남도 부여군 부여읍 성왕로 205',
      tel: '041-830-8626',
      operatingHours: '09:00 - 18:00',
      closedDays: '토, 일, 공휴일',
      services: ['지역사회 정신건강증진사업', '자살예방사업'],
      staff: '정신건강전문요원(7)',
      organization: '충청남도 부여군보건소'
    },
    {
      id: 3,
      name: '수원시중독관리통합지원센터',
      type: '중독관리통합지원센터',
      address: '경기도 수원시 팔달구 매산로 89',
      tel: '031-256-9478',
      operatingHours: '09:00 - 18:00',
      closedDays: '토, 일, 공휴일',
      services: ['중독자 발견 및 등록관리', '가족상담', '재활프로그램'],
      staff: '상담사(8)',
      organization: '경기도 수원시 장안구보건소'
    }
  ];

  const filteredCenters = centers.filter(center => {
    const typeMatch = selectedType === '전체' || center.type === selectedType;
    const regionMatch = selectedRegion === '전체' || center.address.startsWith(selectedRegion);
    return typeMatch && regionMatch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">센터 유형</h3>
            <div className="flex flex-wrap gap-2">
              {centerTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">지역</h3>
            <div className="flex flex-wrap gap-2">
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedRegion === region
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 센터 목록 */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCenters.map(center => (
          <div key={center.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{center.name}</h2>
                  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {center.type}
                  </span>
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                  예약하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="w-5 h-5 mr-2 text-blue-500" />
                    <span>{center.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="w-5 h-5 mr-2 text-blue-500" />
                    <span>{center.tel}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaClock className="w-5 h-5 mr-2 text-blue-500" />
                    <span>{center.operatingHours}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start text-gray-600">
                    <FaUserMd className="w-5 h-5 mr-2 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">의료진/직원</p>
                      <p className="text-sm">{center.staff}</p>
                    </div>
                  </div>
                  <div className="flex items-start text-gray-600">
                    <FaRegCalendarAlt className="w-5 h-5 mr-2 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">휴무일</p>
                      <p className="text-sm">{center.closedDays}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">제공 서비스</h3>
                <div className="flex flex-wrap gap-2">
                  {center.services.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  운영기관: {center.organization}
                </p>
                {center.reservation && (
                  <p className="text-sm text-gray-500 mt-1">
                    예약방법: {center.reservation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthCenterList; 