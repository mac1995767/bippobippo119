import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchNursingHospitals } from "../service/api";
import HospitalMajorList from "./HospitalMajorList";
import DistanceInfo from "./DistanceInfo";
import HealthCenterBanner from './HealthCenterBanner';
import OperatingStatus from "../components/OperatingStatus";
import NursingHospitalFilter from './NursingHospitalFilter';

const NursingHospitalList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 상태 관리
  const [hospitals, setHospitals] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 필터 상태
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [searchQuery, setSearchQuery] = useState("");

  // URL 파라미터에서 검색어와 지역 읽기
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("query") || "";
    const region = params.get("region") || "전국";
    const x = params.get("x");
    const y = params.get("y");
    const distance = params.get("distance");
    
    setSearchQuery(query);
    setSelectedRegion(region);
    
    // 위치 기반 검색인 경우
    if (x && y) {
      fetchHospitalsData({ 
        x, 
        y, 
        distance: distance || '10km',
        region: region !== "전국" ? region : undefined
      });
    } else {
      fetchHospitalsData();
    }
  }, [location.search]);

  // 데이터 가져오기
  const fetchHospitalsData = async (locationParams = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: limit,
        category: "요양병원", // 요양병원만 필터링
      };

      // 지역 필터 적용
      if (selectedRegion !== "전국") {
        params.region = selectedRegion;
      }
      // 검색어 필터 적용
      if (searchQuery) {
        params.query = searchQuery;
      }
      // 위치 기반 검색 파라미터 적용
      if (locationParams) {
        params.x = locationParams.x;
        params.y = locationParams.y;
        params.distance = locationParams.distance;
        // 위치 기반 검색 시 지역 필터가 있는 경우 적용
        if (locationParams.region) {
          params.region = locationParams.region;
        }
      }

      const response = await fetchNursingHospitals(params);
      
      const {
        data,
        totalCount: fetchedTotalCount,
        totalPages: fetchedTotalPages,
        currentPage: fetchedCurrentPage,
      } = response;

      setHospitals(data);
      setTotalCount(fetchedTotalCount);
      setTotalPages(fetchedTotalPages);
      setCurrentPage(fetchedCurrentPage);
    } catch (err) {
      console.error(err);
      setError("요양병원 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 위치 기반 검색 결과 처리
  const handleLocationSearch = (searchResults) => {
    setHospitals(searchResults);
    setTotalCount(searchResults.length);
    setTotalPages(1);
    setCurrentPage(1);
  };

  // 페이지나 필터, 검색어 변경시 데이터 다시 가져오기
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const x = params.get("x");
    const y = params.get("y");
    const distance = params.get("distance");

    if (x && y) {
      fetchHospitalsData({ x, y, distance });
    } else {
      fetchHospitalsData();
    }
  }, [currentPage, limit, selectedRegion, searchQuery, location.search]);

  // 페이지네이션 핸들러
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleHospitalClick = (hospitalId) => {
    navigate(`/nursing-hospitals/${hospitalId}`);
  };

  const handleSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    if (selectedRegion !== "전국") params.append("region", selectedRegion);
    navigate(`/nursing-hospitals?${params.toString()}`);
  };

  return (
    <div className="sticky top-16 z-50 bg-gray-50">
      {/* 건강증진센터 배너 */}
      <HealthCenterBanner />
      
      <NursingHospitalFilter 
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        onSearch={handleSearch}
        onLocationSearch={handleLocationSearch}
      />

      {/* 병원 리스트 */}
      <section className="container mx-auto mt-10 p-6 px-4 md:px-40">
        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
                총 {totalCount}개의 요양병원
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitals.map((hospital) => (
                <div 
                  key={hospital._id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleHospitalClick(hospital._id)}
                >
                
                {/* 병원 이미지 */}
                  {/*
                    <div className="w-full h-[180px] bg-gray-200 flex items-center justify-center relative">
                      {hospital.image ? (
                      <img
                        src={hospital.image}
                        onError={(e) => (e.currentTarget.src = "/image-placeholder.jpg")}
                        alt={hospital.yadmNm || "병원 이미지"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">🖼️ 이미지 준비 중</span>
                    )}
                    </div>
                    */}
                  {/* 병원 정보 */}
                  <div className="p-4">

                    {/* 병원 유형 및 위탁병원 정보 */}
                    <div className="flex items-center gap-2 mb-1">
                          {hospital.category && (
                            <div className="text-xs text-blue-700 font-semibold">
                              {hospital.category}
                            </div>
                          )}
                          {hospital.veteran_hospital && (
                            <div className="text-xs text-red-700 font-semibold">
                              위탁병원
                            </div>
                          )}
                        </div>
                    
                    <h3 className="text-lg font-bold mb-1">{hospital.yadmNm}</h3>
                    <p className="text-gray-600 text-sm mb-2">{hospital.addr}</p>

                    {/* 진료과 정보 */}
                    <HospitalMajorList majors={hospital.major || []} />

                    {/* 거리 정보 */}
                    <DistanceInfo hospitalLocation={hospital.location} />

                    {/* 운영 정보 */}
                     <div className="mt-2">
                        <p className="font-semibold text-gray-700">🕒 영업 여부:</p>
                        <OperatingStatus times={hospital.times} />
                    </div>  

                    {/* 전화번호 */}
                    <div className="mt-2">
                      <p className="font-semibold text-gray-700">📞 전화번호:</p>
                      {hospital.telno ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-blue-600 font-medium">{hospital.telno}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${hospital.telno}`;
                            }}
                            className="ml-auto bg-blue-500 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-600 transition"
                          >
                            📞 바로통화
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500">전화번호 정보 없음</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="mx-4">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                다음
              </button>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-4 px-2 py-1 bg-white border rounded"
              >
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
              </select>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default NursingHospitalList; 