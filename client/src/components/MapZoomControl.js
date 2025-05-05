import React, { useState } from 'react';
import {
  FaSearch,
  FaLocationArrow,
  FaListUl,
  FaLayerGroup,
  FaMap,
  FaThermometerHalf,
  FaRulerCombined,
  FaBookmark,
  FaShareAlt,
  FaUndo,
  FaExpand,
  FaInfoCircle,
  FaRuler,
  FaPlane,
  FaStreetView,
  FaEdit,
  FaStore,
  FaHandshake,
  FaSatellite
} from 'react-icons/fa';
import { BsFillPinAngleFill } from 'react-icons/bs';
import { MdOutlineKeyboardArrowUp } from 'react-icons/md';

const medicalTypes = [
  { key: '의원', count: 36815 },
  { key: '치과의원', count: 19181 },
  { key: '한의원', count: 14773 },
  { key: '보건진료소', count: 1895 },
  { key: '병원', count: 1416 },
  { key: '요양병원', count: 1349 },
  { key: '보건지소', count: 1311 },
  { key: '한방병원', count: 585 },
  { key: '종합병원', count: 330 },
  { key: '정신병원', count: 262 },
  { key: '보건소', count: 246 },
  { key: '치과병원', count: 245 },
  { key: '상급종합', count: 47 },
  { key: '보건의료원', count: 16 },
  { key: '조산원', count: 16 }
];

function MapToolbar({
  onSearch,
  onLocate,
  onListView,
  onToggleLayers,
  onSwitchStyle,
  onToggleHeatmap,
  onMeasure,
  onBookmark,
  onCopyLink,
  onReset,
  onFullscreen,
  onLegend,
  onZoomIn,
  onZoomOut,
  onFilterChange
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(medicalTypes.map(t => t.key));

  const handleTypeToggle = (type) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(next);
    onFilterChange?.(next);
  };

  const buttons = [
    { label: '검색',        icon: <FaSearch size={18} />,       onClick: onSearch },
    { label: '내 위치',     icon: <FaLocationArrow size={18} />, onClick: onLocate },
    { label: '목록',        icon: <FaListUl size={18} />,       onClick: onListView },
    { label: '레이어',      icon: <FaLayerGroup size={18} />,   onClick: onToggleLayers },
    { label: '지도스타일',  icon: <FaMap size={18} />,          onClick: onSwitchStyle },
    { label: '히트맵',      icon: <FaThermometerHalf size={18} />, onClick: onToggleHeatmap },
    { label: '거리측정',    icon: <FaRulerCombined size={18} />, onClick: onMeasure },
    { label: '북마크',      icon: <FaBookmark size={18} />,     onClick: onBookmark },
    { label: '공유',        icon: <FaShareAlt size={18} />,     onClick: onCopyLink },
    { label: '초기화',      icon: <FaUndo size={18} />,         onClick: onReset },
    { label: '풀스크린',    icon: <FaExpand size={18} />,       onClick: onFullscreen },
    { label: '도움말',      icon: <FaInfoCircle size={18} />,   onClick: onLegend },
    { label: '필터',        icon: <FaSatellite size={18} />,    onClick: () => setShowFilter(v => !v) }
  ];

  return (
    <div className="absolute right-2 top-40 z-30 flex flex-col gap-2">
      {/* 툴바 */}
      <div className="bg-white rounded-md shadow-md border border-gray-300 overflow-hidden">
        <div className="bg-purple-500 text-white text-sm font-semibold text-center py-1">
          메뉴
        </div>
        <div className="flex flex-col">
          {buttons.map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              aria-label={btn.label}
              className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
            >
              <div className="flex flex-col items-center text-sm">
                <div className="mb-1">{btn.icon}</div>
                <span className="text-xs">{btn.label}</span>
              </div>
            </button>
          ))}
          <button className="flex items-center justify-center w-14 h-10 hover:bg-gray-100">
            <MdOutlineKeyboardArrowUp size={20} />
          </button>
        </div>
      </div>

      {/* 필터 드롭다운 */}
      {showFilter && (
        <div className="absolute right-16 top-0 bg-white rounded-lg shadow-lg border border-gray-300 p-4 w-64">
          <div className="mb-2 font-bold">의료기관 유형</div>
          <div className="max-h-96 overflow-y-auto">
            {medicalTypes.map(type => (
              <label
                key={type.key}
                className="flex items-center justify-between py-2 cursor-pointer"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedTypes.includes(type.key)}
                    onChange={() => handleTypeToggle(type.key)}
                  />
                  <span>{type.key}</span>
                </div>
                <span className="text-gray-500 text-sm">
                  ({type.count.toLocaleString()})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 확대/축소 */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onZoomIn}
          aria-label="지도 확대"
          className="w-11 h-11 rounded-md bg-white shadow border border-gray-300 flex items-center justify-center text-2xl font-bold active:scale-95 transition"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          aria-label="지도 축소"
          className="w-11 h-11 rounded-md bg-white shadow border border-gray-300 flex items-center justify-center text-2xl font-bold active:scale-95 transition"
        >
          –
        </button>
      </div>
    </div>
  );
}

export default MapToolbar;
