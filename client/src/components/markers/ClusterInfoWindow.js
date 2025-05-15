import React from 'react';

const ClusterInfoWindow = ({ cluster, onHospitalClick, onPharmacyClick, onClose }) => {
  if (!cluster) return null;

  const { hospitals = [], pharmacies = [] } = cluster.details || {};

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto md:relative md:inset-auto md:z-auto md:w-80 md:shadow-lg md:h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">병원 정보</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4">
        {hospitals.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">병원 ({hospitals.length}개)</h3>
            <div className="space-y-2">
              {hospitals.map((hospital, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => onHospitalClick(hospital)}
                >
                  <div className="font-medium">{hospital.yadmNm}</div>
                  <div className="text-sm text-gray-600">{hospital.clCdNm}</div>
                  {hospital.addr && (
                    <div className="text-sm text-gray-500 mt-1">{hospital.addr}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pharmacies.length > 0 && (
          <div>
            <h3 className="text-md font-semibold mb-2">약국 ({pharmacies.length}개)</h3>
            <div className="space-y-2">
              {pharmacies.map((pharmacy, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => onPharmacyClick(pharmacy)}
                >
                  <div className="font-medium">{pharmacy.yadmNm}</div>
                  {pharmacy.addr && (
                    <div className="text-sm text-gray-500 mt-1">{pharmacy.addr}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterInfoWindow; 