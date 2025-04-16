import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FilterDropdown from "../components/FilterDropdown";
import DistanceInfo from "../components/DistanceInfo";
import OperatingStatus from "../components/OperatingStatus";

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

const filterTypes = [
  { label: "전체", icon: "🏥" },
  { label: "일반약국", icon: "💊" },
  { label: "한약국", icon: "🌿" },
  { label: "기관약국", icon: "🏢" },
  { label: "기타약국", icon: "📦" },
];

const filterOperatingHours = [
  { label: "전체", icon: "📌" },
  { label: "야간운영", icon: "🌙" },
  { label: "주말운영", icon: "📅" },
  { label: "24시간", icon: "⏰" },
];

const PharmaciesList = () => {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [selectedType, setSelectedType] = useState("전체");
  const [selectedOperatingHours, setSelectedOperatingHours] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationBased, setLocationBased] = useState(false);
  const [userLocation, setUserLocation] = useState({ x: null, y: null });
  const [selectedDistance, setSelectedDistance] = useState(10000);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // URL에서 쿼리 파라미터 읽어오기
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const query = params.get("query");
    const x = params.get("x");
    const y = params.get("y");

    if (type) {
      setSelectedType(type);
    }
    if (query) {
      setSearchQuery(query);
    }
    if (x && y) {
      setUserLocation({ x: parseFloat(x), y: parseFloat(y) });
      setLocationBased(true);
    }
  }, [location]);

  const filterCategories = [
    { name: "지역", options: filterRegions, state: selectedRegion, setState: setSelectedRegion },
    { name: "약국유형", options: filterTypes, state: selectedType, setState: setSelectedType },
    { name: "운영시간", options: filterOperatingHours, state: selectedOperatingHours, setState: setSelectedOperatingHours },
  ];

  const handleFilterChange = (categoryName, option) => {
    if (categoryName === "지역") {
      setSelectedRegion(option);
    } else if (categoryName === "약국유형") {
      setSelectedType(option);
    } else if (categoryName === "운영시간") {
      setSelectedOperatingHours(option);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
    if (selectedType !== "전체") params.append("type", selectedType);
    if (selectedRegion !== "전국") params.append("region", selectedRegion);
    if (selectedOperatingHours !== "전체") params.append("hours", selectedOperatingHours);
    navigate(`/pharmacies?${params.toString()}`);
  };

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ x: longitude, y: latitude });
          setLocationBased(true);
          const params = new URLSearchParams();
          params.append("x", longitude);
          params.append("y", latitude);
          navigate(`/pharmacies?${params.toString()}`);
        },
        (error) => {
          console.error("위치 정보를 가져오는데 실패했습니다:", error);
          alert("위치 정보를 가져오는데 실패했습니다.");
        }
      );
    } else {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
    }
  };

  return (
    <div className="sticky top-16 z-50 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-2xl font-bold">약국 찾기</h1>
          <p className="text-lg mt-2">선택한 지역의 약국을 쉽게 찾아보세요</p>
          
          {/* 검색 섹션 */}
          <div className="w-full max-w-2xl mt-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="약국 이름, 지역, 약국 유형으로 검색"
                  className="w-full px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  🔍
                </button>
              </div>
            </form>
            
            {/* 위치 기반 검색 버튼 */}
            <button
              onClick={handleLocationSearch}
              className="mt-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>📍</span>
              <span>내 주변 약국 찾기</span>
            </button>
          </div>

          {/* 검색 결과 표시 */}
          {searchQuery && (
            <p className="text-md mt-2">
              검색어: <strong>{searchQuery}</strong>
            </p>
          )}
          {locationBased && userLocation.x !== null && userLocation.y !== null && (
            <p className="text-md mt-2">내 주변 약국 검색 중...</p>
          )}
        </div>
      </header>

      {/* 필터 컨테이너 */}
      <div className="top-0 z-50 bg-white shadow-md py-4">
        <div className="container mx-auto mt-6 p-2 px-4 md:px-40">
          <div className="container mx-auto flex justify-center">
            <FilterDropdown
              categories={filterCategories}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* 약국 리스트 */}
      <section className="container mx-auto mt-10 p-6 px-4 md:px-40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 예시 약국 카드 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">OO약국</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  일반약국
                </span>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-600">서울시 강남구 테헤란로 123</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">02-123-4567</span>
                  <button className="text-blue-500 hover:text-blue-700 text-sm">
                    지도보기 🗺️
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <OperatingStatus schedule={{ isOpen: true, nextOpen: "09:00" }} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  야간운영
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  주말운영
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PharmaciesList; 