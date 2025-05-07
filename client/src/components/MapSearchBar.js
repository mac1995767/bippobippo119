import React, { useState, useEffect } from 'react';
import { searchLocation } from '../service/api';

const MapSearchBar = ({ onSearch, isVisible }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);

  // 검색어가 변경될 때마다 자동완성 결과 업데이트
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 1) {
        setIsLoading(true);
        setError(null);
        try {
          console.log('검색어:', searchQuery);
          const results = await searchLocation(searchQuery);
          console.log('검색 결과:', results);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('자동완성 검색 중 오류 발생:', error);
          setError('검색 중 오류가 발생했습니다.');
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-80">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="장소 검색..."
          className="w-full px-4 py-2 pr-10 rounded-lg shadow-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {error && (
          <div className="absolute w-full mt-1 bg-red-50 text-red-500 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col border-b border-gray-100 last:border-b-0"
              >
                <span className="font-medium text-gray-900">{suggestion.name}</span>
                <span className="text-sm text-gray-500">{suggestion.address}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSearchBar; 