import React from 'react';

const filters = [
  '야간진료', '24시간', '공휴일진료', '주차가능', '여성의사', '진료비', '거리순', '평점순'
];

const MapFilterBar = () => (
  <div className="flex flex-wrap gap-2 bg-white px-4 py-2 border-b">
    {filters.map((filter, idx) => (
      <button
        key={filter}
        className={`px-4 py-2 rounded-full border text-sm font-medium focus:outline-none bg-white text-gray-700 border-gray-200`}
      >
        {filter}
      </button>
    ))}
    <button className="px-4 py-2 rounded border bg-white text-blue-600 border-blue-200 text-sm font-medium">상세검색 +</button>
    <button className="px-4 py-2 rounded border bg-white text-purple-600 border-purple-200 text-sm font-medium"> 준비중인 세션 </button>
  </div>
);

export default MapFilterBar; 