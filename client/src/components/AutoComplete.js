import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAutoComplete } from '../service/api';

const AutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState({ hospital: [] });
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setSearchHistory(storedHistory);
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions({ hospital: [] });
      return;
    }

    const timer = setTimeout(() => {
      fetchAutoComplete(searchQuery)
        .then((response) => {
          setSuggestions({ hospital: response.hospital || [] });
        })
        .catch(() => {
          setSuggestions({ hospital: [] });
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (queryParam = searchQuery) => {
    const trimmedQuery = queryParam.trim();
  
    // 검색어가 있으면 검색어 기반 검색 실행
    if (trimmedQuery) {
      let updatedHistory = [
        trimmedQuery,
        ...searchHistory.filter((h) => h !== trimmedQuery),
      ];
      updatedHistory = updatedHistory.slice(0, 10);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      setSearchHistory(updatedHistory);
      navigate(`/hospitals?query=${encodeURIComponent(trimmedQuery)}`);
      return;
    }
  
    // 검색어가 없으면 위치 기반 검색 시도
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          navigate(`/hospitals?x=${longitude}&y=${latitude}`);
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

  const handleKeyDown = (e) => {
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
      if (selectedIndex >= 0 && selectedIndex < suggestions.hospital.length) {
        handleSearch(suggestions.hospital[selectedIndex].name);
      } else {
        handleSearch();
      }
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

  return (
    <div className="relative w-full">
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
            placeholder="어떤 병원을 찾으시나요?"
            className="flex-1 p-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
          />
          <button
            onClick={() => handleSearch()}
            className="bg-purple-500 text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-purple-600"
          >
            검색
          </button>

          {searchQuery && (
            <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden" style={{ top: '100%', maxHeight: '240px' }}>
              {(suggestions.hospital || []).length === 0 ? (
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
                      onMouseDown={() => handleSearch(hospital.name)}
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
        <div className="container mx-auto">
          <div className="w-full max-w-2xl">
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      navigate(`/hospitals?x=${longitude}&y=${latitude}`);
                    },
                    (error) => {
                      console.error("위치 정보를 가져올 수 없습니다.", error);
                      alert("위치 정보를 가져올 수 없습니다. 직접 검색어를 입력해주세요.");
                    }
                  );
                } else {
                  alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
                }
              }}
              className="mt-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>📍</span>
              <span>내 주변 병원 찾기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoComplete;