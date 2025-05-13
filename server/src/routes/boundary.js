const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redis = require('../config/redis');

// 경계 데이터 조회 함수
const getBoundary = async (type, id) => {
    try {
        const cacheKey = `${type}:${id}`;
        
        // Redis에서 데이터 조회
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        // MongoDB에서 데이터 조회
        const collectionName = `sggu_boundaries_${type}`;
        const boundary = await mongoose.connection.collection(collectionName).findOne({
            _id: new mongoose.Types.ObjectId(id)
        });

        if (!boundary) {
            return null;
        }

        // Redis에 캐싱 (24시간)
        await redis.setex(cacheKey, 86400, JSON.stringify(boundary));

        return boundary;
    } catch (error) {
        console.error('경계 데이터 조회 실패:', error);
        throw error;
    }
};

// 경계 데이터 캐시 상태 확인
router.get('/cache-status/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const cacheKey = `${type}:${id}`;
        const isCached = await redis.exists(cacheKey);
        res.json({ isCached: isCached === 1 });
    } catch (error) {
        console.error('캐시 상태 확인 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 경계 데이터 조회 API (Redis 캐시 활용)
router.get('/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const cacheKey = `${type}:${id}`;

        // Redis에서 데이터 조회
        const cachedData = await redis.get(cacheKey);
        
        if (cachedData) {
            return res.json({
                data: JSON.parse(cachedData),
                source: 'cache'
            });
        }

        // 캐시에 없으면 DB에서 조회
        const boundary = await getBoundary(type, id);
        
        if (!boundary) {
            return res.status(404).json({ message: '경계 데이터를 찾을 수 없습니다.' });
        }

        res.json({
            data: boundary,
            source: 'database'
        });
    } catch (error) {
        console.error('경계 데이터 조회 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 경계 데이터 일괄 캐싱
router.post('/cache-batch', async (req, res) => {
    try {
        const { boundaries } = req.body;
        
        if (!Array.isArray(boundaries)) {
            return res.status(400).json({ message: '유효하지 않은 요청입니다.' });
        }

        const results = await Promise.all(
            boundaries.map(async ({ type, id }) => {
                try {
                    const data = await getBoundary(type, id);
                    if (data) {
                        const cacheKey = `${type}:${id}`;
                        await redis.setex(cacheKey, 86400, JSON.stringify(data));
                        return { type, id, success: true };
                    }
                    return { type, id, success: false };
                } catch (error) {
                    console.error(`캐싱 실패 (${type}:${id}):`, error);
                    return { type, id, success: false };
                }
            })
        );

        res.json({ results });
    } catch (error) {
        console.error('일괄 캐싱 실패:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router; 