const express = require("express");
const client = require("../config/elasticsearch");
const router = express.Router();

router.get("/", async (req, res) => {
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
            must: [
              { term: { category: "요양병원" } }
            ],
            should: [
              { match_phrase_prefix: { "yadmNm": query } },
              { match_phrase_prefix: { "addr": query } }
            ],
            minimum_should_match: 1
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
        address: hit._source.addr
      }))
    };
    res.json(suggestions);
  } catch (error) {
    console.error("❌ 요양병원 자동완성 라우트 오류:", error);
    res.status(500).json({ message: "요양병원 자동완성 검색 중 오류가 발생했습니다." });
  }
});

module.exports = router; 