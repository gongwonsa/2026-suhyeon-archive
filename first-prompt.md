# Claude Code 첫 프롬프트

아래 내용을 그대로 붙여 넣으세요. 한 번에 전체를 만들지 않고, 단계별로 확인하며 진행합니다.

---

## 프로젝트 폴더 구조

이 구조를 기준으로 파일을 만듭니다. 1단계에서는 아래 중 `public/`, `src/pages/`, `src/components/`, `src/lib/`, `src/styles/`, `src/data/`, `.github/workflows/`, `supabase/` 폴더까지 만들고, 지금 필요 없는 파일은 비워 둡니다.

```
2026-suhyeon-archive/
├─ public/
│  ├─ fonts/                       눈누 글꼴 파일 (글꼴_설치_안내.txt 참고)
│  │  ├─ cafe24-ssurround.woff2
│  │  ├─ lee-seoyun.woff2
│  │  ├─ nanumsquare-regular.woff2
│  │  ├─ nanumsquare-bold.woff2
│  │  └─ licenses/                 글꼴 라이선스 파일 (카페24 써라운드 PDF)
│  ├─ default-thumb.png            기본 썸네일 (4:3)
│  └─ 404.html                     GitHub Pages 라우팅 대응
├─ src/
│  ├─ pages/
│  │  ├─ WorksPage.tsx             /works 공개 전시
│  │  ├─ WorkDetailPage.tsx        /works/:id 상세
│  │  ├─ UploadPage.tsx            /upload 접속, 등록, 목록, 수정
│  │  ├─ AdminPage.tsx             /admin 교사 관리
│  │  └─ PrivacyPage.tsx           /privacy 개인정보 처리방침
│  ├─ components/
│  │  ├─ Header.tsx                제목, 소개 문구, 후기 작성 링크
│  │  ├─ Footer.tsx                처리방침 링크, 교사 연락 문구
│  │  ├─ GenreFilter.tsx           장르 필터 (텍스트 목록, 단일 선택)
│  │  ├─ SearchInput.tsx           제목·이름 검색
│  │  ├─ WorkGrid.tsx              벽 배치 (CSS columns)
│  │  ├─ WorkCard.tsx              썸네일 + 라벨 (No., 장르, 제목, 이름, 작품 보기)
│  │  ├─ WorkForm.tsx              등록·수정 공용 폼 (AI 사용 체크 포함)
│  │  └─ ConsentBox.tsx            동의 항목과 전문 펼치기
│  ├─ lib/
│  │  ├─ api.ts                    데이터 접근 (지금은 샘플, 나중에 Supabase)
│  │  ├─ supabase.ts               anon key 클라이언트
│  │  └─ constants.ts              장르, 구글 폼 URL, INTRO_TEXT, 교사 연락처
│  ├─ data/
│  │  └─ sample-works.ts           샘플 작품 14개 (실제 학생 데이터 아님)
│  ├─ styles/
│  │  ├─ tokens.css                DESIGN.md 색상, 글꼴, 간격 변수
│  │  └─ fonts.css                 @font-face 등록 (public/fonts 참조)
│  └─ main.tsx
├─ supabase/                       2단계 이후에 만듭니다
│  ├─ migrations/
│  ├─ functions/
│  │  ├─ upload-auth/
│  │  ├─ work-save/
│  │  └─ admin-action/
│  └─ seed.sql                     실제 값 금지
├─ .github/workflows/
│  └─ deploy.yml                   main 푸시 시 GitHub Pages 배포
├─ .env.example                    키 이름만, 값은 비움
├─ .gitignore                      .env, .env.local 제외
├─ CLAUDE.md
├─ DESIGN.md
└─ first-prompt.md
```

- 글꼴 파일은 `public/fonts/`에 둡니다. 이 폴더가 없으면 만들고, 파일이 없어도 기본 글꼴로 대체되게 합니다.
- 페이지는 `src/pages/`, 재사용 부품은 `src/components/`에만 둡니다.
- 데이터 접근은 `src/lib/api.ts`를 거칩니다. 화면 파일에서 직접 샘플 데이터를 가져오지 않습니다.

프로젝트 루트에 있는 CLAUDE.md와 DESIGN.md를 먼저 읽어 주세요. 이 두 파일이 이 프로젝트의 규칙이고, 이후 모든 작업은 이 기준을 따릅니다.

이번 작업은 **1단계: 프로젝트 기반 세팅과 공개 전시 페이지의 뼈대**까지만 합니다. 다음 단계는 내가 확인한 뒤에 진행합니다.

## 1단계 목표

1. Vite + React + TypeScript 프로젝트 생성
2. GitHub Pages 배포를 위한 기본 설정 (vite.config의 base, 404.html 처리, `.github/workflows/deploy.yml`)
3. `.gitignore`에 `.env`, `.env.local` 포함, `.env.example` 생성 (키 이름만, 값은 비움)
4. DESIGN.md의 CSS 변수를 `src/styles/tokens.css`에 그대로 옮기기 (임의 값 추가 금지)
   - 글꼴 파일 네 개는 `public/fonts/`에 둡니다 (파일 이름은 `public/fonts/글꼴_설치_안내.txt` 참고). `@font-face`로 등록하고 `--font-title`, `--font-label`, `--font-body` 변수로 씁니다. 파일이 없으면 기본 글꼴로 대체되게 합니다.
5. 라우팅: `/works`, `/works/:id`, `/upload`, `/admin`, `/privacy` 경로만 생성하고 각 페이지는 제목 한 줄과 빈 상태 문구만 표시
6. 공개 전시 `/works` 화면 구현
   - 헤더: 제목 "2026 수현중 소프트웨어의 날 작품 전시", 오른쪽 `후기 작성 ↗` 링크 (URL은 `src/lib/constants.ts`의 `FEEDBACK_FORM_URL`, 지금은 빈 문자열로 두고 주석 달기)
   - 장르 필터: 텍스트 목록, 단일 선택, 선택 상태는 장르 색 밑줄
   - 검색 입력창 (제목·이름 기준)
   - 벽 배치(masonry): CSS `columns`로 구현. 모바일 2열, 태블릿 3열, 데스크톱 4열. 썸네일은 원본 비율 유지 (`height: auto`), 고정 비율이나 자르기 금지. 카드는 `break-inside: avoid`
   - 제목 아래 소개 문구 표시 (`INTRO_TEXT` 상수 사용)
   - 썸네일이 없으면 `public/default-thumb.png`를 쓰고 작품 제목을 얹기 (파일이 없으면 CSS 배경색으로 대체)
   - 카드 라벨: 번호, 장르, 제목, 이름, `작품 보기 ↗` (새 탭)
   - 썸네일 클릭만 상세로 이동, 나머지 영역 클릭은 무시
7. 샘플 데이터 12개를 `src/data/sample-works.ts`에 넣기 (실제 학생 데이터 아님, 제목과 이름은 "샘플 작품 01" 형식, 장르 5개 고르게 배치, 썸네일 없는 것과 있는 것을 섞기)
8. 데이터 접근은 `src/lib/api.ts`의 함수 하나로 감싸서, 나중에 Supabase로 바꿀 때 화면 코드를 건드리지 않도록 하기

## 제약

- Supabase 연결, 업로드, 로그인 코드는 이번 단계에서 만들지 않습니다.
- 그라데이션, 그림자, 이모지, 기본 시스템 글꼴을 쓰지 않습니다.
- 학교 로고 이미지는 쓰지 않습니다.
- `any` 타입을 쓰지 않습니다.
- 저장소에 실제 학생 데이터, 키, 이메일을 넣지 않습니다.

## 완료 후 보고할 내용

1. 실행 방법과 `npm run build` 결과
2. 만든 파일 목록
3. DESIGN.md와 다르게 구현한 부분이 있으면 그 이유
4. 360px, 768px, 1280px에서 확인한 결과
5. 다음 단계에서 결정이 필요한 항목

작업 중 판단이 필요한 부분이 있으면 임의로 정하지 말고 질문해 주세요.
