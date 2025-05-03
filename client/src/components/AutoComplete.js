import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAutoComplete } from '../service/api';

const AutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState({ hospital: [] });
  const [searchHistory, setSearchHistory] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
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
          setUserLocation({ latitude, longitude });
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

  return (
    <div className="relative w-full">
      <div className="flex flex-col relative">
        <div className="flex relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
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
            <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden" style={{ top: '100%' }}>
              {(suggestions.hospital || []).length === 0 ? (
                <div className="p-3 text-gray-500 text-center">❌ 검색 결과 없음</div>
              ) : (
                <ul>
                  {(suggestions.hospital || []).map((hospital, idx) => (
                    <li key={idx} onMouseDown={() => handleSearch(hospital.name)}
                        className="p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm">
                      <div className="font-medium text-blue-600">{hospital.name}</div>
                      <div className="text-xs text-gray-500">{hospital.address}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  setUserLocation({ latitude, longitude });
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
          className="mt-2 text-sm text-gray-800 hover:text-gray-900 font-bold flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          내 주변 병원 찾기
        </button>
      </div>
    </div>
  );
};

export default AutoComplete;