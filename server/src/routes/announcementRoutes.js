const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/mysql');

const { authenticateToken, isAdmin } = require('./authRoutes');      

router.use(authenticateToken, isAdmin);

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../client/public/images/announcements/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    cb(null, `ann-${timestamp}-${random}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

// 공지사항 목록 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM hospital_announcements ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('공지사항 조회 실패:', error);
    res.status(500).json({ message: '공지사항 목록을 불러오는데 실패했습니다.' });
  }
});

// 활성화된 공지사항만 조회
router.get('/active', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM hospital_announcements WHERE is_active = true AND start_date <= NOW() AND end_date >= NOW() ORDER BY priority DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('활성 공지사항 조회 실패:', error);
    res.status(500).json({ message: '공지사항을 불러오는데 실패했습니다.' });
  }
});

// 공지사항 등록
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, content, link_url, start_date, end_date, priority, is_active } = req.body;
    const image_url = req.file ? `/images/announcements/${req.file.filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO hospital_announcements (title, content, image_url, link_url, start_date, end_date, priority, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, image_url, link_url, start_date, end_date, priority, is_active === 'true']
    );

    res.status(201).json({ 
      id: result.insertId,
      message: '공지사항이 등록되었습니다.' 
    });
  } catch (error) {
    console.error('공지사항 등록 실패:', error);
    res.status(500).json({ message: '공지사항 등록에 실패했습니다.' });
  }
});

// 공지사항 수정
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, link_url, start_date, end_date, priority, is_active } = req.body;
    
    // 기존 이미지 정보 조회
    const [existing] = await pool.query('SELECT image_url FROM hospital_announcements WHERE id = ?', [id]);
    
    let image_url = existing[0]?.image_url;
    if (req.file) {
      // 새 이미지가 업로드된 경우, 기존 이미지 삭제
      if (image_url) {
        const oldImagePath = path.join(__dirname, '../../client/public', image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image_url = `/images/announcements/${req.file.filename}`;
    }

    await pool.query(
      'UPDATE hospital_announcements SET title = ?, content = ?, image_url = ?, link_url = ?, start_date = ?, end_date = ?, priority = ?, is_active = ? WHERE id = ?',
      [title, content, image_url, link_url, start_date, end_date, priority, is_active === 'true', id]
    );

    res.json({ message: '공지사항이 수정되었습니다.' });
  } catch (error) {
    console.error('공지사항 수정 실패:', error);
    res.status(500).json({ message: '공지사항 수정에 실패했습니다.' });
  }
});

// 공지사항 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 이미지 파일 삭제
    const [existing] = await pool.query('SELECT image_url FROM hospital_announcements WHERE id = ?', [id]);
    if (existing[0]?.image_url) {
      const imagePath = path.join(__dirname, '../../client/public', existing[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query('DELETE FROM hospital_announcements WHERE id = ?', [id]);
    res.json({ message: '공지사항이 삭제되었습니다.' });
  } catch (error) {
    console.error('공지사항 삭제 실패:', error);
    res.status(500).json({ message: '공지사항 삭제에 실패했습니다.' });
  }
});

module.exports = router; 