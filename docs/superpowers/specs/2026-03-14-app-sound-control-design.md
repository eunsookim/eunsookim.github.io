# AppSoundControl — macOS 앱별 사운드 컨트롤러 설계

## 개요

macOS에서 애플리케이션별 사운드 볼륨을 개별 조절할 수 있는 메뉴바 앱. 개인 생산성 향상을 목적으로, 작업 중 음악은 낮추고 회의 앱은 크게 하는 등의 워크플로우를 지원한다.

### 핵심 결정 사항

| 항목 | 결정 |
|-----|------|
| 앱 이름 | AppSoundControl |
| 목적 | 개인 생산성 — 앱별 볼륨 제어 |
| 형태 | 메뉴바 팝오버 + 설정 윈도우 |
| 기술 스택 | Swift + SwiftUI |
| macOS 타겟 | 14.2+ (Sonoma) |
| 오디오 방식 | Audio Process Tap API 단독 |
| UI 스타일 | 글로우 & 프리미엄 (네온/그라데이션, 다크 테마) |
| 데이터 저장 | JSON 파일 (`~/Library/Application Support/AppSoundControl/`) |
| 배포 | 우선 개인용, 향후 결정 |

### 기능 범위

**1차 (MVP):**
- 앱별 볼륨 조절 (0~100%)
- 앱별 뮤트
- 마스터 볼륨
- 프리셋 저장/전환 (단축키 지원)
- 로그인 시 자동 시작

**향후 확장 (2차):**
- 앱별 출력 장치 라우팅 (헤드폰/스피커 분리)

---

## 아키텍처

```
┌─────────────────────────────────────┐
│           AppSoundControl           │
├──────────┬──────────┬───────────────┤
│ MenuBar  │ Settings │   Audio       │
│ Popover  │ Window   │   Engine      │
│ (SwiftUI)│ (SwiftUI)│   (CoreAudio) │
├──────────┴──────────┴───────────────┤
│            Data Layer               │
│  ProcessMonitor │ PresetStore       │
│  (NSWorkspace)  │ (JSON file)      │
└─────────────────────────────────────┘
```

### 3계층 분리

- **UI 레이어** — 메뉴바 팝오버(빠른 볼륨 조작)와 설정 윈도우(프리셋 관리). SwiftUI로 구현.
- **Audio Engine** — `AudioHardwareCreateProcessTap` API로 프로세스별 오디오 탭 생성, 볼륨 적용. CoreAudio/Swift 래퍼.
- **Data 레이어** — 실행 중인 앱 목록 모니터링(`NSWorkspace`), 프리셋 저장/로드(JSON 파일).

각 레이어는 독립적으로 테스트 가능하다. Audio Engine은 프로토콜로 추상화하여 향후 출력 장치 라우팅 추가 시 교체/확장 가능하다.

---

## Audio Engine 상세 설계

### 오디오 처리 흐름

```
앱 실행 감지 → Process Tap 생성 → 오디오 스트림 가로채기 → 볼륨 계수 적용 → 기본 출력으로 전달
```

### 주요 컴포넌트

| 컴포넌트 | 역할 |
|---------|------|
| `AudioTapManager` | Process Tap의 생성/해제 관리. 앱별 탭을 딕셔너리(`[pid: AudioTap]`)로 보유 |
| `AudioTap` | 개별 프로세스의 오디오 탭. 볼륨 값(0.0~1.0)을 보유하고 오디오 버퍼에 곱연산 적용 |
| `VolumeController` | UI와 AudioTap 사이의 중재자. 개별 볼륨 변경, 프리셋 전환, 마스터 볼륨 적용을 담당 |

### 마스터 볼륨

마스터 볼륨은 개별 앱 볼륨과 별도의 전역 계수(0.0~1.0)다. 최종 볼륨은 `앱별 볼륨 × 마스터 볼륨`으로 계산된다. 마스터 볼륨은 시스템 볼륨을 건드리지 않으며, 앱 내부에서만 적용된다.

### 프리셋 전환 흐름

```
사용자가 프리셋 선택 → PresetStore에서 프리셋 로드 → VolumeController가 volumes 딕셔너리 수신
→ 각 Bundle ID에 대해 AudioTapManager에서 해당 AudioTap 조회
→ AudioTap.volume 업데이트 (선형 보간으로 부드럽게 전환)
→ 현재 실행 중이 아닌 앱의 볼륨은 메모리에 보관, 앱 실행 시 자동 적용
```

### 볼륨 적용 방식

- Process Tap의 render callback에서 오디오 버퍼(`AudioBufferList`)를 받음
- 각 샘플에 볼륨 계수(0.0~1.0)를 곱하여 적용
- 급격한 볼륨 변경 시 클릭 노이즈 방지를 위해 선형 보간(ramp) 적용 (약 10ms)

### 프로세스 lifecycle 처리

- 앱 종료 시 해당 탭 자동 해제
- 앱 재실행 시 이전 볼륨 설정 자동 복원 (번들 ID 기반으로 기억)
- 시스템 앱(Finder 등) 사운드는 기본적으로 목록에 포함하되, 소리를 내는 앱만 활성 표시

---

## UI 설계

### 메뉴바 팝오버 (폭 320px)

일상적인 볼륨 조작을 위한 주 인터페이스.

**구성:**
- **헤더** — 앱 이름 + 설정 아이콘
- **프리셋 필 버튼** — 활성 프리셋 표시, 탭으로 전환, `+ 추가` 버튼
- **앱 리스트** — 소리를 내는 앱 목록. 각 항목: 앱 아이콘 + 이름 + 볼륨 퍼센트 + 슬라이더
- **뮤트 표시** — 볼륨 0%인 앱은 흐리게(dimmed) 표시, "뮤트" 텍스트
- **마스터 볼륨** — 하단 구분선 아래, 더 굵은 슬라이더

**디자인:**
- 다크 배경 (`#0c0c1d`)
- 글로우 그라데이션 슬라이더 (`#6366f1` → `#a78bfa`)
- 슬라이더에 box-shadow 글로우 효과
- 앱 아이콘은 시스템에서 자동 추출

### 설정 윈도우

프리셋 관리 및 앱 설정을 위한 별도 윈도우.

**탭 구성:**
- **프리셋** — 프리셋 목록, 각 프리셋의 앱별 볼륨 확인/편집, 단축키 할당
- **일반** — 로그인 시 자동 시작, 마지막 프리셋 기억 등
- **제외 앱** — 볼륨 제어 대상에서 제외할 앱 관리
- **단축키** — 글로벌 단축키 설정. 기본값은 비어 있으며 사용자가 직접 조합을 지정 (시스템 단축키 충돌 방지를 위해 ⌃⌥⌘ 조합 권장)

---

## 데이터 레이어 설계

### 프로세스 모니터링

| 항목 | 설계 |
|-----|------|
| 앱 감지 | `NSWorkspace.runningApplications` + `didLaunchApplicationNotification` / `didTerminateApplicationNotification` |
| 앱 식별 | Bundle ID 기반 (예: `com.spotify.client`) — PID는 재시작 시 변경되므로 |
| 소리 나는 앱 필터링 | Process Tap이 활성 오디오 스트림이 있는 프로세스만 감지 |
| 앱 아이콘 | `NSRunningApplication.icon`으로 자동 추출 |

### 프리셋 저장 구조

**경로:** `~/Library/Application Support/AppSoundControl/presets.json`

```json
{
  "presets": [
    {
      "id": "uuid",
      "name": "업무 모드",
      "icon": "🏢",
      "shortcut": "⌃⌥⌘1",
      "volumes": {
        "com.spotify.client": 0.32,
        "us.zoom.xos": 0.85,
        "com.tinyspeck.slackmacgap": 0.0
      }
    }
  ],
  "activePresetId": "uuid",
  "excludedBundleIds": [
    "com.apple.finder"
  ],
  "settings": {
    "launchAtLogin": true,
    "rememberLastPreset": true
  }
}
```

**제외 앱 (`excludedBundleIds`):**
- 전역 설정으로, 모든 프리셋에 공통 적용
- 제외된 앱은 Process Tap을 생성하지 않으며 팝오버 목록에도 표시되지 않음

**JSON 파일 선택 이유:**
- 프리셋 구조가 중첩되어 있어 JSON이 자연스러움
- 사용자가 직접 백업/공유 가능
- 일관성을 위해 설정값도 동일 파일에 통합

---

## 에러 처리 및 엣지 케이스

| 상황 | 처리 방식 |
|-----|----------|
| Process Tap 생성 실패 | 해당 앱을 목록에 "제어 불가"로 표시, 다른 앱은 정상 작동 |
| 권한 부족 (오디오 접근) | 첫 실행 시 시스템 권한 요청 안내 다이얼로그 표시 |
| 앱이 갑자기 종료 | `didTerminateApplicationNotification`으로 감지, 탭 자동 정리 |
| 프리셋에 저장된 앱이 미설치 | 해당 항목 무시, 프리셋은 정상 적용 |
| JSON 파일 손상 | 기본 프리셋으로 복원, 손상 파일은 `.backup`으로 이동 |
| 시스템 오디오 장치 변경 | `AudioObjectAddPropertyListener`로 감지, 탭 재연결 |

### 범위 밖 (의도적으로 제외)

- DRM 보호된 오디오 스트림 — 시스템 제약으로 탭 불가할 수 있음, 별도 처리하지 않음
- 탭별 오디오 스트림이 없는 앱 — 목록에서 자동 제외
- 앱별 출력 장치 라우팅 — 2차 개발로 연기

---

## 기술적 주의사항

### Audio Process Tap API (macOS 14.2+)

- `AudioHardwareCreateProcessTap` — 프로세스별 오디오 스트림에 접근하는 공식 API
- macOS 14.2 미만에서는 사용 불가 — 앱 실행 시 버전 체크 후 안내 메시지 표시
- Apple의 공식 API이므로 향후 macOS 업데이트에서도 호환성 유지 기대

### 권한 요구사항

- **Audio Process Tap:** 비샌드박스 앱으로 빌드. `AudioHardwareCreateProcessTap`은 샌드박스 환경에서 동작하지 않으므로 App Sandbox를 비활성화한다. 개인용 배포이므로 App Store 제약 없음.
- **마이크/오디오 접근:** `NSMicrophoneUsageDescription` (Info.plist) — Process Tap이 오디오 캡처 권한을 요구할 수 있으므로 포함. 첫 실행 시 시스템 권한 다이얼로그 표시.
- **접근성(Accessibility):** 글로벌 단축키 등록을 위해 필요. `AXIsProcessTrusted()`로 확인 후 미허용 시 시스템 설정으로 안내.

### 성능 고려사항

- 오디오 render callback은 실시간 스레드에서 실행 — 메모리 할당, 잠금(lock), Objective-C 메시지 전송 금지
- 볼륨 값은 atomic 변수로 UI 스레드와 오디오 스레드 간 공유
