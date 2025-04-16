const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');

// 기본 경로와 검색 경로를 하나로 통합
router.get('/', async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      region,
      type,
      query,
      x,
      y,
      distance = "10km"
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const must = [];
    const filter = [];

    // 검색어가 있는 경우
    if (query && query.trim() !== "") {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ["yadmNm^3", "addr", "sidoCdNm", "sgguCdNm"],
          fuzziness: "AUTO"
        }
      });
    } else {
      // 검색어가 없는 경우 전체 데이터 조회
      must.push({ match_all: {} });
    }

    // 지역 필터
    if (region && region !== "전국") {
      filter.push({ term: { sidoCdNm: region } });
    }

    // 약국 유형 필터
    if (type && type !== "전체") {
      filter.push({ term: { clCdNm: type } });
    }

    // 위치 기반 검색
    if (x && y) {
      const userLocation = {
        lat: parseFloat(y),
        lon: parseFloat(x)
      };
      filter.push({
        geo_distance: {
          distance: distance,
          location: userLocation
        }
      });
    }

    const baseQuery = {
      bool: {
        must: must,
        filter: filter
      }
    };

    const searchParams = {
      index: 'pharmacies',
      from: (pageNumber - 1) * limitNumber,
      size: limitNumber,
      body: {
        query: baseQuery,
        sort: (x && y) ? [
          {
            "_geo_distance": {
              "location": { "lat": parseFloat(y), "lon": parseFloat(x) },
              "order": "asc",
              "unit": "km",
              "distance_type": "arc"
            }
          }
        ] : []
      }
    };

    const response = await client.search(searchParams);
    const result = (typeof response.body !== 'undefined') ? response.body : response;

    let hits, totalCount;
    if (result && result.hits) {
      hits = result.hits.hits.map(hit => ({
        ...hit._source,
        _id: hit._id,
      }));
      totalCount = typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total.value;
    } else {
      console.error("검색 응답 구조가 예상과 다릅니다:", result);
      throw new Error("검색 응답 구조가 예상과 다릅니다.");
    }

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      data: hits,
      totalCount,
      currentPage: pageNumber,
      totalPages
    });
  } catch (error) {
    console.error(
      "약국 검색 라우트 오류:",
      error.meta ? JSON.stringify(error.meta.body.error, null, 2) : error
    );
    res.status(500).json({ message: "약국 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router; 