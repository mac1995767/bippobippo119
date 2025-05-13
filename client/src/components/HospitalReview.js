import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchHospitalReviews, submitHospitalReview, updateHospitalReview, deleteHospitalReview } from '../service/api';

const HospitalReview = ({ hospitalId, hospitalType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sort, setSort] = useState('latest');
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [newReview, setNewReview] = useState({
    content: '',
    visitDate: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const getApiEndpoint = () => {
    return hospitalType === 'nursing' ? 'nursing-hospitals' : 'hospitals';
  };

  // 리뷰 목록 조회
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchHospitalReviews(hospitalId, pagination.page, pagination.limit, sort);
      setReviews(data.reviews);
      setTotalReviews(data.total);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(data.total / pagination.limit)
      }));
    } catch (error) {
      console.error('리뷰 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [hospitalId, pagination.page, sort]);

  // 리뷰 작성
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      if (window.confirm('리뷰 작성을 위해서는 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }

    try {
      const reviewData = {
        content: newReview.content,
        visitDate: newReview.visitDate,
        images: newReview.images
      };

      if (isEditing) {
        await updateHospitalReview(hospitalId, editingReviewId, reviewData);
      } else {
        await submitHospitalReview(hospitalId, reviewData);
      }

      setIsWriting(false);
      setIsEditing(false);
      setEditingReviewId(null);
      setNewReview({ content: '', visitDate: '', images: [] });
      fetchReviews();
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
      if (error.message === '로그인이 필요합니다.') {
        if (window.confirm('리뷰 작성을 위해서는 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
          navigate('/login');
        }
      } else {
        alert('리뷰 작성 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 리뷰 수정 시작
  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
    setIsEditing(true);
    setIsWriting(true);
    setNewReview({
      content: review.content,
      visitDate: review.visit_date ? review.visit_date.split('T')[0] : '',
      images: review.image_urls || []
    });
  };

  // 리뷰 삭제
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteHospitalReview(hospitalId, reviewId);
      fetchReviews();
    } catch (error) {
      console.error('리뷰 삭제 중 오류:', error);
      alert('리뷰 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleStartWriting = () => {
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    setIsWriting(true);
  };

  // 날짜 포맷팅 함수 수정
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '날짜 정보 없음';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '날짜 정보 없음';
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      if (includeTime) {
        return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
      }
      return `${year}년 ${month}월 ${day}일`;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '날짜 정보 없음';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-end mb-6">
        {user && !isWriting && (
          <button
            onClick={handleStartWriting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            리뷰 작성
          </button>
        )}
      </div>

      {/* 리뷰 작성/수정 폼 */}
      {isWriting && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded">
          <div className="mb-4">
            <label className="block mb-2 font-medium">방문일</label>
            <input
              type="date"
              value={newReview.visitDate}
              onChange={(e) => setNewReview(prev => ({ ...prev, visitDate: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium">상세 후기</label>
            <textarea
              value={newReview.content}
              onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-2 border rounded h-32"
              placeholder="병원에 대한 상세한 후기를 작성해주세요. 시설, 서비스, 비용 등에 대한 구체적인 경험을 공유해주시면 자동으로 키워드가 분석됩니다."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setIsEditing(false);
                setEditingReviewId(null);
                setNewReview({ content: '', visitDate: '', images: [] });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {isEditing ? '수정완료' : '작성완료'}
            </button>
          </div>
        </form>
      )}

      {/* 정렬 옵션 */}
      <div className="mb-4">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="latest">최신순</option>
          <option value="likes">좋아요순</option>
        </select>
      </div>

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="text-center py-8">로딩중...</div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex flex-col gap-2">
                {/* 상단 영역: 사용자 정보 및 날짜 */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {review.username ? review.username.charAt(0).toUpperCase() : '익'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{review.username || '익명'}</div>
                      <div className="text-sm text-gray-500">
                        방문: {formatDate(review.visit_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      작성: {formatDate(review.created_at)}
                    </div>
                    {user && user.id === review.user_id && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleStartEdit(review)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 리뷰 내용 */}
                <div className="py-3">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {review.content || '내용 없음'}
                  </p>
                </div>

                {/* 키워드 태그 */}
                {review.keywords && review.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {review.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium"
                      >
                        #{keyword.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
              className={`px-3 py-1 rounded ${
                pagination.page === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* 로그인 알림 모달 */}
      {showLoginAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">로그인이 필요합니다</h3>
            <p className="mb-4">리뷰를 작성하려면 먼저 로그인해주세요.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLoginAlert(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowLoginAlert(false);
                  navigate('/login');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalReview; 