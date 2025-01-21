import React, { useState } from "react";

const dummyHospitals = [
  {
    id: 1,
    name: "서울 메디컬 센터",
    location: "서울특별시 강남구 테헤란로 123",
    region: "서울",
    image: "https://via.placeholder.com/300x200",
    schedule: {
      Monday: "09:00 - 18:00",
      Tuesday: "09:00 - 18:00",
      Wednesday: "09:00 - 18:00",
      Thursday: "09:00 - 18:00",
      Friday: "09:00 - 18:00",
      Saturday: "10:00 - 14:00",
      Sunday: "휴무",
    },
  },
  {
    id: 2,
    name: "부산 종합병원",
    location: "부산광역시 해운대구 센텀로 456",
    region: "부산",
    image: "https://via.placeholder.com/300x200",
    schedule: {
      Monday: "08:00 - 17:00",
      Tuesday: "08:00 - 17:00",
      Wednesday: "08:00 - 17:00",
      Thursday: "08:00 - 17:00",
      Friday: "08:00 - 17:00",
      Saturday: "09:00 - 13:00",
      Sunday: "휴무",
    },
  },
  {
    id: 3,
    name: "제주 건강 클리닉",
    location: "제주특별자치도 제주시 노형로 123",
    region: "제주",
    image: "https://via.placeholder.com/300x200",
    schedule: {
      Monday: "09:30 - 18:30",
      Tuesday: "09:30 - 18:30",
      Wednesday: "09:30 - 18:30",
      Thursday: "09:30 - 18:30",
      Friday: "09:30 - 18:30",
      Saturday: "휴무",
      Sunday: "휴무",
    },
  },
];

const regions = ["서울", "부산", "제주", "경기", "인천", "강원", "경상", "전라", "충청"];

const HospitalListPage = () => {
  const [selectedRegion, setSelectedRegion] = useState("");

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const filteredHospitals = selectedRegion
    ? dummyHospitals.filter((hospital) => hospital.region === selectedRegion)
    : dummyHospitals;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">전국 병원 리스트</h1>

      {/* 지역 선택 버튼 */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {regions.map((region) => (
          <button
            key={region}
            className={`px-4 py-2 rounded-lg ${
              selectedRegion === region
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setSelectedRegion(region)}
          >
            {region}
          </button>
        ))}
      </div>

      {/* 병원 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.length > 0 ? (
          filteredHospitals.map((hospital) => {
            const currentHours = hospital.schedule[today] || "운영 시간 정보 없음";
            const isOpen = currentHours !== "휴무" && currentHours !== "운영 시간 정보 없음";

            return (
              <div key={hospital.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <img
                  src={hospital.image}
                  alt={hospital.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-bold">{hospital.name}</h2>
                  <p className="text-sm text-gray-500">{hospital.location}</p>
                  <p
                    className={`mt-2 font-bold ${
                      isOpen ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isOpen ? `현재 운영 중 (${currentHours})` : "현재 휴무"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">선택한 지역에 병원이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default HospitalListPage;