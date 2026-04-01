# Claude Desktop 블로그 초안 자동 생성 파이프라인 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Desktop 스케줄링 + Supabase MCP로 매일 자동 블로그 초안 생성 파이프라인 구축

**Architecture:** Claude Desktop이 매일 07:10 KST에 Supabase MCP로 content_calendar의 당일 pending 항목을 조회하고, 완성도 높은 블로그 초안을 생성하여 posts 테이블에 insert. 기존 Gemini cron은 시간을 분리하여 병행 운영.

**Tech Stack:** Claude Desktop (스케줄링), @supabase/mcp-server-supabase (MCP), Next.js (관리자 UI), Supabase (DB)

**Spec:** `docs/superpowers/specs/2026-03-13-claude-desktop-blog-pipeline-design.md`

---

## Chunk 1: 설정 및 인프라

### Task 1: Gemini cron 시간 변경 (race condition 방지)

**Files:**
- Modify: `vercel.json`

**배경:** 현재 Gemini cron이 `0 0 * * *` (UTC) = 07:10 KST로 설정되어 있어 Claude Desktop 스케줄(07:10 KST)과 충돌. 12:00 KST (03:00 UTC)로 이동하여 Claude가 먼저 처리할 시간을 확보한다.

- [ ] **Step 1: vercel.json 수정**

`vercel.json`의 `generate-draft` cron schedule을 변경:

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/generate-draft",
      "schedule": "0 3 * * *"
    }
  ]
}
```

변경: `"0 0 * * *"` → `"0 3 * * *"` (UTC 03:00 = KST 12:00)

- [ ] **Step 2: 커밋**

```bash
git add vercel.json
git commit -m "chore: move Gemini draft cron to 12:00 KST to avoid Claude Desktop race condition"
```

---

### Task 2: Claude Desktop Supabase MCP 서버 설정

**Files:**
- Modify: `~/Library/Application Support/Claude/claude_desktop_config.json`

**배경:** Claude Desktop에서 Supabase DB에 직접 접근하기 위해 공식 MCP 서버를 추가한다. 현재 설정에는 pencil MCP만 등록되어 있다. Supabase MCP는 **Personal Access Token (PAT)** 기반 인증을 사용한다 (service_role_key가 아님).

- [ ] **Step 1: @supabase/mcp-server-supabase 설치 확인**

```bash
npx -y @supabase/mcp-server-supabase --version
```

버전이 출력되면 패키지 사용 가능. npx로 실행하므로 별도 글로벌 설치 불필요.

- [ ] **Step 2: Supabase Personal Access Token (PAT) 발급**

1. [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)에 로그인
2. Account → Access Tokens → Generate New Token
3. 이름: `claude-desktop-mcp` 등 식별 가능한 이름
4. 생성된 토큰을 안전하게 보관 (한 번만 표시됨)

- [ ] **Step 3: Supabase Project Reference 확인**

프로젝트의 `.env.local`에서 `NEXT_PUBLIC_SUPABASE_URL` 확인:
- URL 형식: `https://<project-ref>.supabase.co`
- `<project-ref>` 부분이 project reference (예: `abcdefghijklmnop`)

- [ ] **Step 4: claude_desktop_config.json에 Supabase MCP 추가**

`~/Library/Application Support/Claude/claude_desktop_config.json`의 `mcpServers`에 추가:

```json
{
  "mcpServers": {
    "pencil": {
      "command": "/Applications/Pencil.app/Contents/Resources/app.asar.unpacked/out/mcp-server-darwin-arm64",
      "args": ["--app", "desktop"],
      "env": {}
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase", "--project-ref", "<PROJECT_REF>"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<Step 2에서 발급한 PAT>"
      }
    }
  },
  "preferences": {
    "quickEntryShortcut": "double-tap-option",
    "quickEntryDictationShortcut": {
      "accelerator": "Ctrl+Space"
    },
    "coworkScheduledTasksEnabled": true,
    "sidebarMode": "code",
    "coworkWebSearchEnabled": true,
    "ccdScheduledTasksEnabled": true
  }
}
```

> **주의:** `<PROJECT_REF>`와 `<PAT>`를 실제 값으로 교체. PAT는 Management API를 통해 SQL을 직접 실행하므로 RLS를 우회한다.

- [ ] **Step 5: Claude Desktop 재시작 후 MCP 연결 확인**

Claude Desktop을 완전히 종료 후 재시작. 새 대화에서 Supabase MCP 도구가 사용 가능한지 확인:

```
Supabase MCP로 content_calendar 테이블의 행 수를 조회해줘.
```

정상 응답이 오면 MCP 연결 성공.

- [ ] **Step 6: RLS 우회 검증**

다음 쿼리로 content_calendar와 posts 테이블에 대한 읽기/쓰기가 모두 가능한지 확인:

```
content_calendar 테이블에서 status가 'pending'인 항목을 조회해줘.
```

Management API 기반이므로 RLS 정책과 무관하게 접근 가능해야 함. 만약 권한 오류 발생 시, PAT의 권한 범위를 확인.

---

### Task 3: Claude Desktop 스케줄 프롬프트 등록

**배경:** Claude Desktop의 스케줄 기능으로 매일 07:10 KST에 자동 실행될 프롬프트를 등록한다.

- [ ] **Step 1: Claude Desktop에서 스케줄 생성**

Claude Desktop → 스케줄(Schedule) 기능에서 새 스케줄 생성:

- **이름:** 블로그 초안 자동 생성
- **실행 주기:** 매일 07:10 KST
- **프롬프트:**

```
당신은 기술 블로그 초안 생성 어시스턴트입니다. Supabase MCP를 사용하여 다음 작업을 수행하세요.

## 1단계: 오늘의 pending 항목 조회

content_calendar 테이블에서 다음 조건의 항목을 조회하세요:
- scheduled_date = 오늘 날짜 (YYYY-MM-DD)
- status = 'pending'

항목이 없으면 "오늘 처리할 항목이 없습니다."라고 보고하고 종료하세요.

## 2단계: 각 항목에 대해 블로그 초안 생성

조회된 각 항목에 대해:

### 2-1. 카테고리 ID 조회
category_slug가 있으면 categories 테이블에서 해당 slug의 id를 조회하세요.

### 2-2. 블로그 글 작성
topic, key_points, references를 기반으로 한국어 블로그 글을 작성하세요.

글 작성 규칙:
- 마크다운 형식, h2/h3 구조
- 분량: 1500-3000자
- 구조: 도입 → 개념 설명 → 코드 예제 → 실전 팁 → 마무리
- 톤: 기술 블로그답게 명확하고 실용적, 경어체 (~합니다, ~입니다)
- 코드 예제는 실행 가능한 수준으로 포함
- key_points에 있는 내용은 반드시 본문에 포함
- references에 있는 자료는 적절히 본문에서 링크로 참조

### 2-3. slug 생성
제목에서 영문/숫자 기반 kebab-case slug를 생성하세요.
- 한글은 적절한 영문 키워드로 변환
- 예: "React Hooks 완벽 가이드" → "react-hooks-complete-guide"
- posts 테이블에서 동일 slug가 이미 존재하는지 확인하고, 존재하면 뒤에 날짜를 붙이세요 (예: react-hooks-complete-guide-2026-03-13)

### 2-4. posts 테이블에 INSERT
다음 필드로 insert:
- slug: 2-3에서 생성한 slug
- title: 생성한 제목
- content: 생성한 마크다운 본문
- excerpt: 본문 내용 기반 2-3문장 요약
- tags: content_calendar의 tags가 있으면 그대로 사용, 없으면 주제 관련 3-5개 생성
- category_id: 2-1에서 조회한 UUID (없으면 null)
- is_published: false
- status: 'pending_review'
- generated_by: 'ai'

INSERT 후 반환된 post id를 기록하세요.

### 2-5. content_calendar 상태 업데이트
해당 calendar 항목을 업데이트:
- status: 'generated'
- generated_post_id: 2-4에서 받은 post id

## 3단계: 결과 보고

처리 결과를 요약하세요:
- 처리된 항목 수
- 각 항목: 주제 → 생성된 글 제목 (slug)
```

- [ ] **Step 2: 테스트 실행**

content_calendar에 오늘 날짜의 테스트 항목을 하나 등록:

```
관리자 캘린더 UI (/admin/calendar)에서:
- 날짜: 오늘
- 주제: "TypeScript 제네릭 기초부터 실전까지"
- 카테고리: (해당 카테고리 slug)
- 태그: typescript, generics, type-safety
- 핵심 포인트:
  - 제네릭이 필요한 이유
  - 기본 문법과 제약 조건
  - 유틸리티 타입 활용
- 참고 자료: (선택)
```

스케줄을 수동 실행하여 초안이 정상적으로 생성되는지 확인.

- [ ] **Step 3: 결과 검증**

확인 사항:
1. `/admin/posts` → AI 초안 탭에 새 글이 나타나는지
2. 글의 status가 `pending_review`인지
3. `generated_by`가 `ai`인지
4. content_calendar의 해당 항목이 `generated`로 변경되었는지
5. 글 내용이 key_points를 모두 포함하는지

검증 완료 후 테스트 글은 삭제하거나 수정하여 실제 발행에 활용.

---

## Chunk 2: 관리자 UI 개선

### Task 4: 캘린더에서 에디터로 이동 링크 추가

**Files:**
- Modify: `src/app/admin/(dashboard)/calendar/page.tsx`

**배경:** CalendarItemCard에서 status가 `generated`이고 `generated_post_id`가 있을 때, 해당 글의 에디터 페이지로 바로 이동할 수 있는 버튼을 추가한다.

- [ ] **Step 1: import에 Link와 Pencil 아이콘 추가**

`src/app/admin/(dashboard)/calendar/page.tsx` 상단 import 수정:

```tsx
// 기존
import { PlusCircle, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

// 변경
import { PlusCircle, Trash2, Loader2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
```

파일 상단에 Link import 추가:

```tsx
import Link from "next/link";
```

- [ ] **Step 2: CalendarItemCard 버튼 영역에 에디터 링크 추가**

`CalendarItemCard` 컴포넌트의 버튼 영역 (`<div className="flex items-center gap-1">` 내부)에서, expand 버튼 앞에 조건부 에디터 링크 추가:

```tsx
<div className="flex items-center gap-1">
  {item.status === "generated" && item.generated_post_id && (
    <Button
      variant="ghost"
      size="icon-sm"
      render={
        <Link href={`/admin/posts/${item.generated_post_id}/edit`} />
      }
      title="초안 편집"
    >
      <Pencil className="size-4 text-primary" />
    </Button>
  )}
  {hasDetails && (
```

generated 상태이고 `generated_post_id`가 있을 때만 연필 아이콘 버튼이 표시됨.

- [ ] **Step 3: 수동 검증**

개발 서버 실행 (`npm run dev`) 후:
1. `/admin/calendar`로 이동
2. status가 `generated`인 항목에 연필 아이콘이 표시되는지 확인
3. 클릭 시 `/admin/posts/[id]/edit` 페이지로 이동하는지 확인
4. `pending` 상태 항목에는 연필 아이콘이 표시되지 않는지 확인

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/(dashboard)/calendar/page.tsx
git commit -m "feat: add editor link to calendar items with generated status"
```

---

## 완료 체크리스트

- [ ] Gemini cron 시간 변경 (vercel.json)
- [ ] Claude Desktop Supabase MCP 연동 확인
- [ ] 스케줄 프롬프트 등록 및 테스트 실행 성공
- [ ] 캘린더 → 에디터 링크 동작 확인
