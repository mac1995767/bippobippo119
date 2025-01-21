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
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6 shadow-md">
        <div className="container mx-auto flex flex-col items-center">
          <h1 className="text-3xl font-bold">삐뽀삐뽀119</h1>
          <p className="text-lg mt-2">
            선택한 지역의 병원을 쉽게 찾아보세요
          </p>
        </div>
      </header>

      {/* 지역 선택 버튼 */}
      <section className="container mx-auto mt-8 p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          지역별 병원 검색
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {regions.map((region) => (
            <button
              key={region}
              className={`px-6 py-3 rounded-full transition ${
                selectedRegion === region
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-blue-100"
              }`}
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </button>
          ))}
        </div>
      </section>

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.length > 0 ? (
            filteredHospitals.map((hospital) => {
              const currentHours =
                hospital.schedule[today] || "운영 시간 정보 없음";
              const isOpen =
                currentHours !== "휴무" &&
                currentHours !== "운영 시간 정보 없음";

              return (
                <div
                  key={hospital.id}
                  className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition"
                >
                  <img
                    src={hospital.image}
                    alt={hospital.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {hospital.name}
                    </h3>
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
            <p className="text-center text-gray-500">
              선택한 지역에 병원이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default HospitalListPage;
