import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon, EyeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { getApiUrl } from '../../utils/api';
import styled from 'styled-components';

const AnnouncementManagementPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    priority: 0,
    is_active: true
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/announcements`, { withCredentials: true });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('공지사항 목록 조회 실패:', error);
      alert('공지사항 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('content', formData.content);
      submitFormData.append('link_url', formData.link_url);
      submitFormData.append('start_date', formData.start_date);
      submitFormData.append('end_date', formData.end_date);
      submitFormData.append('priority', formData.priority);
      submitFormData.append('is_active', formData.is_active);

      if (imageFile) {
        submitFormData.append('image', imageFile);
      }

      if (selectedAnnouncement) {
        await axios.put(
          `${getApiUrl()}/api/announcements/${selectedAnnouncement.id}`, 
          submitFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
          }
        );
      } else {
        await axios.post(
          `${getApiUrl()}/api/announcements`, 
          submitFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
          }
        );
      }
      setIsModalOpen(false);
      setSelectedAnnouncement(null);
      resetForm();
      fetchAnnouncements();
      alert(selectedAnnouncement ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.');
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장에 실패했습니다.');
    }
  };

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content || '',
      image_url: announcement.image_url || '',
      link_url: announcement.link_url || '',
      start_date: format(new Date(announcement.start_date), 'yyyy-MM-dd\'T\'HH:mm'),
      end_date: format(new Date(announcement.end_date), 'yyyy-MM-dd\'T\'HH:mm'),
      priority: announcement.priority || 0,
      is_active: announcement.is_active
    });
    if (announcement.image_url) {
      setPreviewUrl(announcement.image_url);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`${getApiUrl()}/api/announcements/${id}`, { withCredentials: true });
      fetchAnnouncements();
      alert('공지사항이 삭제되었습니다.');
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      image_url: '',
      link_url: '',
      start_date: '',
      end_date: '',
      priority: 0,
      is_active: true
    });
    setImageFile(null);
    setPreviewUrl('');
  };

  const handleAddNew = () => {
    setSelectedAnnouncement(null);
    resetForm();
    setIsModalOpen(true);
  };

  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">공지사항 관리</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          새 공지사항
        </button>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <tr key={announcement.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {announcement.image_url ? (
                    <img
                      src={announcement.image_url}
                      alt={announcement.title}
                      className="h-12 w-20 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-20 bg-gray-100 flex items-center justify-center rounded">
                      <PhotoIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(announcement.start_date), 'yyyy-MM-dd')} ~
                    {format(new Date(announcement.end_date), 'yyyy-MM-dd')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    announcement.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {announcement.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {announcement.priority}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 공지사항 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedAnnouncement ? '공지사항 수정' : '새 공지사항 등록'}
              </h2>
              <button
                onClick={togglePreview}
                className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                <EyeIcon className="w-5 h-5 mr-1" />
                미리보기
              </button>
            </div>

            <div className="flex gap-6">
              {/* 입력 폼 */}
              <div className={`${isPreviewOpen ? 'w-1/2' : 'w-full'}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">제목</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">배너 이미지</label>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="relative">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="배너 미리보기"
                            className="w-64 h-40 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-64 h-40 bg-gray-100 flex items-center justify-center rounded-lg">
                            <PhotoIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <PlusIcon className="h-5 w-5 text-gray-600" />
                        </label>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>권장 크기: 400x500px</p>
                        <p>최대 파일 크기: 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">내용</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">링크 URL</label>
                    <input
                      type="text"
                      value={formData.link_url}
                      onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="/events/spring2024"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">시작일</label>
                      <input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">종료일</label>
                      <input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">우선순위</label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상태</label>
                      <select
                        value={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {selectedAnnouncement ? '수정' : '등록'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 미리보기 */}
              {isPreviewOpen && (
                <div className="w-1/2 border-l pl-6">
                  <h3 className="text-lg font-medium mb-4">미리보기</h3>
                  <PreviewModal>
                    <PreviewContent>
                      <div className="relative">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={formData.title}
                            className="w-full h-[500px] object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-t-lg">
                            <span className="text-gray-400">이미지 없음</span>
                          </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 className="text-white text-lg font-bold">{formData.title}</h3>
                          <p className="text-white/90 text-sm mt-1">{formData.content}</p>
                        </div>
                      </div>
                      <PreviewButtonContainer>
                        <PreviewButton>오늘 하루 닫기</PreviewButton>
                        <PreviewButton>닫기</PreviewButton>
                      </PreviewButtonContainer>
                    </PreviewContent>
                  </PreviewModal>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PreviewModal = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const PreviewContent = styled.div`
  width: 400px;
  margin: 0 auto;
`;

const PreviewButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: #282828;
  padding: 15px;
  border-radius: 0 0 8px 8px;
`;

const PreviewButton = styled.button`
  color: white;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export default AnnouncementManagementPage; 