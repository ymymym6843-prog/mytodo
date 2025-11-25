# 📝 Todo List - 풀스택 할 일 관리 애플리케이션

사용자 인증과 데이터베이스를 갖춘 풀스택 Todo List 웹 애플리케이션입니다.

## ✨ 주요 기능

- ✅ **사용자 인증**
  - 회원가입 및 로그인
  - 세션 기반 인증
  - 비밀번호 암호화 (bcrypt)

- 📋 **할 일 관리**
  - 할 일 추가, 수정, 삭제
  - 완료 상태 토글
  - 카테고리별 필터링 (오늘, 예정, 완료됨)
  - 우선순위 설정 (낮음, 보통, 높음)

- 💾 **데이터 영구 저장**
  - MariaDB 데이터베이스 연동
  - 사용자별 데이터 관리

## 🛠️ 기술 스택

### Backend
- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **MariaDB** - 관계형 데이터베이스
- **bcryptjs** - 비밀번호 해싱
- **express-session** - 세션 관리
- **dotenv** - 환경 변수 관리

### Frontend
- **HTML5** - 마크업
- **CSS3** - 스타일링
- **Vanilla JavaScript** - 클라이언트 로직

## 📦 설치 방법

### 1. 저장소 클론
```bash
git clone https://github.com/ymymym6843-prog/mytodo.git
cd mytodo
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=todo_db
SESSION_SECRET=your_session_secret_key
```

### 4. 데이터베이스 설정

#### MariaDB 설치 및 실행
MariaDB가 설치되어 있지 않다면 먼저 설치하세요.

#### 데이터베이스 및 테이블 생성
```bash
node setup_db.js
```

또는 수동으로 실행:
```bash
mysql -u root -p < schema.sql
```

## 🚀 실행 방법

### 서버 시작
```bash
node server.js
```

서버가 성공적으로 시작되면 다음 메시지가 표시됩니다:
```
🚀 서버 실행 중: http://localhost:3000
✅ MariaDB 연결 성공!
```

### 애플리케이션 접속
브라우저에서 다음 주소로 접속하세요:
```
http://localhost:3000
```

> ⚠️ **중요**: Live Server를 사용하지 마세요! Node.js 서버(`node server.js`)를 통해 실행해야 백엔드 API가 정상적으로 작동합니다.

## 📁 프로젝트 구조

```
mytodo/
├── index.html          # 메인 HTML 파일
├── style.css           # 스타일시트
├── script.js           # 클라이언트 JavaScript
├── server.js           # Express 서버
├── schema.sql          # 데이터베이스 스키마
├── setup_db.js         # DB 자동 설정 스크립트
├── .env                # 환경 변수 (Git에서 제외됨)
├── package.json        # 프로젝트 의존성
└── README.md           # 프로젝트 문서
```

## 🔐 API 엔드포인트

### 인증
- `POST /api/register` - 회원가입
- `POST /api/login` - 로그인
- `POST /api/logout` - 로그아웃
- `GET /api/user` - 현재 사용자 정보

### Todo
- `GET /api/todos` - 모든 할 일 조회
- `POST /api/todos` - 새 할 일 생성
- `PUT /api/todos/:id` - 할 일 수정
- `DELETE /api/todos/:id` - 할 일 삭제

## 🎨 주요 화면

### 로그인/회원가입
- 사용자 인증을 위한 로그인 및 회원가입 폼

### 메인 대시보드
- 할 일 목록 표시
- 필터링 (오늘, 예정, 완료됨)
- 할 일 추가/수정/삭제
- 우선순위 및 완료 상태 관리

## 🔧 개발

### 개발 모드 실행
```bash
node server.js
```

### 데이터베이스 초기화
```bash
node setup_db.js
```

## 📝 라이선스

이 프로젝트는 개인 학습 목적으로 만들어졌습니다.

## 👤 작성자

ymymym6843-prog

## 🐛 버그 리포트

문제가 발생하면 [Issues](https://github.com/ymymym6843-prog/mytodo/issues)에 등록해주세요.