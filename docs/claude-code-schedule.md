# Claude Code Schedule — 블로그 초안 생성

## 개요

블로그 초안 자동 생성은 **Vercel Cron + Gemini API**가 핵심 자동화를 담당합니다.
Claude Code Schedule은 보조적으로 수동/즉석 초안 생성에 활용합니다.

## 자동화 구조

| 방법 | 주기 | 역할 |
|------|------|------|
| Vercel Cron (`/api/cron/generate-draft`) | 매일 UTC 00:00 (KST 09:00) | 핵심 자동화 — `content_calendar`에서 오늘 주제 조회 → Gemini로 초안 생성 |
| Claude Code Schedule | 수동 설정 (3일 만료) | 보조 — 즉석 초안 생성 또는 임시 스케줄 |

## 즉석 초안 생성 (수동)

Claude Code에서 직접 요청:

```
content_calendar 테이블에서 오늘 주제를 확인하고 블로그 초안을 생성해줘
```

또는 API 직접 호출:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://eunsookim.dev/api/cron/generate-draft
```

## 스케줄 생성 (3일간 유효)

Claude Code에서:

```
/schedule 매일 오전 9시에 content_calendar를 확인하고 오늘 주제로 블로그 초안 생성
```

> **참고:** Claude Code Schedule은 3일 만료 제한이 있으므로, 영구적인 일일 자동화는 Vercel Cron이 담당합니다. Schedule은 특정 기간 동안 추가 트리거가 필요할 때 보조적으로 사용하세요.

## 콘텐츠 캘린더 관리

관리자 페이지 `/admin/calendar`에서 콘텐츠 캘린더를 관리합니다:

1. **주제 등록**: 날짜, 주제, 카테고리, 태그, 핵심 포인트, 참고 자료 입력
2. **상태 확인**: pending → generated → published 흐름 추적
3. **생성된 초안 확인**: `/admin/posts?tab=ai`에서 AI 초안 검토/편집/발행
