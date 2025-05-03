import React from 'react';

const categories = [
  '종합병원', '내과', '외과', '소아과', '산부인과', '치과', '한의원', '약국', '기타'
];

const MapCategoryTabs = () => (
  <div className="flex border-b bg-white">
    {categories.map((cat, idx) => (
      <button
        key={cat}
        className={`px-4 py-3 font-bold text-base focus:outline-none ${idx === 0 ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-800'}`}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default MapCategoryTabs; 