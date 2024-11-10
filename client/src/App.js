// client/src/App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

function App() {
  const [horoscope, setHoroscope] = useState(null);
  const [sign, setSign] = useState('aries');

  useEffect(() => {
    fetchHoroscope();
  }, [sign]);

  const fetchHoroscope = async () => {
    try {
      const res = await axios.get(`/api/horoscope/${sign}`);
      setHoroscope(res.data);
    } catch (err) {
      console.error('Error fetching horoscope:', err);
    }
  };

  const handleSignChange = (e) => {
    setSign(e.target.value);
  };

  return (
    <div className="App">
      <h1>운세 웹사이트</h1>
      <select value={sign} onChange={handleSignChange}>
        <option value="aries">양자리</option>
        <option value="taurus">황소자리</option>
        {/* 다른 별자리 추가 */}
      </select>

      {horoscope && (
        <div>
          <h2>{horoscope.sign} 운세</h2>
          <p>{horoscope.horoscope}</p>
          <h3>추천</h3>
          <p>{horoscope.recommendation}</p>

          {/* 데이터 시각화 예시 */}
          <Bar
            data={{
              labels: ['운세 만족도', '추천 정확도'],
              datasets: [
                {
                  label: '점수',
                  data: [80, 90],
                  backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                },
              ],
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
