import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getApiUrl } from '../../utils/api';
import CategoryTree from '../../components/CategoryTree';

const CreateBoardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sidebarSelectedCategory, setSidebarSelectedCategory] = useState('');

  // URL에서 카테고리 ID 추출
  useEffect(() => {
    if (location.pathname.includes('/create/')) {
      const match = location.pathname.match(/\/create\/(\d+)/);
      if (match) {
        setSelectedCategory(match[1]);
        setSidebarSelectedCategory(match[1]);
      }
    }
  }, [location.pathname]);

  // 카테고리 목록 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${getApiUrl()}/api/boards/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('카테고리 로딩 실패:', error);
      }
    };

    fetchCategories();
  }, []);

  // Quill 에디터 설정
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [isLoggedIn, navigate]);

  const handleCategorySelect = (categoryId) => {
    setSidebarSelectedCategory(categoryId);
  };

  const handleFormCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    if (value.endsWith(' ')) {
      if (selectedTags.length >= 5) {
        alert('태그는 최대 5개까지 입력 가능합니다.');
        setTagInput('');
        return;
      }
      const newTag = `#${value.trim()}`;
      if (selectedTags.includes(newTag)) {
        alert('이미 존재하는 태그입니다.');
        setTagInput('');
        return;
      }
      setSelectedTags([...selectedTags, newTag]);
      setTagInput('');
    } else {
      setTagInput(value);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!title.trim() || !content.trim() || !selectedCategory) {
      alert('제목, 내용, 카테고리를 모두 입력해주세요.');
      return;
    }

    try {
      // 1. 먼저 게시글을 생성
      const response = await axios.post(`${getApiUrl()}/api/boards`, {
        title,
        content,
        category_id: selectedCategory,
      }, { withCredentials: true });

      // 2. 태그 처리
      if (selectedTags.length > 0) {
        const tagNames = selectedTags.map(tag => tag.substring(1)); // # 제거
        await axios.post(`${getApiUrl()}/api/boards/${response.data.id}/tags`, {
          tags: tagNames
        }, { withCredentials: true });
      }

      navigate(`/community/boards/${response.data.id}`);
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else {
        alert('게시글 작성에 실패했습니다.');
      }
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* 왼쪽 사이드바 - 카테고리 트리 */}
        <div className="w-full lg:w-1/4">
          <CategoryTree
            onSelectCategory={handleCategorySelect}
            selectedCategoryId={sidebarSelectedCategory}
          />
        </div>

        {/* 오른쪽 메인 컨텐츠 */}
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">게시글 작성</h1>

          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
            {/* 카테고리 선택 */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={selectedCategory}
                onChange={handleFormCategoryChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <ReactQuill
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                className="h-64 lg:h-96 mb-8 lg:mb-12"
              />
            </div>

            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder={`태그 입력 후 스페이스바 (최대 5개) - ${selectedTags.length}/5`}
                disabled={selectedTags.length >= 5}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                작성하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBoardPage; 