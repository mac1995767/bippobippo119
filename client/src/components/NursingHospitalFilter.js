import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterDropdown from './FilterDropdown';

const filterRegions = [
  { label: "전국", icon: "🌍" },
  { label: "서울", icon: "🏙️" },
  { label: "경기", icon: "🏞️" },
  { label: "부산", icon: "🌊" },
  { label: "경남", icon: "🌾" },
  { label: "대구", icon: "🏞️" },
  { label: "인천", icon: "✈️" },
  { label: "경북", icon: "🌾" },
  { label: "전북", icon: "🌻" },
  { label: "충남", icon: "🌳" },
  { label: "전남", icon: "🌻" },
  { label: "대전", icon: "🌳" },
  { label: "광주", icon: "🌻" },
  { label: "충북", icon: "🌳" },
  { label: "강원", icon: "⛰️" },
  { label: "울산", icon: "🌾" },
  { label: "제주", icon: "🏝️" },
  { label: "세종시", icon: "🏢" },
];

const NursingHospitalFilter = ({ selectedRegion, setSelectedRegion, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          navigate(`/nursing-hospitals?x=${longitude}&y=${latitude}`);
        },
        (error) => {
          console.error("위치 정보를 가져올 수 없습니다.", error);
          alert("위치 정보를 가져올 수 없습니다. 직접 검색어를 입력해주세요.");
        }
      );
    } else {
      alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
  };

  const filterCategories = [
    { name: "지역", options: filterRegions, state: selectedRegion, setState: setSelectedRegion }
  ];

  const handleFilterChange = (categoryName, option) => {
    if (categoryName === "지역") {
      setSelectedRegion(option);
    }
  };

  return (
    <div className="bg-[#f6f8fc]">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-[#36d1c4] to-[#3a8dde] text-white p-6 shadow-md rounded-b-2xl">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-bold">요양병원 찾기</h1>
          <p className="text-lg mt-2">선택한 지역의 요양병원을 쉽게 찾아보세요</p>
          
          {/* 검색 섹션 */}
          <div className="w-full max-w-2xl mt-4">
            <div className="flex flex-col relative">
              <div className="flex relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="어떤 요양병원을 찾으시나요?"
                  className="flex-1 p-3 border border-[#3a8dde] rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3a8dde] bg-white placeholder-gray-400 text-gray-800"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#3a8dde] text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-[#2563eb] transition"
                >
                  검색
                </button>
              </div>
            </div>
            
            {/* 위치 기반 검색 버튼 */}
            <button
              onClick={handleLocationSearch}
              className="mt-2 px-4 py-2 bg-[#36d1c4] text-white rounded-lg hover:bg-[#3a8dde] transition-all duration-200 flex items-center justify-center gap-2 shadow"
            >
              <span>📍</span>
              <span>내 주변 요양병원 찾기</span>
            </button>
          </div>
        </div>
      </header>

      {/* 필터 컨테이너 */}
      <div className="top-0 z-50 bg-white shadow-md py-4 rounded-xl mt-4">
        <div className="container mx-auto mt-6 p-2 px-4 md:px-40">
          <div className="container mx-auto flex justify-center">
            <FilterDropdown
              categories={filterCategories}
              onFilterChange={handleFilterChange}
              dropdownClassName="bg-white border border-[#3a8dde] text-gray-800 rounded-lg shadow"
              optionClassName="hover:bg-[#3a8dde] hover:text-white"
              selectedClassName="bg-[#36d1c4] text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingHospitalFilter; 