# eunsookim.dev Landing Page Redesign — "Gradient Glow"

## Overview

현재 랜딩 페이지의 구조를 유지하면서 비주얼을 대폭 업그레이드한다. 다이나믹 & 인터랙티브한 "Gradient Glow" 컨셉으로, 풍부한 애니메이션(타이핑, 카운트업, 3D tilt, 마우스 트래킹)을 적용한다. 다크/라이트 모드 둘 다 제작하여 비교 후 선택할 수 있게 한다.

## Design Approach

- **컨셉:** Gradient Glow — 청록색 그라데이션 orb + glow 효과 중심
- **무드:** 다이나믹 & 인터랙티브 (Vercel 스타일)
- **애니메이션 수준:** 풍부 (타이핑, 카운트업, 3D, 마우스 트래킹)
- **모드:** 다크 + 라이트 동시 제작 후 선택

## Branding

- **Primary Color:** `oklch(0.627 0.194 149.2)` (라이트), `oklch(0.792 0.209 151.7)` (다크)
- **Font Sans:** Geist
- **Font Mono:** Geist Mono
- **Border Radius:** `0.625rem` 기본

## Dependencies

- **framer-motion** (신규 설치 필요): 3D tilt, magnetic 효과, stagger, 타이핑 애니메이션 등 JS 기반 인터랙션에 필수
- 기존 `tw-animate-css`는 단순 fade/slide CSS 애니메이션에 활용

## Page Structure

```
Hero (100svh)
  ↓ gradient divider
Tech Stack Showcase
  ↓ gradient divider
Featured Projects (포트폴리오 하이라이트)
  ↓ gradient divider
Latest Posts
  ↓
Footer CTA ("Let's Connect")
```

## Section 1: Hero

### Layout
- 전체 뷰포트 높이(`min-h-svh`, iOS Safari 주소창 호환), 중앙 정렬
- 배경: 청록색 radial gradient orb — 중앙 상단에서 페이드아웃
  - 다크 모드: 강한 발광, 배경 대비 뚜렷
  - 라이트 모드: 투명도 낮춰 은은하게

### Elements
- **태그라인:** pill badge — "Full-Stack Developer & Writer"
- **메인 타이틀:** `eunsookim.dev` — Geist Mono bold, 타이핑 애니메이션 (SSR 시 전체 텍스트 포함, 클라이언트에서 시각적 타이핑만 시뮬레이션하여 SEO 보호)
- **서브 타이틀:** description 텍스트, fade-in 등장
- **CTA 버튼 2개:**
  - Blog (primary filled) — hover 시 glow (box-shadow primary)
  - Portfolio (outlined) — hover 시 glow
- **스크롤 인디케이터:** 하단 화살표 bounce 애니메이션

### Interactions
- 마우스 움직임에 따라 gradient orb 미세 이동 (parallax)
- 타이핑 완료 후 커서 blink 유지

## Section 2: Tech Stack Showcase

### Layout
- 섹션 타이틀: "Tech Stack" — 스크롤 시 fade-up 등장
- 아이콘들이 2-3줄로 배치, 글래스모피즘 카드 위에 표시

### Tech Stack
- **Frontend:** Next.js, React, Svelte, TypeScript, Tailwind CSS
- **Backend:** Supabase, Firebase, Node.js, GraphQL, PostgreSQL, MariaDB, Redis, Python, Go
- **AI:** Gemini, Claude (Anthropic)

### Visual Effects
- 글래스모피즘 카드: `backdrop-blur` + 반투명 보더 (oklch 토큰 기반)
  - 다크: `color-mix(in oklch, var(--foreground) 5%, transparent)` bg, `color-mix(in oklch, var(--foreground) 10%, transparent)` border
  - 라이트: `color-mix(in oklch, var(--foreground) 3%, transparent)` bg, `color-mix(in oklch, var(--foreground) 8%, transparent)` border

### Interactions
- 스크롤 진입 시 stagger scale-up + fade-in
- 호버: 카드 떠오름(translateY -4px) + 청록색 glow border
- 호버 시 tooltip: 기술명 + 한줄 설명
- 마우스 위치 기반 magnetic 효과 (가까운 아이콘 미세 이동)

## Section 3: Featured Projects (포트폴리오 하이라이트)

### Layout
- 섹션 타이틀: "Featured Projects" + "View All" 링크
- 대표 프로젝트 2-3개 가로 카드 (선택 기준: `is_featured = true` 상위 3개, 없으면 최신순 fallback)
- 카드 구성: 좌측 스크린샷/목업 + 우측 제목/설명/기술 태그

### Visual Effects
- 카드 보더: 기본 투명 → 호버 시 gradient border 회전 애니메이션
- 스크린샷: 3D perspective로 기울어져 표시
- Hero에서 이어지는 은은한 gradient 잔향

### Interactions
- 스크롤 진입 시 좌/우 slide-in + fade
- 호버: 3D tilt (마우스 위치 기반, ±5도)
- 호버 시 스크린샷 parallax 이동
- 기술 태그 pill: 호버 시 primary 색상 전환

## Section 4: Latest Posts

### Layout
- 섹션 타이틀: "Latest Posts" + "View All" 링크
- 3열 그리드 (모바일 1열, 태블릿 2열)

### Card Redesign
- 카테고리 badge: 상단 pill, 고유 색상
- 제목: Geist bold, 2줄 line-clamp
- 하단: 날짜 + 읽기 시간 (muted)
- 글래스모피즘 스타일 통일

### Visual Effects
- 다크: 카드 하단 청록색 언더라인 glow
- 라이트: 미세한 shadow + hover 시 확대

### Interactions
- 스크롤 진입 시 stagger 상승 등장
- 호버: translateY -6px + border glow
- 호버 시 제목 primary 전환 + 화살표 slide-in

## Global Elements

- **섹션 구분:** 얇은 gradient divider (청록색 → 투명)
- **Footer CTA:** "Let's Connect" + 이메일/GitHub 링크
- **스크롤 프로그레스 바:** 페이지 최상단 청록색 얇은 bar

## Accessibility

### `prefers-reduced-motion` 전략
- **reduced-motion 활성 시:** 모든 애니메이션 즉시 완성 상태로 표시 (타이핑 → 전체 텍스트 즉시 노출, stagger → 동시 노출)
- **레이아웃 유지:** 애니메이션 제거 시에도 모든 콘텐츠와 레이아웃은 동일하게 유지
- gradient orb, glow 효과 등 정적 비주얼은 유지 (motion이 아닌 시각 효과)

## Implementation Notes

- Pencil MCP로 다크/라이트 목업 동시 제작
- `framer-motion` 신규 설치 필요 — 3D tilt, magnetic, stagger, 타이핑 등 JS 인터랙션 담당
- `tw-animate-css` (기존) — 단순 CSS fade/slide 애니메이션
- 반응형: 모바일 → 태블릿 → 데스크탑 breakpoint 대응
- Hero 높이: `min-h-svh` 사용 (iOS Safari 호환)
- 색상: 글래스모피즘 포함 모든 색상은 oklch 토큰 기반 `color-mix()` 사용
- 타이핑 애니메이션: SSR에서 전체 텍스트 렌더링, 클라이언트에서 시각 효과만 적용 (SEO 보호)
- 성능 고려: `will-change`, `transform` 기반 애니메이션, `prefers-reduced-motion` 지원
