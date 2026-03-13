# AppSoundControl Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** macOS 14.2+에서 앱별 사운드 볼륨을 개별 조절하는 메뉴바 앱 구축

**Architecture:** Swift + SwiftUI 3계층 구조 (UI / Audio Engine / Data). Audio Process Tap API로 프로세스별 오디오 탭 생성, 볼륨 계수 곱연산으로 볼륨 적용. 프리셋은 JSON 파일로 관리.

**Tech Stack:** Swift 5.9, SwiftUI, CoreAudio (AudioHardwareCreateProcessTap), XCTest, xcodegen

**Spec:** `docs/superpowers/specs/2026-03-14-app-sound-control-design.md`

**의도적 스펙 일탈:**
- **AudioTap.start() 구현:** `AudioHardwareCreateProcessTap` API 시그니처가 문서 확인 필수이므로 골격만 제공. Task 6 Step 1에서 API 연구 후 Step 3에서 완성.
- **글로벌 단축키 편집:** 키 녹화 UI에 별도 라이브러리(KeyboardShortcuts) 필요. MVP에서는 단축키 표시만 구현하고, 등록/편집은 후속 작업으로 분리.

---

## File Structure

```
~/AppSoundControl/
├── project.yml                              # xcodegen 프로젝트 정의
├── .gitignore
├── AppSoundControl/
│   ├── Info.plist
│   ├── AppSoundControl.entitlements
│   ├── App/
│   │   └── AppSoundControlApp.swift         # @main, MenuBarExtra, Settings window
│   ├── Audio/
│   │   ├── AudioEngineProtocol.swift        # 오디오 엔진 추상화 프로토콜
│   │   ├── AudioTap.swift                   # 개별 프로세스 오디오 탭 래퍼
│   │   ├── AudioTapManager.swift            # 다중 AudioTap 관리
│   │   └── VolumeController.swift           # UI ↔ AudioEngine 중재자
│   ├── Data/
│   │   ├── Models.swift                     # Preset, AppSettings (Codable)
│   │   ├── PresetStore.swift                # JSON 파일 읽기/쓰기
│   │   └── ProcessMonitor.swift             # NSWorkspace 앱 모니터링
│   └── UI/
│       ├── Components/
│       │   ├── GlowTheme.swift              # 색상/스타일 상수
│       │   ├── GlowSlider.swift             # 커스텀 글로우 슬라이더
│       │   └── FlowLayout.swift             # 범용 FlowLayout
│       ├── MenuBar/
│       │   ├── MenuBarPopover.swift          # 메뉴바 팝오버 메인 뷰
│       │   ├── AppVolumeRow.swift            # 앱별 볼륨 행
│       │   ├── PresetPillBar.swift           # 프리셋 전환 필 버튼
│       │   └── MasterVolumeSlider.swift      # 마스터 볼륨 슬라이더
│       └── Settings/
│           ├── SettingsWindow.swift          # 설정 윈도우 컨테이너
│           ├── PresetTab.swift               # 프리셋 관리 탭
│           ├── PresetCard.swift             # 프리셋 카드 컴포넌트
│           ├── GeneralTab.swift              # 일반 설정 탭
│           ├── ExcludedAppsTab.swift         # 제외 앱 관리 탭
│           └── ShortcutsTab.swift            # 단축키 설정 탭
└── AppSoundControlTests/
    ├── ModelsTests.swift                    # 모델 인코딩/디코딩 테스트
    ├── PresetStoreTests.swift               # JSON 파일 I/O 테스트
    ├── ProcessMonitorTests.swift            # 앱 모니터링 테스트
    └── VolumeControllerTests.swift          # 볼륨 컨트롤러 테스트 (mock 엔진)
```

---

## Chunk 1: Project Scaffold & Data Layer

### Task 1: Xcode 프로젝트 생성

**Files:**
- Create: `~/AppSoundControl/project.yml`
- Create: `~/AppSoundControl/.gitignore`
- Create: `~/AppSoundControl/AppSoundControl/Info.plist`
- Create: `~/AppSoundControl/AppSoundControl/AppSoundControl.entitlements`
- Create: `~/AppSoundControl/AppSoundControl/App/AppSoundControlApp.swift` (placeholder)

- [ ] **Step 1: 디렉토리 생성 및 Git 초기화**

```bash
mkdir -p ~/AppSoundControl/{AppSoundControl/{App,Audio,Data,UI/{Components,MenuBar,Settings}},AppSoundControlTests}
cd ~/AppSoundControl
git init
```

- [ ] **Step 2: .gitignore 작성**

```gitignore
# Xcode
*.xcodeproj/xcuserdata/
*.xcworkspace/xcuserdata/
DerivedData/
build/
*.pbxuser
*.mode1v3
*.mode2v3
*.perspectivev3
*.xccheckout
*.moved-aside
*.hmap
*.ipa
*.dSYM.zip
*.dSYM

# macOS
.DS_Store
*.swp
*~.nib

# Dependencies
Pods/
Carthage/Build/

# App data
.superpowers/
```

- [ ] **Step 3: project.yml 작성 (xcodegen)**

```yaml
name: AppSoundControl
options:
  minimumXcodeGenVersion: "2.38"
  deploymentTarget:
    macOS: "14.2"
  bundleIdPrefix: com.eunsookim
  xcodeVersion: "15.0"
settings:
  base:
    MARKETING_VERSION: "1.0.0"
    CURRENT_PROJECT_VERSION: 1
    SWIFT_VERSION: "5.9"
targets:
  AppSoundControl:
    type: application
    platform: macOS
    sources:
      - path: AppSoundControl
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.eunsookim.AppSoundControl
        INFOPLIST_FILE: AppSoundControl/Info.plist
        CODE_SIGN_ENTITLEMENTS: AppSoundControl/AppSoundControl.entitlements
        ENABLE_APP_SANDBOX: NO
        CODE_SIGN_IDENTITY: "-"
  AppSoundControlTests:
    type: bundle.unit-test
    platform: macOS
    sources:
      - path: AppSoundControlTests
    dependencies:
      - target: AppSoundControl
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.eunsookim.AppSoundControlTests
```

- [ ] **Step 4: Info.plist 작성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>LSUIElement</key>
    <true/>
    <key>NSMicrophoneUsageDescription</key>
    <string>AppSoundControl needs audio access to control per-app volume.</string>
</dict>
</plist>
```

- [ ] **Step 5: Entitlements 파일 작성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
</dict>
</plist>
```

- [ ] **Step 6: App entry point placeholder 작성**

```swift
// AppSoundControl/App/AppSoundControlApp.swift
import SwiftUI

@main
struct AppSoundControlApp: App {
    var body: some Scene {
        MenuBarExtra("AppSoundControl", systemImage: "speaker.wave.2.fill") {
            Text("AppSoundControl")
                .padding()
        }
    }
}
```

- [ ] **Step 7: xcodegen 설치 확인 및 프로젝트 생성**

```bash
# xcodegen이 없으면 설치
which xcodegen || brew install xcodegen

cd ~/AppSoundControl
xcodegen generate
```

Expected: `⚙ Generating plists...` → `✅ Created project AppSoundControl.xcodeproj`

- [ ] **Step 8: 빌드 확인**

```bash
cd ~/AppSoundControl
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl -configuration Debug build 2>&1 | tail -5
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 9: 커밋**

```bash
cd ~/AppSoundControl
git add .gitignore project.yml AppSoundControl/ AppSoundControlTests/
git commit -m "feat: scaffold Xcode project with xcodegen"
```

---

### Task 2: 데이터 모델 정의

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/Data/Models.swift`
- Create: `~/AppSoundControl/AppSoundControlTests/ModelsTests.swift`

- [ ] **Step 1: 모델 테스트 작성**

```swift
// AppSoundControlTests/ModelsTests.swift
import XCTest
@testable import AppSoundControl

final class ModelsTests: XCTestCase {

    // MARK: - Preset

    func testPresetEncodeDecode() throws {
        let preset = Preset(
            id: UUID(uuidString: "12345678-1234-1234-1234-123456789012")!,
            name: "업무 모드",
            icon: "🏢",
            shortcut: "⌃⌥⌘1",
            volumes: [
                "com.spotify.client": 0.32,
                "us.zoom.xos": 0.85
            ]
        )

        let data = try JSONEncoder().encode(preset)
        let decoded = try JSONDecoder().decode(Preset.self, from: data)

        XCTAssertEqual(decoded.id, preset.id)
        XCTAssertEqual(decoded.name, "업무 모드")
        XCTAssertEqual(decoded.icon, "🏢")
        XCTAssertEqual(decoded.shortcut, "⌃⌥⌘1")
        XCTAssertEqual(decoded.volumes["com.spotify.client"], 0.32)
        XCTAssertEqual(decoded.volumes["us.zoom.xos"], 0.85)
    }

    func testPresetDefaultValues() {
        let preset = Preset(name: "테스트")

        XCTAssertFalse(preset.id.uuidString.isEmpty)
        XCTAssertEqual(preset.name, "테스트")
        XCTAssertEqual(preset.icon, "🎵")
        XCTAssertNil(preset.shortcut)
        XCTAssertTrue(preset.volumes.isEmpty)
    }

    // MARK: - AppSettings

    func testAppSettingsDefaults() {
        let settings = AppSettings()

        XCTAssertFalse(settings.launchAtLogin)
        XCTAssertTrue(settings.rememberLastPreset)
    }

    func testAppSettingsEncodeDecode() throws {
        var settings = AppSettings()
        settings.launchAtLogin = true
        settings.rememberLastPreset = false

        let data = try JSONEncoder().encode(settings)
        let decoded = try JSONDecoder().decode(AppSettings.self, from: data)

        XCTAssertTrue(decoded.launchAtLogin)
        XCTAssertFalse(decoded.rememberLastPreset)
    }

    // MARK: - AppData

    func testAppDataFullRoundTrip() throws {
        let preset = Preset(name: "테스트", volumes: ["com.test.app": 0.5])
        let appData = AppData(
            presets: [preset],
            activePresetId: preset.id,
            excludedBundleIds: ["com.apple.finder"],
            settings: AppSettings(launchAtLogin: true, rememberLastPreset: true)
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(appData)
        let decoded = try JSONDecoder().decode(AppData.self, from: data)

        XCTAssertEqual(decoded.presets.count, 1)
        XCTAssertEqual(decoded.presets[0].name, "테스트")
        XCTAssertEqual(decoded.activePresetId, preset.id)
        XCTAssertEqual(decoded.excludedBundleIds, ["com.apple.finder"])
        XCTAssertTrue(decoded.settings.launchAtLogin)
    }

    func testAppDataDefaultsToEmptyPresets() {
        let appData = AppData()

        XCTAssertTrue(appData.presets.isEmpty)
        XCTAssertNil(appData.activePresetId)
        XCTAssertTrue(appData.excludedBundleIds.isEmpty)
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd ~/AppSoundControl
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | tail -10
```

Expected: FAIL — `Models.swift` 파일이 없으므로 컴파일 에러

- [ ] **Step 3: Models.swift 구현**

```swift
// AppSoundControl/Data/Models.swift
import Foundation

struct Preset: Codable, Identifiable, Equatable {
    var id: UUID
    var name: String
    var icon: String
    var shortcut: String?
    var volumes: [String: Float]  // [BundleID: Volume 0.0~1.0]

    init(
        id: UUID = UUID(),
        name: String,
        icon: String = "🎵",
        shortcut: String? = nil,
        volumes: [String: Float] = [:]
    ) {
        self.id = id
        self.name = name
        self.icon = icon
        self.shortcut = shortcut
        self.volumes = volumes
    }
}

struct AppSettings: Codable, Equatable {
    var launchAtLogin: Bool
    var rememberLastPreset: Bool

    init(launchAtLogin: Bool = false, rememberLastPreset: Bool = true) {
        self.launchAtLogin = launchAtLogin
        self.rememberLastPreset = rememberLastPreset
    }
}

struct AppData: Codable, Equatable {
    var presets: [Preset]
    var activePresetId: UUID?
    var excludedBundleIds: [String]
    var settings: AppSettings
    var masterVolume: Float

    init(
        presets: [Preset] = [],
        activePresetId: UUID? = nil,
        excludedBundleIds: [String] = [],
        settings: AppSettings = AppSettings(),
        masterVolume: Float = 1.0
    ) {
        self.presets = presets
        self.activePresetId = activePresetId
        self.excludedBundleIds = excludedBundleIds
        self.settings = settings
        self.masterVolume = masterVolume
    }
}
```

- [ ] **Step 4: xcodegen 재생성 후 테스트 통과 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | grep -E "(Test Suite|Test Case|PASS|FAIL|BUILD)"
```

Expected: 모든 테스트 PASS, `** TEST SUCCEEDED **`

- [ ] **Step 5: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/Data/Models.swift AppSoundControlTests/ModelsTests.swift
git commit -m "feat: add data models (Preset, AppSettings, AppData) with tests"
```

---

### Task 3: PresetStore (JSON 파일 영속화)

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/Data/PresetStore.swift`
- Create: `~/AppSoundControl/AppSoundControlTests/PresetStoreTests.swift`

- [ ] **Step 1: PresetStore 테스트 작성**

```swift
// AppSoundControlTests/PresetStoreTests.swift
import XCTest
@testable import AppSoundControl

final class PresetStoreTests: XCTestCase {
    var tempDir: URL!
    var store: PresetStore!

    override func setUp() {
        super.setUp()
        tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
        try! FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        store = PresetStore(directory: tempDir)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: tempDir)
        super.tearDown()
    }

    // MARK: - Load

    func testLoadReturnsDefaultWhenFileDoesNotExist() {
        let data = store.load()

        XCTAssertTrue(data.presets.isEmpty)
        XCTAssertNil(data.activePresetId)
        XCTAssertEqual(data.masterVolume, 1.0)
    }

    // MARK: - Save & Load

    func testSaveThenLoad() {
        var data = AppData()
        let preset = Preset(name: "테스트", volumes: ["com.test": 0.5])
        data.presets.append(preset)
        data.activePresetId = preset.id
        data.masterVolume = 0.8

        store.save(data)
        let loaded = store.load()

        XCTAssertEqual(loaded.presets.count, 1)
        XCTAssertEqual(loaded.presets[0].name, "테스트")
        XCTAssertEqual(loaded.activePresetId, preset.id)
        XCTAssertEqual(loaded.masterVolume, 0.8)
    }

    // MARK: - Corrupted File

    func testLoadCorruptedFileReturnsDefaultAndCreatesBackup() {
        let filePath = tempDir.appendingPathComponent("presets.json")
        try! "not json".write(to: filePath, atomically: true, encoding: .utf8)

        let data = store.load()

        XCTAssertTrue(data.presets.isEmpty, "Corrupted file should return defaults")

        let backupPath = tempDir.appendingPathComponent("presets.json.backup")
        XCTAssertTrue(FileManager.default.fileExists(atPath: backupPath.path),
                      "Backup should exist after corruption recovery")
    }

    // MARK: - Add/Remove Preset

    func testAddPreset() {
        let preset = Preset(name: "새 프리셋")
        store.addPreset(preset)

        let loaded = store.load()
        XCTAssertEqual(loaded.presets.count, 1)
        XCTAssertEqual(loaded.presets[0].name, "새 프리셋")
    }

    func testRemovePreset() {
        let preset = Preset(name: "삭제할 프리셋")
        store.addPreset(preset)
        store.removePreset(id: preset.id)

        let loaded = store.load()
        XCTAssertTrue(loaded.presets.isEmpty)
    }

    func testUpdatePreset() {
        var preset = Preset(name: "원래 이름")
        store.addPreset(preset)

        preset.name = "새 이름"
        preset.volumes = ["com.test": 0.7]
        store.updatePreset(preset)

        let loaded = store.load()
        XCTAssertEqual(loaded.presets[0].name, "새 이름")
        XCTAssertEqual(loaded.presets[0].volumes["com.test"], 0.7)
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | tail -10
```

Expected: FAIL — `PresetStore` 정의 없음

- [ ] **Step 3: PresetStore 구현**

```swift
// AppSoundControl/Data/PresetStore.swift
import Foundation

final class PresetStore: ObservableObject {
    @Published private(set) var data: AppData

    private let fileURL: URL
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        return e
    }()
    private let decoder = JSONDecoder()

    init(directory: URL? = nil) {
        let dir = directory ?? Self.defaultDirectory()
        self.fileURL = dir.appendingPathComponent("presets.json")

        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }

        self.data = AppData()
        self.data = load()
    }

    // MARK: - Public

    func load() -> AppData {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return AppData()
        }

        do {
            let rawData = try Data(contentsOf: fileURL)
            let appData = try decoder.decode(AppData.self, from: rawData)
            return appData
        } catch {
            // Corrupted file: move to backup, return defaults
            let backupURL = fileURL.deletingPathExtension()
                .appendingPathExtension("json.backup")
            try? FileManager.default.moveItem(at: fileURL, to: backupURL)
            return AppData()
        }
    }

    func save(_ appData: AppData) {
        data = appData
        do {
            let rawData = try encoder.encode(appData)
            try rawData.write(to: fileURL, options: .atomic)
        } catch {
            print("PresetStore save error: \(error)")
        }
    }

    func addPreset(_ preset: Preset) {
        var current = load()
        current.presets.append(preset)
        save(current)
    }

    func removePreset(id: UUID) {
        var current = load()
        current.presets.removeAll { $0.id == id }
        if current.activePresetId == id {
            current.activePresetId = current.presets.first?.id
        }
        save(current)
    }

    func updatePreset(_ preset: Preset) {
        var current = load()
        if let index = current.presets.firstIndex(where: { $0.id == preset.id }) {
            current.presets[index] = preset
        }
        save(current)
    }

    // MARK: - Private

    private static func defaultDirectory() -> URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("AppSoundControl")
    }
}
```

- [ ] **Step 4: xcodegen 재생성 후 테스트 통과 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | grep -E "(Test Case|PASS|FAIL|BUILD)"
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/Data/PresetStore.swift AppSoundControlTests/PresetStoreTests.swift
git commit -m "feat: add PresetStore with JSON persistence and corruption recovery"
```

---

## Chunk 2: Process Monitoring & Audio Engine

### Task 4: ProcessMonitor (앱 실행 감지)

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/Data/ProcessMonitor.swift`
- Create: `~/AppSoundControl/AppSoundControlTests/ProcessMonitorTests.swift`

- [ ] **Step 1: ProcessMonitor 테스트 작성**

```swift
// AppSoundControlTests/ProcessMonitorTests.swift
import XCTest
@testable import AppSoundControl

final class ProcessMonitorTests: XCTestCase {

    func testRunningAppsReturnsNonEmptyList() {
        let monitor = ProcessMonitor()
        let apps = monitor.runningApps

        // 테스트 실행 중에도 최소한 현재 테스트 프로세스가 있어야 함
        XCTAssertFalse(apps.isEmpty, "At least some apps should be running")
    }

    func testRunningAppsHaveBundleId() {
        let monitor = ProcessMonitor()
        let apps = monitor.runningApps

        // 일부 앱은 bundleId가 없을 수 있지만, 대부분은 있어야 함
        let appsWithBundleId = apps.filter { $0.bundleIdentifier != nil }
        XCTAssertFalse(appsWithBundleId.isEmpty, "Some apps should have bundleIds")
    }

    func testExcludedBundleIdsFiltersApps() {
        let monitor = ProcessMonitor()
        monitor.excludedBundleIds = Set(["com.apple.finder"])

        let apps = monitor.filteredApps
        let finderApps = apps.filter { $0.bundleIdentifier == "com.apple.finder" }

        XCTAssertTrue(finderApps.isEmpty, "Finder should be excluded")
    }

    func testAppInfoFromRunningApp() {
        let monitor = ProcessMonitor()
        let apps = monitor.runningApps

        if let firstApp = apps.first(where: { $0.bundleIdentifier != nil }) {
            let info = AppInfo(from: firstApp)
            XCTAssertNotNil(info)
            XCTAssertNotNil(info?.bundleId)
            XCTAssertFalse(info!.name.isEmpty)
        }
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | tail -10
```

Expected: FAIL — `ProcessMonitor`, `AppInfo` 미정의

- [ ] **Step 3: ProcessMonitor 구현**

```swift
// AppSoundControl/Data/ProcessMonitor.swift
import AppKit
import Combine

struct AppInfo: Identifiable, Equatable {
    let id: pid_t
    let bundleId: String
    let name: String
    let icon: NSImage

    init?(from app: NSRunningApplication) {
        guard let bundleId = app.bundleIdentifier else { return nil }
        self.id = app.processIdentifier
        self.bundleId = bundleId
        self.name = app.localizedName ?? bundleId
        self.icon = app.icon ?? NSImage(systemSymbolName: "app.fill", accessibilityDescription: nil)!
    }
}

final class ProcessMonitor: ObservableObject {
    @Published private(set) var runningApps: [NSRunningApplication] = []
    @Published private(set) var filteredApps: [AppInfo] = []
    @Published var excludedBundleIds: Set<String> = [] {
        didSet { updateFilteredApps() }
    }

    private var cancellables = Set<AnyCancellable>()

    init() {
        refreshApps()
        observeAppChanges()
    }

    private func refreshApps() {
        runningApps = NSWorkspace.shared.runningApplications
            .filter { $0.activationPolicy == .regular || $0.activationPolicy == .accessory }
        updateFilteredApps()
    }

    private func updateFilteredApps() {
        filteredApps = runningApps
            .compactMap { AppInfo(from: $0) }
            .filter { !excludedBundleIds.contains($0.bundleId) }
            .sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    /// 현재 실행 중인 앱의 [BundleID: pid_t] 맵 (프리셋 적용 등에 사용)
    var processMap: [String: pid_t] {
        var map: [String: pid_t] = [:]
        for app in filteredApps {
            map[app.bundleId] = app.id
        }
        return map
    }

    private func observeAppChanges() {
        let workspace = NSWorkspace.shared
        let center = workspace.notificationCenter

        center.publisher(for: NSWorkspace.didLaunchApplicationNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.refreshApps() }
            .store(in: &cancellables)

        center.publisher(for: NSWorkspace.didTerminateApplicationNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in self?.refreshApps() }
            .store(in: &cancellables)
    }
}
```

- [ ] **Step 4: xcodegen 재생성 후 테스트 통과 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | grep -E "(Test Case|PASS|FAIL|BUILD)"
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/Data/ProcessMonitor.swift AppSoundControlTests/ProcessMonitorTests.swift
git commit -m "feat: add ProcessMonitor with NSWorkspace app tracking"
```

---

### Task 5: AudioEngineProtocol 정의

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/Audio/AudioEngineProtocol.swift`

- [ ] **Step 1: 프로토콜 작성**

```swift
// AppSoundControl/Audio/AudioEngineProtocol.swift
import Foundation

/// 오디오 엔진 추상화. 테스트 시 MockAudioEngine으로 교체 가능.
protocol AudioEngineProtocol: AnyObject {
    /// 특정 프로세스에 대한 오디오 탭 생성
    func createTap(for processID: pid_t, bundleID: String) throws

    /// 특정 프로세스의 오디오 탭 해제
    func destroyTap(for processID: pid_t)

    /// 프로세스별 볼륨 설정 (0.0~1.0)
    func setVolume(_ volume: Float, for processID: pid_t)

    /// 프로세스별 현재 볼륨 조회
    func getVolume(for processID: pid_t) -> Float?

    /// 마스터 볼륨 설정 (0.0~1.0)
    func setMasterVolume(_ volume: Float)

    /// 현재 마스터 볼륨
    var masterVolume: Float { get }

    /// 현재 탭이 활성화된 프로세스 ID 목록
    var activeProcessIDs: Set<pid_t> { get }
}

enum AudioTapError: Error, LocalizedError {
    case tapCreationFailed(OSStatus)
    case audioUnitSetupFailed(OSStatus)
    case processNotFound

    var errorDescription: String? {
        switch self {
        case .tapCreationFailed(let status):
            return "Process Tap 생성 실패 (OSStatus: \(status))"
        case .audioUnitSetupFailed(let status):
            return "AudioUnit 설정 실패 (OSStatus: \(status))"
        case .processNotFound:
            return "프로세스를 찾을 수 없음"
        }
    }
}
```

- [ ] **Step 2: xcodegen 재생성 및 빌드 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 3: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/Audio/AudioEngineProtocol.swift
git commit -m "feat: define AudioEngineProtocol for testable audio abstraction"
```

---

### Task 6: AudioTap & AudioTapManager 구현

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/Audio/AudioTap.swift`
- Create: `~/AppSoundControl/AppSoundControl/Audio/AudioTapManager.swift`

> **중요:** `AudioHardwareCreateProcessTap`은 macOS 14.2+의 비공개/신규 API로 정확한 시그니처를 반드시 Apple Developer Documentation에서 확인해야 합니다.

- [ ] **Step 1: Apple Developer Documentation에서 AudioHardwareCreateProcessTap API 확인**

```bash
# jina-reader로 Apple 문서 확인
curl -s -H "Authorization: Bearer $JINA_API_KEY" -H 'x-respond-with: markdown' \
  'https://r.jina.ai/https://developer.apple.com/documentation/coreaudio/audiohardwarecreateprocesstap'
```

> API 시그니처, 파라미터, 반환값을 확인하고 아래 구현에 반영할 것. `CATapDescription` 또는 동등한 타입의 정확한 이름과 이니셜라이저를 확인.

- [ ] **Step 2: AudioTap 구현**

아래는 골격 구현. Step 1에서 확인한 API 시그니처에 맞게 Step 3에서 `start()` 메서드를 완성할 것.

```swift
// AppSoundControl/Audio/AudioTap.swift
import CoreAudio
import AudioToolbox
import Foundation
import libkern

final class AudioTap {
    let processID: pid_t
    let bundleID: String

    /// 볼륨 (0.0~1.0). ManagedAtomic으로 오디오 스레드에서 안전하게 접근.
    private let _volume = ManagedAtomicFloat(1.0)
    var volume: Float {
        get { _volume.load() }
        set { _volume.store(newValue) }
    }

    /// 마스터 볼륨에 대한 참조 (AudioTapManager가 공유)
    private let _masterVolume: ManagedAtomicFloat

    private var tapID: AudioObjectID = kAudioObjectUnknown
    private var audioUnit: AudioUnit?

    init(processID: pid_t, bundleID: String, masterVolume: ManagedAtomicFloat) {
        self.processID = processID
        self.bundleID = bundleID
        self._masterVolume = masterVolume
    }

    func start() throws {
        // Step 1에서 확인한 API 기반으로 Step 3에서 완성
        // 필수 구현 사항:
        // 1. Process Tap 생성 (AudioHardwareCreateProcessTap)
        // 2. AudioUnit 설정 (HAL Output으로 탭에서 오디오 읽기)
        // 3. Render callback 등록 (볼륨 × 마스터볼륨 곱연산)
        // 4. AudioUnit 시작
        throw AudioTapError.tapCreationFailed(-1)  // placeholder — Step 3에서 교체
    }

    func stop() {
        if let unit = audioUnit {
            AudioOutputUnitStop(unit)
            AudioComponentInstanceDispose(unit)
            audioUnit = nil
        }
        if tapID != kAudioObjectUnknown {
            AudioHardwareDestroyProcessTap(tapID)
            tapID = kAudioObjectUnknown
        }
    }

    deinit {
        stop()
    }
}

// MARK: - Lock-free atomic float for real-time audio thread
// Float를 UInt32로 bit-cast하여 OSAtomicCompareAndSwap32로 원자적 읽기/쓰기.
// 실시간 오디오 스레드에서 lock 사용 금지 제약을 준수한다.

final class ManagedAtomicFloat: @unchecked Sendable {
    private let _storage: UnsafeMutablePointer<Int32>

    init(_ initialValue: Float) {
        _storage = .allocate(capacity: 1)
        _storage.initialize(to: Int32(bitPattern: initialValue.bitPattern))
    }

    deinit {
        _storage.deinitialize(count: 1)
        _storage.deallocate()
    }

    func load() -> Float {
        let bits = UInt32(bitPattern: _storage.pointee)
        return Float(bitPattern: bits)
    }

    func store(_ newValue: Float) {
        let newBits = Int32(bitPattern: newValue.bitPattern)
        var oldBits: Int32
        repeat {
            oldBits = _storage.pointee
        } while !OSAtomicCompareAndSwap32(oldBits, newBits, _storage)
    }
}
```

- [ ] **Step 3: API 확인 결과를 바탕으로 AudioTap.start() 완성**

Step 1에서 확인한 `AudioHardwareCreateProcessTap` API 시그니처를 사용하여 `start()` 메서드의 placeholder를 실제 구현으로 교체. 구현해야 할 4가지:
1. `CATapDescription` (또는 동등 타입)으로 프로세스 탭 생성
2. `AudioUnit` (kAudioUnitSubType_HALOutput)을 탭의 출력 장치로 설정
3. Render callback에서 `_volume.load() * _masterVolume.load()`를 각 오디오 샘플에 곱연산
4. `AudioOutputUnitStart`로 오디오 유닛 시작

> **Render callback 주의사항:** 실시간 오디오 스레드에서 실행되므로 메모리 할당, lock 획득, Objective-C 메시지 전송 금지. `ManagedAtomicFloat.load()`의 `os_unfair_lock`은 매우 짧은 임계 구간이므로 허용 가능하나, 성능 이슈 발생 시 aligned UnsafeMutablePointer<UInt32>로 교체하여 하드웨어 레벨 atomicity 활용.

- [ ] **Step 4: AudioTapManager 구현**

```swift
// AppSoundControl/Audio/AudioTapManager.swift
import Foundation
import CoreAudio

final class AudioTapManager: AudioEngineProtocol {
    private var taps: [pid_t: AudioTap] = [:]
    private let masterVolumeAtomic = ManagedAtomicFloat(1.0)
    private let queue = DispatchQueue(label: "com.eunsookim.AudioTapManager")

    var masterVolume: Float {
        masterVolumeAtomic.load()
    }

    var activeProcessIDs: Set<pid_t> {
        queue.sync { Set(taps.keys) }
    }

    func createTap(for processID: pid_t, bundleID: String) throws {
        try queue.sync {
            guard taps[processID] == nil else { return }

            let tap = AudioTap(
                processID: processID,
                bundleID: bundleID,
                masterVolume: masterVolumeAtomic
            )
            try tap.start()
            taps[processID] = tap
        }
    }

    func destroyTap(for processID: pid_t) {
        queue.sync {
            taps[processID]?.stop()
            taps.removeValue(forKey: processID)
        }
    }

    func setVolume(_ volume: Float, for processID: pid_t) {
        queue.sync {
            let clamped = max(0.0, min(1.0, volume))
            taps[processID]?.volume = clamped
        }
    }

    func getVolume(for processID: pid_t) -> Float? {
        queue.sync {
            taps[processID]?.volume
        }
    }

    func setMasterVolume(_ volume: Float) {
        masterVolumeAtomic.store(max(0.0, min(1.0, volume)))
    }

    func destroyAllTaps() {
        queue.sync {
            taps.values.forEach { $0.stop() }
            taps.removeAll()
        }
    }
}
```

- [ ] **Step 5: xcodegen 재생성 및 빌드 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **` (AudioTap.start()의 throw는 런타임에만 발생)

- [ ] **Step 6: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/Audio/AudioTap.swift AppSoundControl/Audio/AudioTapManager.swift
git commit -m "feat: add AudioTap and AudioTapManager with thread-safe volume control"
```

---

### Task 7: VolumeController (UI ↔ Audio 중재자)

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/Audio/VolumeController.swift`
- Create: `~/AppSoundControl/AppSoundControlTests/VolumeControllerTests.swift`

- [ ] **Step 1: Mock AudioEngine 및 VolumeController 테스트 작성**

```swift
// AppSoundControlTests/VolumeControllerTests.swift
import XCTest
@testable import AppSoundControl

final class MockAudioEngine: AudioEngineProtocol {
    var createdTaps: [(pid_t, String)] = []
    var destroyedTaps: [pid_t] = []
    var volumes: [pid_t: Float] = [:]
    var _masterVolume: Float = 1.0
    var shouldFailCreation = false

    var masterVolume: Float { _masterVolume }
    var activeProcessIDs: Set<pid_t> { Set(volumes.keys) }

    func createTap(for processID: pid_t, bundleID: String) throws {
        if shouldFailCreation { throw AudioTapError.tapCreationFailed(-1) }
        createdTaps.append((processID, bundleID))
        volumes[processID] = 1.0
    }

    func destroyTap(for processID: pid_t) {
        destroyedTaps.append(processID)
        volumes.removeValue(forKey: processID)
    }

    func setVolume(_ volume: Float, for processID: pid_t) {
        volumes[processID] = volume
    }

    func getVolume(for processID: pid_t) -> Float? {
        volumes[processID]
    }

    func setMasterVolume(_ volume: Float) {
        _masterVolume = volume
    }
}

final class VolumeControllerTests: XCTestCase {
    var engine: MockAudioEngine!
    var store: PresetStore!
    var controller: VolumeController!
    var tempDir: URL!

    override func setUp() {
        super.setUp()
        engine = MockAudioEngine()
        tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
        try! FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        store = PresetStore(directory: tempDir)
        controller = VolumeController(engine: engine, store: store)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: tempDir)
        super.tearDown()
    }

    func testSetAppVolume() {
        let pid: pid_t = 1234
        try! engine.createTap(for: pid, bundleID: "com.test")

        controller.setVolume(0.5, for: pid, bundleID: "com.test")

        XCTAssertEqual(engine.volumes[pid], 0.5)
    }

    func testSetMasterVolume() {
        controller.setMasterVolume(0.7)

        XCTAssertEqual(engine._masterVolume, 0.7)
    }

    func testApplyPreset() {
        let pid1: pid_t = 100
        let pid2: pid_t = 200
        try! engine.createTap(for: pid1, bundleID: "com.app1")
        try! engine.createTap(for: pid2, bundleID: "com.app2")

        let preset = Preset(
            name: "테스트",
            volumes: ["com.app1": 0.3, "com.app2": 0.8]
        )

        controller.applyPreset(preset, processMap: [
            "com.app1": pid1,
            "com.app2": pid2
        ])

        XCTAssertEqual(engine.volumes[pid1], 0.3)
        XCTAssertEqual(engine.volumes[pid2], 0.8)
    }

    func testApplyPresetIgnoresMissingProcesses() {
        let preset = Preset(
            name: "테스트",
            volumes: ["com.missing.app": 0.5]
        )

        // 프로세스 맵에 없는 bundleID는 무시
        controller.applyPreset(preset, processMap: [:])
        // 에러 없이 정상 완료되어야 함
    }

    func testVolumeMemoryForInactiveApps() {
        let preset = Preset(
            name: "테스트",
            volumes: ["com.inactive": 0.4, "com.active": 0.9]
        )

        let activeProcessMap = ["com.active": pid_t(100)]
        try! engine.createTap(for: 100, bundleID: "com.active")

        controller.applyPreset(preset, processMap: activeProcessMap)

        // com.inactive의 볼륨은 메모리에 보관
        XCTAssertEqual(controller.pendingVolumes["com.inactive"], 0.4)
        XCTAssertEqual(engine.volumes[100], 0.9)
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | tail -10
```

Expected: FAIL — `VolumeController` 미정의

- [ ] **Step 3: VolumeController 구현**

```swift
// AppSoundControl/Audio/VolumeController.swift
import Foundation
import Combine

final class VolumeController: ObservableObject {
    private let engine: AudioEngineProtocol
    private let store: PresetStore

    /// 현재 실행 중이 아닌 앱의 볼륨을 보관 (bundleID → volume)
    @Published var pendingVolumes: [String: Float] = [:]

    /// 현재 앱별 볼륨 상태 (bundleID → volume)
    @Published var appVolumes: [String: Float] = [:]

    @Published var masterVolume: Float = 1.0

    init(engine: AudioEngineProtocol, store: PresetStore) {
        self.engine = engine
        self.store = store
        self.masterVolume = store.data.masterVolume
        engine.setMasterVolume(masterVolume)
    }

    // MARK: - Volume Control

    func setVolume(_ volume: Float, for processID: pid_t, bundleID: String) {
        let clamped = max(0.0, min(1.0, volume))
        engine.setVolume(clamped, for: processID)
        appVolumes[bundleID] = clamped
    }

    func setMasterVolume(_ volume: Float) {
        let clamped = max(0.0, min(1.0, volume))
        masterVolume = clamped
        engine.setMasterVolume(clamped)
        var data = store.load()
        data.masterVolume = clamped
        store.save(data)
    }

    // MARK: - Tap Management

    func startTap(for processID: pid_t, bundleID: String) {
        do {
            try engine.createTap(for: processID, bundleID: bundleID)
            // 보관된 볼륨이 있으면 적용
            if let pending = pendingVolumes.removeValue(forKey: bundleID) {
                engine.setVolume(pending, for: processID)
                appVolumes[bundleID] = pending
            } else {
                appVolumes[bundleID] = engine.getVolume(for: processID) ?? 1.0
            }
        } catch {
            print("Tap creation failed for \(bundleID): \(error)")
        }
    }

    func stopTap(for processID: pid_t, bundleID: String) {
        engine.destroyTap(for: processID)
        appVolumes.removeValue(forKey: bundleID)
    }

    // MARK: - Preset

    func applyPreset(_ preset: Preset, processMap: [String: pid_t]) {
        for (bundleID, volume) in preset.volumes {
            if let pid = processMap[bundleID] {
                engine.setVolume(volume, for: pid)
                appVolumes[bundleID] = volume
            } else {
                pendingVolumes[bundleID] = volume
            }
        }
    }

    func saveCurrentAsPreset(name: String, icon: String, processMap: [String: pid_t]) -> Preset {
        var volumes: [String: Float] = [:]
        for (bundleID, pid) in processMap {
            volumes[bundleID] = engine.getVolume(for: pid) ?? 1.0
        }
        let preset = Preset(name: name, icon: icon, volumes: volumes)
        store.addPreset(preset)
        return preset
    }
}
```

- [ ] **Step 4: xcodegen 재생성 후 테스트 통과 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | grep -E "(Test Case|PASS|FAIL|BUILD)"
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/Audio/VolumeController.swift AppSoundControlTests/VolumeControllerTests.swift
git commit -m "feat: add VolumeController with preset application and pending volumes"
```

---

## Chunk 3: UI — Components & MenuBar Popover

### Task 8: GlowTheme & GlowSlider 컴포넌트

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/UI/Components/GlowTheme.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Components/GlowSlider.swift`

- [ ] **Step 1: GlowTheme 작성**

```swift
// AppSoundControl/UI/Components/GlowTheme.swift
import SwiftUI

enum GlowTheme {
    // Background
    static let background = Color(red: 0.047, green: 0.047, blue: 0.114)      // #0c0c1d
    static let surface = Color.white.opacity(0.03)
    static let surfaceHover = Color.white.opacity(0.06)
    static let divider = Color.white.opacity(0.06)

    // Primary gradient (slider)
    static let primaryStart = Color(red: 0.388, green: 0.400, blue: 0.945)    // #6366f1
    static let primaryEnd = Color(red: 0.655, green: 0.545, blue: 0.980)      // #a78bfa
    static let primaryGlow = Color(red: 0.388, green: 0.400, blue: 0.945).opacity(0.4)

    // Master slider gradient
    static let masterEnd = Color(red: 0.753, green: 0.518, blue: 0.988)       // #c084fc

    // Text
    static let textPrimary = Color(red: 0.878, green: 0.878, blue: 1.0)       // #e0e0ff
    static let textSecondary = Color(red: 0.655, green: 0.545, blue: 0.980)   // #a78bfa
    static let textMuted = Color.white.opacity(0.33)                            // #555

    // Active preset
    static let activePill = Color(red: 0.388, green: 0.400, blue: 0.945)      // #6366f1
    static let inactivePill = Color.white.opacity(0.08)

    // Slider dimensions
    static let sliderHeight: CGFloat = 6
    static let masterSliderHeight: CGFloat = 8
    static let sliderCornerRadius: CGFloat = 3
    static let appIconSize: CGFloat = 20
    static let popoverWidth: CGFloat = 320
}
```

- [ ] **Step 2: GlowSlider 작성**

```swift
// AppSoundControl/UI/Components/GlowSlider.swift
import SwiftUI

struct GlowSlider: View {
    @Binding var value: Float
    var isMaster: Bool = false

    private var height: CGFloat {
        isMaster ? GlowTheme.masterSliderHeight : GlowTheme.sliderHeight
    }

    private var gradientColors: [Color] {
        isMaster
            ? [GlowTheme.primaryStart, GlowTheme.primaryEnd, GlowTheme.masterEnd]
            : [GlowTheme.primaryStart, GlowTheme.primaryEnd]
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Track background
                RoundedRectangle(cornerRadius: GlowTheme.sliderCornerRadius)
                    .fill(Color.white.opacity(0.06))
                    .frame(height: height)

                // Filled track with glow
                RoundedRectangle(cornerRadius: GlowTheme.sliderCornerRadius)
                    .fill(
                        LinearGradient(
                            colors: gradientColors,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(
                        width: max(0, geometry.size.width * CGFloat(value)),
                        height: height
                    )
                    .shadow(color: GlowTheme.primaryGlow, radius: 8, x: 0, y: 0)
            }
            .frame(height: height)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { drag in
                        let newValue = Float(drag.location.x / geometry.size.width)
                        value = max(0, min(1, newValue))
                    }
            )
        }
        .frame(height: height)
    }
}
```

- [ ] **Step 3: xcodegen 재생성 및 빌드 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 4: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/UI/Components/
git commit -m "feat: add GlowTheme and GlowSlider UI components"
```

---

### Task 9: MenuBar Popover 뷰 구현

**Files:**
- Create: `~/AppSoundControl/AppSoundControl/UI/MenuBar/AppVolumeRow.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/MenuBar/PresetPillBar.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/MenuBar/MasterVolumeSlider.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/MenuBar/MenuBarPopover.swift`

- [ ] **Step 1: AppVolumeRow 작성**

```swift
// AppSoundControl/UI/MenuBar/AppVolumeRow.swift
import SwiftUI

struct AppVolumeRow: View {
    let appName: String
    let appIcon: NSImage
    @Binding var volume: Float
    let isMuted: Bool

    var body: some View {
        VStack(spacing: 6) {
            HStack(spacing: 8) {
                Image(nsImage: appIcon)
                    .resizable()
                    .frame(width: GlowTheme.appIconSize, height: GlowTheme.appIconSize)
                    .cornerRadius(5)

                Text(appName)
                    .font(.system(size: 12))
                    .foregroundColor(isMuted ? GlowTheme.textMuted : GlowTheme.textPrimary)
                    .lineLimit(1)

                Spacer()

                Text(isMuted ? "뮤트" : "\(Int(volume * 100))%")
                    .font(.system(size: 11).monospacedDigit())
                    .foregroundColor(isMuted ? GlowTheme.textMuted : GlowTheme.textSecondary)
            }

            GlowSlider(value: $volume)
                .opacity(isMuted ? 0.3 : 1.0)
        }
        .padding(.vertical, 8)
    }
}
```

- [ ] **Step 2: PresetPillBar 작성**

```swift
// AppSoundControl/UI/MenuBar/PresetPillBar.swift
import SwiftUI

struct PresetPillBar: View {
    let presets: [Preset]
    let activePresetId: UUID?
    let onSelect: (Preset) -> Void
    let onAdd: () -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(presets) { preset in
                    Button(action: { onSelect(preset) }) {
                        Text("\(preset.icon) \(preset.name)")
                            .font(.system(size: 10))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 3)
                            .background(
                                preset.id == activePresetId
                                    ? GlowTheme.activePill
                                    : GlowTheme.inactivePill
                            )
                            .foregroundColor(
                                preset.id == activePresetId
                                    ? .white
                                    : GlowTheme.textMuted
                            )
                            .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }

                Button(action: onAdd) {
                    Text("+ 추가")
                        .font(.system(size: 10))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 3)
                        .background(GlowTheme.inactivePill)
                        .foregroundColor(GlowTheme.textMuted)
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
    }
}
```

- [ ] **Step 3: MasterVolumeSlider 작성**

```swift
// AppSoundControl/UI/MenuBar/MasterVolumeSlider.swift
import SwiftUI

struct MasterVolumeSlider: View {
    @Binding var volume: Float

    var body: some View {
        VStack(spacing: 6) {
            HStack(spacing: 8) {
                Text("🔊")
                    .font(.system(size: 11))

                Text("마스터 볼륨")
                    .font(.system(size: 12))
                    .foregroundColor(GlowTheme.textPrimary)

                Spacer()

                Text("\(Int(volume * 100))%")
                    .font(.system(size: 11).monospacedDigit())
                    .foregroundColor(GlowTheme.textSecondary)
            }

            GlowSlider(value: $volume, isMaster: true)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}
```

- [ ] **Step 4: MenuBarPopover 작성**

```swift
// AppSoundControl/UI/MenuBar/MenuBarPopover.swift
import SwiftUI

struct MenuBarPopover: View {
    @ObservedObject var volumeController: VolumeController
    @ObservedObject var presetStore: PresetStore
    @ObservedObject var processMonitor: ProcessMonitor

    let onOpenSettings: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("🔊 AppSoundControl")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(GlowTheme.textPrimary)

                Spacer()

                Button(action: onOpenSettings) {
                    Image(systemName: "gear")
                        .font(.system(size: 12))
                        .foregroundColor(GlowTheme.activePill)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 8)

            // Preset pills
            PresetPillBar(
                presets: presetStore.data.presets,
                activePresetId: presetStore.data.activePresetId,
                onSelect: { preset in
                    let processMap = processMonitor.processMap
                    volumeController.applyPreset(preset, processMap: processMap)
                    var data = presetStore.data
                    data.activePresetId = preset.id
                    presetStore.save(data)
                },
                onAdd: onOpenSettings
            )

            Divider()
                .background(GlowTheme.divider)

            // App list
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(processMonitor.filteredApps) { app in
                        let bundleId = app.bundleId
                        AppVolumeRow(
                            appName: app.name,
                            appIcon: app.icon,
                            volume: Binding(
                                get: { volumeController.appVolumes[bundleId] ?? 1.0 },
                                set: { newValue in
                                    volumeController.setVolume(newValue, for: app.id, bundleID: bundleId)
                                }
                            ),
                            isMuted: (volumeController.appVolumes[bundleId] ?? 1.0) == 0
                        )
                    }
                }
                .padding(.horizontal, 16)
            }
            .frame(maxHeight: 300)

            // Master volume
            Divider()
                .background(GlowTheme.divider)

            MasterVolumeSlider(
                volume: Binding(
                    get: { volumeController.masterVolume },
                    set: { volumeController.setMasterVolume($0) }
                )
            )
        }
        .frame(width: GlowTheme.popoverWidth)
        .background(GlowTheme.background)
    }
}
```

- [ ] **Step 5: xcodegen 재생성 및 빌드 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 6: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/UI/MenuBar/
git commit -m "feat: add MenuBar popover views with glow design"
```

---

### Task 10: App Entry Point (MenuBarExtra 통합)

**Files:**
- Modify: `~/AppSoundControl/AppSoundControl/App/AppSoundControlApp.swift`

- [ ] **Step 1: AppSoundControlApp 완성**

```swift
// AppSoundControl/App/AppSoundControlApp.swift
import SwiftUI

@main
struct AppSoundControlApp: App {
    @StateObject private var presetStore: PresetStore
    @StateObject private var processMonitor: ProcessMonitor
    @StateObject private var volumeController: VolumeController
    @Environment(\.openSettings) private var openSettings

    init() {
        let store = PresetStore()
        let engine = AudioTapManager()
        let controller = VolumeController(engine: engine, store: store)
        let monitor = ProcessMonitor()
        monitor.excludedBundleIds = Set(store.data.excludedBundleIds)

        _presetStore = StateObject(wrappedValue: store)
        _volumeController = StateObject(wrappedValue: controller)
        _processMonitor = StateObject(wrappedValue: monitor)
    }

    var body: some Scene {
        MenuBarExtra("AppSoundControl", systemImage: "speaker.wave.2.fill") {
            MenuBarPopover(
                volumeController: volumeController,
                presetStore: presetStore,
                processMonitor: processMonitor,
                onOpenSettings: openSettings
            )
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsWindow(
                presetStore: presetStore,
                processMonitor: processMonitor,
                volumeController: volumeController
            )
        }
    }
}
```

> **주의:** 이 단계에서는 `SettingsWindow`가 아직 없으므로 placeholder를 만들어야 합니다. Task 11에서 완성합니다.

- [ ] **Step 2: SettingsWindow placeholder 작성**

```swift
// AppSoundControl/UI/Settings/SettingsWindow.swift
import SwiftUI

struct SettingsWindow: View {
    @ObservedObject var presetStore: PresetStore
    @ObservedObject var processMonitor: ProcessMonitor
    @ObservedObject var volumeController: VolumeController

    var body: some View {
        Text("설정 (구현 예정)")
            .frame(width: 500, height: 400)
    }
}
```

- [ ] **Step 3: xcodegen 재생성 및 빌드 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 4: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/App/AppSoundControlApp.swift AppSoundControl/UI/Settings/SettingsWindow.swift
git commit -m "feat: integrate MenuBarExtra with popover and settings"
```

---

## Chunk 4: Settings Window & System Integration

### Task 11: 설정 윈도우 완성 (4개 탭)

**Files:**
- Modify: `~/AppSoundControl/AppSoundControl/UI/Settings/SettingsWindow.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Components/FlowLayout.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Settings/PresetCard.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Settings/PresetTab.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Settings/GeneralTab.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Settings/ExcludedAppsTab.swift`
- Create: `~/AppSoundControl/AppSoundControl/UI/Settings/ShortcutsTab.swift`

- [ ] **Step 1a: FlowLayout 작성 (별도 파일)**

```swift
// AppSoundControl/UI/Components/FlowLayout.swift
import SwiftUI

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: ProposedViewSize(width: bounds.width, height: bounds.height), subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
```

- [ ] **Step 1b: PresetCard 작성 (별도 파일)**

```swift
// AppSoundControl/UI/Settings/PresetCard.swift
import SwiftUI

struct PresetCard: View {
    let preset: Preset
    let isActive: Bool
    let onActivate: () -> Void
    let onDelete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("\(preset.icon) \(preset.name)")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(GlowTheme.textPrimary)

                Spacer()

                if isActive {
                    Text("활성")
                        .font(.system(size: 10))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(GlowTheme.activePill.opacity(0.15))
                        .foregroundColor(GlowTheme.activePill)
                        .cornerRadius(6)
                }

                if let shortcut = preset.shortcut {
                    Text(shortcut)
                        .font(.system(size: 10))
                        .foregroundColor(GlowTheme.textMuted)
                }
            }

            FlowLayout(spacing: 10) {
                ForEach(Array(preset.volumes.sorted(by: { $0.key < $1.key })), id: \.key) { bundleId, vol in
                    let appName = bundleId.components(separatedBy: ".").last ?? bundleId
                    HStack(spacing: 4) {
                        Text(appName)
                            .foregroundColor(GlowTheme.textMuted)
                        Text(vol == 0 ? "뮤트" : "\(Int(vol * 100))%")
                            .foregroundColor(vol == 0 ? GlowTheme.textMuted : GlowTheme.textSecondary)
                    }
                    .font(.system(size: 10))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(GlowTheme.surface)
                    .cornerRadius(6)
                }
            }

            HStack {
                if !isActive {
                    Button("적용", action: onActivate)
                        .buttonStyle(.plain)
                        .foregroundColor(GlowTheme.activePill)
                        .font(.system(size: 11))
                }
                Spacer()
                Button("삭제", action: onDelete)
                    .buttonStyle(.plain)
                    .foregroundColor(.red.opacity(0.7))
                    .font(.system(size: 11))
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isActive ? GlowTheme.activePill.opacity(0.1) : GlowTheme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isActive ? GlowTheme.activePill.opacity(0.3) : GlowTheme.divider, lineWidth: 1)
        )
    }
}
```

- [ ] **Step 1c: PresetTab 작성**

```swift
// AppSoundControl/UI/Settings/PresetTab.swift
import SwiftUI

struct PresetTab: View {
    @ObservedObject var presetStore: PresetStore
    @ObservedObject var volumeController: VolumeController
    @ObservedObject var processMonitor: ProcessMonitor

    @State private var showingNewPreset = false
    @State private var newPresetName = ""
    @State private var newPresetIcon = "🎵"

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(presetStore.data.presets) { preset in
                PresetCard(
                    preset: preset,
                    isActive: preset.id == presetStore.data.activePresetId,
                    onActivate: {
                        let map = buildProcessMap()
                        volumeController.applyPreset(preset, processMap: map)
                        var data = presetStore.data
                        data.activePresetId = preset.id
                        presetStore.save(data)
                    },
                    onDelete: {
                        presetStore.removePreset(id: preset.id)
                    }
                )
            }

            Button(action: { showingNewPreset = true }) {
                HStack {
                    Spacer()
                    Text("+ 새 프리셋 만들기")
                        .foregroundColor(GlowTheme.activePill)
                    Spacer()
                }
                .padding(14)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(style: StrokeStyle(lineWidth: 1, dash: [5]))
                        .foregroundColor(GlowTheme.divider)
                )
            }
            .buttonStyle(.plain)
            .sheet(isPresented: $showingNewPreset) {
                VStack(spacing: 16) {
                    Text("새 프리셋").font(.headline)
                    TextField("이름", text: $newPresetName)
                        .textFieldStyle(.roundedBorder)
                    TextField("아이콘 (이모지)", text: $newPresetIcon)
                        .textFieldStyle(.roundedBorder)
                    HStack {
                        Button("취소") { showingNewPreset = false }
                        Button("현재 볼륨으로 저장") {
                            let map = processMonitor.processMap
                            let preset = volumeController.saveCurrentAsPreset(
                                name: newPresetName, icon: newPresetIcon, processMap: map
                            )
                            // addPreset이 save를 수행하므로, 이후 다시 load하여 activePresetId만 업데이트
                            var freshData = presetStore.load()
                            freshData.activePresetId = preset.id
                            presetStore.save(freshData)
                            showingNewPreset = false
                            newPresetName = ""
                            newPresetIcon = "🎵"
                        }
                        .disabled(newPresetName.isEmpty)
                    }
                }
                .padding(20)
                .frame(width: 300)
            }

            Spacer()
        }
        .padding()
    }
}
```

- [ ] **Step 2: GeneralTab 작성**

```swift
// AppSoundControl/UI/Settings/GeneralTab.swift
import SwiftUI
import ServiceManagement

struct GeneralTab: View {
    @ObservedObject var presetStore: PresetStore

    var body: some View {
        Form {
            Toggle("로그인 시 자동 시작", isOn: Binding(
                get: { presetStore.data.settings.launchAtLogin },
                set: { newValue in
                    var data = presetStore.data
                    data.settings.launchAtLogin = newValue
                    presetStore.save(data)
                    updateLoginItem(enabled: newValue)
                }
            ))

            Toggle("마지막 프리셋 기억", isOn: Binding(
                get: { presetStore.data.settings.rememberLastPreset },
                set: { newValue in
                    var data = presetStore.data
                    data.settings.rememberLastPreset = newValue
                    presetStore.save(data)
                }
            ))
        }
        .formStyle(.grouped)
        .padding()
    }

    private func updateLoginItem(enabled: Bool) {
        do {
            if enabled {
                try SMAppService.mainApp.register()
            } else {
                try SMAppService.mainApp.unregister()
            }
        } catch {
            print("Login item update failed: \(error)")
        }
    }
}
```

- [ ] **Step 3: ExcludedAppsTab 작성**

```swift
// AppSoundControl/UI/Settings/ExcludedAppsTab.swift
import SwiftUI

struct ExcludedAppsTab: View {
    @ObservedObject var presetStore: PresetStore
    @ObservedObject var processMonitor: ProcessMonitor

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("제외된 앱은 볼륨 제어 목록에 표시되지 않습니다.")
                .font(.system(size: 12))
                .foregroundColor(.secondary)

            List {
                ForEach(processMonitor.runningApps.compactMap({ AppInfo(from: $0) }), id: \.bundleId) { app in
                    HStack {
                        Image(nsImage: app.icon)
                            .resizable()
                            .frame(width: 20, height: 20)

                        Text(app.name)

                        Spacer()

                        Toggle("", isOn: Binding(
                            get: { !presetStore.data.excludedBundleIds.contains(app.bundleId) },
                            set: { included in
                                var data = presetStore.data
                                if included {
                                    data.excludedBundleIds.removeAll { $0 == app.bundleId }
                                } else {
                                    data.excludedBundleIds.append(app.bundleId)
                                }
                                presetStore.save(data)
                                processMonitor.excludedBundleIds = Set(data.excludedBundleIds)
                            }
                        ))
                        .toggleStyle(.switch)
                    }
                }
            }
        }
        .padding()
    }
}
```

- [ ] **Step 4: ShortcutsTab 작성**

> **MVP 범위 참고:** 스펙에서 글로벌 단축키 설정을 MVP 기능으로 명시했으나, 단축키 녹화(key recording) UI는 별도 라이브러리(예: KeyboardShortcuts by Sindre Sorhus)가 필요하여 복잡도가 높다. MVP에서는 단축키 목록 표시만 구현하고, 단축키 편집은 후속 작업으로 분리한다.

```swift
// AppSoundControl/UI/Settings/ShortcutsTab.swift
import SwiftUI

struct ShortcutsTab: View {
    @ObservedObject var presetStore: PresetStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("시스템 단축키 충돌 방지를 위해 ⌃⌥⌘ 조합을 권장합니다.")
                .font(.system(size: 12))
                .foregroundColor(.secondary)

            List {
                ForEach(presetStore.data.presets) { preset in
                    HStack {
                        Text("\(preset.icon) \(preset.name)")

                        Spacer()

                        Text(preset.shortcut ?? "미설정")
                            .foregroundColor(preset.shortcut != nil ? GlowTheme.textSecondary : .secondary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(GlowTheme.surface)
                            .cornerRadius(6)
                    }
                }
            }

            Text("단축키 편집은 후속 작업으로 구현 예정 (KeyboardShortcuts 라이브러리 도입)")
                .font(.system(size: 11))
                .foregroundColor(.secondary)
        }
        .padding()
    }
}
```

- [ ] **Step 5: SettingsWindow 완성 (탭 통합)**

```swift
// AppSoundControl/UI/Settings/SettingsWindow.swift
import SwiftUI

struct SettingsWindow: View {
    @ObservedObject var presetStore: PresetStore
    @ObservedObject var processMonitor: ProcessMonitor
    @ObservedObject var volumeController: VolumeController

    var body: some View {
        TabView {
            PresetTab(
                presetStore: presetStore,
                volumeController: volumeController,
                processMonitor: processMonitor
            )
            .tabItem {
                Label("프리셋", systemImage: "slider.horizontal.3")
            }

            GeneralTab(presetStore: presetStore)
                .tabItem {
                    Label("일반", systemImage: "gear")
                }

            ExcludedAppsTab(
                presetStore: presetStore,
                processMonitor: processMonitor
            )
            .tabItem {
                Label("제외 앱", systemImage: "eye.slash")
            }

            ShortcutsTab(presetStore: presetStore)
                .tabItem {
                    Label("단축키", systemImage: "command")
                }
        }
        .frame(width: 500, height: 450)
    }
}
```

- [ ] **Step 6: xcodegen 재생성 및 빌드 확인**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
```

Expected: `** BUILD SUCCEEDED **`

- [ ] **Step 7: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/UI/Settings/ AppSoundControl/UI/Components/FlowLayout.swift
git commit -m "feat: add Settings window with Preset, General, Excluded Apps, Shortcuts tabs"
```

---

### Task 12: macOS 버전 체크 및 최종 통합

**Files:**
- Modify: `~/AppSoundControl/AppSoundControl/App/AppSoundControlApp.swift`

- [ ] **Step 1: Task 10의 init()에 버전 체크 삽입**

`AppSoundControlApp.swift`의 `init()` 맨 처음에 다음 버전 체크 코드를 추가 (기존 store/engine/controller/monitor 초기화 코드는 유지):

```swift
// init() 맨 위에 추가
let version = ProcessInfo.processInfo.operatingSystemVersion
if version.majorVersion < 14 || (version.majorVersion == 14 && version.minorVersion < 2) {
    let alert = NSAlert()
    alert.messageText = "macOS 14.2 이상이 필요합니다"
    alert.informativeText = "AppSoundControl은 Audio Process Tap API를 사용하므로 macOS 14.2 (Sonoma) 이상에서만 동작합니다."
    alert.alertStyle = .critical
    alert.runModal()
    NSApp.terminate(nil)
}
// 이하 기존 let store = PresetStore() ... 코드 유지
```

- [ ] **Step 2: 전체 빌드 및 테스트 실행**

```bash
cd ~/AppSoundControl
xcodegen generate
xcodebuild -project AppSoundControl.xcodeproj -scheme AppSoundControl build 2>&1 | tail -3
xcodebuild test -project AppSoundControl.xcodeproj -scheme AppSoundControlTests -configuration Debug 2>&1 | grep -E "(Test Suite|PASS|FAIL|BUILD)"
```

Expected: 빌드 성공, 모든 테스트 통과

- [ ] **Step 3: 커밋**

```bash
cd ~/AppSoundControl
git add AppSoundControl/App/AppSoundControlApp.swift
git commit -m "feat: add macOS version check and finalize app integration"
```

---

### Task 13: README 작성

**Files:**
- Create: `~/AppSoundControl/README.md`

- [ ] **Step 1: README 작성**

```markdown
# AppSoundControl

macOS 14.2+ 전용 앱별 사운드 볼륨 컨트롤러.

## Features

- 🔊 앱별 독립 볼륨 조절 (0~100%)
- 🎛 마스터 볼륨 제어
- 📋 프리셋 저장/전환 (단축키 지원)
- 🌙 글로우 & 프리미엄 다크 UI
- 🚀 메뉴바 상주 + 설정 윈도우

## Requirements

- macOS 14.2 (Sonoma) 이상
- Xcode 15+
- [xcodegen](https://github.com/yonaskolb/XcodeGen)

## Build

\```bash
brew install xcodegen  # if not installed
xcodegen generate
open AppSoundControl.xcodeproj
\```

## Architecture

3계층 분리 구조:

- **UI Layer** — SwiftUI (MenuBarExtra + Settings)
- **Audio Engine** — CoreAudio Process Tap API
- **Data Layer** — NSWorkspace + JSON persistence

## Tech Stack

Swift 5.9 · SwiftUI · CoreAudio · XCTest
```

- [ ] **Step 2: 커밋**

```bash
cd ~/AppSoundControl
git add README.md
git commit -m "docs: add project README"
```
