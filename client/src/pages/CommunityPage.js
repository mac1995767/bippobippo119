import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import CategoryTree from '../components/CategoryTree';

const CommunityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // URL에서 카테고리 ID 추출
  const getCategoryIdFromUrl = () => {
    if (location.pathname.includes('/community/category/')) {
      const match = location.pathname.match(/\/community\/category\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const categoryId = getCategoryIdFromUrl();
      const response = await axios.get(`${getApiUrl()}/api/boards`, {
        params: {
          page: currentPage,
          limit: 10,
          categoryId: categoryId
        }
      });
      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('게시글 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, location.pathname]);

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/community/create');
  };

  const handlePostClick = (postId) => {
    navigate(`/community/boards/${postId}`);
  };

  // 프로필 이미지 URL 생성 함수
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${getApiUrl()}${imagePath}`;
    return `${getApiUrl()}/uploads/${imagePath}`;
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

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-full mx-auto p-4 sm:p-6">
        {/* 상단 네비게이션 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-8 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">커뮤니티</h1>
          </div>
          <button
            onClick={handleWriteClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            새 글 작성
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* 왼쪽 사이드바 - 카테고리 트리 */}
          <div className="w-full lg:w-1/4">
            <CategoryTree />
          </div>

          {/* 오른쪽 메인 컨텐츠 */}
          <div className="flex-1">
            {/* 칸반 보드 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* 최신 글 */}
              <div className="bg-[#f8f9fa] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    최신 글
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                    {posts.filter(p => new Date(p.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {posts
                    .filter(p => new Date(p.created_at) > new Date(Date.now() - 24*60*60*1000))
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5)
                    .map(post => (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {post.profile_image ? (
                              <img
                                src={getProfileImageUrl(post.profile_image)}
                                alt={post.author_name || '작성자'}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getRandomColor(post.author_name)}`}>
                                {getInitials(post.author_name)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</h3>
                            <p className="text-xs text-gray-500">{post.author_name || '익명'}</p>
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-500 ml-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {post.category_name}
                          </span>
                          {post.tags && post.tags.length > 0 && post.tags[0]?.name && (
                            <div className="flex items-center space-x-1">
                              {post.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                                  #{tag.name}
                                </span>
                              ))}
                              {post.tags.length > 2 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  +{post.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          {post.hospital_info && (
                            <div className="relative">
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full cursor-pointer hover:bg-green-200 hospital-tag">
                                @{post.hospital_info.name}
                              </span>
                              <div className="absolute -top-12 right-0 bg-white shadow-lg rounded-lg p-1.5 min-w-[120px] max-w-[160px] z-10 opacity-0 pointer-events-none hospital-tag-tooltip">
                                <div className="text-xs font-medium text-gray-900 truncate">{post.hospital_info.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5 truncate">{post.hospital_info.address}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-gray-500">
                          <span className="text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.view_count}
                          </span>
                          {post.comment_count > 0 && (
                            <span className="text-xs flex items-center text-blue-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              {post.comment_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 인기 글 */}
              <div className="bg-[#f8f9fa] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    인기 글
                  </h2>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                    {posts.filter(p => p.view_count >= 100).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {posts
                    .filter(p => p.view_count >= 100)
                    .sort((a, b) => b.view_count - a.view_count)
                    .slice(0, 5)
                    .map(post => (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {post.profile_image ? (
                              <img
                                src={getProfileImageUrl(post.profile_image)}
                                alt={post.author_name || '작성자'}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getRandomColor(post.author_name)}`}>
                                {getInitials(post.author_name)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</h3>
                            <p className="text-xs text-gray-500">{post.author_name || '익명'}</p>
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-500 ml-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {post.category_name}
                          </span>
                          {post.tags && post.tags.length > 0 && post.tags[0]?.name && (
                            <div className="flex items-center space-x-1">
                              {post.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                                  #{tag.name}
                                </span>
                              ))}
                              {post.tags.length > 2 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                  +{post.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          {post.hospital_info && (
                            <div className="relative">
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full cursor-pointer hover:bg-green-200 hospital-tag">
                                @{post.hospital_info.name}
                              </span>
                              <div className="absolute -top-12 right-0 bg-white shadow-lg rounded-lg p-1.5 min-w-[120px] max-w-[160px] z-10 opacity-0 pointer-events-none hospital-tag-tooltip">
                                <div className="text-xs font-medium text-gray-900 truncate">{post.hospital_info.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5 truncate">{post.hospital_info.address}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-gray-500">
                          <span className="text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {post.view_count}
                          </span>
                          {post.comment_count > 0 && (
                            <span className="text-xs flex items-center text-blue-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                              {post.comment_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 전체 게시글 목록 */}
            <div className="mt-8 bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">전체 게시글</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">총 {posts.length}개</span>
                </div>
              </div>
              <div className="space-y-4">
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="border-b pb-4 last:border-b-0 hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2" onClick={() => handlePostClick(post.id)}>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {post.profile_image ? (
                            <img
                              src={getProfileImageUrl(post.profile_image)}
                              alt={post.author_name || '작성자'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getRandomColor(post.author_name)}`}>
                              {getInitials(post.author_name)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900 cursor-pointer">{post.title}</h3>
                          <p className="text-sm text-gray-500">{post.author_name || '익명'}</p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-500 ml-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {post.category_name}
                        </span>
                        {post.tags && post.tags.length > 0 && post.tags[0]?.name && (
                          <div className="flex items-center space-x-1">
                            {post.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                                #{tag.name}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                +{post.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        {post.hospital_info && (
                          <div className="relative">
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full cursor-pointer hover:bg-green-200 hospital-tag">
                              @{post.hospital_info.name}
                            </span>
                            <div className="absolute -top-12 right-0 bg-white shadow-lg rounded-lg p-1.5 min-w-[120px] max-w-[160px] z-10 opacity-0 pointer-events-none hospital-tag-tooltip">
                              <div className="text-xs font-medium text-gray-900 truncate">{post.hospital_info.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">{post.hospital_info.address}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-gray-500">
                        <span className="text-xs flex items-center cursor-pointer" onClick={() => handlePostClick(post.id)}>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.view_count}
                        </span>
                        {post.comment_count > 0 && (
                          <span className="text-xs flex items-center text-blue-600 cursor-pointer" onClick={() => handlePostClick(post.id)}>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            {post.comment_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex flex-wrap justify-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .hospital-tag:hover + .hospital-tag-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default CommunityPage; 