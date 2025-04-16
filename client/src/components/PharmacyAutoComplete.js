import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

const PharmacyAutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState({ pharmacy: [] });
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions({ pharmacy: [] });
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/api/pharmacy-autocomplete?query=${encodeURIComponent(searchQuery)}`)
        .then((response) => {
          setSuggestions({ pharmacy: response.data.pharmacy || [] });
        })
        .catch(() => {
          setSuggestions({ pharmacy: [] });
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (queryParam = searchQuery) => {
    const trimmedQuery = queryParam.trim();
    if (!trimmedQuery) return;
    setSuggestions({ pharmacy: [] });
    navigate(`/pharmacies?query=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <div className="relative w-full">
      <div className="flex">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="어떤 약국을 찾으시나요?"
          className="flex-1 p-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
        />
        <button
          onClick={() => handleSearch()}
          className="bg-green-500 text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-green-600"
        >
          검색
        </button>
      </div>
      {searchQuery && (
        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden">
          {(suggestions.pharmacy || []).length === 0 ? (
            <div className="p-3 text-gray-500 text-center">❌ 검색 결과 없음</div>
          ) : (
            <ul>
              {(suggestions.pharmacy || []).map((pharmacy, idx) => (
                <li key={pharmacy.name + pharmacy.address + idx} onMouseDown={() => handleSearch(pharmacy.name)}
                    className="p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm">
                  <div className="font-medium text-blue-600">{pharmacy.name}</div>
                  <div className="text-xs text-gray-500">{pharmacy.address}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacyAutoComplete; 