import React from 'react';

function FilterDropdown({ selectedTypes, onTypeToggle, medicalStats }) {
  const { hospitals, pharmacies } = medicalStats;

  return (
    <div className="absolute right-16 top-0 bg-white rounded-lg shadow-lg border border-gray-300 p-4 w-64">
      {/* 병원 유형 */}
      <div className="mb-4">
        <div className="mb-2 font-bold text-purple-600">의료기관 유형</div>
        <div className="max-h-48 overflow-y-auto">
          {hospitals.map(type => (
            <label
              key={type.key}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedTypes.includes(type.key)}
                  onChange={() => onTypeToggle(type.key)}
                />
                <span>{type.key}</span>
              </div>
              <span className="text-gray-500 text-sm">
                ({type.count.toLocaleString()})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 약국 유형 */}
      <div>
        <div className="mb-2 font-bold text-blue-600">약국 유형</div>
        <div className="max-h-24 overflow-y-auto">
          {pharmacies.map(type => (
            <label
              key={type.key}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedTypes.includes(type.key)}
                  onChange={() => onTypeToggle(type.key)}
                />
                <span>{type.key}</span>
              </div>
              <span className="text-gray-500 text-sm">
                ({type.count.toLocaleString()})
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilterDropdown; 