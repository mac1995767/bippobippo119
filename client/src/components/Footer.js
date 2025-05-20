import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 px-4 md:px-6 lg:px-40">
        {/* 회사 소개 */}
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold">🚑 삐뽀삐뽀119</h2>
          <p className="text-sm text-gray-300 mt-2">
            가장 가까운 병원을 빠르게 찾을 수 있도록!
            <br />
            <strong>삐뽀삐뽀119</strong>는 공공데이터를 활용하여 실시간 병원 정보를 제공합니다.
            빠르고, 정확한 의료정보 검색을 경험하세요.
          </p>
        </div>

        {/* 주요 서비스 링크 */}
        <div className="flex flex-col items-center text-center space-y-2">
          <h3 className="text-lg font-semibold">🔗 주요 서비스</h3>
          <a href="/about" className="text-gray-400 hover:text-white transition">
            회사 소개
          </a>
        </div>

        {/* 소셜 미디어 링크 */}
        <div className="flex flex-col items-center text-center space-y-2">
          <h3 className="text-lg font-semibold">📱 소셜 미디어</h3>
          <div className="flex flex-row items-center justify-center gap-4 mt-2">
            {/* Naver Blog */}
            <a
              href="https://blog.naver.com/bippobippo119"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-500 transition"
              aria-label="네이버 블로그"
            >
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="white"/>
                <rect x="10" y="13" width="20" height="14" rx="3" fill="#03C75A"/>
                <text x="15" y="25" fontSize="10" fill="white" fontWeight="bold">blog</text>
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/bippobippo119/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center hover:bg-pink-500 transition"
              aria-label="인스타그램"
            >
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="white"/>
                <g>
                  <rect x="12" y="12" width="16" height="16" rx="5" fill="#E1306C"/>
                  <circle cx="20" cy="20" r="5" fill="white"/>
                  <circle cx="25" cy="15" r="1" fill="#E1306C"/>
                </g>
              </svg>
            </a>
            {/* GitHub */}
            <a
              href="https://github.com/KWANHYUNKIM"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-600 transition"
              aria-label="깃허브"
            >
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M20 10c-5.52 0-10 4.48-10 10 0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0120 15.16c.85.004 1.7.12 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10.01 10.01 0 0030 20c0-5.52-4.48-10-10-10z" fill="#181717"/>
              </svg>
            </a>
          </div>
        </div>

        {/* 공공누리 저작권 & 공공데이터 출처 */}
        <div className="flex flex-col items-center text-center">
          <h3 className="text-lg font-semibold">🛡️ 저작권 & 데이터 출처</h3>
          <img
            src="/img_opentype01.png"
            alt="공공누리 저작물 자유이용허락"
            className="h-10 mt-2"
          />
          <p className="text-xs mt-1 text-gray-300">
            본 서비스는{" "}
            <a
              href="https://www.data.go.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              공공데이터포털
            </a>{" "}
            의 정보를 활용하여 운영됩니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <a
              href="https://www.kogl.or.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              공공누리 제1유형
            </a>{" "}
            적용
          </p>
        </div>
      </div>

      {/* 하단 바 */}
      <div className="mt-6 border-t border-gray-700 pt-4 text-center text-sm text-gray-500">
        © 2024 삐뽀삐뽀119. 모든 권리 보유.
      </div>
    </footer>
  );
};

export default Footer;
