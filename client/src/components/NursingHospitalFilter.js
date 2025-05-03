import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FilterDropdown from './FilterDropdown';
import { fetchNursingHospitalAutoComplete, fetchNursingHospitals } from '../service/api';

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

const NursingHospitalFilter = ({ selectedRegion, setSelectedRegion, onSearch, onLocationSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ hospital: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const debounceTimer = React.useRef(null);

  const handleSearch = (queryParam = searchQuery) => {
    const trimmedQuery = queryParam.trim();
    if (trimmedQuery) {
      navigate(`/nursing-hospitals?query=${encodeURIComponent(trimmedQuery)}`);
      setIsDropdownOpen(false);
    }
  };

  const handleLocationSearch = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            setIsSearching(true);
            const response = await fetchNursingHospitals({
              x: longitude,
              y: latitude,
              distance: '10km'
            });
            
            // 부모 컴포넌트에 검색 결과 전달
            if (onLocationSearch) {
              onLocationSearch(response.data);
            }
            
            navigate(`/nursing-hospitals?x=${longitude}&y=${latitude}&distance=10km`);
          } catch (error) {
            console.error("위치 기반 검색 오류:", error);
            alert("위치 기반 검색 중 오류가 발생했습니다. 다시 시도해주세요.");
          } finally {
            setIsSearching(false);
          }
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
      
      // URL 파라미터에서 위치 정보 확인
      const params = new URLSearchParams(location.search);
      const x = params.get("x");
      const y = params.get("y");
      const distance = params.get("distance");
      
      // 위치 기반 검색인 경우
      if (x && y) {
        navigate(`/nursing-hospitals?x=${x}&y=${y}&distance=${distance}&region=${option}`);
      } else {
        navigate(`/nursing-hospitals?region=${option}`);
      }
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions({ hospital: [] });
      setSelectedIndex(-1);
      setIsDropdownOpen(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setIsSearching(true);
      fetchNursingHospitalAutoComplete(searchQuery)
        .then(data => {
          setSuggestions({ hospital: data.hospital || [] });
          setIsSearching(false);
          setIsDropdownOpen(true);
          setSelectedIndex(-1);
        })
        .catch(error => {
          console.error('자동완성 에러:', error);
          setSuggestions({ hospital: [] });
          setIsSearching(false);
          setIsDropdownOpen(false);
        });
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const nextIndex = prev + 1;
        return nextIndex >= suggestions.hospital.length ? 0 : nextIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const nextIndex = prev - 1;
        return nextIndex < 0 ? suggestions.hospital.length - 1 : nextIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.hospital.length) {
        const selectedHospital = suggestions.hospital[selectedIndex];
        setSearchQuery(selectedHospital.name);
        setSuggestions({ hospital: [] });
        setIsDropdownOpen(false);
        handleSearch(selectedHospital.name);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSuggestionClick = (hospital) => {
    setSearchQuery(hospital.name);
    setSuggestions({ hospital: [] });
    setIsDropdownOpen(false);
    handleSearch(hospital.name);
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="어떤 요양병원을 찾으시나요?"
                  className="flex-1 p-3 border border-[#3a8dde] rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3a8dde] bg-white placeholder-gray-400 text-gray-800"
                />
                <button
                  onClick={() => handleSearch()}
                  className="bg-[#3a8dde] text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-[#2563eb] transition"
                >
                  검색
                </button>

                {isDropdownOpen && searchQuery && (
                  <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden" style={{ top: '100%', left: 0, maxHeight: '240px' }}>
                    {isSearching ? (
                      <div className="p-3 text-gray-500 text-center">검색 중...</div>
                    ) : (suggestions.hospital || []).length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">❌ 검색 결과 없음</div>
                    ) : (
                      <ul 
                        ref={suggestionsRef}
                        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                        style={{ maxHeight: '240px' }}
                      >
                        {(suggestions.hospital || []).map((hospital, idx) => (
                          <li 
                            key={idx} 
                            onClick={() => handleSuggestionClick(hospital)}
                            className={`p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm ${
                              idx === selectedIndex ? 'bg-gray-200' : ''
                            }`}
                          >
                            <div className="font-medium text-blue-600">{hospital.name}</div>
                            <div className="text-xs text-gray-500">{hospital.address}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 위치 기반 검색 버튼 */}
            <button
              onClick={handleLocationSearch}
              disabled={isSearching}
              className={`mt-2 px-4 py-2 ${
                isSearching ? 'bg-gray-400' : 'bg-[#36d1c4] hover:bg-[#3a8dde]'
              } text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow`}
            >
              <span>📍</span>
              <span>{isSearching ? '검색 중...' : '내 주변 요양병원 찾기'}</span>
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