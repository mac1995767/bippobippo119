import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const horoscopes = [
    {
      sign: "양자리",
      horoscope: "오늘은 새로운 도전을 시도하기 좋은 날입니다.",
    },
    {
      sign: "황소자리",
      horoscope: "자신의 직감을 믿고 행동에 옮기세요.",
    },
    {
      sign: "쌍둥이자리",
      horoscope: "주변 사람들과의 대화에서 중요한 정보를 얻을 수 있습니다.",
    },
    {
      sign: "사자자리",
      horoscope: "자신감을 가지고 중요한 결정을 내려보세요.",
    },
  ];

  return (
    <div className="container mt-5">
      {/* 제목 */}
      <header className="text-center mb-5">
        <h1>2024년 12월 28일 오늘의 운세</h1>
      </header>

      {/* 운세 리스트 */}
      <div className="row">
        {horoscopes.map((horoscope, index) => (
          <div className="col-md-6 mb-4" key={index}>
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{horoscope.sign}</h5>
                <p className="card-text">{horoscope.horoscope}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;