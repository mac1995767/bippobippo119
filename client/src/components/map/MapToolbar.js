import React, { useState, useEffect } from 'react';
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
  FaSatellite
} from 'react-icons/fa';
import { MdOutlineKeyboardArrowUp } from 'react-icons/md';
import { initialMedicalTypes, pharmacyTypes, getMedicalStats } from './constants';
import FilterDropdown from './FilterDropdown';
import ZoomControls from './ZoomControls';
import HelpModal from './HelpModal';

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
  const [showHelp, setShowHelp] = useState(false);
  const [medicalStats, setMedicalStats] = useState({
    hospitals: initialMedicalTypes,
    pharmacies: pharmacyTypes
  });
  const [selectedTypes, setSelectedTypes] = useState(initialMedicalTypes.map(t => t.key));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 통계 데이터 가져오기
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('통계 데이터 로딩 시작');
        const stats = await getMedicalStats();
        console.log('로딩된 통계 데이터:', stats);
        setMedicalStats(stats);
        setSelectedTypes(stats.hospitals.map(t => t.key));
      } catch (err) {
        console.error('통계 데이터 로딩 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

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
    { label: '도움말',      icon: <FaInfoCircle size={18} />,   onClick: () => setShowHelp(true) },
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
        <FilterDropdown
          selectedTypes={selectedTypes}
          onTypeToggle={handleTypeToggle}
          medicalStats={medicalStats}
        />
      )}

      {/* 확대/축소 */}
      <ZoomControls onZoomIn={onZoomIn} onZoomOut={onZoomOut} />

      {/* 도움말 모달 */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default MapToolbar; 