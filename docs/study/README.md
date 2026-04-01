# 기술 블로그 작성 지침 및 콘텐츠 관리 (Study)

이 문서는 기술 블로그(Study)에 매일 작성하는 마크다운(MD) 파일들의 작성 가이드라인과 작성할 내용/일정을 한 곳에서 통합 관리하기 위한 문서입니다.

## 📁 디렉토리 구조 (Directory Structure)

주제별로 폴더를 분리하여 문서를 관리합니다. 새로운 주제가 생기면 폴더를 추가하고 이 문서에 반영해주세요.

- `/go` : Go 언어 관련 아티클 (예: 버전 마이그레이션, 동작 원리 등)
- `/redis` : Redis 관련 아티클
- `/infra` : 인프라, Docker, Kubernetes 등
- `/architecture` : 소프트웨어 아키텍처, 디자인 패턴 등

## 📝 블로그 작성 지침 (Writing Guidelines)

### 1. 파일명 규칙 (Naming Convention)
- 영문 소문자와 하이픈(-)만 사용하여 명확하게 작성합니다.
- 예: `go-run-build-environments.md`

### 2. 마크다운 메타데이터 (Frontmatter)
블로그 플랫폼(Next.js 등)에서 파싱할 수 있도록 문서 최상단에 메타데이터를 추가하는 것을 권장합니다.
```yaml
---
title: "아티클 제목을 입력하세요"
date: "YYYY-MM-DD"
category: "go" # 또는 폴더명과 일치하는 카테고리
tags: ["tag1", "tag2"]
description: "이 글의 핵심 내용을 한두 줄로 요약합니다."
---
```

### 3. 글 구성 원칙 (Structure)
- **도입부 (Why):** 왜 이 주제를 다루게 되었는지, 어떤 문제를 해결하고자 하는지 배경 설명
- **본론 (How/What):** 구체적인 개념 설명, 트러블슈팅 과정, 핵심 코드 스니펫 등
- **결론 (Conclusion):** 배운 점 요약, 주의할 점, 향후 더 알아볼 내용
- **참고 자료 (References):** 공식 문서 링크, 참고한 블로그 및 서적

---

## 📅 작성 일정 및 아이디어 (Contents Plan & Ideas)

앞으로 작성할 주제나 아이디어를 기록하고 상태를 관리합니다.

### 🟢 진행 중 / 작성 예정 (To Do / In Progress)
- [ ] Redis 데이터 타입별 활용 사례 정리
- [ ] Redis Pub/Sub을 활용한 실시간 알림 기능 구현
- [ ] Go 언어의 동시성(Goroutine, Channel) 패턴 분석

### 🔵 완료 (Done)

#### Go (Golang)
- [x] [Go run vs build 그리고 개발/프로덕션 환경의 Go 동작 차이](./go/go-run-build-and-environments.md)
- [x] [Go 1.23 → 1.26 버전 마이그레이션 가이드: Docker vs 로컬 환경](./go/go-version-migration-guide.md)
