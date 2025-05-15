import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchNursingHospitalDetail, fetchHospitalKeywordStats, fetchHospitalReviews } from '../../service/api';
import { IoMdBed } from 'react-icons/io';
import { FaUserMd, FaUserNurse, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { BsImage, BsCheckCircle, BsInfoCircle } from 'react-icons/bs';

// 시간 포맷팅 함수 추가
const formatTime = (time) => {
  if (!time) return "정보 없음";
  const timeStr = time.toString().padStart(4, '0');
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
};

// 점심시간 포맷팅 함수 추가
const formatLunchTime = (lunchTime) => {
  if (!lunchTime) return "정보 없음";
  const [start, end] = lunchTime.split('~').map(time => time.trim());
  return `${formatTime(start)} ~ ${formatTime(end)}`;
};

  // 운영 시간 표시 함수 추가
const displayOperatingTime = (startTime, endTime) => {
  if (!startTime || !endTime) return "정보 없음";
  return `${formatTime(startTime)} ~ ${formatTime(endTime)}`;
};

const NursingHospitalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [keywordStats, setKeywordStats] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hospitalData, statsData, reviewsData] = await Promise.all([
          fetchNursingHospitalDetail(id),
          fetchHospitalKeywordStats(id),
          fetchHospitalReviews(id)
        ]);
        
        if (hospitalData) {
          setHospital(hospitalData);
          setKeywordStats(statsData);
          setReviews(reviewsData.reviews || []);
        } else {
          throw new Error('병원 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleReviewClick = () => {
    navigate(`/nursing-hospitals/${id}/reviews`);
  };

  // 아이콘 매핑 함수
  const getIconComponent = (iconName) => {
    const iconMap = {
      'BsImage': <BsImage className="text-green-500" />,
      'BsCheckCircle': <BsCheckCircle className="text-yellow-500" />,
      'BsInfoCircle': <BsInfoCircle className="text-blue-500" />,
      'FaUserMd': <FaUserMd className="text-purple-500" />,
      'FaUserNurse': <FaUserNurse className="text-pink-500" />,
      'IoMdBed': <IoMdBed className="text-blue-500" />
    };
    return iconMap[iconName] || <BsInfoCircle className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => navigate('/nursing-hospitals')}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MdKeyboardArrowLeft className="mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-gray-600 text-lg mb-4">병원 정보를 찾을 수 없습니다.</div>
        <button
          onClick={() => navigate('/nursing-hospitals')}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MdKeyboardArrowLeft className="mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/nursing-hospitals')}
            className="flex items-center text-gray-600 hover:text-blue-500 transition-colors"
          >
            <MdKeyboardArrowLeft size={24} />
            <span>돌아가기</span>
          </button>
        </div>
      </div>

      {/* 상단 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{hospital.yadmNm}</h1>
          <p className="text-lg opacity-90">{hospital.addr}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 섹션: 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 리뷰 요약 섹션 */}
            {/*
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">후기 ({reviews.length})</h2>
                <button
                  onClick={handleReviewClick}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  전체보기
                </button>
              </div>

              <h3 className="font-medium text-gray-900 mb-4">한눈에 보는 특징</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keywordStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      {getIconComponent(stat.icon)}
                      <span className="ml-2 font-medium">{stat.label}</span>
                    </div>
                    <span className="text-gray-500">{stat.count}명</span>
                  </div>
                ))}
              </div>
            </div>
            */}

            {/* 핵심 정보 카드 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">병원 정보</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl">
                  <IoMdBed size={24} className="text-blue-500 mb-2" />
                  <span className="text-sm text-gray-600">병상</span>
                  <span className="font-bold">{hospital.beds || '정보없음'}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 rounded-xl">
                  <FaUserMd size={24} className="text-green-500 mb-2" />
                  <span className="text-sm text-gray-600">의사</span>
                  <span className="font-bold">{hospital.doctors || '정보없음'}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-purple-50 rounded-xl">
                  <FaUserNurse size={24} className="text-purple-500 mb-2" />
                  <span className="text-sm text-gray-600">간호사</span>
                  <span className="font-bold">{hospital.nurses || '정보없음'}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl">
                  <FaPhoneAlt size={24} className="text-red-500 mb-2" />
                  <span className="text-sm text-gray-600">전화</span>
                  <a href={`tel:${hospital.telno}`} className="font-bold text-blue-500 hover:underline">
                    {hospital.telno || '정보없음'}
                  </a>
                </div>
              </div>

              {/* 병원 유형 및 위탁병원 정보 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">병원 유형</h3>
                <div className="flex flex-wrap gap-2">
                  {hospital.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {hospital.category}
                    </span>
                  )}
                  {hospital.veteran_hospital && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      위탁병원
                    </span>
                  )}
                </div>
              </div>

              {/* 진료과 정보 */}
              {hospital.major && hospital.major.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">진료과</h3>
                  <div className="flex flex-wrap gap-2">
                    {hospital.major.map((major, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {major}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 병원 홈페이지 */}
              {hospital.hospUrl && hospital.hospUrl !== '-' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">홈페이지</h3>
                  <a
                    href={hospital.hospUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {hospital.hospUrl}
                  </a>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">운영 정보</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 mb-2">운영 시간</p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">월요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtMonStart, hospital.times?.trmtMonEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">화요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtTueStart, hospital.times?.trmtTueEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">수요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtWedStart, hospital.times?.trmtWedEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">목요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtThuStart, hospital.times?.trmtThuEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">금요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtFriStart, hospital.times?.trmtFriEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">토요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtSatStart, hospital.times?.trmtSatEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">일요일</p>
                      <p>{displayOperatingTime(hospital.times?.trmtSunStart, hospital.times?.trmtSunEnd)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">점심시간</p>
                      <p>{formatLunchTime(hospital.times?.lunchWeek)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    hospital.nightCare ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    야간진료: {hospital.nightCare ? "가능" : "불가능"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    hospital.weekendCare ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    주말진료: {hospital.weekendCare ? "가능" : "불가능"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 섹션: 빠른 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4">빠른 정보</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaPhoneAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-600">전화번호</div>
                    <a href={`tel:${hospital.telno}`} className="text-blue-500 hover:underline">
                      {hospital.telno || '정보없음'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center">
                  <IoMdBed className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-600">병상 수</div>
                    <div>{hospital.beds || '정보없음'}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaUserMd className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-600">의사 수</div>
                    <div>{hospital.doctors || '정보없음'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingHospitalDetailPage; 