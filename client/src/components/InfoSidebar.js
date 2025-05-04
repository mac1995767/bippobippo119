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

  // 아이콘 매핑
  const iconMap = {
    이름: '🏥',
    주소: '📍',
    전화번호: '☎️',
    분류: '🏷️',
    개설일: '📆',
    시도: '📌',
    시군구: '📍',
    읍면동: '🗺️',
    우편번호: '🏣',
    기관코드: '🔢',
    홈페이지: '🌐',
    X좌표: '❌',
    Y좌표: '🔺',
    의사수: '🧑‍⚕️',
    전문의수: '👨‍⚕️',
    인턴수: '🧑‍🎓',
    레지던트수: '👨‍🎓',
    전공의수: '📚',
    진료과목: '🩺',
    간호사수: '👩‍⚕️',
    업데이트: '⏱️',
  };

  const fields = [
    { label: '이름', value: info.yadmNm || info.name },
    { label: '주소', value: info.addr || info.address },
    { label: '전화번호', value: info.telno },
    { label: '홈페이지', value: info.hospUrl },
    { label: '분류', value: info.clCdNm },
    { label: '개설일', value: info.estbDd },
    { label: '시도', value: info.sidoCdNm },
    { label: '시군구', value: info.sgguCdNm },
    { label: '읍면동', value: info.emdongNm },
    { label: '우편번호', value: info.postNo },
    { label: '기관코드', value: info.ykiho },
    { label: 'X좌표', value: info.Xpos || info.XPos },
    { label: 'Y좌표', value: info.Ypos || info.YPos },
    { label: '의사수', value: info.drTotCnt },
    { label: '전문의수', value: info.cmdcGdrCnt },
    { label: '인턴수', value: info.cmdcIntnCnt },
    { label: '레지던트수', value: info.cmdcResdntCnt },
    { label: '전공의수', value: info.cmdcSdrCnt },
    { label: '진료과목', value: info.mdeptGdrCnt },
    { label: '간호사수', value: info.pnursCnt },
    { label: '업데이트', value: info.updatedAt },
  ];

  // 중요 정보 우선 필터링
  const importantKeys = ['이름', '주소', '전화번호', '홈페이지'];
  const important = fields.filter(f => importantKeys.includes(f.label) && f.value);
  const others = fields.filter(f => !importantKeys.includes(f.label) && f.value);

  return (
    <div className="h-full w-80 bg-white shadow-lg z-40 p-6 flex flex-col border-r min-w-[320px] max-w-[400px] overflow-y-auto">
      <button className="self-end mb-4 text-xl" onClick={onClose}>✕</button>

      {/* 상단 병원 이름 및 분류 뱃지 */}
      <div className="mb-4">
        {info.clCdNm && (
          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold mb-2">
            {info.clCdNm}
          </span>
        )}
        <h2 className="text-2xl font-bold text-blue-900">{info.yadmNm || info.name}</h2>
      </div>

      {/* 중요 정보 카드 */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {important.map((f, i) => (
          <InfoRow key={i} label={f.label} value={f.value} icon={iconMap[f.label] || 'ℹ️'} />
        ))}
      </div>

      <hr className="my-2 border-gray-300" />

      {/* 일반 정보 카드 */}
      <div className="grid grid-cols-1 gap-4">
        {others.map((f, i) => (
          <InfoRow key={i} label={f.label} value={f.value} icon={iconMap[f.label] || '📄'} />
        ))}
      </div>
    </div>
  );
};

export default InfoSidebar;
