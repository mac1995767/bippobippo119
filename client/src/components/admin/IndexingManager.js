import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const IndexingManager = () => {
  const [status, setStatus] = useState(null);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIndices();
    if (status?.isRunning) {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [status?.isRunning]);

  const fetchIndices = async () => {
    try {
      const response = await api.get('/api/admin/indices');
      setIndices(response.data);
    } catch (error) {
      setError('인덱스 목록 조회 실패');
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await api.get('/api/admin/indexing-status');
      setStatus(response.data);
    } catch (error) {
      setError('상태 조회 실패');
    }
  };

  const startIndexing = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/api/admin/reindex');
      await fetchStatus();
    } catch (error) {
      setError('색인 시작 실패');
    } finally {
      setLoading(false);
    }
  };

  const rollbackIndexing = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/api/admin/rollback');
      await fetchStatus();
      await fetchIndices();
    } catch (error) {
      setError('롤백 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">색인 관리</h2>
          <p className="text-gray-600 mt-1">Elasticsearch 색인을 관리하고 모니터링합니다.</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={startIndexing}
            disabled={loading || status?.isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '처리 중...' : '색인 시작'}
          </button>
          <button
            onClick={rollbackIndexing}
            disabled={loading || status?.isRunning || !status?.backupIndex}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            롤백
          </button>
        </div>
      </div>

      {/* 인덱스 목록 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">인덱스 목록</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인덱스명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문서 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">크기</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {indices.map((index) => (
                  <tr key={index.index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index.index}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index['docs.count']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        index.health === 'green' ? 'bg-green-100 text-green-800' :
                        index.health === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {index.health}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index['store.size']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 색인 상태 */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">색인 상태</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">상태</p>
                <p className="text-sm font-medium">{status.isRunning ? '진행 중' : '대기 중'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">진행률</p>
                <p className="text-sm font-medium">{status.progress}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">현재 인덱스</p>
                <p className="text-sm font-medium">{status.currentIndex || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">백업 인덱스</p>
                <p className="text-sm font-medium">{status.backupIndex || '-'}</p>
              </div>
            </div>
            
            {status.isRunning && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {status.error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {status.error}
              </div>
            )}

            <div className="text-sm text-gray-500">
              마지막 업데이트: {new Date(status.lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default IndexingManager; 