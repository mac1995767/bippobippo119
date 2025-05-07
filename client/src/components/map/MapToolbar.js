import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch,
  FaLocationArrow,
  FaListUl,
  FaLayerGroup,
  FaMap,
  FaThermometerHalf,
  FaBus,
  FaBookmark,
  FaShareAlt,
  FaInfoCircle,
  FaSatellite,
  FaExpand,
  FaCompress,
  FaUndo
} from 'react-icons/fa';
import { MdOutlineKeyboardArrowUp } from 'react-icons/md';
import { initialMedicalTypes, pharmacyTypes, getMedicalStats } from './constants';
import FilterDropdown from './FilterDropdown';
import ZoomControls from './ZoomControls';
import HelpModal from './HelpModal';
import FullscreenControl from './FullscreenControl';
import LocationControl from './LocationControl';
import ResetControl from './ResetControl';
import ListViewControl from './ListViewControl';
import LayerControl from './LayerControl';
import MapStyleControl from './MapStyleControl';

function MapToolbar({
  onSearch,
  onListView,
  onToggleLayers,
  onSwitchStyle,
  onToggleHeatmap,
  onPublicTransport,
  onBookmark,
  onCopyLink,
  onReset,
  onLegend,
  onZoomIn,
  onZoomOut,
  onFilterChange,
  map,
  hospitals,
  pharmacies,
  onItemClick
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const handleReset = () => {
    console.log('초기화 실행');
    if (onReset) {
      onReset();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`전체화면 오류: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleLocationClick = useCallback(() => {
    console.log('내 위치 버튼 클릭됨');
    console.log('map 객체:', map);
    
    if (!map) {
      console.log('map 객체가 없습니다');
      return;
    }
    
    if (!navigator.geolocation) {
      console.log('geolocation을 지원하지 않습니다');
      alert('이 브라우저에서는 위치 정보를 사용할 수 없습니다.');
      return;
    }

    if (!window.naver || !window.naver.maps) {
      console.log('네이버 지도 API가 로드되지 않았습니다');
      alert('네이버 지도 API가 로드되지 않았습니다.');
      return;
    }

    console.log('위치 정보 요청 시작');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('위치 정보 수신 성공:', position);
        try {
          const { latitude, longitude } = position.coords;
          console.log('위치 좌표:', { latitude, longitude });
          
          // 네이버 지도 좌표로 변환
          const naverCoord = new window.naver.maps.LatLng(latitude, longitude);
          console.log('네이버 좌표:', naverCoord);
          
          // 지도 이동
          map.setCenter(naverCoord);
          map.setZoom(17);

          // 마커 생성
          new window.naver.maps.Marker({
            position: naverCoord,
            map: map,
            icon: {
              content: '<div class="current-location-marker"></div>',
              anchor: new window.naver.maps.Point(15, 15)
            }
          });
          console.log('지도 이동 및 마커 생성 완료');
        } catch (error) {
          console.error('지도 조작 중 오류 발생:', error);
          alert('지도 조작 중 오류가 발생했습니다.');
        }
      },
      (error) => {
        console.error('위치 정보를 가져오는데 실패했습니다:', error);
        alert('위치 정보를 가져오는데 실패했습니다.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  }, [map]);

  const buttons = [
    { label: '검색',        icon: <FaSearch size={18} />,       onClick: onSearch },
    { label: '히트맵',      icon: <FaThermometerHalf size={18} />, onClick: onToggleHeatmap },
    { label: '대중교통',    icon: <FaBus size={18} />,          onClick: onPublicTransport },
    { label: '북마크',      icon: <FaBookmark size={18} />,     onClick: onBookmark },
    { label: '공유',        icon: <FaShareAlt size={18} />,     onClick: onCopyLink },
    { label: '풀스크린',    icon: isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />, onClick: toggleFullscreen },
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
          {buttons.slice(0, 1).map((btn, i) => (
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
          <button
            onClick={handleLocationClick}
            aria-label="내 위치"
            className="flex items-center justify-center w-14 h-12 hover:bg-gray-100 transition"
          >
            <div className="flex flex-col items-center text-sm">
              <div className="mb-1">
                <FaLocationArrow size={18} />
              </div>
              <span className="text-xs">내 위치</span>
            </div>
          </button>
          <ListViewControl 
            hospitals={hospitals} 
            pharmacies={pharmacies} 
            onItemClick={onItemClick}
          />
          <LayerControl onToggleLayers={onToggleLayers} />
          <MapStyleControl map={map} onSwitchStyle={onSwitchStyle} />
          {buttons.slice(1).map((btn, i) => (
            <button
              key={i + 1}
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
          <ResetControl map={map} onReset={onReset} />
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