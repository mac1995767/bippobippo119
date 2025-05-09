import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const GeoIndexManager = () => {
  const [indexStatus, setIndexStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const collections = [
    { name: 'sggu_boundaries_ctprvn', label: '시도 경계' },
    { name: 'sggu_boundaries_sig', label: '시군구 경계' },
    { name: 'sggu_boundaries_emd', label: '읍면동 경계' },
    { name: 'sggu_boundaries_li', label: '리 경계' }
  ];

  const fetchIndexStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/geo/index-status');
      setIndexStatus(response.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: '인덱스 상태를 불러오는데 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAllIndexes = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/geo/create-indexes');
      setMessage({
        type: response.data.success ? 'success' : 'error',
        text: response.data.message
      });
      await fetchIndexStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: '인덱스 생성에 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  const createSingleIndex = async (collectionName) => {
    try {
      setLoading(true);
      const response = await api.post(`/api/geo/create-index/${collectionName}`);
      setMessage({
        type: response.data.success ? 'success' : 'error',
        text: response.data.message
      });
      await fetchIndexStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: '인덱스 생성에 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexStatus();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">지리공간 인덱스 관리</h2>
        <button
          onClick={createAllIndexes}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '처리 중...' : '모든 인덱스 생성'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((collection) => {
          const status = indexStatus.find(s => s.collection === collection.name);
          return (
            <div key={collection.name} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{collection.label}</h3>
                <button
                  onClick={() => createSingleIndex(collection.name)}
                  disabled={loading || (status?.hasGeoIndex)}
                  className={`px-3 py-1 rounded text-sm ${
                    status?.hasGeoIndex
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {status?.hasGeoIndex ? '인덱스 있음' : '인덱스 생성'}
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p>컬렉션: {collection.name}</p>
                <p>인덱스 수: {status?.totalIndexes || 0}</p>
                <p>상태: {status?.hasGeoIndex ? '✅ 정상' : '❌ 없음'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GeoIndexManager; 