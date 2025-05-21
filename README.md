![삐뽀삐뽀119 로고](https://github.com/KWANHYUNKIM/horoscope/blob/main/client/public/images/pp119_og.jpg?raw=true)

**삐뽀삐뽀119**는 육아 중인 부모들이 **아이의 갑작스러운 병원 방문이 필요할 때** 신속하게 병원을 검색하고, 운영 시간과 진료 카테고리에 따라 필터링할 수 있는 **병원 검색 웹사이트**입니다. 이 프로젝트는 상업용으로 사용되며, 바쁜 부모님들에게 **신속하고 정확한 병원 정보**를 제공합니다.

## 목차

- [소개](#소개)
- [대상 사용자](#대상-사용자)
- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [보안 및 민감 정보 관리](#보안-및-민감-정보-관리)
- [라이선스](#라이선스)
- [Google Cloud Storage 설정](#google-cloud-storage-설정)

---

## 소개

**삐뽀삐뽀119**는 갑작스럽게 아픈 아이를 위해 병원을 찾아야 하는 부모님들을 위해 **운영 중인 병원 정보**를 신속하게 제공하는 병원 검색 플랫폼입니다.

특히, 야간이나 주말에도 진료하는 병원을 쉽게 찾을 수 있도록 **운영 시간 필터**를 지원하며, 육아 중인 부모님들이 **최대한 빠르게 병원을 방문할 수 있도록** 위치 기반 검색을 제공합니다.

---

## 대상 사용자

이 웹사이트는 **육아 중인 부모님**을 주된 대상으로 합니다.
특히 다음과 같은 경우에 유용하게 사용할 수 있습니다:

- **아이가 갑자기 아플 때**: 밤늦게나 주말에도 운영하는 병원을 빠르게 찾아야 하는 부모님
- **응급 상황**: 응급실 방문이 필요한데 가까운 병원이 어디 있는지 모르는 경우
- **예방 접종 및 정기 검진**: 아이의 예방 접종이나 건강 검진을 위한 병원을 찾는 경우

---

## 기술 스택

| 프론트엔드 | 백엔드 | 데이터베이스 | AI/ML | 인프라/DevOps | 기타 |
|------------|--------|--------------|-------|--------------|------|
| React 18 | Node.js | MongoDB | TensorFlow.js | Docker | Axios |
| Redux Toolkit | Express.js | PostgreSQL | LangChain | Kubernetes | Proj4 |
| Material-UI | Sequelize | MySQL | OpenAI API | GCP | Turf.js |
| Tailwind CSS | JWT | Elasticsearch | | GitHub Actions | GA4 |
| Styled Components | Swagger | | | | GTM |
| React Router DOM | Nodemailer | | | | |
| Chart.js | Multer | | | | |
| Framer Motion | | | | | |

---

## 주요 기능

- **병원 검색**
  - 현재 위치 기반으로 가까운 병원 추천
  - 지역별 병원 검색 가능

- **운영 시간 필터**
  - **야간, 24시간, 주말 진료 필터링**
  - 운영 중인 병원만 선택 가능

- **병원 상세 정보 확인**
  - 병원의 운영 시간, 진료 과목 확인 가능
  - 응급실 운영 여부 표시

- **반응형 디자인**
  - 모바일과 데스크톱에서 최적화된 UI 제공

---

## 보안 및 민감 정보 관리

- **병원 데이터 최신화**: 운영 중인 병원 정보를 주기적으로 업데이트합니다.
- **HTTPS 적용**: 모든 데이터는 보안이 강화된 HTTPS 프로토콜을 사용하여 전송됩니다.

---

## 라이선스

이 프로젝트는 상업용으로 사용되며, 무단 복제 및 배포를 금합니다.

## Google Cloud Storage 설정

1. Google Cloud Console에서 서비스 계정 키 생성
   - IAM & 관리자 > 서비스 계정으로 이동
   - 서비스 계정 생성 또는 선택
   - 키 생성 (JSON 형식)
   - 다운로드한 키 파일을 `server/config/` 디렉토리에 저장

2. 환경 변수 설정
   - `server/.env` 파일에 다음 변수들을 설정:
   ```
   GOOGLE_CLOUD_PROJECT=your-project-id
   GCS_BUCKET_NAME=your-bucket-name
   GOOGLE_APPLICATION_CREDENTIALS=./config/your-service-account-key.json
   ```

3. 버킷 권한 설정
   - Cloud Storage > 버킷으로 이동
   - 해당 버킷 선택
   - IAM 탭에서 서비스 계정에 다음 역할 부여:
     - Storage Object Admin
     - Storage Object Viewer
