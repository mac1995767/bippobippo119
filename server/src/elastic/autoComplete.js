const express = require("express");
const client = require("../config/elasticsearch");
const router = express.Router();

// 지역명 추출 함수
const extractRegion = (query) => {
  const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  const foundRegion = regions.find(region => query.includes(region));
  return foundRegion;
};

// 자동완성 검색 (상위 5개 결과만)
router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const rawQuery = req.query.query;
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;

    const query = rawQuery?.trim();
    if (!query || query === "") {
      return res.json({ hospital: [] });
    }

    const hasValidLocation =
      latitude != null && longitude != null &&
      !isNaN(parseFloat(latitude)) &&
      !isNaN(parseFloat(longitude)) &&
      parseFloat(latitude) >= -90 && parseFloat(latitude) <= 90 &&
      parseFloat(longitude) >= -180 && parseFloat(longitude) <= 180;

    const region = extractRegion(query);
    const searchQuery = query.replace(region || '', '').trim();

    const searchParams = {
      index: "hospitals",
      size: 5,
      body: {
        query: {
          bool: {
            should: [
              {
                match_phrase: {
                  "yadmNm": { query: query, boost: 20 }
                }
              },
              {
                match_phrase: {
                  "yadmNm": { query: searchQuery, boost: 15 }
                }
              },
              {
                match: {
                  "yadmNm": { query: searchQuery, fuzziness: "AUTO", boost: 7 }
                }
              },
              {
                match_phrase: {
                  "addr": { query: searchQuery, boost: 10 }
                }
              },
              {
                match: {
                  "addr": { query: searchQuery, fuzziness: "AUTO", boost: 5 }
                }
              },
              {
                match_phrase: {
                  "major": { query: searchQuery, boost: 8 }
                }
              },
              {
                match: {
                  "major": { query: searchQuery, fuzziness: "AUTO", boost: 4 }
                }
              },
              {
                match_phrase: {
                  "speciality": { query: searchQuery, boost: 6 }
                }
              },
              {
                match: {
                  "speciality": { query: searchQuery, fuzziness: "AUTO", boost: 3 }
                }
              }
            ],
            filter: [
              ...(region ? [{
                match: {
                  "region": {
                    query: region,
                    boost: 5
                  }
                }
              }] : []),
              ...(hasValidLocation ? [{
                geo_distance: {
                  distance: "50km",
                  location: {
                    lat: parseFloat(latitude),
                    lon: parseFloat(longitude)
                  }
                }
              }] : [])
            ],
            minimum_should_match: 1
          }
        },
        sort: [
          { _score: "desc" },
          ...(hasValidLocation ? [{
            _geo_distance: {
              location: {
                lat: parseFloat(latitude),
                lon: parseFloat(longitude)
              },
              order: "asc",
              unit: "km",
              mode: "min",
              distance_type: "plane"
            }
          }] : [])
        ]
      }
    };

    const response = await client.search(searchParams);
    const hits = response.hits?.hits || [];

    const suggestions = {
      hospital: hits.map(hit => {
        const source = hit._source;
        let score = hit._score || 0;

        if (source.yadmNm?.includes(searchQuery)) score += 7;
        if (source.yadmNm === query) score += 10;
        if (region && source.region === region) score += 4;
        if (source.major?.includes(searchQuery)) score += 2;

        return {
          id: hit._id,
          name: source.yadmNm,
          address: source.addr,
          region: source.region,
          category: source.category,
          major: source.major || [],
          speciality: source.speciality || [],
          score: score,
          ...(hasValidLocation && {
            distance: hit.sort?.[1] ?? null
          })
        };
      })
    };

    res.json(suggestions);
  } catch (error) {
    console.error("❌ 자동완성 라우트 오류:", error);
    res.status(500).json({ message: "자동완성 검색 중 오류가 발생했습니다." });
  }
});

// 전체 검색 결과 API
router.get("/search", async (req, res) => {
  try {
    const { query, page = 1, size = 20 } = req.query;

    if (!query || query.trim() === "") {
      return res.json({ 
        hospitals: [],
        total: 0,
        page: parseInt(page),
        size: parseInt(size)
      });
    }

    const searchParams = {
      index: "hospitals",
      size: parseInt(size),
      from: (parseInt(page) - 1) * parseInt(size),
      body: {
        query: {
          bool: {
            should: [
              // 병원명 검색 (부분 매칭)
              {
                match_phrase_prefix: {
                  "yadmNm": {
                    query: query,
                    boost: 2
                  }
                }
              },
              // 주소 검색 (부분 매칭)
              {
                match_phrase_prefix: {
                  "addr": {
                    query: query,
                    boost: 1
                  }
                }
              },
              // 병원명 검색 (유사도 매칭)
              {
                match: {
                  "yadmNm": {
                    query: query,
                    fuzziness: "AUTO",
                    boost: 1.5
                  }
                }
              },
              // 주소 검색 (유사도 매칭)
              {
                match: {
                  "addr": {
                    query: query,
                    fuzziness: "AUTO",
                    boost: 1
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        highlight: {
          fields: {
            "yadmNm": {},
            "addr": {}
          },
          pre_tags: ["<em>"],
          post_tags: ["</em>"]
        }
      }
    };

    const response = await client.search(searchParams);
    const hits = response.hits?.hits || [];
    
    const hospitals = hits.map(hit => {
      const source = hit._source;
      return {
        id: hit._id,
        name: source.yadmNm,
        address: source.addr,
        region: source.region,
        category: source.category,
        major: source.major || [],
        speciality: source.speciality || [],
        highlight: hit.highlight || {}
      };
    });

    res.json({
      hospitals: hospitals,
      total: response.hits.total.value,
      page: parseInt(page),
      size: parseInt(size),
      totalPages: Math.ceil(response.hits.total.value / parseInt(size))
    });

  } catch (error) {
    console.error("❌ 검색 라우트 오류:", error);
    res.status(500).json({ message: "검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
