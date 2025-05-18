# ---- 1단계: React 애플리케이션 빌드 ----
FROM node:18-alpine as builder

WORKDIR /app

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 환경변수 파일 설정
COPY .env.production .env

# React 소스 전체 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# ---- 2단계: Nginx 서버 설정 ----
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물을 runner 단계로 복사
COPY --from=builder /app/build ./build

# Cloud Run에서 주입하는 PORT 환경변수를 사용하도록 EXPOSE 및 CMD 설정
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
    