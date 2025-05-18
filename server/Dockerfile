# server/Dockerfile
FROM node:18
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# 환경변수 파일이 있다면 사용
COPY .env.production .env

# 나머지 소스 코드 복사
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
