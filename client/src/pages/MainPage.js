import React from "react";
import { Link } from "react-router-dom";

const MainPage = () => {
  const categories = [
    { label: "야간 진료", icon: "🌙" },
    { label: "24시간 진료", icon: "⏰" },
    { label: "주말 진료", icon: "📅" },
    { label: "일반 진료", icon: "🏥" },
  ];

  return (
    <div className="container mx-auto p-6">
      {/* 헤더 */}
      <header className="flex items-center justify-between bg-gradient-to-r from-blue-400 to-purple-500 text-white p-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">삐뽀삐뽀119</h1>
        <div className="flex items-center space-x-4">
          <Link to="/hospitals">
            <button className="px-4 py-2 bg-white text-blue-500 rounded-lg shadow-md hover:bg-gray-100">
              병원 검색
            </button>
          </Link>
        </div>
      </header>

      {/* 검색바 */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="어떤 병원을 찾으시나요?"
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 카테고리 */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <Link
            key={index}
            to={`/hospitals?category=${category.label}`}
            className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow hover:bg-gray-200"
          >
            <span className="text-4xl">{category.icon}</span>
            <p className="mt-2 text-lg font-bold">{category.label}</p>
          </Link>
        ))}
      </div>

      {/* 슬라이더 */}
      <div className="mt-8">
        <div className="relative w-full h-64 bg-gray-300 rounded-lg shadow-md overflow-hidden">
          <img
            src="https://via.placeholder.com/800x400"
            alt="슬라이더 이미지"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent text-white p-4">
            <h2 className="text-xl font-bold">야간 진료 병원을 찾으세요?</h2>
            <p>지금 바로 검색하여 필요한 병원을 찾아보세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
