export const API_URL = 'http://localhost:3001'; // 실제 기기에서는 PC의 IP로 변경

// 예시 fetch 함수
export async function fetchData() {
  const res = await fetch(`${API_URL}/api/your-endpoint`);
  return res.json();
} 