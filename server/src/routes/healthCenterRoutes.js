const express = require('express');
const router = express.Router();
const HealthCenter = require('../models/HealthCenter');

// 지역명 매핑
const regionMapping = {
  '서울': ['서울', '서울시', '서울특별시'],
  '부산': ['부산', '부산시', '부산광역시'],
  '대구': ['대구', '대구시', '대구광역시'],
  '인천': ['인천', '인천시', '인천광역시'],
  '광주': ['광주', '광주시', '광주광역시'],
  '대전': ['대전', '대전시', '대전광역시'],
  '울산': ['울산', '울산시', '울산광역시'],
  '세종': ['세종', '세종시', '세종특별자치시'],
  '경기': ['경기', '경기도'],
  '강원': ['강원', '강원도'],
  '충북': ['충북', '충청북도'],
  '충남': ['충남', '충청남도'],
  '전북': ['전북', '전라북도'],
  '전남': ['전남', '전라남도'],
  '경북': ['경북', '경상북도'],
  '경남': ['경남', '경상남도'],
  '제주': ['제주', '제주도', '제주특별자치도']
};

// 건강증진센터 목록 조회
router.get('/', async (req, res) => {
  try {
    const { keyword, type, sido, page = 1, limit = 9 } = req.query;
    let query = {};

    console.log('요청 파라미터:', { keyword, type, sido, page, limit });

    // 유형 필터링
    if (type && type !== 'all') {
      query.clCdNm = type;
    }

    // 지역 필터링 (주소에 포함된 문자열로 검색)
    if (sido && sido !== 'all') {
      const regionVariants = regionMapping[sido] || [sido];
      query.$or = regionVariants.map(variant => ({
        $or: [
          { addr: { $regex: variant, $options: 'i' } },
          { jibunAddr: { $regex: variant, $options: 'i' } }
        ]
      }));
    }

    // 검색어 필터링
    if (keyword && keyword.trim() !== '') {
      const keywordQuery = {
        $or: [
          { yadmNm: { $regex: keyword, $options: 'i' } },
          { addr: { $regex: keyword, $options: 'i' } },
          { jibunAddr: { $regex: keyword, $options: 'i' } }
        ]
      };

      if (query.$or) {
        // 지역 검색과 키워드 검색을 AND 조건으로 결합
        query = {
          $and: [
            { $or: query.$or },
            keywordQuery
          ]
        };
      } else {
        query = keywordQuery;
      }
    }

    console.log('최종 쿼리:', JSON.stringify(query, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await HealthCenter.countDocuments(query);
    const centers = await HealthCenter.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ yadmNm: 1 });

    console.log('검색된 센터 수:', centers.length);
    console.log('전체 센터 수:', total);

    // 데이터가 없는 경우 빈 배열 반환
    if (!centers || centers.length === 0) {
      return res.json({
        centers: [],
        total: 0,
        currentPage: parseInt(page),
        totalPages: 0
      });
    }

    res.json({
      centers,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('건강증진센터 조회 중 오류 발생:', error);
    res.status(500).json({ message: '건강증진센터 정보를 불러오는데 실패했습니다.' });
  }
});

// 건강증진센터 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const center = await HealthCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: '건강증진센터를 찾을 수 없습니다.' });
    }
    res.json(center);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 건강증진센터 데이터 일괄 저장
router.post('/bulk', async (req, res) => {
  try {
    const centers = req.body;
    const result = await HealthCenter.insertMany(centers);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 