const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Google Cloud Storage 설정
const storage = new Storage(
  process.env.NODE_ENV === 'development' 
    ? {
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      }
    : {
        projectId: process.env.GOOGLE_CLOUD_PROJECT
      }
);

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// CORS 설정
const corsConfiguration = [
  {
    origin: ['*'],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    responseHeader: ['Content-Type', 'Access-Control-Allow-Origin'],
    maxAgeSeconds: 3600
  }
];

// CORS 설정 적용
bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log('CORS 설정이 성공적으로 적용되었습니다.');
  })
  .catch(err => {
    console.error('CORS 설정 적용 중 오류 발생:', err);
  });

// 안전한 파일명 생성 함수
const generateSafeFileName = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `profile-images/${timestamp}-${randomString}${ext}`;
};

// Multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

// 파일 업로드 미들웨어
const uploadToGCS = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const fileName = generateSafeFileName(req.file.originalname);
    const file = bucket.file(fileName);
    
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false
    });

    stream.on('error', (err) => {
      next(err);
    });

    stream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        req.file.cloudStoragePublicUrl = publicUrl;
        next();
      } catch (error) {
        next(error);
      }
    });

    stream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
};

// 파일 삭제 함수
const deleteFromGCS = async (fileUrl) => {
  try {
    if (!fileUrl) return;
    
    const fileName = fileUrl.split(`${bucket.name}/`)[1];
    if (!fileName) return;

    await bucket.file(fileName).delete();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  upload,
  uploadToGCS,
  deleteFromGCS,
  bucket
}; 