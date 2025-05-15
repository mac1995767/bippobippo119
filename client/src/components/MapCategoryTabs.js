import React from 'react';

const categories = [
  '병원 찾기'
];

const MapCategoryTabs = () => (
  <div className="flex border-b bg-white overflow-x-auto whitespace-nowrap">
    {categories.map((cat, idx) => (
      <button
        key={cat}
        className={`
          px-4 py-3 font-bold text-base focus:outline-none
          ${idx === 0 ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-800'}
          sm:px-2 sm:py-2 sm:text-sm sm:min-w-[72px]
        `}
        style={{ minWidth: '90px' }}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default MapCategoryTabs; 