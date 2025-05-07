import React from 'react';
import { FaTimes } from 'react-icons/fa';

function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">지도 사용 가이드</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-2">기본 기능</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>지도 확대/축소: 마우스 휠 또는 우측 컨트롤 버튼 사용</li>
              <li>지도 이동: 마우스 드래그 또는 화살표 키 사용</li>
              <li>현재 위치: 내 위치 버튼 클릭</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-2">검색 및 필터</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>검색: 주소, 병원명, 약국명으로 검색 가능</li>
              <li>필터: 의료기관 유형별 필터링 가능</li>
              <li>목록 보기: 검색 결과를 목록으로 확인</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-2">지도 표시</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>지도 스타일: 일반/위성/지형 등 다양한 지도 스타일 제공</li>
              <li>히트맵: 지역별 의료기관 밀집도 확인</li>
              <li>거리측정: 두 지점 간의 거리 측정</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-2">추가 기능</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>북마크: 자주 찾는 위치 저장</li>
              <li>공유: 현재 지도 화면 공유</li>
              <li>초기화: 지도 화면 초기 상태로 복원</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-purple-600 mb-2">줌 레벨별 표시 정보</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>줌 레벨 8-10: 시도별 요약 정보</li>
              <li>줌 레벨 11-14: 시군구별 요약 정보</li>
              <li>줌 레벨 15-16: 읍면동별 요약 정보</li>
              <li>줌 레벨 16-18: 간단한 마커 표시</li>
              <li>줌 레벨 19+: 상세 정보 마커 표시</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HelpModal; 