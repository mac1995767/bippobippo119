import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BoardList from './BoardList';
import { getApiUrl } from '../../utils/api';
import CategoryTree from '../../components/CategoryTree';
import Comment from '../../components/Comment';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userId, userRole } = useAuth();
  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedBoards, setRelatedBoards] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [taggedHospitals, setTaggedHospitals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryBoards, setCategoryBoards] = useState([]);
  const [replyTaggedHospitals, setReplyTaggedHospitals] = useState([]);
  const [replyShowMention, setReplyShowMention] = useState(false);
  const [replyMentionPosition, setReplyMentionPosition] = useState({ top: 0, left: 0 });
  const [replySuggestions, setReplySuggestions] = useState([]);
  const [replySearchTerm, setReplySearchTerm] = useState('');
  const replyTextareaRef = useRef(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [viewIncremented, setViewIncremented] = useState(false);

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      axios.get(`${getApiUrl()}/api/autocomplete?query=${encodeURIComponent(searchTerm)}`)
        .then((response) => {
          setSuggestions(response.data.hospital || []);
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 카테고리별 게시글 조회
  const fetchCategoryBoards = async (categoryId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api/boards/category/${categoryId}`, { withCredentials: true });
      setCategoryBoards(response.data.boards);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error('카테고리별 게시글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchCategoryBoards(categoryId);
  };

  // 댓글 목록 조회 시 병원 정보도 함께 가져오기
  const fetchComments = React.useCallback(async () => {
    try {
      const commentsResponse = await axios.get(`${getApiUrl()}/api/boards/${id}/comments`, { withCredentials: true });

      // 댓글 데이터가 배열인지 확인
      const commentsData = Array.isArray(commentsResponse.data) ? commentsResponse.data : commentsResponse.data.comments || [];

      // 각 댓글의 @ 태그된 병원 정보 가져오기
      const commentsWithHospitals = await Promise.all(
        commentsData.map(async (comment) => {
          // @ 뒤에 한글, 영문, 숫자, (), [], ·, -, _ 등 병원 이름에 자주 쓰이는 문자만 매칭, 공백/구두점/줄끝에서 끊음
          const matches = comment.comment.match(/@([가-힣a-zA-Z0-9()[\]·_-]+)/g);
          let hospitalNames = [];
          if (matches) {
            hospitalNames = matches.map(m => m.substring(1));
          }
          let hospitals = [];
          if (hospitalNames.length > 0) {
            hospitals = await Promise.all(
              hospitalNames.map(async (hospitalName) => {
                try {
                  const response = await axios.get(`${getApiUrl()}/api/hospitals/autocomplete?query=${encodeURIComponent(hospitalName)}`, { withCredentials: true });
                  return response.data.hospital[0]; // 첫 번째 검색 결과 사용
                } catch (error) {
                  console.error('병원 정보 조회 실패:', error);
                  return null;
                }
              })
            );
            hospitals = hospitals.filter(Boolean); // null 제거
          }
          return { ...comment, hospitals };
        })
      );

      setComments(commentsWithHospitals);
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      setComments([]); // 오류 발생 시 빈 배열로 설정
    }
  }, [id]);

  // 초기 데이터 로딩
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        // 게시글, 댓글, 관련 게시글 데이터 가져오기
        const [boardResponse, relatedBoardsResponse] = await Promise.all([
          axios.get(`${getApiUrl()}/api/boards/${id}`, { withCredentials: true }),
          axios.get(`${getApiUrl()}/api/boards/related/${id}?page=${currentPage}`, { withCredentials: true })
        ]);
        if (isMounted) {
          setBoard(boardResponse.data);
          setRelatedBoards(relatedBoardsResponse.data.boards);
          setTotalPages(relatedBoardsResponse.data.totalPages);
          setCurrentPage(relatedBoardsResponse.data.currentPage);
          if (!viewIncremented) {
            try {
              await axios.post(`${getApiUrl()}/api/boards/${id}/increment-view`, {}, { withCredentials: true });
              setViewIncremented(true);
            } catch (error) {
              console.error('조회수 증가 실패:', error);
            }
          }
          await fetchComments();
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id, navigate, currentPage, viewIncremented, fetchComments]);

  const handleEditBoard = () => {
    navigate(`/community/boards/edit/${id}`);
  };

  const handleDeleteBoard = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!board || board.user_id !== userId) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`${getApiUrl()}/api/boards/${id}`, { withCredentials: true });
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    }
  };

  const handleEditClick = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.comment);
    setTaggedHospitals([]);
    setShowMention(false);
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleEditSubmit = async (commentId) => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      // 병원 멘션 태그 처리
      const taggedHospitals = [];
      const content = editContent.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, (match, name, id) => {
        taggedHospitals.push({ name, id });
        return name;
      });

      // 상태 초기화를 response 확인 전에 먼저 수행
      setEditingComment(null);
      setEditContent('');
      setTaggedHospitals([]);
      setShowMention(false);
      setSearchTerm('');
      setSuggestions([]);

      const response = await axios.put(
        `${getApiUrl()}/api/boards/${id}/comments/${commentId}`,
        {
          comment: content,
          taggedHospitals: taggedHospitals.length > 0 ? taggedHospitals : null
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // 댓글 목록 새로고침
        await fetchComments();
      }
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else {
        alert('댓글 수정에 실패했습니다.');
        // 에러 발생 시 수정 모드 유지
        setEditingComment(commentId);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
    setTaggedHospitals([]);
    setShowMention(false);
    setSearchTerm('');
    setSuggestions([]);
  };

  // 댓글 내용에서 @ 태그를 파싱하는 함수
  const renderCommentContent = (comment) => {
    if (!comment.comment) return '';

    // hospitals 배열에서 병원 이름만 추출
    const hospitalNames = (comment.hospitals || []).map(h => h.name);
    if (hospitalNames.length === 0) return comment.comment;

    // 병원 이름 escape
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = `@(${hospitalNames.map(escapeRegExp).join('|')})`;
    const regex = new RegExp(pattern, 'g');

    let lastIndex = 0;
    let match;
    const resultParts = [];
    while ((match = regex.exec(comment.comment)) !== null) {
      if (match.index > lastIndex) {
        resultParts.push(<span key={lastIndex}>{comment.comment.slice(lastIndex, match.index)}</span>);
      }
      // 병원 정보 찾기
      const matchedName = match[1];
      const matchedIndex = match.index;
      const hospital = (comment.hospitals || []).find(h => h.name === matchedName);
      resultParts.push(
        <span
          key={matchedIndex}
          className="text-blue-600 font-medium cursor-pointer relative group"
          onClick={() => navigate(`/hospitals?query=${encodeURIComponent(matchedName)}`)}
        >
          @{matchedName}
          {/* 툴크 */}
          {hospital && (
            <span className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              <span className="font-bold text-sm mb-1 block">{hospital.name}</span>
              <span className="text-xs text-gray-600 mb-1 block">{hospital.address}</span>
              <span className="text-xs text-gray-600 block">{hospital.phone}</span>
            </span>
          )}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < comment.comment.length) {
      resultParts.push(<span key={lastIndex}>{comment.comment.slice(lastIndex)}</span>);
    }
    return resultParts;
  };

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    if (!replySearchTerm) {
      setReplySuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      axios.get(`${getApiUrl()}/api/autocomplete?query=${encodeURIComponent(replySearchTerm)}`)
        .then((response) => {
          setReplySuggestions(response.data.hospital || []);
        })
        .catch(() => {
          setReplySuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [replySearchTerm]);

  const handleReplyInput = (e) => {
    const value = e.target.value;
    setReplyContent(value);

    // @ 입력 감지
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const rect = replyTextareaRef.current.getBoundingClientRect();
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtSymbolInText = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbolInText !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtSymbolInText + 1);
        if (!textAfterAt.includes(' ')) {
          const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbolInText);
          const lines = textBeforeAt.split('\n');
          const currentLine = lines[lines.length - 1];
          
          setReplyMentionPosition({
            top: rect.top + (lines.length * 20) + 30,
            left: rect.left + (currentLine.length * 8)
          });
          
          setReplySearchTerm(textAfterAt);
          setReplyShowMention(true);
          return;
        }
      }
    }
    setReplyShowMention(false);
  };

  const handleReplyMentionSelect = (hospital) => {
    const lastAtSymbol = replyContent.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const beforeAt = replyContent.substring(0, lastAtSymbol);
      const afterAt = replyContent.substring(lastAtSymbol);
      const afterSpace = afterAt.indexOf(' ');
      const newContent = afterSpace === -1 
        ? `${beforeAt}@${hospital.name} `
        : `${beforeAt}@${hospital.name}${afterAt.substring(afterSpace)}`;
      
      setReplyContent(newContent);
      setReplyShowMention(false);
      
      if (!replyTaggedHospitals.some(h => h.id === hospital.dbId)) {
        setReplyTaggedHospitals(prev => [...prev, {
          id: hospital.dbId,
          name: hospital.name,
          typeId: 1
        }]);
      }
    }
  };

  // 대댓글 작성 함수 수정
  const handleReplySubmit = async (parentId) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${getApiUrl()}/api/boards/${id}/comments`, {
        comment: replyContent,
        parent_id: parentId,
        entityTags: replyTaggedHospitals.map(hospital => ({
          typeId: hospital.typeId,
          entityId: hospital.id,
          entityName: hospital.name
        }))
      }, { withCredentials: true });

      // 댓글 작성 성공 후 댓글 목록 새로고침
      await fetchComments();
      
      // 입력 폼 초기화
      setReplyContent('');
      setReplyingTo(null);
      setReplyTaggedHospitals([]);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    }
  };

  // 대댓글 입력 폼 수정
  const renderReplyForm = (comment) => {
    return (
      <div className="mt-3 ml-4">
        <div className="relative">
          <textarea
            ref={replyTextareaRef}
            value={replyContent}
            onChange={handleReplyInput}
            className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            rows="2"
            placeholder="답글을 입력하세요..."
          />
          
          {/* 태그된 병원 미리보기 */}
          {replyTaggedHospitals.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">태그된 병원:</div>
              <div className="flex flex-wrap gap-2">
                {replyTaggedHospitals.map(hospital => (
                  <span
                    key={hospital.id}
                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                  >
                    @{hospital.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 멘션 제안 */}
          {replyShowMention && (
            <div
              style={{
                position: 'fixed',
                top: replyMentionPosition.top,
                left: replyMentionPosition.left
              }}
              className="z-50"
            >
              <div className="w-64 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={replySearchTerm}
                    onChange={(e) => setReplySearchTerm(e.target.value)}
                    placeholder="병원 검색..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {replySuggestions.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
                  ) : (
                    replySuggestions.map((hospital) => (
                      <div
                        key={hospital.id}
                        onClick={() => handleReplyMentionSelect(hospital)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                        <div className="text-xs text-gray-500">{hospital.address}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-2">
          <button
            onClick={() => setReplyingTo(null)}
            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => handleReplySubmit(comment.id)}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            답글 작성
          </button>
        </div>
      </div>
    );
  };

  // 댓글 렌더링 부분 수정
  const renderComment = (comment) => {
    const isAuthor = isLoggedIn && (comment.user_id === userId || userRole === 'admin');
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    const isDeleted = comment.status === 'deleted';
    const hasReplies = comments.some(c => c.parent_id === comment.id);

    return (
      <div key={comment.id} className={`mb-4 ${isDeleted ? 'opacity-50' : ''}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {isDeleted ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-600 font-semibold text-sm">X</span>
              </div>
            ) : comment.author_profile_image ? (
              <img
                src={getProfileImageUrl(comment.author_profile_image)}
                alt={comment.username || '사용자'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {comment.username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-800 text-sm">
                    {isDeleted ? '삭제됨' : comment.username}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                {!isDeleted && isAuthor && !isEditing && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEditClick(comment)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="mt-3">
                  <div className="relative">
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        setEditContent(e.target.value);
                        // @ 입력 감지
                        const lastAtSymbol = e.target.value.lastIndexOf('@');
                        if (lastAtSymbol !== -1) {
                          const rect = e.target.getBoundingClientRect();
                          const cursorPosition = e.target.selectionStart;
                          const textBeforeCursor = e.target.value.substring(0, cursorPosition);
                          const lastAtSymbolInText = textBeforeCursor.lastIndexOf('@');
                          
                          if (lastAtSymbolInText !== -1) {
                            const textAfterAt = textBeforeCursor.substring(lastAtSymbolInText + 1);
                            if (!textAfterAt.includes(' ')) {
                              const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbolInText);
                              const lines = textBeforeAt.split('\n');
                              const currentLine = lines[lines.length - 1];
                              
                              setMentionPosition({
                                top: rect.top + (lines.length * 20) + 30,
                                left: rect.left + (currentLine.length * 8)
                              });
                              
                              setSearchTerm(textAfterAt);
                              setShowMention(true);
                              return;
                            }
                          }
                        }
                        setShowMention(false);
                      }}
                      className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      rows="2"
                    />
                    
                    {/* 태그된 병원 미리보기 */}
                    {taggedHospitals.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">태그된 병원:</div>
                        <div className="flex flex-wrap gap-2">
                          {taggedHospitals.map(hospital => (
                            <span
                              key={hospital.id}
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                            >
                              @{hospital.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 멘션 제안 */}
                    {showMention && (
                      <div
                        style={{
                          position: 'fixed',
                          top: mentionPosition.top,
                          left: mentionPosition.left
                        }}
                        className="z-50"
                      >
                        <div className="w-64 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="병원 검색..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                          
                          <div className="max-h-60 overflow-y-auto">
                            {suggestions.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
                            ) : (
                              suggestions.map((hospital) => (
                                <div
                                  key={hospital.id}
                                  onClick={() => {
                                    const lastAtSymbol = editContent.lastIndexOf('@');
                                    if (lastAtSymbol !== -1) {
                                      const beforeAt = editContent.substring(0, lastAtSymbol);
                                      const afterAt = editContent.substring(lastAtSymbol);
                                      const afterSpace = afterAt.indexOf(' ');
                                      const newContent = afterSpace === -1 
                                        ? `${beforeAt}@${hospital.name} `
                                        : `${beforeAt}@${hospital.name}${afterAt.substring(afterSpace)}`;
                                      
                                      setEditContent(newContent);
                                      setShowMention(false);
                                      
                                      if (!taggedHospitals.some(h => h.id === hospital.dbId)) {
                                        setTaggedHospitals(prev => [...prev, {
                                          id: hospital.dbId,
                                          name: hospital.name,
                                          typeId: 1
                                        }]);
                                      }
                                    }
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                                  <div className="text-xs text-gray-500">{hospital.address}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 mt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleEditSubmit(comment.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {isDeleted ? '삭제된 댓글입니다.' : renderCommentContent(comment)}
                </p>
              )}
              {!isDeleted && !isReplying && !isEditing && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  답글 달기
                </button>
              )}
            </div>
            {isReplying && renderReplyForm(comment)}
          </div>
        </div>
        {/* 대댓글 표시 */}
        {hasReplies && (
          <div className="ml-8 mt-2 space-y-4">
            {comments
              .filter(reply => reply.parent_id === comment.id)
              .map(reply => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.delete(`${getApiUrl()}/api/boards/${id}/comments/${commentId}`, { withCredentials: true });

      // 댓글이 삭제되었을 때 화면 업데이트
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, status: 'deleted' };
          }
          return comment;
        });
      });
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    }
  };

  // 댓글 작성 후 목록 새로고침
  const handleNewCommentSubmit = async (comment, entityTags = []) => {
    if (!isLoggedIn) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      // 댓글 목록 새로고침만 수행
      await fetchComments();
    } catch (error) {
      console.error('댓글 목록 새로고침 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else {
        alert('댓글 목록 새로고침에 실패했습니다.');
      }
    } finally {
    }
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${getApiUrl()}${imagePath}`;
    return `${getApiUrl()}/uploads/${imagePath}`;
  };

  const getRandomColor = (username) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 
      'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-green-500',
      'bg-yellow-500', 'bg-orange-500'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (!board) {
    return <div className="text-center p-4">게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 왼쪽 사이드바 - 카테고리 트리 */}
        <div className="w-full lg:w-1/4">
          <CategoryTree onSelectCategory={handleCategorySelect} selectedCategoryId={selectedCategory} />
        </div>

        {/* 메인 컨텐츠 */}
        <div className="w-full lg:w-3/4">
          {selectedCategory ? (
            <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6">카테고리 게시글</h2>
              {loading ? (
                <div className="text-center p-4">로딩 중...</div>
              ) : (
                <BoardList boards={categoryBoards} />
              )}
            </div>
          ) : (
            board && (
              <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
                {/* 상단 헤더 영역 */}
                <div className="border-b border-gray-100 pb-4 mb-4 lg:mb-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
                    <div className="w-full">
                      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 font-['Pretendard'] mb-2">{board.title}</h1>
                      <div className="flex flex-wrap items-center text-gray-600 text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0">
                            {board.profile_image ? (
                              <img
                                src={getProfileImageUrl(board.profile_image)}
                                alt={board.author_name || '작성자'}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getRandomColor(board.author_name)}`}>
                                {getInitials(board.author_name)}
                              </div>
                            )}
                          </div>
                          <span>작성자: {board.author_name}</span>
                        </div>
                        <span>작성일: {new Date(board.created_at).toLocaleString()}</span>
                        <span>조회: {board.view_count}</span>
                      </div>
                    </div>
                    {isLoggedIn && (board.user_id === userId || userRole === 'admin') && (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleEditBoard}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={handleDeleteBoard}
                          className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 본문 내용 */}
                <div className="mt-4">
                  <p className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: board.content }}></p>
                </div>

                {/* 태그된 병원 표시 */}
                {taggedHospitals.length > 0 && (
                  <div className="mt-4 lg:mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">태그된 병원</h3>
                    <div className="flex flex-wrap gap-2">
                      {taggedHospitals.map(hospital => (
                        <span
                          key={hospital.id}
                          className="px-2 lg:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs lg:text-sm"
                        >
                          {hospital.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 댓글 섹션 */}
                <div className="mt-4 mb-8">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 font-['Pretendard']">
                    댓글 ({comments.filter(c => !c.is_deleted).length})
                  </h3>
                  
                  {/* 새 댓글 작성 폼 */}
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <Comment 
                      onSubmit={handleNewCommentSubmit} 
                      boardId={id} 
                    />
                  </div>

                  {/* 댓글 목록 */}
                  <div className="space-y-4">
                    {comments
                      .filter(comment => !comment.parent_id)
                      .map(comment => renderComment(comment))}
                  </div>
                </div>

                {/* 관련 게시글 목록 */}
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-800 font-['Pretendard']">
                      카테고리 리스트
                    </h3>
                    {totalPages > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else {
                            if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 lg:px-3 py-1 text-xs lg:text-sm font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <BoardList boards={relatedBoards} />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardDetail; 