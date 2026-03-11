# eunsookim.dev — 개인 기술 블로그 설계

**Date:** 2026-03-11
**Status:** Approved

## 개요

기술 중심 + 견해/아이디어를 다루는 개인 블로그. 페이지에서 직접 글을 쓰고 볼 수 있는 풀스택 블로그 플랫폼.

## 기존 기획(001-initial-setup)과의 관계

이 설계는 `specs/001-initial-setup/`의 기획을 **완전히 대체**합니다. 주요 변경점:

| 항목 | 기존 (001-initial-setup) | 변경 후 |
|------|--------------------------|---------|
| 호스팅 | GitHub Pages (정적, `output: export`) | **Vercel** (SSR 지원) |
| 스토리지 | Google Cloud Storage + Edge Function | **Supabase Storage** (통합) |
| 인증 | 클라이언트 사이드 (LocalStorage + useEffect) | **서버 사이드** (@supabase/ssr + httpOnly 쿠키 + Middleware) |
| 범위 | Foundation Only (CMS UI 제외) | **풀스택** (에디터, 관리자 대시보드 포함) |
| 필드명 | `demo_path`, `thumbnail_url` | `demo_url`, `thumbnail` (의도적 변경) |

**제거 대상 (기존 기획 산출물):**
- `specs/001-initial-setup/` — 새 설계로 대체
- `StorageService` 인터페이스, `scripts/upload-asset.ts` 계획 — GCS 관련 코드 전부 제거
- `next.config.mjs`의 `output: 'export'` 설정 — Vercel SSR로 전환
- Supabase Edge Function (GCS Signed URL) 계획 — 불필요

## 요구사항

- 본인만 글을 쓰는 개인 블로그 (관리자 1명)
- 하이브리드 마크다운 에디터 (마크다운 입력 + 실시간 미리보기)
- 인증 토큰 보안 관리 (Supabase Auth, httpOnly 쿠키)
- 블로그 + 포트폴리오 섹션
- 카테고리 + 태그 + 시리즈 분류 체계
- 다크/라이트 모드 (시스템 감지 + 수동 전환)
- SEO 최적화 (SSR)
- 댓글 기능 (GitHub Discussions 기반)

## 아키텍처

```
Vercel (호스팅)
└── Next.js 14+ (App Router)
    ├── Server Components — 공개 페이지 (SSR, SEO)
    ├── Client Components — 관리자 페이지 (에디터, 대시보드)
    └── API Routes — 인증 처리, CRUD, 이미지 업로드
        └── Supabase
            ├── PostgreSQL (posts, projects, categories, series)
            ├── Auth (JWT, httpOnly 쿠키)
            └── Storage (이미지)
```

- 공개 페이지: Server Components로 SSR → SEO 최적
- 관리자 페이지: Client Components + API Routes → 인증 보호
- 인증: Supabase Auth → @supabase/ssr → httpOnly 쿠키 → Middleware 검증

## 데이터 모델

### posts
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() | 기본 키 |
| slug | text (UNIQUE) | NO | — | URL 식별자 |
| title | text | NO | — | 제목 |
| content | text | YES | — | 마크다운 본문 |
| excerpt | text | YES | — | 미리보기 요약 |
| cover_image | text | YES | — | 커버 이미지 URL (Supabase Storage) |
| category_id | UUID (FK → categories) | YES | — | 카테고리 참조. null 허용 (미분류 글 가능) |
| series_id | UUID (FK → series) | YES | — | 시리즈 참조. null이면 독립 글 |
| series_order | int | YES | — | 시리즈 내 순서. series_id가 null이면 무시 |
| is_published | boolean | NO | false | 발행 여부. false = 임시 저장(draft) |
| published_at | timestamptz | YES | — | 발행일. 첫 발행 시 자동 설정 |
| tags | text[] | NO | '{}' | 태그 배열 |
| created_at | timestamptz | NO | now() | 생성일 |
| updated_at | timestamptz | NO | now() | 수정일. 애플리케이션 레벨에서 UPDATE 시 명시적으로 갱신 |

### posts 제약 조건
- `series_order`에 partial unique index: `CREATE UNIQUE INDEX ON posts(series_id, series_order) WHERE series_id IS NOT NULL`

### projects
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() | 기본 키 |
| slug | text (UNIQUE) | NO | — | URL 식별자 |
| title | text | NO | — | 프로젝트명 |
| description | text | YES | — | 상세 설명 |
| demo_url | text | YES | — | 데모 URL (외부 링크 가능) |
| github_url | text | YES | — | GitHub 링크 |
| thumbnail | text | YES | — | 썸네일 URL (Supabase Storage) |
| tech_stack | text[] | NO | '{}' | 기술 스택 |
| created_at | timestamptz | NO | now() | 생성일 |
| updated_at | timestamptz | NO | now() | 수정일. 애플리케이션 레벨에서 UPDATE 시 명시적으로 갱신 |

### categories
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() | 기본 키 |
| name | text (UNIQUE) | NO | — | 카테고리명 |
| slug | text (UNIQUE) | NO | — | URL 식별자 |
| description | text | YES | — | 설명 |
| color | text | YES | — | 표시 색상 (hex) |
| created_at | timestamptz | NO | now() | 생성일 |

### series
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() | 기본 키 |
| title | text | NO | — | 시리즈명 |
| slug | text (UNIQUE) | NO | — | URL 식별자 |
| description | text | YES | — | 설명 |
| created_at | timestamptz | NO | now() | 생성일 |
| updated_at | timestamptz | NO | now() | 수정일 |

## RLS 정책

### 관리자 식별 방식
- Supabase Dashboard에서 관리자 계정 1개 생성
- 마이그레이션 SQL에 관리자 UUID를 직접 기입 (환경 변수가 아닌 SQL 상수)
- 애플리케이션 환경 변수 `ADMIN_USER_ID`는 Middleware/API Route에서 사용

### 읽기 (SELECT)
- **posts:** 공개 사용자는 `is_published = true`만, 관리자는 전체 (draft 포함)
- **projects:** 전체 공개 읽기 허용
- **categories, series:** 전체 공개 읽기 허용

### 쓰기 (INSERT, UPDATE, DELETE)
- **모든 테이블:** 관리자 UUID 일치 시에만 허용

```sql
-- 관리자 UUID (Supabase Dashboard에서 생성 후 여기에 기입)
-- 실제 배포 시 아래 UUID를 관리자 계정의 실제 UUID로 교체

-- posts: 공개 읽기 (발행된 글만) + 관리자 전체 관리 (draft 포함, FOR ALL이 SELECT 포함)
CREATE POLICY "Public read published posts" ON public.posts
    FOR SELECT USING (is_published = true);
CREATE POLICY "Admin manage posts" ON public.posts
    FOR ALL USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);

-- projects, categories, series: 동일 패턴
CREATE POLICY "Public read projects" ON public.projects
    FOR SELECT USING (true);
CREATE POLICY "Admin manage projects" ON public.projects
    FOR ALL USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);
```

### Supabase Storage 정책
- **버킷명:** `assets` (public bucket)
- **읽기:** 공개 (이미지 URL로 직접 접근 가능)
- **업로드/삭제:** 인증된 관리자만 (`auth.uid() = ADMIN_UUID`)

## 페이지 구조

### 공개 페이지 (SSR)
| 경로 | 설명 |
|------|------|
| `/` | 홈 — 최신 글 + 소개 |
| `/blog` | 블로그 목록 — 카테고리 필터, 태그 필터, 검색 |
| `/blog/[slug]` | 글 상세 — 마크다운 렌더링, 시리즈 네비게이션, giscus 댓글 |
| `/blog/series/[slug]` | 시리즈 목록 — 연재글 모아보기 |
| `/portfolio` | 포트폴리오 목록 — 프로젝트 카드 그리드 |
| `/portfolio/[slug]` | 프로젝트 상세 — 설명, 기술 스택, 데모/GitHub 링크 |
| `/about` | 소개 — 코드에 하드코딩 (DB 관리 불필요) |

### 관리자 페이지 (인증 필요)
| 경로 | 설명 |
|------|------|
| `/admin/login` | 관리자 로그인 |
| `/admin` | 대시보드 — 글 수, 최근 글, 빠른 작성 |
| `/admin/posts` | 글 관리 — 목록, 검색, 발행/비공개 전환 |
| `/admin/posts/new` | 글 작성 — 하이브리드 마크다운 에디터 |
| `/admin/posts/[id]/edit` | 글 수정 |
| `/admin/portfolio` | 포트폴리오 관리 |
| `/admin/categories` | 카테고리/시리즈 관리 — 탭 UI로 카테고리 탭, 시리즈 탭 분리 |

### 페이지네이션
- **블로그 목록 (`/blog`):** offset 기반, 한 페이지당 10개
- **관리자 글 목록 (`/admin/posts`):** offset 기반, 한 페이지당 20개
- **포트폴리오:** 페이지네이션 없음 (전체 로드, 프로젝트 수가 적으므로)

### 검색 (`/blog`)
- Supabase `ilike` 기반 제목 + excerpt 검색 (서버 사이드)
- 카테고리 필터, 태그 필터와 조합 가능
- full-text search는 글이 충분히 쌓인 후 필요 시 도입

## 메뉴 구조

코드에 고정 (DB 저장 불필요):
- **Blog** — 글 목록, 카테고리 필터로 기술/견해/아이디어 구분
- **Portfolio** — 프로젝트 쇼케이스
- **About** — 자기 소개 (코드에 하드코딩)

## 에디터 설계

- 상단: 제목 입력 + 임시 저장/발행 버튼
- 메타 바: 카테고리, 시리즈, 태그, 커버 이미지 선택
- 하단 분할: 왼쪽 마크다운 입력 | 오른쪽 실시간 미리보기
- 라이브러리: @uiw/react-md-editor
- 이미지: Supabase Storage에 드래그앤드롭 업로드

### 임시 저장 메커니즘
- **임시 저장 버튼 클릭:** DB에 `is_published: false` 상태로 저장. `/admin/posts`에서 draft 목록 확인 가능
- **자동 저장:** 30초 간격으로 localStorage에 현재 편집 내용 백업 (네트워크 끊김 대비)
- **발행 버튼 클릭:** DB에 `is_published: true`로 저장, `published_at` 자동 설정
- **페이지 이탈 시:** 미저장 변경사항이 있으면 `beforeunload` 경고

### 이미지 업로드 정책
- **허용 포맷:** JPEG, PNG, WebP, GIF
- **최대 파일 크기:** 5MB
- **저장 경로:** 새 글 작성 시(slug 미확정) → `temp/{uuid}/{filename}`, 저장 시 `blog/{post-slug}/{filename}`으로 이동. 포트폴리오는 `portfolio/{project-slug}/{filename}`
- **리사이징:** 업로드 시 처리 없음 (필요 시 Next.js Image 컴포넌트가 최적화)

## 테마 & 디자인 시스템

- **베이스:** shadcn/ui + Tailwind CSS
- **컬러:** Green (터미널) — Stone 배경 + 초록 포인트
- **다크/라이트:** next-themes, 시스템 설정 감지 + 수동 전환 토글
- **코드 블록 (공개 페이지):** rehype-pretty-code + shiki — 빌드 타임에 코드 블록 하이라이팅
- **코드 블록 (에디터 미리보기):** @uiw/react-md-editor 내장 하이라이팅 — 실시간 미리보기용. 공개 페이지와 100% 일치하지 않을 수 있으나, 작성 편의를 위한 근사치 제공

## 인증

- Supabase Auth (이메일 + 비밀번호)
- @supabase/ssr로 httpOnly 쿠키에 JWT 저장
- Next.js Middleware에서 /admin/* 경로 토큰 검증
- 관리자 계정: Supabase Dashboard에서 1개만 생성 (회원가입 UI 없음)
- 관리자 식별: `auth.uid()` 기반, 환경 변수 `ADMIN_USER_ID`로 관리

## 댓글

- giscus (GitHub Discussions 기반)
- `/blog/[slug]` 글 하단에 삽입
- 다크/라이트 테마 자동 연동

## 에러 처리

- 인증 실패 → 로그인 페이지 리다이렉트 + 에러 메시지
- API 실패 → shadcn/ui Toast 알림
- 글 작성 중 네트워크 끊김 → localStorage 자동 백업에서 복구
- 이미지 업로드 실패 → Toast 알림 + 재시도 안내

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14+ (App Router) |
| 언어 | TypeScript 5+ |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 테마 | next-themes |
| 에디터 | @uiw/react-md-editor |
| DB | Supabase (PostgreSQL) |
| 인증 | Supabase Auth + @supabase/ssr |
| 스토리지 | Supabase Storage |
| 댓글 | giscus |
| 호스팅 | Vercel |
| 코드 하이라이팅 | rehype-pretty-code + shiki |

## 환경 변수

| 변수명 | 용도 | 공개 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | YES |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 (공개 읽기용) | YES |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (서버 전용) | NO |
| `ADMIN_USER_ID` | 관리자 UUID (Middleware/API Route용) | NO |
| `NEXT_PUBLIC_GISCUS_REPO` | giscus 연동 GitHub 저장소 | YES |
| `NEXT_PUBLIC_GISCUS_REPO_ID` | giscus 저장소 ID | YES |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID` | giscus 카테고리 ID | YES |

## 프로젝트 폴더명 변경

**실행 시점:** 구현 시작 전 (전제 조건). Phase 0으로 가장 먼저 실행.

- **변경 대상:** 로컬 폴더명 + GitHub 저장소명
- **변경:** `eunsookim.github.io` → `eunsookim.dev`
- **도메인:** Vercel에서 `eunsookim.dev` 커스텀 도메인 연결 (DNS 설정 필요)
- **기존 GitHub Pages:** 저장소명 변경 시 자동 비활성화
