import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaPhone, FaClock, FaBuilding, FaHeartbeat, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { fetchHealthCenters } from '../service/api';

const HealthCenterList = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [regions, setRegions] = useState([]);
  const [types, setTypes] = useState([]);
  const itemsPerPage = 9;

  const fetchCenters = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setCenters([]); // 새로운 데이터를 불러오기 전에 기존 데이터 초기화
      setError(null);

      const params = {
        page,
        limit: 9,
        keyword: searchTerm || undefined,
        type: selectedType !== 'all' ? selectedType : undefined,
        sido: selectedRegion !== 'all' ? selectedRegion : undefined
      };
      
      const data = await fetchHealthCenters(params);
      
      if (data && data.centers) {
        setCenters(data.centers);
        setTotalPages(Math.ceil(data.total / 9));
      } else {
        setCenters([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      setCenters([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedRegion]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchCenters(1);
  }, [fetchCenters]); // fetchCenters를 의존성 배열에 추가

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCenters(1);
  };

  const handleCenterClick = (center) => {
    navigate(`/health-centers/${center._id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCenters(page);
  };

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setCurrentPage(1);
    // fetchCenters는 useCallback으로 메모이제이션되어 있으므로,
    // selectedRegion이 변경될 때 자동으로 새로운 데이터를 불러옵니다.
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    setCurrentPage(1);
    // fetchCenters는 useCallback으로 메모이제이션되어 있으므로,
    // selectedType이 변경될 때 자동으로 새로운 데이터를 불러옵니다.
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 페이지 버튼
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          <FaChevronLeft />
        </button>
      );
    }

    // 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // 다음 페이지 버튼
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          <FaChevronRight />
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <FaHeartbeat className="text-blue-500 mr-2" />
          건강증진센터 찾기
        </h1>
      </div>
      
      {/* 검색 필터 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="건강증진센터명 또는 주소로 검색"
                className="w-full px-4 py-2 border rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedType}
              onChange={handleTypeChange}
            >
              <option value="all">전체 유형</option>
              <option value="건강증진">건강증진</option>
              <option value="정신보건">정신보건</option>
            </select>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 지역</option>
              <option value="서울">서울</option>
              <option value="경기">경기</option>
              <option value="인천">인천</option>
              <option value="부산">부산</option>
              <option value="대구">대구</option>
              <option value="광주">광주</option>
              <option value="대전">대전</option>
              <option value="울산">울산</option>
              <option value="세종">세종</option>
              <option value="강원">강원</option>
              <option value="충북">충북</option>
              <option value="충남">충남</option>
              <option value="전북">전북</option>
              <option value="전남">전남</option>
              <option value="경북">경북</option>
              <option value="경남">경남</option>
              <option value="제주">제주</option>
            </select>
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 결과 목록 */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      ) : centers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {centers.map((center) => (
              <div
                key={center._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold">{center.yadmNm}</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {center.clCdNm}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-2 text-blue-500" />
                    <span>{center.addr}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaPhone className="mr-2 text-blue-500" />
                    <span>{center.telno}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaClock className="mr-2 text-blue-500" />
                    <span>{center.startTime} - {center.endTime}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaBuilding className="mr-2 text-blue-500" />
                    <span>{center.operOrgNm}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><span className="font-semibold">지번주소:</span> {center.jibunAddr}</p>
                    <p><span className="font-semibold">운영기관:</span> {center.mgrOrgNm}</p>
                    <p><span className="font-semibold">운영기관 연락처:</span> {center.mgrTelno}</p>
                    <p><span className="font-semibold">건물면적:</span> {center.buildingArea}㎡</p>
                    <p><span className="font-semibold">의사 수:</span> {center.drTotCnt}명</p>
                    <p><span className="font-semibold">간호사 수:</span> {center.pnursCnt}명</p>
                    <p><span className="font-semibold">사회복지사 수:</span> {center.socialWorkerCnt}명</p>
                    <p><span className="font-semibold">영양사 수:</span> {center.nutritionistCnt}명</p>
                    <p><span className="font-semibold">기타 인력:</span> {center.etcPersonnelStatus}</p>
                    <p><span className="font-semibold">휴무일:</span> {center.holidayInfo}</p>
                    <p><span className="font-semibold">이용안내:</span> {center.etcUseInfo}</p>
                    <p><span className="font-semibold">사업내용:</span> {center.bizCont}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {renderPagination()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HealthCenterList; 