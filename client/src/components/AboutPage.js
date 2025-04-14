import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-16">
        <div className="container mx-auto px-4 md:px-40">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center">
            삐뽀삐뽀119 소개
          </h1>
          <p className="text-xl text-blue-100 text-center mt-4">
            공공데이터를 활용한 실시간 병원 정보 서비스
          </p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 md:px-40 py-12">
        {/* 회사 소개 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">회사 소개</h2>
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              <strong>삐뽀삐뽀119</strong>는 공공데이터를 활용하여 실시간 병원 정보를 제공하는 서비스입니다.
              빠르고 정확한 의료정보 검색을 통해 사용자들이 필요한 의료 서비스를 쉽게 찾을 수 있도록 돕습니다.
            </p>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">우리의 가치관</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">1. 공정한 정보 제공</h4>
                  <p className="text-gray-700">
                    우리는 병원으로부터 광고료나 수수료를 받지 않습니다. 
                    모든 병원 정보는 공공데이터를 기반으로 하며, 
                    사용자들에게 공정하고 객관적인 정보만을 제공합니다.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">2. 자유로운 선택</h4>
                  <p className="text-gray-700">
                    전국 7만여 개의 병원 데이터를 제공하여, 
                    사용자들이 자신의 상황과 필요에 맞는 병원을 자유롭게 선택할 수 있도록 합니다.
                    최종 선택은 오직 사용자의 몫입니다.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">3. 투명한 서비스</h4>
                  <p className="text-gray-700">
                    우리는 공공기관의 데이터를 기반으로 하되, 
                    사용자들에게 투명하게 정보를 제공합니다. 
                    데이터의 정확성과 일관성을 위해 지속적인 개선 작업을 진행하고 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">데이터 수집 및 관리</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📊 데이터 현황</h4>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      현재 서비스는 공공기관의 데이터를 기반으로 운영되고 있습니다.
                      그러나 모든 데이터를 공공데이터로만 수집하는 데는 한계가 있어,
                      지속적인 데이터 정확성 향상을 위한 작업을 진행 중입니다.
                    </p>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2">데이터 관리 계획</h5>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>공공데이터 기반의 기본 정보 제공</li>
                        <li>데이터 정확성 향상을 위한 지속적인 검증 작업</li>
                        <li>사용자 피드백을 통한 데이터 품질 개선</li>
                        <li>병원 정보의 주기적인 업데이트</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      ※ 데이터 일관화 작업은 시간이 필요한 과정입니다. 
                      사용자들의 이해와 협조를 부탁드립니다.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 부정확한 데이터 신고</h4>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      서비스에 표시된 병원 정보가 실제와 다르거나 부정확한 경우,
                      아래 방법으로 신고해 주시면 빠르게 수정하도록 하겠습니다.
                    </p>
                    <div className="bg-white p-3 rounded border border-yellow-200">
                      <h5 className="font-semibold text-yellow-900 mb-2">신고 방법</h5>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>병원 상세 페이지에서 '정보 수정 요청' 버튼 클릭</li>
                        <li>이메일을 통한 신고 (support@삐뽀삐뽀119.com)</li>
                        <li>고객센터 전화 (02-123-4567)</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded border border-yellow-200">
                      <h5 className="font-semibold text-yellow-900 mb-2">신고 시 포함할 정보</h5>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>병원명</li>
                        <li>부정확한 정보 항목</li>
                        <li>수정이 필요한 정확한 정보</li>
                        <li>신고자 연락처 (선택사항)</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      ※ 신고해 주신 정보는 검증 후 빠르게 반영하도록 하겠습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">서비스 이용 안내</h3>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 중요 안내</h4>
                  <p className="text-gray-700">
                    본 서비스는 병원의 비방이나 홍보를 목적으로 하지 않습니다.
                    모든 병원 정보는 공공데이터를 기반으로 제공되며,
                    사용자들의 편의를 위한 정보 제공만을 목적으로 합니다.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📍 거리 기반 검색 시스템</h4>
                  <div className="space-y-3">
                    <p className="text-gray-700">
                      삐뽀삐뽀119는 <strong>거리 기반 검색</strong>만을 제공합니다.
                      이는 응급 상황에서 가장 중요한 요소인 '시간'을 고려한 설계입니다.
                    </p>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2">검색 원칙</h5>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>사용자의 현재 위치를 기준으로 검색</li>
                        <li>가장 가까운 병원부터 순차적으로 표시</li>
                        <li>거리 순 정렬이 기본값이며, 다른 정렬 옵션은 제공하지 않음</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <h5 className="font-semibold text-blue-900 mb-2">이용 방법</h5>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>위치 정보 접근 권한 허용 필요</li>
                        <li>실시간 위치 기반으로 주변 병원 검색</li>
                        <li>거리별 필터링 기능 제공 (1km, 3km, 5km, 10km)</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      ※ 거리 기반 검색은 응급 상황에서 빠른 의료 서비스 접근을 돕기 위한 핵심 기능입니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">주요 기능</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>현재 위치 기반 병원 검색 (거리 순 정렬)</li>
                <li>실시간 병원 정보 제공</li>
                <li>병원 운영시간 및 연락처 정보 제공</li>
                <li>모바일 최적화된 사용자 인터페이스</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 