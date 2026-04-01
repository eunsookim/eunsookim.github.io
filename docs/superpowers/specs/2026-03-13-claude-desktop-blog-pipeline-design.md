# Claude Desktop 블로그 초안 자동 생성 파이프라인 설계

**Date:** 2026-03-13
**Status:** Approved

## 개요

Claude Desktop의 스케줄링 기능과 Supabase MCP 서버를 활용하여, 매일 자동으로 블로그 초안을 생성하고 관리자가 검토/수정 후 발행하는 파이프라인.

기존 Gemini 기반 cron (`/api/cron/generate-draft`)은 그대로 유지하며, Claude Desktop 파이프라인을 별도 채널로 병행 운영한다.

## 요구사항

- 매일 오전 7시 10분(KST) 자동 실행
- content_calendar에 사전 등록된 주제 기반으로 초안 생성
- Supabase MCP로 DB 직접 접근 (코드 변경 최소화)
- 완성도 높은 초안 생성 (거의 발행 가능 수준)
- 관리자가 에디터에서 테스트 결과 추가/수정 후 즉시 발행
- 기존 Gemini cron과 충돌 없이 공존

## 아키텍처

```
[사용자]
  ↓ content_calendar에 주제 등록 (관리자 캘린더 UI)

[Claude Desktop Schedule — 매일 07:10 KST]
  ↓ ① Supabase MCP로 content_calendar 조회 (당일 pending)
  ↓ ② 각 항목에 대해 블로그 초안 생성 (Claude 자체)
  ↓ ③ Supabase MCP로 posts 테이블에 draft insert
  ↓ ④ content_calendar 상태를 generated로 업데이트

[사용자]
  ↓ 관리자 에디터에서 초안 확인
  ↓ 테스트 결과 추가, 수정
  ↓ 즉시 발행
```

## Claude Desktop 설정

### Supabase MCP 서버

- **패키지:** `@supabase/mcp-server-supabase` (공식)
- **인증:** Supabase Personal Access Token (PAT) — Dashboard > Account > Access Tokens에서 발급
- **프로젝트 지정:** `--project-ref` 플래그로 대상 프로젝트 지정
- **접근 테이블:** `content_calendar` (SELECT, UPDATE) + `posts` (INSERT, SELECT) + `categories` (SELECT)
- **설정 위치:** `claude_desktop_config.json`

### 스케줄 설정

- **실행 주기:** 매일 07:10 KST
- **실행 조건:** 당일 pending 항목이 없으면 조기 종료

### 보안

- PAT는 Management API를 통해 SQL을 실행하므로 RLS를 우회 — 프롬프트에서 접근 테이블을 명시적으로 제한
- 로컬 머신에서만 실행, PAT 노출 위험은 기존 .env 관리 수준과 동일

## 스케줄 프롬프트 설계

### 동작 흐름

1. `content_calendar`에서 `scheduled_date = 오늘` AND `status = 'pending'` 항목 조회
2. 항목 없으면 "오늘 처리할 항목 없음" 메시지 후 종료
3. 각 항목마다:
   - `categories` 테이블에서 `category_slug`로 `category_id` 조회
   - topic, key_points, references를 기반으로 블로그 글 생성
   - `posts`에 insert
   - `content_calendar` 상태를 `generated`로 업데이트 + `generated_post_id` 연결

### 글 생성 지시사항

- **언어:** 한국어
- **형식:** 마크다운, h2/h3 구조, 코드 예제 포함
- **분량:** 1500-3000자
- **구조:** 도입 → 개념 설명 → 코드 예제 → 실전 팁 → 마무리
- **톤:** 기술 블로그답게 명확하고 실용적, 경어체
- **slug:** 제목에서 영문/숫자 기반 kebab-case 자동 생성. 기존 posts에 동일 slug가 있으면 날짜 suffix 추가 (예: `react-hooks-2026-03-13`)
- **excerpt:** 2-3문장 요약 자동 생성
- **tags:** content_calendar의 tags 우선 반영 + Claude가 3-5개 보충

### 프롬프트에 포함하지 않는 것

- 테스트 결과 섹션 (관리자가 에디터에서 직접 추가)
- 커버 이미지 (관리자가 에디터에서 별도 업로드)

## 데이터 흐름

### content_calendar → posts 매핑

| content_calendar 필드 | 용도 | posts 필드 매핑 |
|---|---|---|
| `topic` | 글 생성의 주제 입력 | Claude가 생성한 `title` |
| `key_points` | 반드시 포함할 핵심 내용 | `content`에 반영 |
| `references` | 참고할 외부 자료 | `content`에 링크 포함 |
| `category_slug` | 카테고리 연결 | categories 조회 → `category_id` |
| `tags` | 태그 힌트 | `tags` (없으면 Claude가 자동 생성) |

### posts insert 시 값

| 필드 | 값 |
|---|---|
| `slug` | 제목 기반 kebab-case |
| `title` | Claude가 생성 |
| `content` | Claude가 생성 (마크다운) |
| `excerpt` | Claude가 생성 (2-3문장) |
| `tags` | calendar tags 우선 + Claude 보충 |
| `category_id` | category_slug로 조회한 UUID |
| `is_published` | `false` |
| `status` | `'pending_review'` |
| `generated_by` | `'ai'` |
| `scheduled_at` | `null` |
| `created_at` | DB 기본값 (`now()`) |
| `updated_at` | DB 기본값 (`now()`) |

### 상태 전이

```
content_calendar:  pending → generated
posts:            (insert) pending_review → [사용자 수정] → published
```

### 기존 Gemini cron과의 공존

- **시간 분리:** Claude Desktop 07:10 KST 실행, Gemini cron은 12:00 KST 이후로 설정 권장 — race condition 방지
- Claude가 처리 후 `status = 'generated'`로 즉시 업데이트 → Gemini cron은 `pending`만 처리하므로 자연스럽게 충돌 회피
- 만약 동시 실행되더라도, slug UNIQUE 제약으로 중복 insert는 DB 레벨에서 방지됨

## 관리자 UI 변경사항

### 변경 없음 (기존 그대로 사용)

- 관리자 캘린더 페이지 (`/admin/calendar`) — 주제 등록/삭제, 상태 필터링
- 관리자 글 에디터 (`/admin/posts/[id]/edit`) — draft 수정 + 발행
- 관리자 글 목록 (`/admin/posts`) — status별 필터

### 코드 변경 (1개 파일)

- `generated_by` 뱃지는 이미 `posts/page.tsx`에 구현됨 (AI 생성 뱃지 + pending_review 필터 탭)
- **`src/app/admin/(dashboard)/calendar/page.tsx`** — CalendarItemCard의 generated 항목에 해당 글 에디터로 이동하는 링크 버튼 추가

## 구현 범위

| 구분 | 항목 | 설명 |
|---|---|---|
| **설정** | Claude Desktop Supabase MCP | `claude_desktop_config.json`에 MCP 서버 추가 |
| **설정** | Claude Desktop 스케줄 등록 | 매일 07:10 KST 프롬프트 실행 |
| **코드** | 캘린더 → 에디터 링크 | generated 항목에서 해당 글 편집 페이지로 이동 |

> **참고:** 글 목록의 `generated_by` 뱃지는 이미 구현 완료 (AI 초안 탭 + AI 생성 뱃지)

### 변경하지 않는 것

- 기존 Gemini cron 코드
- DB 스키마 (`generated_by`, `status`, `generated_post_id` 필드 이미 존재)
- 에디터, 발행 로직

### 구현 순서

1. Claude Desktop MCP + 스케줄 설정 (설정 파일 + 프롬프트 작성)
2. 관리자 글 목록 generated_by 뱃지 추가
3. 캘린더 → 에디터 링크 추가
