import { fetchMedicalStats } from '../../service/api';

// 초기 데이터
export const initialMedicalTypes = [
  { key: '의원', count: 0 },
  { key: '치과의원', count: 0 },
  { key: '한의원', count: 0 },
  { key: '보건진료소', count: 0 },
  { key: '병원', count: 0 },
  { key: '요양병원', count: 0 },
  { key: '보건지소', count: 0 },
  { key: '한방병원', count: 0 },
  { key: '종합병원', count: 0 },
  { key: '정신병원', count: 0 },
  { key: '보건소', count: 0 },
  { key: '치과병원', count: 0 },
  { key: '상급종합', count: 0 },
  { key: '보건의료원', count: 0 },
  { key: '조산원', count: 0 }
];

// 약국 타입
export const pharmacyTypes = [
  { key: '약국', count: 0 }
];

// 통계 데이터 가져오기
export const getMedicalStats = async () => {
  try {
    const stats = await fetchMedicalStats();

    if (!stats || (!stats.hospitals && !stats.pharmacies)) {
      console.warn('통계 데이터가 없거나 형식이 올바르지 않습니다.');
      return {
        hospitals: initialMedicalTypes,
        pharmacies: pharmacyTypes
      };
    }

    // 병원 데이터 매핑
    const hospitals = initialMedicalTypes.map(type => {
      const found = stats.hospitals?.find(h => h.key === type.key);
      return found || { ...type, count: 0 };
    });

    // 약국 데이터 매핑
    const pharmacies = pharmacyTypes.map(type => {
      const found = stats.pharmacies?.find(p => p.key === type.key);
      return found || { ...type, count: 0 };
    });

    return {
      hospitals,
      pharmacies
    };
  } catch (error) {
    console.error('의료기관 통계 데이터 로딩 실패:', error);
    return {
      hospitals: initialMedicalTypes,
      pharmacies: pharmacyTypes
    };
  }
}; 