import React from 'react';

const ClusterInfoWindow = ({ cluster, onHospitalClick, onPharmacyClick }) => {
  console.log('ClusterInfoWindow - cluster data:', cluster); // 디버깅용 로그

  const { details: { hospitals = [], pharmacies = [] } = {} } = cluster;
  const totalCount = hospitals.length + pharmacies.length;

  return (
    <div className="p-4 max-h-[300px] overflow-y-auto bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">클러스터 정보</h3>
        <p className="text-sm text-gray-600">
          총 {totalCount}개의 시설이 있습니다.
        </p>
      </div>

      {hospitals.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">병원 ({hospitals.length})</h4>
          <div className="space-y-2">
            {hospitals.map((hospital, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                onClick={() => onHospitalClick(hospital)}
              >
                <div className="font-medium">{hospital.yadmNm || hospital.name}</div>
                <div className="text-sm text-gray-600">{hospital.clCdNm}</div>
                {hospital.addr && (
                  <div className="text-xs text-gray-500">{hospital.addr}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pharmacies.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">약국 ({pharmacies.length})</h4>
          <div className="space-y-2">
            {pharmacies.map((pharmacy, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                onClick={() => onPharmacyClick(pharmacy)}
              >
                <div className="font-medium">{pharmacy.name}</div>
                {pharmacy.addr && (
                  <div className="text-xs text-gray-500">{pharmacy.addr}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterInfoWindow; 