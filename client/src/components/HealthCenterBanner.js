import React from 'react';
import { FaHeartbeat, FaBrain, FaHandHoldingHeart, FaClinicMedical } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HealthCenterBanner = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/health-centers');
  };

  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer hover:opacity-90 transition-opacity bg-gradient-to-r from-teal-500 to-blue-500 py-8 px-4 rounded-lg shadow-lg mb-8"
    >
      <div className="container mx-auto">
        <div className="text-center text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">건강증진센터 & 정신건강복지센터</h2>
          <p className="text-sm opacity-90">
            국민건강증진법 및 정신건강복지법에 따른 전문 의료복지 서비스
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <FaHeartbeat className="text-2xl text-white mr-3" />
              <h3 className="text-lg font-semibold text-white">건강관리</h3>
            </div>
            <p className="text-white text-sm opacity-90">
              만성질환 관리, 영양 상담, 운동 처방
            </p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <FaBrain className="text-2xl text-white mr-3" />
              <h3 className="text-lg font-semibold text-white">정신건강</h3>
            </div>
            <p className="text-white text-sm opacity-90">
              상담, 치료, 재활 프로그램 운영
            </p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <FaHandHoldingHeart className="text-2xl text-white mr-3" />
              <h3 className="text-lg font-semibold text-white">복지서비스</h3>
            </div>
            <p className="text-white text-sm opacity-90">
              맞춤형 복지 서비스 제공 및 연계
            </p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <FaClinicMedical className="text-2xl text-white mr-3" />
              <h3 className="text-lg font-semibold text-white">지역연계</h3>
            </div>
            <p className="text-white text-sm opacity-90">
              보건소, 의료기관과의 협력 체계
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthCenterBanner; 