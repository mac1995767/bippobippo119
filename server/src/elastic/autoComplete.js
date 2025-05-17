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
    // URL 파라미터 파싱
    const rawQuery = req.query.query;
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;

    const query = rawQuery?.trim();
    // 이중 인코딩된 쿼리 디코딩
    
    if (!query || query.trim() === "") {
      return res.json({ hospital: [] });
    }

    // 위치 정보 유효성 검사
    const hasValidLocation = latitude != null && longitude != null &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude)) &&
    parseFloat(latitude) >= -90 && parseFloat(latitude) <= 90 &&
    parseFloat(longitude) >= -180 && parseFloat(longitude) <= 180;

    console.log("유효한 위치 정보:", hasValidLocation);
    if (hasValidLocation) {
      console.log("위치 정보 값:", {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
    }

    const region = extractRegion(query);
    const searchQuery = query.replace(region || '', '').trim();

    const searchParams = {
      index: "hospitals",
      size: 5,
      body: {
        query: {
          bool: {
            should: [
              // 정확한 병원명 매칭 (가중치 10)
              {
                match_phrase: {
                  "yadmNm": {
                    query: searchQuery,
                    boost: 10
                  }
                }
              },
              // 병원명 부분 매칭 (가중치 5)
              {
                match: {
                  "yadmNm": {
                    query: searchQuery,
                    boost: 5,
                    fuzziness: "AUTO"
                  }
                }
              },
              // 정확한 진료과목 매칭 (가중치 3)
              {
                match_phrase: {
                  "major": {
                    query: searchQuery,
                    boost: 3
                  }
                }
              },
              // 진료과목 부분 매칭 (가중치 2)
              {
                match: {
                  "major": {
                    query: searchQuery,
                    boost: 2,
                    fuzziness: "AUTO"
                  }
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
                  distance: "10km",
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
              unit: "km"
            }
          }] : [])
        ]
      }
    };

    console.log("검색 파라미터:", JSON.stringify(searchParams, null, 2));

    const response = await client.search(searchParams);
    const hits = response.hits?.hits || [];
    
    console.log("검색 결과 수:", hits.length);
    if (hits.length > 0) {
      console.log("첫 번째 결과 거리:", hasValidLocation ? hits[0].sort[1] : "위치 정보 없음");
    }
    
    const suggestions = {
      hospital: hits.map(hit => {
        const source = hit._source;
        let score = hit._score;
        
        // 추가 점수 계산
        if (source.yadmNm && source.yadmNm.includes(searchQuery)) {
          score += 5; // 정확한 병원명 매칭
        }
        if (region && source.region === region) {
          score += 3; // 지역 정확히 일치
        }
        if (source.major && source.major.includes(searchQuery)) {
          score += 2; // 진료과목 매칭
        }

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
            distance: hit.sort[1]
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
    const { query, page = 1, size = 20, latitude, longitude } = req.query;
    console.log("검색어:", query, "페이지:", page, "크기:", size, "위치:", latitude, longitude);

    if (!query || query.trim() === "") {
      return res.json({ 
        hospitals: [],
        total: 0,
        page: parseInt(page),
        size: parseInt(size)
      });
    }

    const region = extractRegion(query);
    const searchQuery = query.replace(region || '', '').trim();

    const searchParams = {
      index: "hospitals",
      size: parseInt(size),
      from: (parseInt(page) - 1) * parseInt(size),
      body: {
        query: {
          bool: {
            should: [
              // 정확한 병원명 매칭 (가중치 10)
              {
                match_phrase: {
                  "yadmNm": {
                    query: searchQuery,
                    boost: 10
                  }
                }
              },
              // 병원명 부분 매칭 (가중치 5)
              {
                match: {
                  "yadmNm": {
                    query: searchQuery,
                    boost: 5,
                    fuzziness: "AUTO"
                  }
                }
              },
              // 정확한 진료과목 매칭 (가중치 3)
              {
                match_phrase: {
                  "major": {
                    query: searchQuery,
                    boost: 3
                  }
                }
              },
              // 진료과목 부분 매칭 (가중치 2)
              {
                match: {
                  "major": {
                    query: searchQuery,
                    boost: 2,
                    fuzziness: "AUTO"
                  }
                }
              },
              // 주소 검색 (가중치 1)
              {
                match: {
                  "addr": {
                    query: searchQuery,
                    boost: 1,
                    fuzziness: "AUTO"
                  }
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
              ...(latitude && longitude ? [{
                geo_distance: {
                  distance: "10km",
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
          ...(latitude && longitude ? [{
            _geo_distance: {
              location: {
                lat: parseFloat(latitude),
                lon: parseFloat(longitude)
              },
              order: "asc",
              unit: "km"
            }
          }] : [])
        ],
        highlight: {
          fields: {
            "yadmNm": {},
            "addr": {},
            "major": {},
            "region": {}
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
      let score = hit._score;
      
      // 추가 점수 계산
      if (source.yadmNm && source.yadmNm.includes(searchQuery)) {
        score += 5; // 정확한 병원명 매칭
      }
      if (region && source.region === region) {
        score += 3; // 지역 정확히 일치
      }
      if (source.major && source.major.includes(searchQuery)) {
        score += 2; // 진료과목 매칭
      }
      if (source.yadmNm && source.yadmNm.includes("의원") && searchQuery.includes("의원")) {
        score += 1;
      }
      if (source.yadmNm && source.yadmNm.includes("전문") && searchQuery.includes("전문")) {
        score += 1;
      }

      return {
        id: hit._id,
        name: source.yadmNm,
        address: source.addr,
        region: source.region,
        category: source.category,
        major: source.major || [],
        speciality: source.speciality || [],
        score: score,
        highlight: hit.highlight || {},
        ...(latitude && longitude && {
          distance: hit.sort[1]
        })
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

// 위치 기반 검색
router.post("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius = 1000 } = req.body;

    const searchParams = {
      index: "hospitals",
      size: 5,
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
        distance: hit.sort[0]
      }))
    };

    res.json(suggestions);
  } catch (error) {
    console.error("❌ 위치 기반 검색 오류:", error);
    res.status(500).json({ message: "위치 기반 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router;
