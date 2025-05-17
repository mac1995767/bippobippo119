import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/api';

const NavigationBar = () => {
  const { user, userProfileImage, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 모바일 메뉴 상태
  const location = useLocation();

  // 현재 경로가 특정 경로와 일치하는지 확인하는 함수
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // 메뉴 항목의 클래스를 동적으로 생성하는 함수
  const getMenuItemClasses = (path, isMobile = false) => {
    if (isMobile) {
      return `block px-3 py-2 rounded-md text-base font-medium ${
        isActive(path)
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`;
    }
    return `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive(path)
        ? 'border-indigo-500 text-indigo-600 font-semibold'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;
  };

  // 랜덤 색상 생성 함수
  const getRandomColor = (username) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 
      'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-green-500',
      'bg-yellow-500', 'bg-orange-500'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // 사용자 이니셜 가져오기
  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const menuItems = [
    { path: '/hospitals', label: '병원 찾기' },
    { path: '/pharmacies', label: '약국 찾기' },
    { path: '/community', label: '커뮤니티' },
    { path: '/map', label: '지도' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                삐뽀삐뽀119
              </Link>
            </div>
            {/* 데스크탑 메뉴 */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={getMenuItemClasses(item.path)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            {/* 데스크탑 사용자 정보 및 로그인 버튼 */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 focus:outline-none"
                  >
                    {userProfileImage ? (
                      <img
                        src={`${getApiUrl()}${userProfileImage}`}
                        alt="프로필"
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-indigo-500 transition-colors duration-200"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor(user.username)}`}>
                        {getInitials(user.username)}
                      </div>
                    )}
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="fixed right-4 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[99999]">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        프로필
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                          window.location.reload();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              )}
            </div>
            {/* 모바일 햄버거 버튼 */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={getMenuItemClasses(item.path, true)}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {/* 모바일 사용자 정보 및 로그인/로그아웃 버튼 */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center px-5">
                  {userProfileImage ? (
                    <img
                      src={`${getApiUrl()}${userProfileImage}`}
                      alt="프로필"
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getRandomColor(user.username)}`}>
                      {getInitials(user.username)}
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.username}</div>
                    {user.email && <div className="text-sm font-medium text-gray-500">{user.email}</div>}
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    프로필
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      window.location.reload();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2">
                <Link
                  to="/login"
                  className="block w-full px-3 py-2 rounded-md text-center text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar; 