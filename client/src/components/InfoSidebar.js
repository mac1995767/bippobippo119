import React from 'react';

const InfoRow = ({ label, value, icon }) => (
  <div className="bg-gray-50 p-3 rounded-lg shadow-sm border flex items-start gap-2">
    <span className="text-blue-500 text-lg">{icon}</span>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-800 break-all">{value}</div>
    </div>
  </div>
);

const InfoSidebar = ({ info, onClose }) => {
  if (!info) return null;

  const renderGroupInfo = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">같은 위치의 시설 ({info.markers.length}개)</h2>
        <div className="space-y-4">
          {info.markers.map((marker, index) => (
            <div key={index} className="border-b pb-4">
              <h3 className="font-semibold">{marker.yadmNm || marker.name}</h3>
              <p className="text-sm text-gray-600">
                {marker.clCdNm || '약국'}
              </p>
              {marker.addr && (
                <p className="text-sm text-gray-500 mt-1">{marker.addr}</p>
              )}
              {marker.telno && (
                <p className="text-sm text-gray-500">{marker.telno}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSingleInfo = () => {
    const isHospital = 'yadmNm' in info;
    
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">{info.yadmNm || info.name}</h2>
        <div className="space-y-2">
          {isHospital && info.clCdNm && (
            <p className="text-gray-600">{info.clCdNm}</p>
          )}
          {info.addr && (
            <p className="text-gray-500">{info.addr}</p>
          )}
          {info.telno && (
            <p className="text-gray-500">{info.telno}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-white shadow-lg h-full overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">상세 정보</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      {info.type === 'group' ? renderGroupInfo() : renderSingleInfo()}
    </div>
  );
};

export default InfoSidebar;
