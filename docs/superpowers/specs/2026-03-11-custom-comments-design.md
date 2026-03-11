# 커스텀 익명 댓글 시스템 설계

**Date:** 2026-03-11
**Status:** Approved
**Replaces:** giscus (GitHub Discussions 기반 댓글)

## 요구사항

- 익명 댓글 (인증 없음)
- 이름 + 비밀번호 + 내용 입력
- 비밀번호로 본인 삭제 가능
- 대댓글 1단계만 허용
- 스팸 방지: Honeypot + IP Rate Limiting (1분 1개)
- 관리자: 비밀번호 없이 모든 댓글 삭제 가능

## 데이터 모델

### comments

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | gen_random_uuid() | 기본 키 |
| post_id | UUID (FK → posts) | NO | — | 글 참조 |
| parent_id | UUID (FK → comments) | YES | — | 부모 댓글. null이면 최상위 |
| author_name | text | NO | — | 작성자 이름 |
| password_hash | text | NO | — | bcrypt 해시 |
| content | text | NO | — | 댓글 내용 |
| ip_address | text | NO | — | Rate limiting용 IP |
| created_at | timestamptz | NO | now() | 작성일 |

### 제약 조건
- parent_id가 있는 댓글(대댓글)에는 대댓글 불가 — 애플리케이션 레벨 검증
- 대댓글의 parent는 반드시 같은 post_id의 댓글이어야 함

## API Routes

| Route | Method | 역할 |
|-------|--------|------|
| /api/comments | GET | post_id 쿼리로 댓글 목록 조회 |
| /api/comments | POST | 댓글 작성 (honeypot + rate limit + bcrypt) |
| /api/comments/[id] | DELETE | 비밀번호 검증 후 삭제 또는 관리자 삭제 |

## 스팸 방지

- **Honeypot**: 숨겨진 `website` 필드. 값이 있으면 봇으로 판단, 200 응답하되 저장 안 함
- **Rate Limiting**: IP 기반 1분 1개. comments 테이블에서 ip_address + created_at 확인

## RLS 정책

- SELECT: 공개 읽기
- INSERT/UPDATE/DELETE: service_role만 (API Route에서 검증 후 처리)

## 컴포넌트

- `src/components/blog/comment-section.tsx` — 댓글 목록 + 작성 폼 (giscus-comments.tsx 대체)

## 관리자

- `/admin/comments` 또는 대시보드에 댓글 관리 섹션 추가

## 변경 사항 (기존 코드)

- `@giscus/react` 패키지 제거
- giscus 환경 변수 3개 제거 (.env.local.example에서)
- `src/components/blog/giscus-comments.tsx` → 삭제
- `src/app/(public)/blog/[slug]/page.tsx` — GiscusComments → CommentSection으로 교체
- `bcryptjs` 패키지 추가
