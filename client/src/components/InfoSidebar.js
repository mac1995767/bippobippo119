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

  // 병원/약국 구분
  const isHospital = !!info.yadmNm;

  // 진료과/운영시간 등 문자열 변환
  const majorStr = info.major && Array.isArray(info.major) ? info.major.join(', ') : '';
  const openHours = info.openHours || info.operatingHours || info.hours || '';

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto md:relative md:inset-auto md:z-auto md:w-80 md:shadow-lg md:h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">상세 정보</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="p-4 space-y-3">
        <InfoRow label="이름" value={info.yadmNm || info.name} icon={isHospital ? '🏥' : '💊'} />
        {isHospital && info.clCdNm && <InfoRow label="분류" value={info.clCdNm} icon="🏷️" />}
        {!isHospital && info.clCdNm && <InfoRow label="분류" value={info.clCdNm} icon="🏷️" />}
        {info.addr && <InfoRow label="주소" value={info.addr} icon="📍" />}
        {info.telno && <InfoRow label="전화번호" value={info.telno} icon="📞" />}
        {isHospital && info.beds && <InfoRow label="병상 수" value={info.beds} icon="🛏️" />}
        {isHospital && info.doctors && <InfoRow label="의사 수" value={info.doctors} icon="👨‍⚕️" />}
        {isHospital && info.nurses && <InfoRow label="간호사 수" value={info.nurses} icon="👩‍⚕️" />}
        {isHospital && info.category && <InfoRow label="카테고리" value={info.category} icon="🏷️" />}
        {isHospital && info.major && info.major.length > 0 && (
          <InfoRow label="진료과" value={majorStr} icon="🩺" />
        )}
        {isHospital && info.hospUrl && (
          <InfoRow label="홈페이지" value={<a href={info.hospUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{info.hospUrl}</a>} icon="🔗" />
        )}
        {isHospital && (
          <>
            {typeof info.nightCare !== 'undefined' && (
              <InfoRow label="야간진료" value={info.nightCare ? '가능' : '불가'} icon="🌙" />
            )}
            {typeof info.weekendCare !== 'undefined' && (
              <InfoRow label="주말진료" value={info.weekendCare ? '가능' : '불가'} icon="📅" />
            )}
          </>
        )}
        {/* 약국 특화 정보 */}
        {!isHospital && openHours && <InfoRow label="운영시간" value={openHours} icon="⏰" />}
        {/* 기타 특이사항 등 필요시 추가 */}
      </div>
    </div>
  );
};

export default InfoSidebar;
