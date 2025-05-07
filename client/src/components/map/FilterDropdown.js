import React from 'react';
import { medicalTypes } from './constants';

function FilterDropdown({ selectedTypes, onTypeToggle }) {
  return (
    <div className="absolute right-16 top-0 bg-white rounded-lg shadow-lg border border-gray-300 p-4 w-64">
      <div className="mb-2 font-bold">의료기관 유형</div>
      <div className="max-h-96 overflow-y-auto">
        {medicalTypes.map(type => (
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
  );
}

export default FilterDropdown; 