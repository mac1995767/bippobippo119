const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// 댓글 작성
router.post('/boards/:boardId/comments', authenticateToken, async (req, res) => {
  const { boardId } = req.params;
  const { comment, hospitalTags = [] } = req.body;
  const userId = req.user.id;

  // 필수 필드 검증
  if (!comment || !comment.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: '댓글 내용을 입력해주세요.' 
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 댓글 작성
    const [commentResult] = await connection.query(
      'INSERT INTO hospital_board_comments (board_id, user_id, comment) VALUES (?, ?, ?)',
      [boardId, userId, comment.trim()]
    );
    const commentId = commentResult.insertId;

    // 병원 태그가 있는 경우에만 처리
    if (hospitalTags && hospitalTags.length > 0) {
      for (const tag of hospitalTags) {
        if (!tag.hospitalId) {
          throw new Error('병원 ID가 유효하지 않습니다.');
        }
        await connection.query(
          'INSERT INTO hospital_board_comment_hospital_tags (comment_id, hospital_id) VALUES (?, ?)',
          [commentId, tag.hospitalId]
        );
      }
    }

    await connection.commit();

    // 작성된 댓글과 태그 정보 조회
    const [comment] = await connection.query(
      `SELECT c.*,
        GROUP_CONCAT(DISTINCT hct.hospital_id) as hospital_ids
       FROM hospital_board_comments c
       LEFT JOIN hospital_board_comment_hospital_tags hct ON c.id = hct.comment_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [commentId]
    );

    res.json({
      success: true,
      comment: comment[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('댓글 작성 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '댓글 작성에 실패했습니다.' 
    });
  } finally {
    connection.release();
  }
});

// 댓글 목록 조회
router.get('/boards/:boardId/comments', async (req, res) => {
  const { boardId } = req.params;

  try {
    const [comments] = await pool.query(
      `SELECT c.*,
        GROUP_CONCAT(DISTINCT et.id) as entity_tag_ids,
        GROUP_CONCAT(DISTINCT tt.type_name) as entity_tag_types,
        GROUP_CONCAT(DISTINCT et.entity_id) as entity_ids
       FROM hospital_board_comments c
       LEFT JOIN hospital_comment_entity_tags cet ON c.id = cet.comment_id
       LEFT JOIN hospital_entity_tags et ON cet.entity_tag_id = et.id
       LEFT JOIN hospital_tag_types tt ON et.tag_type_id = tt.id
       WHERE c.board_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [boardId]
    );

    const formattedComments = comments.map(comment => ({
      ...comment,
      entityTags: comment.entity_tag_ids ? comment.entity_tag_ids.split(',').map((id, index) => ({
        id: parseInt(id),
        type: comment.entity_tag_types.split(',')[index],
        entityId: parseInt(comment.entity_ids.split(',')[index])
      })) : []
    }));

    res.json({ success: true, comments: formattedComments });
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    res.status(500).json({ success: false, message: '댓글 조회에 실패했습니다.' });
  }
});

module.exports = router; 