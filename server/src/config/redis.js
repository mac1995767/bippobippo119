const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  keyPrefix: 'boundary:'
});

// Redis 연결 이벤트 핸들러
redis.on('connect', () => {
  console.log('Redis 연결 성공');
});

redis.on('error', (err) => {
  console.error('Redis 연결 오류:', err);
});

module.exports = redis; 