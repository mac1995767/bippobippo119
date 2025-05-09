import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import proj4 from 'proj4';

// proj4 로그 비활성화
proj4.defs("EPSG:5179","+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no-defs");
proj4.defs("EPSG:4326", proj4.WGS84);

// 좌표 변환 함수
function transformCoordinates(coords, type) {
  const transformPoint = ([x, y]) => {
    try {
      // EPSG:5179 -> EPSG:4326
      const [lon, lat] = proj4('EPSG:5179', 'EPSG:4326', [x, y]);
      return [lon, lat];
    } catch (error) {
      console.warn('좌표 변환 실패:', error);
      return null;
    }
  };

  try {
    if (type === 'Polygon') {
      return coords.map(ring => {
        const transformedRing = ring.map(transformPoint).filter(coord => coord !== null);
        return transformedRing.length > 0 ? transformedRing : null;
      }).filter(ring => ring !== null);
    }

    if (type === 'MultiPolygon') {
      return coords.map(polygon => {
        const transformedPolygon = polygon.map(ring => {
          const transformedRing = ring.map(transformPoint).filter(coord => coord !== null);
          return transformedRing.length > 0 ? transformedRing : null;
        }).filter(ring => ring !== null);
        return transformedPolygon.length > 0 ? transformedPolygon : null;
      }).filter(polygon => polygon !== null);
    }

    return coords;
  } catch (error) {
    console.warn('좌표 변환 실패:', error);
    return null;
  }
}

const EmdManager = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('EMD_KOR_NM'); // 기본 검색 필드
  const itemsPerPage = 10;

  // 파일 목록 조회
  const fetchFiles = async () => {
    try {
      const response = await api.get('/api/admin/bucket/emd/files', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          field: searchField
        }
      });
      setFiles(response.data.files);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));
    } catch (err) {
      setMessage('❌ 파일 목록 조회 실패: ' + err.message);
    }
  };

  // 검색 처리
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    fetchFiles();
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 페이지네이션 번호 생성
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // 한 번에 보여줄 최대 페이지 수
    
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지 수가 maxVisiblePages보다 작으면 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 현재 페이지 주변의 페이지 번호만 표시
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  // 파일 업로드
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    
    // GeoJSON 파일 읽기 및 좌표 변환
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const geoJson = JSON.parse(e.target.result);
        if (geoJson.features) {
          geoJson.features = geoJson.features.map(feature => ({
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: transformCoordinates(feature.geometry.coordinates, feature.geometry.type)
            }
          }));
        }
        const transformedBlob = new Blob([JSON.stringify(geoJson)], { type: 'application/json' });
        formData.append('file', transformedBlob, file.name);
        
        await api.post('/api/admin/bucket/emd/upload', formData, {
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
    reader.readAsText(file);
  };

  // 파일 삭제
  const handleDelete = async (fileId) => {
    try {
      await api.delete(`/api/admin/bucket/emd/files/${fileId}`);
      setMessage('✅ 삭제 완료');
      fetchFiles();
    } catch (err) {
      setMessage('❌ 삭제 실패: ' + err.message);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPage]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">읍면동 경계 관리</h2>
        
        {/* 검색 폼 */}
        <div className="mb-4 flex gap-4">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="EMD_KOR_NM">한글명</option>
            <option value="EMD_ENG_NM">영문명</option>
            <option value="EMD_CD">코드</option>
          </select>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              검색
            </button>
          </form>
        </div>

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
                    {file.properties?.EMD_CD || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.properties?.EMD_KOR_NM || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {file.properties?.EMD_ENG_NM || 'N/A'}
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

        {/* 페이지네이션 */}
        <div className="mt-4 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
            {getPageNumbers().map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === pageNumber
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              다음
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default EmdManager; 