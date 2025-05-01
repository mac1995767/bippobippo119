const express = require("express");
const client = require("../config/elasticsearch");
const router = express.Router();

// 일반 자동완성 검색
router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.json({ hospital: [] });
    }

    const searchParams = {
      index: "hospitals",
      size: 20,
      body: {
        query: {
          bool: {
            should: [
              { match_phrase_prefix: { "yadmNm": query } },
              { match_phrase_prefix: { "addr": query } },
              { match_phrase_prefix: { "subject": query } },
              { wildcard: { "region.keyword": `*${query}*` } }
            ]
          }
        },
        sort: [{ _score: "desc" }]
      }
    };

    const response = await client.search(searchParams);

    const hits = response.hits?.hits || [];
    const suggestions = {
      hospital: hits.map(hit => ({
        name: hit._source.yadmNm,
        address: hit._source.addr,
        subject: hit._source.subject
      }))
    };

    res.json(suggestions);
  } catch (error) {
    console.error("❌ 자동완성 라우트 오류:", error);
    res.status(500).json({ message: "자동완성 검색 중 오류가 발생했습니다." });
  }
});

// 위치 기반 검색
router.post("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.body;

    const searchParams = {
      index: "hospitals",
      size: 20,
      body: {
        query: {
          bool: {
            filter: {
              geo_distance: {
                distance: `${radius}m`,
                location: {
                  lat: latitude,
                  lon: longitude
                }
              }
            }
          }
        },
        sort: [
          {
            _geo_distance: {
              location: {
                lat: latitude,
                lon: longitude
              },
              order: "asc",
              unit: "m",
              distance_type: "arc"
            }
          }
        ]
      }
    };

    const response = await client.search(searchParams);
    const hits = response.hits?.hits || [];

    const suggestions = {
      hospital: hits.map(hit => ({
        name: hit._source.yadmNm,
        address: hit._source.addr,
        subject: hit._source.subject,
        distance: hit.sort[0] // 거리 정보 추가
      }))
    };

    res.json(suggestions);
  } catch (error) {
    console.error("❌ 위치 기반 검색 오류:", error);
    res.status(500).json({ message: "위치 기반 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
