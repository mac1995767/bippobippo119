const express = require('express');
const client = require('../config/elasticsearch');
const router = express.Router();

// 라우터 디버깅
router.use((req, res, next) => {
  console.log('hospitalDetail 라우터 접근');
  console.log('요청 경로:', req.path);
  console.log('요청 메서드:', req.method);
  next();
});

// 병원 상세 정보 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('요청된 병원 ID:', id);

    const searchParams = {
      index: 'hospitals',
      body: {
        query: {
          bool: {
            should: [
              { term: { ykiho: id } },
              { match: { ykiho: id } }
            ],
            minimum_should_match: 1
          }
        }
      }
    };

    console.log('Elasticsearch 쿼리:', JSON.stringify(searchParams, null, 2));

    const response = await client.search(searchParams);
    console.log('Elasticsearch 응답:', JSON.stringify(response, null, 2));

    // 응답 구조 확인
    if (!response || !response.hits || !response.hits.hits) {
      console.error('Elasticsearch 응답 구조가 예상과 다릅니다:', response);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }

    const hits = response.hits.hits;
    if (hits.length === 0) {
      console.log('병원을 찾을 수 없습니다.');
      return res.status(404).json({ error: '병원을 찾을 수 없습니다.' });
    }

    const hospitalDetail = hits[0]._source;
    console.log('찾은 병원 정보:', hospitalDetail);

    // 응답 데이터 정리
    const formattedResponse = {
      ...hospitalDetail,

      food_treatment: hospitalDetail.food_treatment || [],
      intensive_care: hospitalDetail.intensive_care || [],
      personnel: hospitalDetail.personnel || [],
      speciality: hospitalDetail.speciality || [],
      // 기본값 설정
      subjects: hospitalDetail.subjects || [],
      equipment: hospitalDetail.equipment || [],
      nursing_grade: hospitalDetail.nursing_grade || [],
      nearby_pharmacies: hospitalDetail.nearby_pharmacies || [],
      subject: hospitalDetail.subject || "-",
      major: hospitalDetail.major || ["-"],
      // 운영 시간 정보
      times: hospitalDetail.times || {
        trmtWeekStart: "-",
        trmtWeekEnd: "-",
        trmtSatStart: "-",
        trmtSatEnd: "-",
        lunchWeek: "-"
      },
      // 위치 정보
      location: hospitalDetail.location || { lat: 0, lon: 0 }
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('병원 상세 정보 조회 오류:', error);
    if (error.meta && error.meta.body) {
      console.error('Elasticsearch 에러 상세:', error.meta.body);
    }
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 