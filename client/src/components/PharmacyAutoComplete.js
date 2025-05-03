import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

const PharmacyAutoComplete = ({ searchQuery, setSearchQuery, onSearch }) => {
  const [suggestions, setSuggestions] = useState({ pharmacy: [] });
  const [inputValue, setInputValue] = useState(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!inputValue) {
      setSuggestions({ pharmacy: [] });
      setSelectedIndex(-1);
      setIsDropdownOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      api.get(`/api/pharmacy-autocomplete?query=${encodeURIComponent(inputValue)}`)
        .then((response) => {
          setSuggestions({ pharmacy: response.data.pharmacy || [] });
          setIsDropdownOpen(true);
          setSelectedIndex(-1);
        })
        .catch(() => {
          setSuggestions({ pharmacy: [] });
          setIsDropdownOpen(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSearch = (queryParam = inputValue) => {
    const trimmedQuery = queryParam.trim();
    if (!trimmedQuery) return;
    setSuggestions({ pharmacy: [] });
    setSearchQuery(trimmedQuery);
    setInputValue(trimmedQuery);
    setIsDropdownOpen(false);
    onSearch(trimmedQuery);
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const nextIndex = prev + 1;
        return nextIndex >= suggestions.pharmacy.length ? 0 : nextIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        const nextIndex = prev - 1;
        return nextIndex < 0 ? suggestions.pharmacy.length - 1 : nextIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.pharmacy.length) {
        const selectedPharmacy = suggestions.pharmacy[selectedIndex];
        handleSearch(selectedPharmacy.name);
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

  return (
    <div className="relative w-full">
      <div className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
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
      {isDropdownOpen && inputValue && suggestions.pharmacy.length > 0 && (
        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden max-h-60">
          <ul 
            ref={suggestionsRef}
            className="overflow-y-auto max-h-60 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {suggestions.pharmacy.map((pharmacy, idx) => (
              <li 
                key={pharmacy.name + pharmacy.address + idx} 
                onClick={() => handleSearch(pharmacy.name)}
                className={`p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm ${
                  idx === selectedIndex ? 'bg-gray-200' : ''
                }`}
              >
                <div className="font-medium text-blue-600">{pharmacy.name}</div>
                <div className="text-xs text-gray-500">{pharmacy.address}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PharmacyAutoComplete; 