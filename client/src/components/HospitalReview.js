import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HospitalReview = ({ hospitalId, hospitalType }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sort, setSort] = useState('latest');
  const [isWriting, setIsWriting] = useState(false);
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
      const response = await axios.get(
        `/api/nursing-hospitals/${hospitalId}/reviews?page=${pagination.page}&limit=${pagination.limit}&sort=${sort}`
      );
      const data = response.data;
      setReviews(data.reviews);
      setPagination(data.pagination);
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
    try {
      const response = await axios.post(
        `/api/nursing-hospitals/${hospitalId}/reviews`,
        {
          ...newReview,
          hospitalType
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.status === 201) {
        setIsWriting(false);
        setNewReview({ content: '', visitDate: '', images: [] });
        fetchReviews();
      }
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
    }
  };

  // 리뷰 좋아요
  const handleLike = async (reviewId) => {
    try {
      const response = await axios.post(
        `/api/nursing-hospitals/reviews/${reviewId}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.status === 200) {
        fetchReviews();
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    }
  };

  const handleStartWriting = () => {
    if (!user) {
      if (window.confirm('리뷰 작성을 위해서는 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }
    setIsWriting(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">리뷰</h2>
          <div className="flex items-center mt-2">
            <span className="text-gray-500">총 {pagination.total}개의 리뷰</span>
          </div>
        </div>
        <button
          onClick={handleStartWriting}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          리뷰 작성
        </button>
      </div>

      {/* 리뷰 작성 폼 */}
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
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              작성완료
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
            <div key={review.id} className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{review.user.name}</div>
                  <div className="text-gray-500 text-sm">
                    {new Date(review.visitDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-gray-500 text-sm">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              {review.keywords && review.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {review.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {keyword.label}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-gray-700 whitespace-pre-line">{review.content}</p>
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