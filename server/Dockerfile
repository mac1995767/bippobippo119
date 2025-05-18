# server/Dockerfile
FROM node:18
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# 환경변수 파일이 있다면 사용
COPY .env.production .env

EXPOSE 3001
CMD ["npm", "start"]
