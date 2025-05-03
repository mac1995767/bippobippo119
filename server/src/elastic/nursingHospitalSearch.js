const express = require('express');
const router = express.Router();
const client = require('../config/elasticsearch');

// 요양병원 검색 라우트
router.get('/', async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      region,
      query,
      x,
      y,
      distance = "10km"
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const must = [
      { term: { category: "요양병원" } }
    ];
    const filter = [];

    // 검색어가 있는 경우
    if (query && query.trim() !== "") {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ["yadmNm^3", "addr", "major"],
          fuzziness: "AUTO"
        }
      });
    } else {
      // 검색어가 없는 경우 전체 데이터 조회
      must.push({ match_all: {} });
    }

    // 지역 필터 (region)
    if (region && region !== "전국") {
      filter.push({ term: { region: region } });
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
      index: 'hospitals',
      from: (pageNumber - 1) * limitNumber,
      size: limitNumber,
      body: {
        query: baseQuery,
        sort: (x && y) ? [
          {
            "_geo_distance": {
              "location": { "lat": parseFloat(y), "lon": parseFloat(x) },
              "order": "asc",
              "unit": "m",
              "distance_type": "arc"
            }
          }
        ] : [],
        _source: {
          includes: ["*"]
        }
      }
    };

    const response = await client.search(searchParams);
    const result = (typeof response.body !== 'undefined') ? response.body : response;

    let hits, totalCount;
    if (result && result.hits) {
      hits = result.hits.hits.map(hit => {
        const distance = hit.sort ? Math.round(hit.sort[0]) : null;
        return {
          ...hit._source,
          _id: hit._id,
          distance: distance
        };
      });
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
      "요양병원 검색 라우트 오류:",
      error.meta ? JSON.stringify(error.meta.body.error, null, 2) : error
    );
    res.status(500).json({ message: "요양병원 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router; 