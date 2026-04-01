# 블로그 콘텐츠 계획

## Redis 시리즈

입문부터 운영까지 단계적으로 다루는 Redis 시리즈.

### 기초

1. Redis란? — 인메모리 데이터 스토어의 개념과 특징, 언제 쓰고 언제 쓰지 말아야 하는지
2. Redis 설치와 기본 명령어 — CLI 사용법, SET/GET/DEL, TTL, 키 네이밍 전략
3. Redis 자료구조 완전 정복 — String, List, Set, Sorted Set, Hash 각각의 용도와 실전 예제

### 활용

4. Redis를 활용한 캐싱 전략 — Cache Aside, Write Through, Write Behind 패턴 비교
5. Redis로 세션 관리 구현하기 — Express/Go 서버에서 세션 스토어로 활용
6. Redis Pub/Sub 실시간 메시징 — 채팅, 알림 시스템에 적용하기
7. Redis로 Rate Limiting 구현 — 슬라이딩 윈도우, 토큰 버킷 알고리즘

### 심화

8. Redis 트랜잭션과 Lua 스크립팅 — MULTI/EXEC, 원자적 연산, Lua 스크립트 작성법
9. Redis 영속성: RDB vs AOF — 스냅샷과 로그 방식의 차이, 데이터 유실 시나리오
10. Redis Sentinel과 고가용성 — 자동 페일오버, 모니터링 구성

### 운영

11. Redis Cluster 구축과 샤딩 — 수평 확장, 해시 슬롯, 노드 추가/제거
12. Redis 메모리 최적화 — 메모리 정책(maxmemory-policy), 키 설계, 압축 기법
13. Redis 모니터링과 트러블슈팅 — INFO, SLOWLOG, 메모리 누수 진단, 성능 병목 해결

---

## Go 시리즈

기초 문법부터 프로덕션 백엔드 개발까지 다루는 Go 시리즈.

### 기초

1. Go 시작하기 — 설치, 프로젝트 구조, go mod, Hello World부터 첫 HTTP 서버까지
2. Go 기본 문법 — 변수, 함수, 구조체, 인터페이스, 에러 처리(error, panic, recover)
3. Go의 슬라이스와 맵 — 배열과의 차이, 내부 구조, 자주 하는 실수들
4. Go 포인터와 메모리 — 값 전달 vs 참조 전달, 스택과 힙, 가비지 컬렉션 기초

### 동시성

5. Goroutine과 Channel 기초 — 경량 스레드의 원리, 채널 통신, select문
6. 동시성 패턴 — Worker Pool, Fan-in/Fan-out, Pipeline, Context를 활용한 취소 전파
7. sync 패키지 활용 — Mutex, WaitGroup, Once, Map 올바른 사용법
8. 동시성 함정과 디버깅 — 데이터 레이스, 데드락, go vet, race detector 활용

### 웹 개발

9. Go로 REST API 만들기 — net/http부터 시작, 라우팅, 미들웨어 직접 구현
10. Go 웹 프레임워크 비교 — Gin, Echo, Fiber, Chi 장단점과 선택 기준
11. Go에서 데이터베이스 다루기 — database/sql, sqlx, GORM 비교, 커넥션 풀 관리
12. Go API 인증과 미들웨어 — JWT, 미들웨어 체인, CORS, Rate Limiting

### 프로덕션

13. Go 프로젝트 구조 설계 — Clean Architecture, 레이어 분리, 의존성 주입
14. Go 테스트 작성법 — 단위 테스트, 테이블 드리븐 테스트, 목킹, httptest
15. Go 애플리케이션 Docker화 — 멀티스테이지 빌드, scratch 이미지, 빌드 최적화
16. Go 성능 프로파일링 — pprof, 벤치마크 테스트, 메모리/CPU 분석
