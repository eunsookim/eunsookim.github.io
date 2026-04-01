# 인라인 이미지 커서 위치 삽입 설계

## 요약

블로그 포스트 에디터에서 이미지 업로드 시 콘텐츠 끝이 아닌 **커서 위치**에 마크다운 이미지 문법을 삽입하도록 개선한다.

## 현재 상태

- `post-editor.tsx`의 `handleImageUpload`가 이미지 업로드 후 항상 콘텐츠 끝에 `![파일명](url)` 추가
- 버튼 클릭, 드래그 앤 드롭, 클립보드 붙여넣기 세 가지 방법 모두 동일하게 끝에 추가

## 변경 사항

### 변경 파일

- `src/components/admin/post-editor.tsx` (1개 파일)

### 설계

1. **커서 위치 추적 ref 추가**
   - `cursorPositionRef = useRef<number | null>(null)` 선언
   - 한국어/영어 에디터 모두에 적용

2. **MDEditor `textareaProps`로 커서 위치 캡처**
   - `onSelect`: 텍스트 선택/커서 이동 시 `selectionStart` 저장
   - `onBlur`: 포커스 이탈 시(버튼 클릭 등) 마지막 위치 저장

3. **`handleImageUpload` 수정**
   - 저장된 커서 위치에서 문자열을 분할하여 사이에 placeholder 삽입
   - `before(0~cursor) + "\n" + placeholder + "\n" + after(cursor~끝)`
   - 커서 위치가 null이면 기존처럼 끝에 추가 (fallback)

4. **삽입 방법별 동작**
   - 버튼 클릭: `onBlur` 시 저장된 위치 사용
   - 붙여넣기: `onSelect`로 실시간 추적된 위치 사용
   - 드래그 앤 드롭: 마지막으로 알려진 커서 위치 사용

5. **업로드 완료 후 처리**
   - placeholder → 실제 URL 교체는 기존 `prev.replace()` 로직 유지 (문자열 치환이므로 위치 무관)
