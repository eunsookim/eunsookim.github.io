# Go 1.23 → 1.26 버전 마이그레이션 가이드: Docker vs 로컬 환경

> Go 1.23부터 1.26까지 4개 버전을 거치며 겪은 마이그레이션 경험과, Docker 환경과 로컬 환경에서의 차이점을 정리합니다.

## 왜 Go 버전을 올려야 하는가

Go는 6개월 주기로 새 버전을 릴리즈하며, 각 버전은 **2개 직전 버전까지만 보안 패치를 제공**합니다. 2026년 3월 기준으로 Go 1.24 이전 버전은 더 이상 보안 업데이트를 받지 못합니다. 하지만 버전 업그레이드의 가치는 보안만이 아닙니다. 각 버전은 런타임 성능, 컴파일러 최적화, 새로운 언어 기능을 포함하고 있어, 코드 한 줄 바꾸지 않아도 성능이 개선되는 경우가 많습니다.

---

## 버전별 핵심 변경사항 요약

### Go 1.23 (2024년 8월)

**언어 기능:**
- **Iterator 함수 (range over func)** — `for range` 루프에서 사용자 정의 이터레이터 함수를 사용할 수 있게 되었습니다. `func(func(K, V) bool)` 형태의 함수를 range 표현식으로 사용할 수 있습니다.

```go
// Go 1.23 이전: 슬라이스를 직접 반환해야 했음
func getItems() []Item { ... }
for _, item := range getItems() { ... }

// Go 1.23 이후: 이터레이터 함수로 메모리 효율적 순회
func iterItems(yield func(Item) bool) { ... }
for item := range iterItems { ... }
```

- **`unique` 패키지** — 값의 정규화(canonicalization)를 지원합니다. `Make[T]`로 핸들을 생성하면 동일한 값은 하나의 핸들로 통합되어 메모리 사용량을 줄이고 비교 연산이 단순 포인터 비교로 최적화됩니다.
- **`iter` 패키지** — 이터레이터 작업을 위한 기본 정의를 제공합니다. `slices.All`, `slices.Collect`, `maps.Keys` 등 이터레이터 기반 함수들이 추가되었습니다.

**런타임/컴파일러:**
- **Timer/Ticker 개선** — 더 이상 Stop하지 않은 Timer가 GC에서 누수되지 않습니다. 타이머 채널이 unbuffered(용량 0)로 변경되어 `Reset`/`Stop` 후 오래된 값이 전달되지 않습니다.
- **PGO 빌드 시간 감소** — Profile Guided Optimization 사용 시 빌드 오버헤드가 100%+ 에서 한자릿수 %로 크게 줄었습니다.
- **스택 프레임 최적화** — 함수 내 지역 변수의 스택 프레임 슬롯을 겹쳐 사용하여 스택 사용량이 감소합니다.

**업그레이드 이점:**
- 이터레이터 패턴으로 대규모 데이터 처리 시 메모리 할당 감소
- Timer 관련 미묘한 버그가 사라짐
- PGO 적용 프로젝트에서 빌드 시간 대폭 개선

---

### Go 1.24 (2025년 2월)

**언어 기능:**
- **Generic type aliases** 완전 지원 — `type MyList[T any] = []T`처럼 타입 별칭에도 제네릭 파라미터를 사용할 수 있습니다.

**도구:**
- **`go.mod`에 `tool` 지시자** — `tools.go` 파일에 blank import하던 관행이 사라집니다. `go get -tool` 명령으로 도구를 추가하고, `go tool`로 바로 실행할 수 있습니다.

```
// go.mod
module myproject

go 1.24

tool (
    golang.org/x/tools/cmd/stringer
    github.com/air-verse/air
)
```

- **`go build -json`** — 빌드 출력을 구조화된 JSON으로 받을 수 있어 CI/CD 파이프라인 통합이 편해집니다.

**런타임:**
- **Swiss Tables 기반 `map` 구현** — 내장 map이 Swiss Tables 알고리즘으로 교체되어 CPU 오버헤드가 **2~3% 감소**합니다. 코드 변경 없이 자동 적용됩니다.
- **더 효율적인 소형 객체 메모리 할당**
- **새로운 런타임 내부 mutex 구현**

**표준 라이브러리:**
- **`os.Root`** — 디렉토리 제한 파일시스템 접근. 심볼릭 링크를 통한 디렉토리 탈출을 방지합니다.
- **`testing.B.Loop`** — 벤치마크에서 `for range b.N` 대신 `for b.Loop()` 사용. 더 정확하고 간편합니다.
- **`runtime.AddCleanup`** — `SetFinalizer`의 개선판. 하나의 객체에 여러 클린업을 붙일 수 있고, 순환 참조에서도 누수가 없습니다.
- **`weak` 패키지** — 약한 포인터. 캐시 구현 등에 활용됩니다.
- **`crypto/mlkem`** — ML-KEM (포스트 양자 암호) 지원
- **FIPS 140-3 준수** — `GOFIPS140` 환경변수로 빌드 시 FIPS 모듈 선택 가능

**업그레이드 이점:**
- map 연산이 많은 서비스에서 즉각적인 성능 향상 (Swiss Tables)
- tool 관리가 go.mod로 통합되어 개발 환경 일관성 향상
- 포스트 양자 암호 및 FIPS 준수 지원

---

### Go 1.25 (2025년 8월)

**런타임:**
- **컨테이너 인식 GOMAXPROCS** — Linux에서 cgroup CPU 대역폭 제한을 자동 감지합니다. Kubernetes 환경에서 CPU limit을 설정하면 GOMAXPROCS가 자동으로 맞춰집니다. 이전에는 노드의 전체 CPU 수를 사용하여 과도한 컨텍스트 스위칭이 발생했습니다.

```
# 이전: 32코어 노드에서 CPU limit 2로 설정해도 GOMAXPROCS=32
# Go 1.25: 자동으로 GOMAXPROCS=2로 설정
```

- **Green Tea GC (실험적)** — 소형 객체의 마킹/스캐닝 성능을 개선한 새로운 가비지 컬렉터. `GOEXPERIMENT=greenteagc`로 활성화. **10~40% GC 오버헤드 감소**가 기대됩니다.
- **Trace Flight Recorder** — `runtime/trace.FlightRecorder`로 인메모리 링 버퍼에 지속적으로 트레이스를 기록하다가, 중요한 이벤트 발생 시 스냅샷으로 저장할 수 있습니다.

**컴파일러:**
- **DWARF5 디버그 정보** — 바이너리의 디버그 정보 크기가 줄고 링킹 시간이 단축됩니다. 특히 대형 Go 바이너리에서 효과적입니다.
- **nil 포인터 버그 수정** — Go 1.21~1.24에서 nil 포인터 체크가 잘못 지연되던 컴파일러 버그가 수정되었습니다.
- **슬라이스 스택 할당 최적화** — 슬라이스 backing store를 스택에 할당하는 경우가 늘어나 힙 할당이 줄어듭니다.

**표준 라이브러리:**
- **`testing/synctest`** 정식 졸업 — 동시성 코드 테스트를 위한 가상 시간 환경이 정식 API가 되었습니다.
- **`encoding/json/v2` (실험적)** — JSON 디코딩이 크게 빨라진 새 구현. `GOEXPERIMENT=jsonv2`로 활성화합니다.
- **`go.mod` `ignore` 지시자** — 특정 디렉토리를 go 명령에서 무시하도록 설정할 수 있습니다.

**업그레이드 이점:**
- 컨테이너 환경에서 별도의 GOMAXPROCS 설정 없이 최적 성능
- Green Tea GC 실험으로 GC 부하가 큰 서비스에서 사전 검증 가능
- 대형 바이너리의 빌드/링크 시간 단축 (DWARF5)

---

### Go 1.26 (2026년 2월)

**언어 기능:**
- **`new()` 초기값 지정** — `new(expression)` 형태로 초기값을 가진 포인터를 생성할 수 있습니다.

```go
// Go 1.26 이전
age := 30
person.Age = &age

// Go 1.26 이후
person.Age = new(30)
```

- **자기 참조 타입 제약** — 제네릭 타입이 자신의 타입 파라미터 목록에서 자기 자신을 참조할 수 있게 되었습니다. 재귀적 타입 제약이 가능해져 더 표현력 높은 인터페이스를 정의할 수 있습니다.

**런타임:**
- **Green Tea GC 기본 활성화** — Go 1.25에서 실험적이었던 GC가 기본으로 켜집니다. **10~40% GC 오버헤드 감소**. 최신 amd64 CPU(Intel Ice Lake, AMD Zen 4 이상)에서는 벡터 명령어 활용으로 추가 10% 개선이 기대됩니다.
- **cgo 호출 오버헤드 ~30% 감소** — C 함수 호출이 많은 프로그램에서 체감됩니다.
- **힙 기본 주소 무작위화** — 64비트 플랫폼에서 보안이 강화됩니다.
- **고루틴 누수 프로파일 (실험적)** — `GOEXPERIMENT=goroutineleakprofile`로 활성화하면 GC를 활용해 누수된 고루틴을 탐지합니다.

**도구:**
- **`go fix` 완전 개편 — Modernizer** — `go fix` 명령이 modernizer 프레임워크로 재구축되었습니다. 코드를 최신 Go 관용구와 API로 자동 업데이트합니다. `//go:fix inline` 지시자로 사용자 정의 마이그레이션도 가능합니다.

**표준 라이브러리:**
- **`crypto/hpke`** — Hybrid Public Key Encryption (RFC 9180)
- **`simd/archsimd` (실험적)** — SIMD 벡터 연산 직접 접근 (amd64)
- **`runtime/secret` (실험적)** — 시크릿 정보의 안전한 메모리 소거

**업그레이드 이점:**
- GC 오버헤드 대폭 감소 (코드 변경 없이)
- `new()` 문법으로 포인터 생성이 간결해짐
- cgo 사용 서비스에서 호출 오버헤드 감소
- `go fix`로 코드 모더나이제이션 자동화

---

## Docker 환경 vs 로컬 환경 마이그레이션 차이

Go 버전을 올릴 때, Docker 환경과 로컬 환경은 완전히 다른 문제를 만듭니다. 아래는 실제 마이그레이션 과정에서 겪은 차이점입니다.

### 1. Go 버전 결정 지점이 다르다

| 구분 | 로컬 환경 | Docker 환경 |
|------|-----------|-------------|
| Go 버전 결정 | `go.mod`의 `go` 지시자 + 로컬 설치된 Go 바이너리 | `Dockerfile`의 `FROM golang:X.XX` 이미지 |
| 업그레이드 방법 | `brew upgrade go` 또는 공식 인스톨러 | Dockerfile의 베이스 이미지 태그 변경 |
| 버전 확인 | `go version` | `docker exec <container> go version` |
| GOTOOLCHAIN | 로컬에 설치된 버전이 기본 | 이미지에 포함된 버전으로 고정 |

로컬에서는 `go.mod`에 `go 1.26`을 적으면 GOTOOLCHAIN 메커니즘이 자동으로 맞는 버전을 다운로드합니다. 하지만 Docker에서는 **베이스 이미지 자체를 바꿔야** 합니다.

### 2. 캐시 문제: Docker의 레이어 캐시 함정

Docker의 빌드 캐시는 Dockerfile의 각 명령어를 레이어로 캐시합니다. 문제는 `FROM golang:1.26-alpine`이라고 적어도 **이전에 같은 태그로 빌드한 캐시가 남아 있으면** 실제로는 이전 버전 이미지가 사용될 수 있다는 점입니다.

```bash
# 이 상황이 실제로 발생했습니다:
# Dockerfile에는 golang:1.26-alpine이라고 적혀 있지만,
# 컨테이너 내부에서 go version을 확인하면 1.23.12가 나옴

# 해결: --no-cache 플래그로 강제 재빌드
docker-compose build --no-cache <service-name>

# 또는 특정 이미지를 먼저 명시적으로 pull
docker pull golang:1.26-alpine
docker-compose build <service-name>
```

로컬 환경에서는 이런 문제가 없습니다. `go.mod`의 `go` 지시자가 Source of Truth이고, GOTOOLCHAIN이 자동으로 맞는 버전을 찾아줍니다.

### 3. 멀티스테이지 빌드 vs 개발용 단일 이미지

프로덕션 Docker 이미지는 보통 멀티스테이지 빌드를 사용합니다. 이때 **빌드 스테이지**와 **런타임 스테이지** 모두를 업데이트해야 합니다.

```dockerfile
# 프로덕션 Dockerfile (멀티스테이지)
# 1단계: 빌드 — Go 버전을 여기서 결정
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server ./cmd/server/

# 2단계: 런타임 — Go가 필요 없음 (정적 바이너리)
FROM alpine:3.20
COPY --from=builder /app/server /server
CMD ["/server"]
```

```dockerfile
# 개발용 Dockerfile (단일 스테이지 + hot reload)
FROM golang:1.26-alpine
RUN apk add --no-cache git gcc musl-dev
RUN go install github.com/air-verse/air@latest
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY .air.toml ./
RUN mkdir -p tmp
CMD ["air", "-c", ".air.toml"]
```

개발용 Docker 이미지에서는 소스 코드를 볼륨 마운트하고 `air`(hot reload)로 실행하기 때문에, **이미지의 Go 버전이 곧 빌드 버전**입니다. 이 이미지가 낡으면 `go.mod`의 버전 요구사항과 충돌합니다.

### 4. 환경별 `go.mod` 호환성 관리

`go.mod`의 `go` 지시자는 "이 모듈은 최소 Go X.XX를 요구한다"는 의미입니다. 이 값을 올리면 **해당 버전 미만의 Go로는 빌드할 수 없습니다.**

```
// go.mod
module myproject

go 1.26.0  // 이 줄을 올리면 Go 1.25 이하에서 빌드 불가
```

| 상황 | 로컬 | Docker |
|------|------|--------|
| go.mod에 `go 1.26` 명시 | GOTOOLCHAIN이 자동 다운로드 | 이미지가 1.26 미만이면 **즉시 에러** |
| 에러 메시지 | `go: go.mod requires go >= 1.26.0` | 동일 에러, 하지만 컨테이너 내부에서 발생 |
| 해결 | `go install golang.org/dl/go1.26@latest` | Dockerfile 베이스 이미지 변경 + 재빌드 |

### 5. CGO 의존성과 Alpine Linux

Go의 순수 Go 코드(`CGO_ENABLED=0`)는 환경 차이가 적지만, CGO가 필요한 패키지(예: `go-sqlite3`, 일부 네트워킹 기능)를 사용할 때는 Docker 환경에서 추가 주의가 필요합니다.

```dockerfile
# Alpine에서 CGO 사용 시 musl-dev 필요
FROM golang:1.26-alpine
RUN apk add --no-cache gcc musl-dev

# Debian 기반이면 더 호환성이 좋음
FROM golang:1.26
# gcc, libc-dev가 이미 포함되어 있음
```

로컬(macOS)에서는 Xcode Command Line Tools의 clang이 CGO 컴파일을 담당하므로 별도 설정이 불필요합니다.

### 6. 컨테이너 인식 GOMAXPROCS (Go 1.25+)

Go 1.25부터 추가된 컨테이너 인식 GOMAXPROCS는 **Docker 환경에서만 의미 있는 변경사항**입니다.

```yaml
# docker-compose.yml
services:
  myservice:
    deploy:
      resources:
        limits:
          cpus: '2.0'  # CPU 2코어 제한

# Go 1.24 이전: 호스트의 전체 CPU 수(예: 10)로 GOMAXPROCS 설정
#   → 과도한 컨텍스트 스위칭, CPU 경합
# Go 1.25 이후: cgroup 제한을 감지하여 GOMAXPROCS=2로 자동 설정
#   → 최적의 스케줄링
```

로컬 환경에서는 cgroup 제한이 없으므로 이 기능은 동작하지 않습니다. Docker/Kubernetes 환경에서만 차이가 나타납니다.

---

## 마이그레이션 체크리스트

### 공통 (로컬 + Docker)

- [ ] `go.mod`의 `go` 지시자를 대상 버전으로 변경
- [ ] `go mod tidy` 실행하여 의존성 정리
- [ ] 전체 테스트 실행 (`go test ./...`)
- [ ] deprecated API 사용 여부 확인
- [ ] 컴파일러 경고/에러 확인 (`go vet ./...`)

### 로컬 환경 전용

- [ ] 로컬 Go 바이너리 업그레이드 (`brew upgrade go` 또는 공식 인스톨러)
- [ ] IDE의 Go SDK 경로 업데이트 (GoLand, VS Code 등)
- [ ] `go version`으로 버전 확인

### Docker 환경 전용

- [ ] Dockerfile의 `FROM golang:X.XX` 태그 변경
- [ ] `docker pull golang:X.XX-alpine`으로 최신 이미지 확보
- [ ] `docker-compose build --no-cache`로 캐시 없이 재빌드
- [ ] 컨테이너 내부에서 `go version` 확인
- [ ] 멀티스테이지 빌드의 경우 빌드 스테이지 이미지도 업데이트
- [ ] Alpine/Debian 기반 차이에 따른 시스템 패키지 호환성 확인
- [ ] CGO 사용 시 C 컴파일러/라이브러리 호환성 확인

---

## 버전별 업그레이드 추천 경로

### Go 1.23 → 1.24 (추천도: 높음)

Swiss Tables map과 런타임 개선만으로 **코드 변경 없이 2~3% 성능 향상**. `go.mod` tool 지시자로 개발 환경 관리가 편해집니다. 파급 영향이 적어 안전한 업그레이드입니다.

### Go 1.24 → 1.25 (추천도: 중간)

컨테이너 환경이라면 GOMAXPROCS 자동 인식이 큰 가치. DWARF5로 빌드 시간 단축. 다만 nil 포인터 버그 수정으로 **이전에 우연히 동작하던 잘못된 코드가 패닉**할 수 있으니 테스트를 꼼꼼히 해야 합니다.

### Go 1.25 → 1.26 (추천도: 매우 높음)

Green Tea GC 기본 활성화로 **10~40% GC 오버헤드 감소**는 대부분의 서비스에서 체감됩니다. `new()` 초기값 문법, `go fix` modernizer, cgo 성능 개선까지 종합적인 업그레이드. Bootstrap이 Go 1.24.6+을 요구하므로 CI/CD 파이프라인의 Go 버전도 함께 확인해야 합니다.

---

## 실전 트러블슈팅: 우리 프로젝트에서 겪은 일

### Docker 캐시로 인한 Go 버전 불일치

`go.mod`를 `go 1.26`으로 올리고 `Dockerfile.dev`도 `golang:1.26-alpine`으로 변경했지만, 컨테이너를 재시작하면 여전히 `go 1.23.12`로 실행되었습니다.

**원인:** Docker Compose가 이미지 캐시를 재사용하여 `golang:1.26-alpine`이 아닌 이전에 빌드된 레이어를 사용했습니다.

**해결:**

```bash
# 1. 최신 이미지를 명시적으로 pull
docker pull golang:1.26-alpine

# 2. 캐시 없이 재빌드
docker-compose -f docker/docker-compose.dev.yml build --no-cache dataprocessserver

# 3. 컨테이너 재시작
docker-compose -f docker/docker-compose.dev.yml up -d dataprocessserver
```

**교훈:** Go 메이저 버전을 올릴 때는 항상 `--no-cache`로 빌드하고, 컨테이너 내부에서 `go version`을 확인하는 습관을 들여야 합니다.

---

## 참고 자료

- [Go 1.23 Release Notes](https://go.dev/doc/go1.23)
- [Go 1.24 Release Notes](https://go.dev/doc/go1.24)
- [Go 1.25 Release Notes](https://go.dev/doc/go1.25)
- [Go 1.26 Release Notes](https://go.dev/doc/go1.26)
- [Go Toolchain Management](https://go.dev/doc/toolchain)
- [Go Docker Official Images](https://hub.docker.com/_/golang)
