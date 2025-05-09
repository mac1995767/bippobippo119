import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const LiManager = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // 파일 목록 조회
  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/admin/bucket/li/files');
      setFiles(response.data);
    } catch (err) {
      setMessage('❌ 파일 목록 조회 실패: ' + err.message);
    }
  };

  // 파일 업로드
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/admin/bucket/li/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('✅ 업로드 완료');
      fetchFiles();
    } catch (err) {
      setMessage('❌ 업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 파일 삭제
  const handleDelete = async (fileId) => {
    try {
      await api.delete(`/api/admin/bucket/li/files/${fileId}`);
      setMessage('✅ 삭제 완료');
      fetchFiles();
    } catch (err) {
      setMessage('❌ 삭제 실패: ' + err.message);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">리 경계 관리</h2>
        
        {/* 파일 업로드 */}
        <div className="mb-4">
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {uploading && <p className="text-blue-500">업로드 중...</p>}
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`p-4 mb-4 rounded ${
            message.includes('실패') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* 파일 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  한글명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  영문명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file) => (
                <tr key={file._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.properties?.LI_CD || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.properties?.LI_KOR_NM || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.properties?.LI_ENG_NM || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(file._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiManager; 