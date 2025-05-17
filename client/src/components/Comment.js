import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Comment = ({ onSubmit, boardId, comment }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [taggedHospitals, setTaggedHospitals] = useState([]);
  const [hospitalDetails, setHospitalDetails] = useState({});
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const textareaRef = useRef(null);

  const isDeleted = comment?.status === 'deleted';

  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      api.get(`/api/autocomplete?query=${encodeURIComponent(searchTerm)}`)
        .then((response) => {
          setSuggestions(response.data.hospital || []);
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchHospitalDetails = async (ykiho) => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/hospitals/${ykiho}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('병원 정보 조회 실패:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      const details = {};
      for (const hospital of taggedHospitals) {
        if (hospital.ykiho) {
          const hospitalData = await fetchHospitalDetails(hospital.ykiho);
          if (hospitalData) {
            details[hospital.ykiho] = hospitalData;
          }
        }
      }
      setHospitalDetails(details);
    };

    if (taggedHospitals.length > 0) {
      fetchDetails();
    }
  }, [taggedHospitals]);

  const handleInput = (e) => {
    const value = e.target.value;
    setContent(value);

    // @ 입력 감지
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const rect = textareaRef.current.getBoundingClientRect();
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtSymbolInText = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbolInText !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtSymbolInText + 1);
        if (!textAfterAt.includes(' ')) {
          // 커서 위치 계산
          const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbolInText);
          const lines = textBeforeAt.split('\n');
          const currentLine = lines[lines.length - 1];
          
          setMentionPosition({
            top: rect.top + (lines.length * 20) + 30,
            left: rect.left + (currentLine.length * 8)
          });
          
          // 검색어 설정
          setSearchTerm(textAfterAt);
          setShowMention(true);
          return;
        }
      }
    }
    setShowMention(false);
  };

  const handleMentionSelect = (hospital) => {
    const lastAtSymbol = content.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const beforeAt = content.substring(0, lastAtSymbol);
      const afterAt = content.substring(lastAtSymbol);
      const afterSpace = afterAt.indexOf(' ');
      const newContent = afterSpace === -1 
        ? `${beforeAt}@${hospital.name} `
        : `${beforeAt}@${hospital.name}${afterAt.substring(afterSpace)}`;
      
      setContent(newContent);
      setShowMention(false);
      
      // 태그된 병원 목록에 추가 (중복 체크)
      if (!taggedHospitals.some(h => h.id === hospital.id)) {
        setTaggedHospitals(prev => [...prev, {
          id: hospital.id,        // id를 ID로 사용
          name: hospital.name,    // 병원 이름
          typeId: 1              // 병원 태그 타입 ID
        }]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 로그인 체크
    if (!user) {
      setShowLoginAlert(true);
      return;
    }
    
    // 댓글 내용이 비어있는지 확인
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const hospitalTags = taggedHospitals.map(hospital => {
        if (!hospital.id) {
          return null;
        }
        return {
          id: hospital.id,
          name: hospital.name
        };
      }).filter(Boolean);
      
      const response = await api.post(`/api/boards/${boardId}/comments`, {
        comment: trimmedContent,
        hospitalTags: hospitalTags
      });

      if (response.data.success) {
        onSubmit(response.data.comment);
        setContent('');
        setTaggedHospitals([]);
      }
    } catch (error) {
      alert('댓글 작성에 실패했습니다.');
    }
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${getApiUrl()}${imagePath}`;
  };
  return (
    <div className="relative">
      {isDeleted ? (
        <div className="text-gray-500 italic text-sm">삭제됨</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {user?.profile_image ? (
                <img
                  src={getProfileImageUrl(user.profile_image)}
                  alt={user.username || '사용자'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.target.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }
                }}
                placeholder="댓글을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
          
          {/* 태그된 병원 미리보기 */}
          {taggedHospitals.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-500 mb-1">태그된 병원:</div>
              <div className="flex flex-wrap gap-2">
                {taggedHospitals.map(hospital => (
                  <span
                    key={hospital.id}
                    className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                  >
                    @{hospital.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              댓글 작성
            </button>
          </div>
        </form>
      )}

      {/* 로그인 알림 모달 */}
      {showLoginAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">로그인이 필요합니다</h3>
            <p className="text-gray-600 mb-6">댓글을 작성하려면 로그인이 필요합니다.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLoginAlert(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowLoginAlert(false);
                  navigate('/login');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                로그인
              </button>
            </div>
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
                    onClick={() => handleMentionSelect(hospital)}
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
  );
};

export default Comment; 