const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('./authRoutes');
const pool = require('../config/mysql');
const client = require('../config/elasticsearch'); // ✅ Elasticsearch 클라이언트 가져오기

// 키워드 자동 분석 함수
const analyzeReviewKeywords = (content) => {
  const keywords = [];
  
  // 시설/환경 관련 키워드
  if (content.includes('깨끗') || content.includes('청결') || content.includes('위생')) {
    keywords.push(1); // 청결/위생 키워드 ID
  }
  if (content.includes('전망') || content.includes('뷰') || content.includes('경치')) {
    keywords.push(2); // 전망 키워드 ID
  }
  if (content.includes('주차') || content.includes('주차장')) {
    keywords.push(3); // 주차 키워드 ID
  }
  if (content.includes('시설') || content.includes('장비') || content.includes('설비')) {
    keywords.push(4); // 시설/장비 키워드 ID
  }

  // 서비스 관련 키워드
  if (content.includes('친절') || content.includes('상냥') || content.includes('배려')) {
    keywords.push(5); // 친절도 키워드 ID
  }
  if (content.includes('전문') || content.includes('실력') || content.includes('치료')) {
    keywords.push(6); // 전문성 키워드 ID
  }
  if (content.includes('설명') || content.includes('상담') || content.includes('안내')) {
    keywords.push(7); // 설명/안내 키워드 ID
  }

  // 비용 관련 키워드
  if (content.includes('가격') || content.includes('비용') || content.includes('저렴')) {
    keywords.push(8); // 비용 키워드 ID
  }

  return keywords;
};


// 요양병원 키워드 통계 조회
router.get('/:id/keyword-stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [stats] = await pool.query(`
      SELECT 
        hkt.id,
        hkt.name,
        hkt.label,
        hkt.icon,
        COUNT(hrk.id) as count
      FROM hospital_review_keyword_types hkt
      LEFT JOIN hospital_review_keywords hrk ON hkt.id = hrk.keyword_type_id
      LEFT JOIN hospital_reviews hr ON hrk.review_id = hr.id
      WHERE hr.hospital_id = ? AND hr.status = 1
      GROUP BY hkt.id, hkt.name, hkt.label, hkt.icon
    `, [id]);

    res.json(stats);
  } catch (error) {
    console.error('키워드 통계 조회 중 오류:', error);
    res.status(500).json({ message: '키워드 통계를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 요양병원 리뷰 목록 조회 (키워드 포함)
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching reviews for hospital ID:', id);
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    // 정렬 조건 설정
    let orderBy = 'r.created_at DESC';
    if (sort === 'likes') orderBy = 'like_count DESC';

    // 리뷰 기본 정보 조회 (이미지, 좋아요 수 포함)
    const [reviews] = await pool.query(`
      SELECT 
        r.*,
        u.username,
        u.profile_image,
        COUNT(DISTINCT l.id) as like_count,
        GROUP_CONCAT(DISTINCT i.image_url) as image_urls
      FROM hospital_reviews r
      LEFT JOIN hospital_users u ON r.user_id = u.id
      LEFT JOIN hospital_review_likes l ON r.id = l.review_id
      LEFT JOIN hospital_review_images i ON r.id = i.review_id
      WHERE r.ykiho = ? AND r.status = 1
      GROUP BY r.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `, [id, parseInt(limit), offset]);

    console.log('Found reviews:', reviews);

    // 각 리뷰의 키워드 정보 조회
    for (let review of reviews) {
      const [keywords] = await pool.query(`
        SELECT 
          hkt.id,
          hkt.name,
          hkt.label,
          hkt.icon
        FROM hospital_review_keywords hrk
        JOIN hospital_review_keyword_types hkt ON hrk.keyword_type_id = hkt.id
        WHERE hrk.review_id = ?
      `, [review.id]);

      review.keywords = keywords;
      review.images = review.image_urls ? review.image_urls.split(',') : [];
      delete review.image_urls;
    }

    // 전체 리뷰 수 조회
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT r.id) as total
       FROM hospital_reviews r
       WHERE r.hospital_id = ? AND r.status = 1`,
      [id]
    );

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('리뷰 조회 중 오류:', error);
    res.status(500).json({ message: '리뷰를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 리뷰 작성 (자동 키워드 분석)
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { content, visitDate, images } = req.body;
    const userId = req.user.id;

    // 리뷰 작성
    const [result] = await connection.query(
      `INSERT INTO hospital_reviews 
       (hospital_id, ykiho, user_id, hospital_type, content, visit_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, id, userId, 'nursing', content, visitDate]
    );

    const reviewId = result.insertId;

    // 리뷰 내용 자동 분석하여 키워드 추출
    const keywords = analyzeReviewKeywords(content);

    // 키워드 저장
    if (keywords.length > 0) {
      const keywordValues = keywords.map(keywordId => [reviewId, keywordId]);
      await connection.query(
        `INSERT INTO hospital_review_keywords (review_id, keyword_type_id) VALUES ?`,
        [keywordValues]
      );
    }

    // 이미지 저장
    if (images && images.length > 0) {
      const imageValues = images.map(imageUrl => [reviewId, imageUrl]);
      await connection.query(
        `INSERT INTO hospital_review_images (review_id, image_url) VALUES ?`,
        [imageValues]
      );
    }

    await connection.commit();

    res.status(201).json({ 
      message: '리뷰가 작성되었습니다.',
      reviewId,
      analyzedKeywords: keywords
    });
  } catch (error) {
    await connection.rollback();
    console.error('리뷰 작성 중 오류:', error);
    res.status(500).json({ message: '리뷰 작성 중 오류가 발생했습니다.' });
  } finally {
    connection.release();
  }
});

// 병원별 리뷰 조회
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    // 정렬 조건 설정
    let orderBy = 'r.created_at DESC';
    if (sort === 'rating') orderBy = 'r.rating DESC';
    else if (sort === 'likes') orderBy = 'like_count DESC';

    // 리뷰 데이터 조회
    const [reviews] = await pool.query(
      `SELECT 
        r.*,
        u.username,
        u.profile_image,
        COUNT(DISTINCT l.id) as like_count,
        GROUP_CONCAT(DISTINCT i.image_url) as image_urls
      FROM hospital_reviews r
      LEFT JOIN hospital_users u ON r.id = u.id
      LEFT JOIN hospital_review_likes l ON r.id = l.review_id
      LEFT JOIN hospital_review_images i ON r.id = i.review_id
      WHERE r.hospital_id = ? AND r.status = 1
      GROUP BY r.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    // 전체 리뷰 수 조회
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT r.id) as total
       FROM hospital_reviews r
       WHERE r.hospital_id = ? AND r.status = 1`,
      [id]
    );

    // 평균 평점 조회
    const [[{ avgRating }]] = await pool.query(
      `SELECT AVG(rating) as avgRating
       FROM hospital_reviews
       WHERE hospital_id = ? AND status = 1`,
      [id]
    );

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        images: review.image_urls ? review.image_urls.split(',') : [],
        image_urls: undefined
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: avgRating || 0
      }
    });
  } catch (error) {
    console.error('리뷰 조회 중 오류:', error);
    res.status(500).json({ message: '리뷰 조회 중 오류가 발생했습니다.' });
  }
});

// 리뷰 수정
router.put('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, content, visitDate } = req.body;
    const userId = req.user.id;

    // 리뷰 존재 여부와 작성자 확인
    const [[review]] = await pool.query(
      'SELECT * FROM hospital_reviews WHERE id = ?',
      [reviewId]
    );

    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: '리뷰를 수정할 권한이 없습니다.' });
    }

    // 리뷰 수정
    await pool.query(
      `UPDATE hospital_reviews 
       SET rating = ?, content = ?, visit_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [rating, content, visitDate, reviewId]
    );

    // 이미지 처리 (기존 이미지 삭제 후 새 이미지 추가)
    if (req.body.images) {
      await pool.query('DELETE FROM hospital_review_images WHERE review_id = ?', [reviewId]);
      
      if (req.body.images.length > 0) {
        const imageValues = req.body.images.map(imageUrl => [reviewId, imageUrl]);
        await pool.query(
          `INSERT INTO hospital_review_images (review_id, image_url) VALUES ?`,
          [imageValues]
        );
      }
    }

    res.json({ message: '리뷰가 수정되었습니다.' });
  } catch (error) {
    console.error('리뷰 수정 중 오류:', error);
    res.status(500).json({ message: '리뷰 수정 중 오류가 발생했습니다.' });
  }
});

// 리뷰 삭제 (소프트 삭제)
router.delete('/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // 리뷰 존재 여부와 작성자 확인
    const [[review]] = await pool.query(
      'SELECT * FROM hospital_reviews WHERE id = ?',
      [reviewId]
    );

    if (!review) {
      return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: '리뷰를 삭제할 권한이 없습니다.' });
    }

    // 소프트 삭제 처리
    await pool.query(
      'UPDATE hospital_reviews SET status = 0 WHERE id = ?',
      [reviewId]
    );

    res.json({ message: '리뷰가 삭제되었습니다.' });
  } catch (error) {
    console.error('리뷰 삭제 중 오류:', error);
    res.status(500).json({ message: '리뷰 삭제 중 오류가 발생했습니다.' });
  }
});

// 리뷰 좋아요 토글
router.post('/reviews/:reviewId/like', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // 이미 좋아요를 눌렀는지 확인
    const [[existingLike]] = await pool.query(
      'SELECT * FROM hospital_review_likes WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (existingLike) {
      // 좋아요 취소
      await pool.query(
        'DELETE FROM hospital_review_likes WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );
      res.json({ message: '좋아요가 취소되었습니다.' });
    } else {
      // 좋아요 추가
      await pool.query(
        'INSERT INTO hospital_review_likes (review_id, user_id) VALUES (?, ?)',
        [reviewId, userId]
      );
      res.json({ message: '좋아요가 추가되었습니다.' });
    }
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    res.status(500).json({ message: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// 요양병원 상세 정보 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Searching for hospital with ykiho:', id);
    
    // Elasticsearch에서 ykiho로 병원 정보 조회
    const response = await client.search({
      index: 'hospitals',
      body: {
        query: {
          bool: {
            must: [
              { term: { 'ykiho.keyword': id } },
              { term: { 'category.keyword': '요양병원' } }
            ]
          }
        }
      }
    });

    console.log('Elasticsearch response:', JSON.stringify(response, null, 2));
    const result = (typeof response.body !== 'undefined') ? response.body : response;
    
    if (!result.hits.hits.length) {
      console.log('No hospital found with ykiho:', id);
      return res.status(404).json({ message: '요양병원을 찾을 수 없습니다.' });
    }

    const hospital = result.hits.hits[0]._source;
    console.log('Found hospital:', hospital);
    res.json(hospital);
  } catch (error) {
    console.error('요양병원 정보 조회 중 오류:', error);
    res.status(500).json({ message: '요양병원 정보 조회 중 오류가 발생했습니다.' });
  }
});


module.exports = router; 