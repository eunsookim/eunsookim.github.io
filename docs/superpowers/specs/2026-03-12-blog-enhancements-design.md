# 블로그 기능 강화 설계 (티스토리 기능 + 인라인 이미지 + AI 초안 자동화)

**Date:** 2026-03-12
**Status:** Approved
**Scope:** 공개 블로그, 관리자 에디터, AI 자동화 파이프라인

## 개요

티스토리 블로그의 핵심 기능들을 eunsookim.dev에 도입하고, 에디터 이미지 삽입 기능을 강화하며, AI 기반 블로그 초안 자동 생성 파이프라인을 구축한다.

## 기능 범위

### A. 블로그 UX 강화 (티스토리 기능)

| # | 기능 | 설명 |
|---|------|------|
| A1 | 목차(TOC) 자동 생성 | 마크다운 헤딩 기반 사이드바 목차, 스크롤 추적, 클릭 이동 |
| A2 | 이전글/다음글 네비게이션 | 글 하단에 같은 카테고리 내 이전/다음 글 카드 |
| A3 | 조회수 | 게시글별 조회수 기록 + 표시, 인기글 순위 |
| A4 | 공유 버튼 | Twitter/X, Facebook, 카카오톡, URL 복사 |
| A5 | 관련 글 추천 | 같은 카테고리/태그 기반 관련 글 3-5개 |
| A6 | 좋아요/공감 | 비로그인 공감 버튼 (IP 기반 중복 방지) |
| A7 | 관리자 통계 대시보드 | 방문자 트렌드, 인기 글, 댓글 수 요약 |
| A8 | RSS 피드 | `/feed.xml` — 최신 글 RSS 2.0 |
| A9 | 예약 발행 | 발행 날짜/시간 지정, Vercel Cron으로 자동 공개 |

### B. 인라인 이미지 삽입

| # | 기능 | 설명 |
|---|------|------|
| B1 | 툴바 이미지 버튼 | 에디터 툴바에 이미지 삽입 버튼 → 파일 선택 → 업로드 → `![](url)` 삽입 |
| B2 | 드래그 앤 드롭 | 에디터 영역에 이미지 파일 드롭 → 자동 업로드 + 삽입 |
| B3 | 클립보드 붙여넣기 | Ctrl+V로 스크린샷/이미지 붙여넣기 → 자동 업로드 + 삽입 |
| B4 | Firebase Storage | Supabase Storage 대신 Firebase Storage 사용 (무료 5GB) |

### C. AI 초안 자동 생성

| # | 기능 | 설명 |
|---|------|------|
| C1 | Content Calendar | `content-calendar.md` 파일로 주제/일정 관리 |
| C2 | Vercel Cron + Gemini | 매일 자동 실행 → Gemini API로 초안 생성 → pending 저장 |
| C3 | Claude Code Schedule | 보조 수단 — 수동/즉석 초안 생성 |
| C4 | Admin 초안 관리 | 관리자 대시보드에서 AI 초안 목록 확인, 편집, 발행/삭제 |

---

## A. 블로그 UX 강화 — 상세 설계

### A1. 목차(TOC) 자동 생성

**위치:** 블로그 글 상세 페이지 (`/[lang]/blog/[slug]`)

**구현:**
- 서버에서 마크다운 렌더링 시 헤딩(h2, h3)을 추출하여 TOC 데이터 생성
- 클라이언트 컴포넌트 `TableOfContents`에서 Intersection Observer로 스크롤 위치 추적
- 데스크탑: 우측 사이드바에 sticky 고정
- 모바일: 글 상단에 접이식(collapsible) 목차

**파일:**
- 신규: `src/components/blog/table-of-contents.tsx`
- 수정: `src/app/[lang]/(public)/blog/[slug]/page.tsx` — TOC 추출 + 사이드바 레이아웃

### A2. 이전글/다음글 네비게이션

**위치:** 블로그 글 상세 페이지 하단

**구현:**
- 서버에서 현재 글의 `published_at` 기준으로 이전/다음 글 쿼리
- 같은 카테고리 내에서 탐색 (카테고리 없으면 전체)
- 제목 + 날짜 표시

**파일:**
- 신규: `src/components/blog/post-navigation.tsx`
- 수정: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

### A3. 조회수

**DB 변경:**

```sql
-- posts 테이블에 조회수 컬럼 추가
ALTER TABLE posts ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- 조회수 증가 함수 (RPC)
CREATE OR REPLACE FUNCTION increment_view_count(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**구현:**
- 글 상세 페이지 로드 시 API Route `POST /api/views` 호출
- IP 기반 중복 방지 (24시간 내 동일 IP는 카운트 안 함) — `post_views` 테이블
- 블로그 목록에서 조회수 표시

**DB 변경 — 중복 방지 테이블:**

```sql
CREATE TABLE post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_views_lookup ON post_views(post_id, ip_hash, viewed_at);
```

**파일:**
- 신규: `src/app/api/views/route.ts`
- 수정: `src/lib/types.ts` — Post에 `view_count` 추가
- 수정: 블로그 목록/상세 페이지 — 조회수 표시

### A4. 공유 버튼

**위치:** 블로그 글 상세 페이지 (제목 하단 또는 사이드바)

**구현:**
- 클라이언트 컴포넌트 `ShareButtons`
- Twitter/X: `https://twitter.com/intent/tweet?url=...&text=...`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=...`
- 카카오톡: Kakao JavaScript SDK (`Kakao.Share.sendDefault`)
- URL 복사: `navigator.clipboard.writeText()` + 토스트 알림

**파일:**
- 신규: `src/components/blog/share-buttons.tsx`
- 수정: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

### A5. 관련 글 추천

**위치:** 블로그 글 상세 페이지 하단 (댓글 위)

**구현:**
- 같은 카테고리 글 우선, 없으면 같은 태그 글
- 최대 4개, 현재 글 제외
- 서버 사이드 쿼리

**파일:**
- 신규: `src/components/blog/related-posts.tsx`
- 수정: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

### A6. 좋아요/공감

**DB 변경:**

```sql
ALTER TABLE posts ADD COLUMN like_count integer NOT NULL DEFAULT 0;

CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, ip_hash)
);
```

**구현:**
- 클라이언트 컴포넌트 `LikeButton`
- `POST /api/likes` — IP 해시 기반 중복 체크 (UNIQUE 제약)
- `GET /api/likes?post_id=...` — 현재 IP의 좋아요 여부 확인
- 숫자 + 하트 아이콘, 토글 가능

**파일:**
- 신규: `src/app/api/likes/route.ts`
- 신규: `src/components/blog/like-button.tsx`
- 수정: `src/lib/types.ts` — Post에 `like_count` 추가

### A7. 관리자 통계 대시보드

**위치:** `/admin` 대시보드 페이지 강화

**구현:**
- 요약 카드: 총 글 수, 총 조회수, 총 댓글 수, 총 좋아요 수
- 최근 7일 조회수 트렌드 (간단한 바 차트, CSS만으로)
- 인기 글 Top 5 (조회수 기준)
- 최근 댓글 5개

**파일:**
- 수정: `src/app/admin/(dashboard)/page.tsx` — 대시보드 강화

### A8. RSS 피드

**위치:** `/feed.xml`

**구현:**
- Next.js Route Handler (`src/app/feed.xml/route.ts`)
- RSS 2.0 형식, 최신 20개 발행 글
- `Content-Type: application/xml`
- 한국어/영어 모두 포함 (별도 피드 또는 통합)

**파일:**
- 신규: `src/app/feed.xml/route.ts`

### A9. 예약 발행

**DB 변경:**

```sql
ALTER TABLE posts ADD COLUMN scheduled_at timestamptz;
```

**구현:**
- 에디터에서 발행 시 "즉시 발행" / "예약 발행" 선택
- 예약 발행: `scheduled_at` 설정, `is_published = false` 유지
- Vercel Cron (매 시간) → `POST /api/cron/publish-scheduled` → `scheduled_at <= now()`인 글을 자동 발행

**파일:**
- 수정: `src/components/admin/post-editor.tsx` — 예약 발행 UI
- 신규: `src/app/api/cron/publish-scheduled/route.ts`
- 수정: `src/lib/types.ts` — Post에 `scheduled_at` 추가

---

## B. 인라인 이미지 삽입 — 상세 설계

### B4. Firebase Storage 설정

**Firebase 프로젝트:**
- Google 계정으로 Firebase Console에서 프로젝트 생성
- Storage 활성화 (무료 Spark 플랜: 5GB 저장, 1GB/일 다운로드)
- 보안 규칙: 인증된 사용자만 업로드, 읽기는 공개

**환경 변수:**

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```

**라이브러리:** `firebase` (클라이언트 SDK)

**업로드 경로 규칙:**
- 블로그 이미지: `blog/{post-slug}/{timestamp}-{filename}`
- 새 글 (slug 미확정): `blog/drafts/{uuid}/{timestamp}-{filename}`
- 발행 시 경로 이동 불필요 — Firebase URL은 경로와 무관하게 영구 유효

### B1-B3. 에디터 이미지 삽입

**구현:**
- `src/lib/firebase.ts` — Firebase 초기화 + `uploadImage()` 유틸
- 에디터 커스텀 커맨드 3가지:
  1. **툴바 버튼**: `<input type="file">` 트리거 → `uploadImage()` → 마크다운 삽입
  2. **드래그 앤 드롭**: `onDrop` 이벤트 → `DataTransfer.files` → 업로드 → 삽입
  3. **붙여넣기**: `onPaste` 이벤트 → `clipboardData.items` → Blob → 업로드 → 삽입

**업로드 UX:**
- 업로드 중: `![업로드 중...](uploading)` 플레이스홀더 삽입
- 완료: 플레이스홀더를 실제 URL로 교체
- 실패: 플레이스홀더 제거 + 토스트 에러

**파일:**
- 신규: `src/lib/firebase.ts` — Firebase 초기화 + 업로드 유틸
- 수정: `src/components/admin/post-editor.tsx` — 이미지 삽입 핸들러 추가

---

## C. AI 초안 자동 생성 — 상세 설계

### C1. Content Calendar

**파일:** `content-calendar.md` (Git 저장소 루트)

**형식:**

```markdown
# Content Calendar

## 2026-03-15
- topic: "Next.js 16 Server Components 심화"
- category: Frontend
- tags: [nextjs, react, server-components]
- key_points:
  - RSC vs Client Components 성능 비교
  - 실제 프로젝트 적용 사례
  - 마이그레이션 가이드
- references:
  - https://nextjs.org/docs/app/building-your-application/rendering/server-components
- status: pending

## 2026-03-16
- topic: "Supabase Edge Functions 활용기"
- category: Backend
- tags: [supabase, serverless]
- key_points:
  - Edge Function vs API Route 비교
  - 실제 사용 사례
- references: []
- status: pending
```

**status 값:**
- `pending` — 아직 생성 안 됨
- `generated` — AI 초안 생성 완료
- `published` — 편집 후 발행 완료
- `skipped` — 건너뜀

### C2. Vercel Cron + Gemini API

**스케줄:** 매일 09:00 KST

**vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-draft",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "0 * * * *"
    }
  ]
}
```

**API Route:** `POST /api/cron/generate-draft`

**워크플로우:**
1. `content-calendar.md`를 Supabase Storage 또는 DB에서 읽기 (또는 GitHub API로 Git 파일 읽기)
2. 오늘 날짜의 `pending` 항목 찾기
3. Gemini API (`gemini-2.5-flash`) 호출 — 주제, 키포인트, 참조 URL 전달
4. 생성된 초안을 Supabase `posts` 테이블에 저장:
   - `is_published: false`
   - `status: 'pending_review'` (새 컬럼)
   - `generated_by: 'ai'` (새 컬럼)
   - 한국어 본문 + DeepL 번역으로 영어 본문 생성
5. Content Calendar의 해당 항목 status를 `generated`로 업데이트

**Gemini API 설정:**
- Google AI Studio에서 무료 API 키 발급
- `@google/generative-ai` npm 패키지
- 모델: `gemini-2.5-flash` (무료 250 RPD, 블로그 1개/일에 충분)

**환경 변수:**

```
GEMINI_API_KEY=...
CRON_SECRET=... (Vercel Cron 인증)
```

**Cron 인증:**
- Vercel Cron은 `Authorization: Bearer <CRON_SECRET>` 헤더 전송
- API Route에서 검증

### C3. Claude Code Schedule (보조)

**사용 시나리오:**
- 사용자가 수동으로 특정 주제에 대해 초안 생성 요청
- Content Calendar에 없는 즉석 주제 처리

**설정 방법:**
```bash
# Claude Code에서 스케줄 생성 (선택적)
claude schedule create "매일 오전 9시 content-calendar.md를 읽고 오늘 주제의 블로그 초안을 생성해줘"
```

**한계:** 3일 만료 → 보조 수단으로만 활용, 핵심 자동화는 Vercel Cron 담당

### C4. 관리자 초안 관리 UI

**위치:** `/admin/posts` 페이지 강화

**구현:**
- 탭 분리: "전체 글" | "AI 초안" (status = pending_review 필터)
- 초안 카드: 주제, 생성 날짜, AI 생성 표시 배지
- 액션: [편집] → 기존 에디터, [발행], [삭제], [재생성]

### DB 변경 (C 영역)

```sql
ALTER TABLE posts ADD COLUMN status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'pending_review', 'published', 'scheduled'));
ALTER TABLE posts ADD COLUMN generated_by text
  CHECK (generated_by IN ('human', 'ai'));
```

**기존 데이터 마이그레이션:**
- `is_published = true` → `status = 'published'`
- `is_published = false` → `status = 'draft'`
- 기존 글 → `generated_by = 'human'`

---

## Content Calendar 저장 전략

Content Calendar를 MD 파일로 Git 관리하되, Vercel Cron에서 접근하기 위해 두 가지 방식 가능:

**방식 1: Supabase 테이블 (추천)**
- `content_calendar` 테이블에 주제/일정 저장
- Admin UI에서 관리 가능
- Vercel Cron에서 직접 쿼리

```sql
CREATE TABLE content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date date NOT NULL,
  topic text NOT NULL,
  category_slug text,
  tags text[] DEFAULT '{}',
  key_points text[] DEFAULT '{}',
  references text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generated', 'published', 'skipped')),
  generated_post_id uuid REFERENCES posts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**방식 2: Git MD 파일 + GitHub API**
- `content-calendar.md`를 Git 관리
- Vercel Cron에서 GitHub API로 파일 읽기
- 업데이트 시 GitHub API로 커밋

→ **방식 1 (Supabase 테이블) 추천** — Admin UI 통합이 자연스럽고 Cron 접근이 단순

---

## 데이터 모델 변경 요약

### posts 테이블 — 새 컬럼

| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| view_count | integer | 0 | 조회수 |
| like_count | integer | 0 | 좋아요 수 |
| scheduled_at | timestamptz | null | 예약 발행 시간 |
| status | text | 'draft' | draft / pending_review / published / scheduled |
| generated_by | text | null | human / ai |

### 새 테이블

| 테이블 | 용도 |
|--------|------|
| post_views | 조회수 중복 방지 (IP 해시 + 24시간) |
| post_likes | 좋아요 중복 방지 (IP 해시 UNIQUE) |
| content_calendar | AI 초안 생성 일정 관리 |

---

## 환경 변수 추가

| 변수 | 용도 | 공개 |
|------|------|------|
| NEXT_PUBLIC_FIREBASE_API_KEY | Firebase 클라이언트 | YES |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Firebase 인증 도메인 | YES |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | Firebase 프로젝트 ID | YES |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Firebase Storage 버킷 | YES |
| GEMINI_API_KEY | Google AI Studio API 키 | NO |
| CRON_SECRET | Vercel Cron 인증 토큰 | NO |

---

## 기술 스택 추가

| 영역 | 기술 | 용도 |
|------|------|------|
| 이미지 스토리지 | Firebase Storage | 인라인 이미지 업로드 |
| AI 초안 | Gemini 2.5 Flash (Google AI Studio) | 블로그 초안 자동 생성 |
| 스케줄러 | Vercel Cron | 일일 자동 실행 |
| 스케줄러 (보조) | Claude Code Schedule | 수동/즉석 초안 생성 |
| SNS 공유 | Kakao JS SDK | 카카오톡 공유 |

---

## 파일 변경 요약

### 신규 파일

| 파일 | 용도 |
|------|------|
| `src/lib/firebase.ts` | Firebase 초기화 + 이미지 업로드 유틸 |
| `src/components/blog/table-of-contents.tsx` | TOC 사이드바 |
| `src/components/blog/post-navigation.tsx` | 이전/다음 글 |
| `src/components/blog/share-buttons.tsx` | SNS 공유 버튼 |
| `src/components/blog/related-posts.tsx` | 관련 글 추천 |
| `src/components/blog/like-button.tsx` | 좋아요 버튼 |
| `src/app/api/views/route.ts` | 조회수 API |
| `src/app/api/likes/route.ts` | 좋아요 API |
| `src/app/api/cron/publish-scheduled/route.ts` | 예약 발행 Cron |
| `src/app/api/cron/generate-draft/route.ts` | AI 초안 생성 Cron |
| `src/app/feed.xml/route.ts` | RSS 피드 |
| `vercel.json` | Cron 스케줄 설정 |
| `supabase/migrations/004_blog_enhancements.sql` | DB 마이그레이션 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/types.ts` | Post에 view_count, like_count, scheduled_at, status, generated_by 추가 |
| `src/app/[lang]/(public)/blog/[slug]/page.tsx` | TOC, 공유, 관련글, 이전/다음글, 좋아요 통합 |
| `src/app/[lang]/(public)/blog/page.tsx` | 조회수 표시 |
| `src/components/admin/post-editor.tsx` | 인라인 이미지 삽입 + 예약 발행 UI |
| `src/app/admin/(dashboard)/page.tsx` | 통계 대시보드 강화 |
| `src/app/admin/(dashboard)/posts/page.tsx` | AI 초안 탭 추가 |
| `package.json` | firebase, @google/generative-ai 추가 |
| `.env.local.example` | 새 환경변수 추가 |
