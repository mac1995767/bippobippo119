const express = require('express');
const client = require('../config/elasticsearch');
const router = express.Router();

// 병원 상세 정보 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const searchParams = {
      index: 'hospitals',
      body: {
        query: {
          term: {
            ykiho: id
          }
        }
      }
    };

    const response = await client.search(searchParams);
    const result = (typeof response.body !== 'undefined') ? response.body : response;

    if (!result.hits.hits.length) {
      return res.status(404).json({ error: '병원을 찾을 수 없습니다.' });
    }

    const hospitalDetail = result.hits.hits[0]._source;

    res.json(hospitalDetail);
  } catch (error) {
    console.error('병원 상세 정보 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 