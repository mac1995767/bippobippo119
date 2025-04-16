import React from "react";

const HospitalMajorList = ({ majors }) => {
  if (!majors || majors.length === 0) {
    return (
      <div className="mt-2">
        <p className="font-semibold text-gray-700">진료과:</p>
        <div className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-500">
          진료과 정보 없음
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="font-semibold text-gray-700">진료과:</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {majors.map((major, index) => (
          <span
            key={index}
            className="bg-gray-200 px-3 py-1 text-sm rounded-md"
          >
            {major}
          </span>
        ))}
      </div>
    </div>
  );
};

export default HospitalMajorList;
