# ---- 1단계: React 애플리케이션 빌드 ----
    FROM node:18-alpine as builder

    WORKDIR /app
    
    # package.json 및 package-lock.json 복사
    COPY package*.json ./
    
    # 의존성 설치
    RUN npm install
    
    # React 소스 전체 복사
    COPY . .
        
    # 프로덕션 빌드
    RUN npm run build
    
    # ---- 2단계: Node 기반 정적 파일 서버 (serve) 사용 ----
    FROM node:18-alpine as runner
    
    WORKDIR /app
    
    # 정적 파일 서빙을 위한 serve 패키지 전역 설치
    RUN npm install -g serve
    
    # 빌드 결과물을 runner 단계로 복사
    COPY --from=builder /app/build ./build
    
    # Cloud Run에서 주입하는 PORT 환경변수를 사용하도록 EXPOSE 및 CMD 설정
    EXPOSE $PORT
    CMD ["sh", "-c", "serve -s build -l ${PORT}"]
    