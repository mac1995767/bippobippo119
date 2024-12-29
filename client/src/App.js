import React, { useState, useEffect } from "react";
import axios from "axios"; // Axios로 API 호출
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [horoscopes, setHoroscopes] = useState([]); // API 데이터를 저장할 상태
  const [error, setError] = useState(null); // 에러 상태

  useEffect(() => {
    // API 호출 함수
    const fetchHoroscopes = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/horoscope"); // 백엔드 API 호출
        setHoroscopes(response.data); // 데이터를 상태에 저장
      } catch (err) {
        console.error("Error fetching horoscopes:", err);
        setError("데이터를 불러오는 데 실패했습니다.");
      }
    };

    fetchHoroscopes(); // 컴포넌트 로드 시 데이터 호출
  }, []);

  return (
    <div className="container mt-5">
      {/* 제목 */}
      <header className="text-center mb-5">
        <h1>2024년 12월 28일 오늘의 운세</h1>
      </header>

      {/* 에러 처리 */}
      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}

      {/* 운세 리스트 */}
      <div className="row">
        {horoscopes.map((horoscope, index) => (
          <div className="col-md-6 mb-4" key={index}>
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{horoscope.zodiac} - {horoscope.year}</h5>
                <p className="card-text">{horoscope.general_horoscope}</p>
                <p className="card-text">
                  <strong>세부 운세:</strong> {horoscope.specific_horoscope}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
