# 블로그 기능 강화 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 티스토리 핵심 기능 9개 + 인라인 이미지 삽입 + AI 초안 자동 생성 파이프라인 구현

**Architecture:** Next.js 16 App Router + Supabase PostgreSQL + Firebase Storage + Gemini API + Vercel Cron. 공개 블로그 UX 강화, 에디터 이미지 삽입 강화, AI 자동화 파이프라인 구축의 3축으로 진행.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Firebase Storage, Gemini 2.5 Flash, Vercel Cron, Tailwind CSS, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-12-blog-enhancements-design.md`

---

## Chunk 1: 데이터베이스 + 기반 설정

### Task 1: DB 마이그레이션 — posts 테이블 확장

**Files:**
- Create: `supabase/migrations/004_blog_enhancements.sql`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- 004_blog_enhancements.sql

-- A3: 조회수
ALTER TABLE posts ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- A6: 좋아요
ALTER TABLE posts ADD COLUMN like_count integer NOT NULL DEFAULT 0;

-- A9: 예약 발행
ALTER TABLE posts ADD COLUMN scheduled_at timestamptz;

-- C: AI 초안
ALTER TABLE posts ADD COLUMN status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'pending_review', 'published', 'scheduled'));
ALTER TABLE posts ADD COLUMN generated_by text
  CHECK (generated_by IN ('human', 'ai'));

-- 기존 데이터 마이그레이션
UPDATE posts SET status = 'published' WHERE is_published = true;
UPDATE posts SET status = 'draft' WHERE is_published = false;
UPDATE posts SET generated_by = 'human' WHERE generated_by IS NULL;

-- A3: 조회수 중복 방지 테이블
CREATE TABLE post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_views_lookup ON post_views(post_id, ip_hash, viewed_at);

-- A6: 좋아요 중복 방지 테이블
CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, ip_hash)
);

-- C1: 콘텐츠 캘린더 테이블
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

-- A3: 조회수 증가 RPC
CREATE OR REPLACE FUNCTION increment_view_count(target_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 정책
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- post_views: 누구나 INSERT (조회 기록), 읽기는 관리자만
CREATE POLICY "Anyone can record views" ON post_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read views" ON post_views FOR SELECT USING (auth.uid() = (SELECT id FROM auth.users LIMIT 1));

-- post_likes: 누구나 INSERT/SELECT, DELETE는 자기 IP만
CREATE POLICY "Anyone can like" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can unlike" ON post_likes FOR DELETE USING (true);

-- content_calendar: 관리자만 전체 접근
CREATE POLICY "Admin manage calendar" ON content_calendar FOR ALL USING (auth.uid() = (SELECT id FROM auth.users LIMIT 1));
```

- [ ] **Step 2: Supabase Dashboard에서 SQL 실행**

Supabase SQL Editor에서 위 마이그레이션 실행.

- [ ] **Step 3: TypeScript 타입 업데이트**

`src/lib/types.ts`에 새 필드 및 타입 추가:

```typescript
export interface Post {
  // ... 기존 필드
  view_count: number;
  like_count: number;
  scheduled_at: string | null;
  status: 'draft' | 'pending_review' | 'published' | 'scheduled';
  generated_by: 'human' | 'ai' | null;
}

export interface ContentCalendar {
  id: string;
  scheduled_date: string;
  topic: string;
  category_slug: string | null;
  tags: string[];
  key_points: string[];
  references: string[];
  status: 'pending' | 'generated' | 'published' | 'skipped';
  generated_post_id: string | null;
  created_at: string;
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 기존 코드에서 Post 타입 변경으로 인한 에러 발생 가능 → Step 5에서 수정

- [ ] **Step 5: 기존 코드 호환성 수정**

`status` 필드 추가로 인해 기존 포스트 생성/수정 코드에서 `status` 값을 명시적으로 설정하도록 수정:
- `src/components/admin/post-editor.tsx` — 저장 시 `status: 'draft'` 또는 `status: 'published'` 설정
- `src/app/admin/(dashboard)/posts/page.tsx` — 목록 쿼리에 `status` 반영

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations/004_blog_enhancements.sql src/lib/types.ts
git commit -m "feat: add DB schema for view counts, likes, scheduling, AI drafts, content calendar"
```

---

### Task 2: Firebase Storage 설정 + 이미지 업로드 유틸

**Files:**
- Create: `src/lib/firebase.ts`
- Modify: `package.json`
- Modify: `.env.local.example`

- [ ] **Step 1: Firebase 패키지 설치**

Run: `npm install firebase`

- [ ] **Step 2: Firebase 초기화 + 업로드 유틸 작성**

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);

export async function uploadImage(
  file: File,
  path: string,
): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
```

- [ ] **Step 3: .env.local.example 업데이트**

```
# Firebase Storage
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Vercel Cron
CRON_SECRET=your-cron-secret
```

- [ ] **Step 4: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/firebase.ts .env.local.example package.json package-lock.json
git commit -m "feat: add Firebase Storage setup and image upload utility"
```

---

## Chunk 2: 블로그 글 상세 페이지 UX 강화

### Task 3: 목차(TOC) 자동 생성

**Files:**
- Create: `src/components/blog/table-of-contents.tsx`
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: TOC 추출 유틸 작성**

마크다운 콘텐츠에서 `## `, `### ` 헤딩을 파싱하여 `{ id, text, level }[]` 배열 반환하는 함수를 작성. 서버 컴포넌트에서 호출.

- [ ] **Step 2: TOC 클라이언트 컴포넌트 작성**

`src/components/blog/table-of-contents.tsx`:
- `"use client"` — Intersection Observer 사용을 위해
- props: `items: { id: string; text: string; level: number }[]`
- 데스크탑: `sticky top-24` 우측 사이드바
- 모바일: 글 상단 접이식 (Collapsible)
- 현재 읽는 섹션 하이라이트 (IntersectionObserver)
- 클릭 시 `scrollIntoView({ behavior: 'smooth' })`

- [ ] **Step 3: 블로그 상세 페이지 레이아웃 변경**

`src/app/[lang]/(public)/blog/[slug]/page.tsx`:
- 기존: 단일 컬럼 (본문만)
- 변경: 2컬럼 레이아웃 (본문 좌측 + TOC 우측 사이드바)
- `<div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-8">`
- 마크다운 렌더링 시 헤딩에 `id` 속성 자동 부여 (`rehype-slug` 또는 커스텀 플러그인)

- [ ] **Step 4: rehype-slug 설치 및 적용**

Run: `npm install rehype-slug`

마크다운 렌더링 파이프라인에 `rehype-slug` 추가하여 헤딩에 자동 id 부여.

- [ ] **Step 5: 브라우저에서 동작 확인**

- 데스크탑: 사이드바에 목차 표시, 스크롤 추적, 클릭 이동
- 모바일: 접이식 목차

- [ ] **Step 6: 커밋**

```bash
git add src/components/blog/table-of-contents.tsx src/app/[lang]/(public)/blog/[slug]/page.tsx package.json package-lock.json
git commit -m "feat: add auto-generated table of contents with scroll tracking"
```

---

### Task 4: 이전글/다음글 네비게이션

**Files:**
- Create: `src/components/blog/post-navigation.tsx`
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: 이전/다음글 쿼리 작성**

블로그 상세 페이지 서버 컴포넌트에서 Supabase 쿼리:
- 이전글: `published_at < current.published_at` + `ORDER BY published_at DESC LIMIT 1`
- 다음글: `published_at > current.published_at` + `ORDER BY published_at ASC LIMIT 1`
- `is_published = true` 필터

- [ ] **Step 2: PostNavigation 컴포넌트 작성**

`src/components/blog/post-navigation.tsx`:
- 서버 컴포넌트 (데이터 패칭 불필요 — props로 받음)
- 좌측: ← 이전 글 (제목 + 날짜)
- 우측: 다음 글 → (제목 + 날짜)
- 없으면 해당 쪽 비움
- 링크: `/${lang}/blog/${slug}`

- [ ] **Step 3: 상세 페이지에 통합**

댓글 섹션 위에 `<PostNavigation>` 배치.

- [ ] **Step 4: 커밋**

```bash
git add src/components/blog/post-navigation.tsx src/app/[lang]/(public)/blog/[slug]/page.tsx
git commit -m "feat: add previous/next post navigation"
```

---

### Task 5: 조회수 시스템

**Files:**
- Create: `src/app/api/views/route.ts`
- Create: `src/components/blog/view-counter.tsx`
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`
- Modify: `src/app/[lang]/(public)/blog/page.tsx`

- [ ] **Step 1: 조회수 API 작성**

`src/app/api/views/route.ts`:
- `POST` — post_id 받아 조회수 증가
  - IP 해시 생성 (SHA-256, 소금 추가)
  - `post_views`에서 24시간 내 동일 IP 체크
  - 중복 아니면 `post_views` INSERT + `increment_view_count` RPC 호출
- Supabase 서비스 역할 키 사용 (RLS 우회)

- [ ] **Step 2: ViewCounter 클라이언트 컴포넌트 작성**

`src/components/blog/view-counter.tsx`:
- `"use client"`
- 마운트 시 `POST /api/views` 호출 (1회만)
- props로 받은 `initialCount` 표시
- 아이콘(Eye) + 숫자

- [ ] **Step 3: 블로그 상세/목록 페이지에 조회수 표시**

- 상세 페이지: 날짜 옆에 조회수
- 목록 페이지: 각 글 카드에 조회수 (서버 사이드 `select view_count`)

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/views/route.ts src/components/blog/view-counter.tsx
git commit -m "feat: add view count system with IP-based deduplication"
```

---

### Task 6: 공유 버튼

**Files:**
- Create: `src/components/blog/share-buttons.tsx`
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: ShareButtons 컴포넌트 작성**

`src/components/blog/share-buttons.tsx`:
- `"use client"`
- props: `url: string`, `title: string`
- 버튼 4개:
  - Twitter/X: `window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`)`
  - Facebook: `window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`)`
  - 카카오톡: `Kakao.Share.sendDefault(...)` (Kakao JS SDK)
  - URL 복사: `navigator.clipboard.writeText(url)` + 토스트
- lucide-react 아이콘 사용

- [ ] **Step 2: 카카오 JS SDK 설정**

`src/app/layout.tsx` 또는 `src/app/[lang]/layout.tsx`에 Kakao SDK 스크립트 추가:
```html
<Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" />
```
- `NEXT_PUBLIC_KAKAO_JS_KEY` 환경 변수 추가
- 카카오 개발자 사이트에서 JavaScript 키 발급 필요

참고: 카카오톡 공유는 선택 사항. 카카오 개발자 등록이 번거로우면 나머지 3개(Twitter, Facebook, URL 복사)만으로도 충분.

- [ ] **Step 3: 상세 페이지에 통합**

제목 하단 또는 글 하단에 배치.

- [ ] **Step 4: 커밋**

```bash
git add src/components/blog/share-buttons.tsx
git commit -m "feat: add social share buttons (Twitter, Facebook, copy URL)"
```

---

### Task 7: 관련 글 추천

**Files:**
- Create: `src/components/blog/related-posts.tsx`
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: 관련 글 쿼리 작성**

서버 컴포넌트에서:
1. 같은 카테고리 글 쿼리 (현재 글 제외, 최대 4개, 최신순)
2. 부족하면 같은 태그가 겹치는 글로 보충
3. `slug, title, title_en, excerpt, excerpt_en, published_at, cover_image` 선택

- [ ] **Step 2: RelatedPosts 컴포넌트 작성**

`src/components/blog/related-posts.tsx`:
- 서버 컴포넌트 (props로 데이터 수신)
- 2x2 또는 1x4 그리드 카드
- 각 카드: 커버 이미지 (있으면), 제목, 요약 일부, 날짜
- 링크: `/${lang}/blog/${slug}`

- [ ] **Step 3: 상세 페이지에 통합**

댓글 위, 이전/다음글 위에 배치.

- [ ] **Step 4: 커밋**

```bash
git add src/components/blog/related-posts.tsx
git commit -m "feat: add related posts recommendation section"
```

---

### Task 8: 좋아요/공감

**Files:**
- Create: `src/app/api/likes/route.ts`
- Create: `src/components/blog/like-button.tsx`
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: 좋아요 API 작성**

`src/app/api/likes/route.ts`:
- `POST` — 좋아요 토글
  - IP 해시 생성
  - `post_likes`에 해당 IP 있으면 DELETE + `like_count - 1`
  - 없으면 INSERT + `like_count + 1`
  - 현재 좋아요 상태 + 총 수 반환
- `GET ?post_id=...` — 현재 IP의 좋아요 여부 + 총 수 반환

- [ ] **Step 2: LikeButton 클라이언트 컴포넌트 작성**

`src/components/blog/like-button.tsx`:
- `"use client"`
- 하트 아이콘 (Heart from lucide-react)
- 좋아요 상태: 비어있는 하트 / 채워진 하트
- 클릭 시 토글 (optimistic update)
- 숫자 표시

- [ ] **Step 3: 상세 페이지에 통합**

공유 버튼 옆 또는 글 하단에 배치.

- [ ] **Step 4: 커밋**

```bash
git add src/app/api/likes/route.ts src/components/blog/like-button.tsx
git commit -m "feat: add like/unlike system with IP-based deduplication"
```

---

## Chunk 3: 에디터 강화 + 관리자 기능

### Task 9: 에디터 인라인 이미지 삽입 (툴바 + 드래그드롭 + 붙여넣기)

**Files:**
- Modify: `src/components/admin/post-editor.tsx`

- [ ] **Step 1: 이미지 업로드 핸들러 작성**

`post-editor.tsx` 내에 `handleImageUpload` 함수:
1. File 객체 받기
2. 파일 타입/크기 검증 (JPEG, PNG, WebP, GIF / 5MB)
3. Firebase Storage에 업로드 (`uploadImage` 호출)
4. 업로드 중: 에디터에 `![업로드 중...](uploading)` 플레이스홀더 삽입
5. 완료: 플레이스홀더를 `![image](firebaseUrl)` 로 교체
6. 실패: 플레이스홀더 제거 + 토스트 에러

경로: `blog/{slug 또는 uuid}/{Date.now()}-{filename}`

- [ ] **Step 2: 툴바 이미지 버튼 추가**

@uiw/react-md-editor의 `commands` prop에 커스텀 이미지 명령 추가:
- 아이콘: `Image` (lucide-react)
- 클릭 시 숨겨진 `<input type="file" accept="image/*">` 트리거
- 파일 선택 시 `handleImageUpload` 호출

- [ ] **Step 3: 드래그 앤 드롭 핸들러**

에디터 래퍼 div에:
- `onDragOver`: `e.preventDefault()` + 드롭 영역 하이라이트
- `onDragLeave`: 하이라이트 제거
- `onDrop`: `e.dataTransfer.files`에서 이미지 추출 → `handleImageUpload`

- [ ] **Step 4: 클립보드 붙여넣기 핸들러**

에디터 래퍼 div에:
- `onPaste`: `e.clipboardData.items`에서 이미지 타입 확인
  - 이미지 있으면 `e.preventDefault()` + `getAsFile()` → `handleImageUpload`
  - 이미지 없으면 기본 동작 (텍스트 붙여넣기)

- [ ] **Step 5: 동작 확인**

- 툴바 버튼으로 이미지 삽입
- 파일 드래그 앤 드롭으로 삽입
- 스크린샷 Ctrl+V로 삽입
- 각각 Firebase Storage에 업로드 확인

- [ ] **Step 6: 커밋**

```bash
git add src/components/admin/post-editor.tsx
git commit -m "feat: add inline image insertion (toolbar, drag-drop, clipboard paste) with Firebase Storage"
```

---

### Task 10: 예약 발행

**Files:**
- Modify: `src/components/admin/post-editor.tsx`
- Create: `src/app/api/cron/publish-scheduled/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: 에디터에 예약 발행 UI 추가**

"발행" 버튼 옆에 "예약 발행" 옵션:
- 드롭다운 또는 Popover로 날짜/시간 선택
- `<input type="datetime-local">` 사용
- 선택 시 `scheduled_at` 설정, `status: 'scheduled'`, `is_published: false`로 저장

- [ ] **Step 2: 예약 발행 Cron API 작성**

`src/app/api/cron/publish-scheduled/route.ts`:
- `GET` 메서드 (Vercel Cron은 GET 호출)
- `Authorization: Bearer <CRON_SECRET>` 검증
- `scheduled_at <= now()` AND `status = 'scheduled'` 인 글 쿼리
- 해당 글들을 `is_published: true`, `status: 'published'`, `published_at: now()` 업데이트

- [ ] **Step 3: vercel.json Cron 설정**

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "0 * * * *"
    }
  ]
}
```

매시간 실행하여 예약된 글 자동 발행.

- [ ] **Step 4: 커밋**

```bash
git add src/components/admin/post-editor.tsx src/app/api/cron/publish-scheduled/route.ts vercel.json
git commit -m "feat: add scheduled publishing with Vercel Cron"
```

---

### Task 11: 관리자 통계 대시보드

**Files:**
- Modify: `src/app/admin/(dashboard)/page.tsx`

- [ ] **Step 1: 통계 데이터 쿼리 작성**

Supabase 서비스 역할 키로:
- 총 글 수 (`posts` count where `is_published`)
- 총 조회수 (`SUM(view_count)`)
- 총 좋아요 수 (`SUM(like_count)`)
- 총 댓글 수 (`comments` count)
- 인기 글 Top 5 (`ORDER BY view_count DESC LIMIT 5`)
- 최근 7일 조회수 트렌드 (`post_views` GROUP BY date)
- 최근 댓글 5개
- AI 초안 대기 수 (`status = 'pending_review'` count)

- [ ] **Step 2: 대시보드 UI 구현**

- 상단: 요약 카드 4개 (글, 조회수, 좋아요, 댓글)
- 중단: 7일 조회수 트렌드 (CSS 바 차트 — 라이브러리 없이)
- 하단 좌: 인기 글 Top 5 목록
- 하단 우: 최근 댓글 5개 + AI 초안 대기 알림

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/(dashboard)/page.tsx
git commit -m "feat: enhance admin dashboard with stats, trending chart, popular posts"
```

---

### Task 12: RSS 피드

**Files:**
- Create: `src/app/feed.xml/route.ts`

- [ ] **Step 1: RSS Route Handler 작성**

`src/app/feed.xml/route.ts`:
- `GET` — RSS 2.0 XML 반환
- 최신 발행 글 20개 쿼리
- 각 항목: `<item>` with `<title>`, `<link>`, `<description>`, `<pubDate>`, `<guid>`
- `Content-Type: application/xml; charset=utf-8`
- 한국어 기본, `title_en`이 있으면 영어도 포함 (또는 별도 `/en/feed.xml`)

- [ ] **Step 2: 헤더에 RSS 링크 추가**

`<head>`에 `<link rel="alternate" type="application/rss+xml" href="/feed.xml" />` 추가.

- [ ] **Step 3: 커밋**

```bash
git add src/app/feed.xml/route.ts
git commit -m "feat: add RSS 2.0 feed"
```

---

### Task 13: 관리자 글 목록 AI 초안 탭

**Files:**
- Modify: `src/app/admin/(dashboard)/posts/page.tsx`

- [ ] **Step 1: 탭 UI 추가**

기존 글 목록 위에 탭 추가: "전체 글" | "AI 초안"
- "AI 초안" 탭: `status = 'pending_review'` 필터
- AI 초안에 "AI 생성" 배지 표시
- 액션: [편집], [발행], [삭제]

- [ ] **Step 2: 커밋**

```bash
git add src/app/admin/(dashboard)/posts/page.tsx
git commit -m "feat: add AI drafts tab to admin posts list"
```

---

## Chunk 4: AI 초안 자동 생성 파이프라인

### Task 14: Gemini API 연동 유틸

**Files:**
- Create: `src/lib/gemini.ts`
- Modify: `package.json`

- [ ] **Step 1: Gemini 패키지 설치**

Run: `npm install @google/generative-ai`

- [ ] **Step 2: Gemini 유틸 작성**

`src/lib/gemini.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateBlogDraft(params: {
  topic: string;
  keyPoints: string[];
  references: string[];
  categorySlug?: string;
}): Promise<{ title: string; content: string; excerpt: string; tags: string[] }> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `당신은 기술 블로그 작성자입니다. 다음 주제로 한국어 블로그 초안을 작성하세요.

주제: ${params.topic}
핵심 포인트:
${params.keyPoints.map((p) => `- ${p}`).join("\n")}
${params.references.length > 0 ? `참고 자료:\n${params.references.map((r) => `- ${r}`).join("\n")}` : ""}

요구사항:
1. 제목 (title): 매력적이고 SEO에 좋은 제목
2. 본문 (content): 마크다운 형식, h2/h3 구조, 코드 예제 포함
3. 요약 (excerpt): 2-3문장
4. 태그 (tags): 관련 태그 3-5개

JSON 형식으로 응답하세요:
{"title": "...", "content": "...", "excerpt": "...", "tags": ["..."]}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // JSON 파싱 (코드 블록 제거)
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(jsonStr);
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add src/lib/gemini.ts package.json package-lock.json
git commit -m "feat: add Gemini API utility for blog draft generation"
```

---

### Task 15: AI 초안 생성 Cron API

**Files:**
- Create: `src/app/api/cron/generate-draft/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Cron API Route 작성**

`src/app/api/cron/generate-draft/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBlogDraft } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 오늘 날짜의 pending 캘린더 항목 조회
  const today = new Date().toISOString().split("T")[0];
  const { data: calendarItems } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("scheduled_date", today)
    .eq("status", "pending");

  if (!calendarItems || calendarItems.length === 0) {
    return NextResponse.json({ message: "No pending items for today" });
  }

  const results = [];

  for (const item of calendarItems) {
    // Gemini로 초안 생성
    const draft = await generateBlogDraft({
      topic: item.topic,
      keyPoints: item.key_points,
      references: item.references,
      categorySlug: item.category_slug,
    });

    // 카테고리 ID 조회
    let categoryId = null;
    if (item.category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", item.category_slug)
        .single();
      categoryId = cat?.id ?? null;
    }

    // 포스트 저장
    const slug = draft.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: post } = await supabase
      .from("posts")
      .insert({
        slug,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        tags: draft.tags,
        category_id: categoryId,
        is_published: false,
        status: "pending_review",
        generated_by: "ai",
      })
      .select("id")
      .single();

    // 캘린더 상태 업데이트
    await supabase
      .from("content_calendar")
      .update({
        status: "generated",
        generated_post_id: post?.id,
      })
      .eq("id", item.id);

    results.push({ topic: item.topic, postId: post?.id });
  }

  return NextResponse.json({ generated: results });
}
```

- [ ] **Step 2: vercel.json에 Cron 추가**

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/generate-draft",
      "schedule": "0 0 * * *"
    }
  ]
}
```

`0 0 * * *` = 매일 UTC 00:00 (KST 09:00)

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/cron/generate-draft/route.ts vercel.json
git commit -m "feat: add Vercel Cron + Gemini API daily blog draft generation"
```

---

### Task 16: 콘텐츠 캘린더 관리 UI

**Files:**
- Create: `src/app/admin/(dashboard)/calendar/page.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`

- [ ] **Step 1: 캘린더 관리 페이지 작성**

`src/app/admin/(dashboard)/calendar/page.tsx`:
- 캘린더 항목 목록 (날짜, 주제, 상태)
- 새 항목 추가 다이얼로그: 날짜, 주제, 카테고리, 태그, 핵심 포인트, 참고 자료
- 상태별 필터 (pending, generated, published, skipped)
- 삭제 기능

- [ ] **Step 2: 사이드바에 캘린더 메뉴 추가**

`src/components/admin/admin-sidebar.tsx`에 "콘텐츠 캘린더" 메뉴 항목 추가.

- [ ] **Step 3: 커밋**

```bash
git add src/app/admin/(dashboard)/calendar/page.tsx src/components/admin/admin-sidebar.tsx
git commit -m "feat: add content calendar management UI for AI draft scheduling"
```

---

### Task 17: Claude Code Schedule 설정 가이드

**Files:**
- Create: `docs/claude-code-schedule.md`

- [ ] **Step 1: 가이드 문서 작성**

Claude Code에서 수동/즉석 초안 생성을 위한 설정 가이드:

```markdown
# Claude Code Schedule — 블로그 초안 생성

## 즉석 초안 생성 (수동)

Claude Code에서 직접 요청:
"content-calendar.md에서 오늘 주제를 읽고 블로그 초안을 생성해서 /api/cron/generate-draft를 호출해줘"

## 스케줄 생성 (3일간 유효)

Claude Code에서:
"/schedule 매일 오전 9시에 content-calendar.md를 확인하고 오늘 주제로 블로그 초안 생성"

참고: 3일 만료 제한이 있으므로 핵심 자동화는 Vercel Cron이 담당합니다.
```

- [ ] **Step 2: 커밋**

```bash
git add docs/claude-code-schedule.md
git commit -m "docs: add Claude Code schedule guide for blog draft generation"
```

---

## Chunk 5: 마무리 + 통합 테스트

### Task 18: 패키지 설치 + 환경 변수 정리

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example`

- [ ] **Step 1: 전체 의존성 확인**

신규 패키지 목록:
- `firebase` — Firebase Storage
- `@google/generative-ai` — Gemini API
- `rehype-slug` — 마크다운 헤딩 ID 부여

- [ ] **Step 2: .env.local.example 최종 확인**

모든 새 환경 변수가 포함되어 있는지 확인:
```
# Firebase Storage
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

# Gemini AI
GEMINI_API_KEY=

# Vercel Cron
CRON_SECRET=

# Kakao (선택)
NEXT_PUBLIC_KAKAO_JS_KEY=
```

- [ ] **Step 3: 커밋**

```bash
git add .env.local.example
git commit -m "chore: finalize environment variables for blog enhancements"
```

---

### Task 19: 블로그 상세 페이지 통합 레이아웃

**Files:**
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: 전체 컴포넌트 배치 확인**

블로그 상세 페이지의 최종 레이아웃:

```
┌─────────────────────────────────────────────────────────┐
│  [← Blog]                                               │
├─────────────────────────────────┬───────────────────────┤
│                                 │  📑 목차 (TOC)         │
│  📝 제목                        │  ├ 섹션 1             │
│  📅 날짜 · 👁 조회수 · ❤ 좋아요   │  ├ 섹션 2             │
│  🏷 카테고리 · 태그들             │  └ 섹션 3             │
│                                 │                       │
│  [공유 버튼: X · FB · 링크복사]    │                       │
│                                 │                       │
│  ─── 본문 (마크다운) ───          │                       │
│                                 │                       │
│                                 │                       │
├─────────────────────────────────┴───────────────────────┤
│  📎 관련 글 추천 (4개 카드)                               │
├─────────────────────────────────────────────────────────┤
│  ← 이전 글          │          다음 글 →                 │
├─────────────────────────────────────────────────────────┤
│  💬 댓글 섹션                                            │
└─────────────────────────────────────────────────────────┘
```

- [ ] **Step 2: 레이아웃 통합 및 반응형 확인**

- 데스크탑: 2컬럼 (본문 + TOC 사이드바)
- 모바일: 1컬럼 (TOC 접이식)
- 각 컴포넌트가 올바른 순서로 배치되었는지 확인

- [ ] **Step 3: 커밋**

```bash
git add src/app/[lang]/(public)/blog/[slug]/page.tsx
git commit -m "feat: integrate all blog detail page enhancements into unified layout"
```

---

### Task 20: 전체 빌드 + 타입 체크

- [ ] **Step 1: TypeScript 체크**

Run: `npx tsc --noEmit`
Expected: PASS (0 errors)

- [ ] **Step 2: Next.js 빌드**

Run: `npm run build`
Expected: 모든 페이지 빌드 성공

- [ ] **Step 3: 빌드 에러 수정 (있으면)**

에러 발생 시 해당 파일 수정 후 재빌드.

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "chore: fix build errors and finalize blog enhancements"
```
