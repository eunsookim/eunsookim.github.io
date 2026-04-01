# Go run vs build 그리고 개발/프로덕션 환경의 Go 동작 차이

> `go run`과 `go build`는 둘 다 Go 코드를 실행하지만, 작동 방식과 적합한 상황이 완전히 다릅니다. 이 글에서는 두 명령어의 내부 동작 차이를 파헤치고, 개발 환경과 프로덕션 환경에서 Go가 어떻게 다르게 동작하는지 정리합니다.

## go run vs go build: 무엇이 다른가

### go run — 컴파일 + 즉시 실행

`go run`은 소스 코드를 **임시 디렉토리에 컴파일한 후 즉시 실행**합니다. 바이너리가 디스크에 남지 않습니다.

```bash
go run main.go          # 단일 파일 실행
go run .                # 현재 패키지 실행
go run ./cmd/server/    # 특정 패키지 실행
```

**내부 동작:**
1. 소스 코드를 파싱하고 의존성을 분석
2. 임시 디렉토리(`$GOCACHE` 하위)에 바이너리를 컴파일
3. 생성된 바이너리를 exec 시스템 콜로 실행
4. 프로세스 종료 시 임시 바이너리는 캐시에 보관 (Go 1.24부터)

Go 1.24 이전에는 `go run`이 매번 임시 바이너리를 새로 생성했습니다. Go 1.24부터는 **빌드 캐시에 저장**되어 반복 실행이 빨라졌습니다. 이 변경은 캐시 크기를 늘리는 대신 개발 루프 속도를 높입니다.

### go build — 컴파일만, 실행은 별도

`go build`는 바이너리를 **지정된 위치에 생성**합니다. 실행은 사용자가 직접 합니다.

```bash
go build -o ./bin/server ./cmd/server/    # 바이너리를 bin/server로 생성
./bin/server                                # 직접 실행
```

**내부 동작:**
1. 소스 코드를 파싱하고 의존성을 분석
2. 지정된 경로에 바이너리를 생성 (기본: 현재 디렉토리, 패키지 이름으로)
3. 완료. 실행은 사용자 몫.

### 핵심 차이 비교

| 특성 | `go run` | `go build` |
|------|----------|------------|
| **바이너리 위치** | 임시 디렉토리 (캐시) | 사용자 지정 경로 |
| **실행** | 자동 | 수동 |
| **빌드 캐시** | Go 1.24+에서 캐시됨 | 항상 캐시됨 |
| **빌드 플래그** | 제한적 (`-race`, `-tags` 등 가능) | 전체 지원 (`-ldflags`, `-gcflags` 등) |
| **크로스 컴파일** | 불가 (현재 OS/ARCH만) | 가능 (`GOOS`, `GOARCH` 설정) |
| **사용 시나리오** | 개발 중 빠른 테스트 | 배포용 바이너리 생성 |
| **프로파일링/디버깅** | 가능하지만 번거로움 | 바이너리가 있으므로 편리 |

### go install — 빌드 + 설치

`go install`은 `go build`와 같지만 바이너리를 `$GOPATH/bin` (또는 `$GOBIN`)에 설치합니다. 주로 CLI 도구를 설치할 때 사용합니다.

```bash
go install github.com/air-verse/air@latest    # 최신 버전 설치
go install ./cmd/server/                        # 현재 모듈의 패키지 설치
```

---

## 개발 환경에서의 Go

### 개발 서버 실행 패턴

개발 환경에서는 코드를 수정할 때마다 서버를 재시작해야 합니다. 이를 위한 세 가지 접근법이 있습니다.

**1. go run 직접 사용 (가장 단순)**
```bash
# 코드 수정할 때마다 수동 재시작
go run ./cmd/server/
# Ctrl+C → 수정 → 다시 go run
```

**2. air — Hot Reload 도구 (추천)**
```bash
# air가 파일 변경을 감지하고 자동으로 재빌드+재시작
air -c .air.toml
```

air의 `.air.toml` 설정:
```toml
[build]
  cmd = "go build -o ./tmp/main ./cmd/server/"
  bin = "tmp/main"
  delay = 1000   # 파일 변경 후 1초 대기
  include_ext = ["go", "toml", "yaml"]
  exclude_dir = ["tmp", "vendor", "node_modules"]
```

air는 내부적으로 `go build`를 사용합니다. 파일이 변경되면 빌드 → 이전 프로세스 종료 → 새 바이너리 실행의 과정을 자동으로 수행합니다.

**3. Docker 볼륨 마운트 + air (컨테이너 개발)**
```yaml
# docker-compose.dev.yml
services:
  server:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app        # 소스 코드를 컨테이너에 마운트
    command: air -c .air.toml
```

이 방식에서는 로컬에서 코드를 수정하면 Docker 볼륨을 통해 컨테이너 내부에도 반영되고, 컨테이너 안의 air가 변경을 감지하여 재빌드합니다.

### 개발 환경의 빌드 플래그

```bash
# Race Detector — 동시성 버그 탐지 (개발 시 필수)
go run -race ./cmd/server/
go build -race -o ./bin/server ./cmd/server/

# 프로덕션에서는 race detector를 끕니다.
# race detector는 10~20배 느려지고 메모리를 5~10배 더 사용합니다.
```

### CGO_ENABLED의 의미

```bash
# CGO_ENABLED=1 (기본값)
# C 라이브러리에 의존하는 패키지 사용 가능
# net 패키지가 시스템 DNS 리졸버 사용
go build -o server ./cmd/server/

# CGO_ENABLED=0
# 순수 Go 코드만으로 컴파일 (정적 바이너리)
# net 패키지가 Go 내장 DNS 리졸버 사용
# Alpine/scratch 이미지에서 실행 가능
CGO_ENABLED=0 go build -o server ./cmd/server/
```

---

## 프로덕션 환경에서의 Go

### 정적 바이너리 빌드

프로덕션에서는 `go build`로 최적화된 단일 바이너리를 생성합니다.

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build \
    -ldflags="-s -w -X main.version=1.2.0 -X main.buildTime=$(date -u +%Y%m%d%H%M%S)" \
    -o ./bin/server \
    ./cmd/server/
```

각 플래그의 의미:
| 플래그 | 효과 |
|--------|------|
| `CGO_ENABLED=0` | C 의존성 제거, 정적 바이너리 생성 |
| `GOOS=linux` | Linux용 바이너리 (macOS에서도 빌드 가능) |
| `GOARCH=amd64` | x86_64 아키텍처 대상 |
| `-ldflags="-s -w"` | 디버그 심볼 제거 → 바이너리 크기 20~30% 감소 |
| `-ldflags="-X main.version=..."` | 빌드 시점에 변수 값 주입 |

### Docker 멀티스테이지 빌드

프로덕션 Docker 이미지의 표준 패턴입니다.

```dockerfile
# === 빌드 스테이지 ===
FROM golang:1.26-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /app

# 의존성 먼저 복사 (캐시 레이어 활용)
COPY go.mod go.sum ./
RUN go mod download

# 소스 코드 복사 및 빌드
COPY . .
RUN CGO_ENABLED=0 go build \
    -ldflags="-s -w" \
    -o /app/server \
    ./cmd/server/

# === 런타임 스테이지 ===
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
```

**왜 멀티스테이지인가:**
- 빌드 스테이지: Go 컴파일러, 소스 코드, 빌드 도구가 포함된 이미지 (~1GB)
- 런타임 스테이지: 바이너리만 포함된 최소 이미지 (~15MB)
- 공격 표면 최소화, 이미지 크기 최소화

### scratch vs alpine vs distroless

| 베이스 이미지 | 크기 | 특징 | 적합한 경우 |
|---------------|------|------|-------------|
| `scratch` | ~0MB | 완전히 빈 이미지 | 순수 Go, 외부 의존성 없음 |
| `alpine` | ~7MB | 최소 Linux + musl libc | CA 인증서, 타임존 등 필요 시 |
| `gcr.io/distroless/static` | ~2MB | Google의 최소 이미지 | 보안 중시 환경 |
| `debian:bookworm-slim` | ~80MB | glibc 포함 | CGO 사용 시 |

```dockerfile
# scratch 사용 시 — CA 인증서를 직접 복사해야 함
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server /server
CMD ["/server"]
```

---

## 개발 vs 프로덕션: Go 런타임 동작 차이

Go 바이너리 자체는 개발이든 프로덕션이든 동일하게 컴파일됩니다. 하지만 **환경 변수, 빌드 플래그, 런타임 설정**에 따라 동작이 달라집니다.

### GOMAXPROCS

```bash
# 개발 (로컬): 전체 CPU 사용
# macOS 10코어 → GOMAXPROCS=10

# 프로덕션 (Kubernetes):
# Go 1.24 이전: 노드의 CPU 수 사용 (예: 32)
# Go 1.25 이후: cgroup 제한 자동 감지 (예: 2)
```

Go 1.25 이전에는 Kubernetes 환경에서 `automaxprocs` 같은 서드파티 라이브러리를 사용해야 했습니다.

```go
// Go 1.25 이전: 서드파티 라이브러리 필요
import _ "go.uber.org/automaxprocs"

// Go 1.25 이후: 내장 기능, 추가 코드 불필요
```

### GC 튜닝

```bash
# 개발: 기본값 사용
GOGC=100  # 힙이 100% 증가하면 GC 실행

# 프로덕션: 서비스 특성에 따라 튜닝
GOGC=200             # GC 빈도 줄임 (메모리 여유 있을 때)
GOMEMLIMIT=512MiB    # Go 1.19+ 메모리 상한 설정
```

Go 1.26의 Green Tea GC는 별도 설정 없이 GC 오버헤드를 10~40% 줄여줍니다. 이전 버전에서 GC 튜닝에 공을 들였다면, 1.26 업그레이드만으로 상당 부분 해결될 수 있습니다.

### GODEBUG

`GODEBUG`은 런타임 동작을 세밀하게 제어하는 환경변수입니다. 주로 **이전 버전 호환성** 또는 **디버깅** 목적으로 사용합니다.

```bash
# 개발: 디버깅용 설정
GODEBUG=gctrace=1                    # GC 동작 로그 출력
GODEBUG=schedtrace=5000              # 5초마다 스케줄러 상태 출력
GODEBUG=asynctimerchan=1             # Go 1.22 이전 타이머 동작 복원

# 프로덕션: 호환성 또는 성능 설정
GODEBUG=madvdontneed=1               # 메모리 반환 전략 변경
GODEBUG=http2server=0                # HTTP/2 비활성화 (문제 발생 시)
```

### 빌드 태그를 활용한 환경 분기

```go
// config_dev.go
//go:build !production

package config

const (
    LogLevel = "debug"
    EnablePprof = true
)
```

```go
// config_prod.go
//go:build production

package config

const (
    LogLevel = "info"
    EnablePprof = false
)
```

```bash
# 개발
go run ./cmd/server/

# 프로덕션
go build -tags production -o server ./cmd/server/
```

---

## 프로파일링: 개발에서 쓰고 프로덕션에서도 쓰는 도구

### pprof — 성능 프로파일링

```go
import _ "net/http/pprof"

func main() {
    // 개발 환경에서는 항상 활성화
    go http.ListenAndServe("localhost:6060", nil)
    // ...
}
```

```bash
# CPU 프로파일 수집 (30초)
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 메모리 프로파일
go tool pprof http://localhost:6060/debug/pprof/heap

# 고루틴 프로파일
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Go 1.26: 고루틴 누수 프로파일 (실험적)
# GOEXPERIMENT=goroutineleakprofile로 빌드 시
go tool pprof http://localhost:6060/debug/pprof/goroutineleak
```

프로덕션에서는 pprof 엔드포인트를 **내부 네트워크에서만 접근 가능**하게 설정해야 합니다.

### Trace — 실행 트레이스

```bash
# 트레이스 수집 (5초)
curl -o trace.out http://localhost:6060/debug/pprof/trace?seconds=5

# 트레이스 뷰어 실행
go tool trace trace.out
```

Go 1.25의 **Flight Recorder**를 사용하면 평소에는 오버헤드 없이 트레이스를 기록하다가, 문제 발생 시에만 저장할 수 있습니다.

```go
// Go 1.25+ Flight Recorder
import "runtime/trace"

fr := trace.NewFlightRecorder()
fr.Start()

// 문제 감지 시
if somethingWrong {
    f, _ := os.Create("trace.out")
    fr.WriteTo(f)
    f.Close()
}
```

---

## PGO (Profile-Guided Optimization) — 프로덕션 프로파일로 빌드 최적화

Go 1.21에서 도입된 PGO는 **프로덕션에서 수집한 CPU 프로파일을 빌드에 반영**하여 컴파일러 최적화를 개선합니다.

```bash
# 1. 프로덕션에서 CPU 프로파일 수집
curl -o default.pgo http://production:6060/debug/pprof/profile?seconds=60

# 2. 프로파일을 소스 루트에 배치
cp default.pgo ./cmd/server/default.pgo

# 3. 빌드 — go build가 자동으로 default.pgo를 감지
go build -o server ./cmd/server/
```

Go 1.23에서 PGO 빌드 오버헤드가 대폭 감소(100%+ → 한자릿수 %)하여, 실용성이 크게 향상되었습니다.

---

## 정리: 환경별 권장 설정

| 설정 | 개발 (로컬) | 개발 (Docker) | 프로덕션 |
|------|------------|---------------|---------|
| **실행 방식** | `go run` 또는 `air` | `air` (볼륨 마운트) | `go build` 정적 바이너리 |
| **CGO_ENABLED** | 1 (기본값) | 상황에 따라 | 0 (정적 빌드) |
| **Race Detector** | 활성화 | 활성화 | 비활성화 |
| **ldflags** | 없음 | 없음 | `-s -w` (심볼 제거) |
| **GOGC** | 100 (기본값) | 100 (기본값) | 서비스 특성에 따라 |
| **GOMEMLIMIT** | 미설정 | 미설정 | 컨테이너 메모리의 80% |
| **pprof** | 항상 활성화 | 항상 활성화 | 내부 네트워크만 |
| **베이스 이미지** | N/A | `golang:X.XX-alpine` | `alpine` 또는 `scratch` |
| **PGO** | 불필요 | 불필요 | 프로파일 수집 후 적용 |
| **GOMAXPROCS** | 자동 (전체 CPU) | 자동 (Go 1.25+) | 자동 (Go 1.25+) |

---

## 참고 자료

- [Go Build Constraints](https://pkg.go.dev/cmd/go#hdr-Build_constraints)
- [Profile-Guided Optimization](https://go.dev/doc/pgo)
- [Go Runtime Environment Variables](https://pkg.go.dev/runtime)
- [Containerize a Go Application](https://docs.docker.com/guides/golang/containerize/)
- [Go 1.25 Container-Aware GOMAXPROCS](https://go.dev/doc/go1.25#container-aware-gomaxprocs)
- [Go 1.26 Green Tea GC](https://go.dev/doc/go1.26#new-garbage-collector)
