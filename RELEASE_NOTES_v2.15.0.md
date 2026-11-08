# Infinite Egg v2.15.0 Release Notes

## 🎨 Master Contour Asset Slicing (전면 재슬라이싱 및 고해상도 투명 PNG 재구축)

기존 단순 수학적 공식(`make_pill_alpha`, `make_circle_alpha`) 기반의 엉성한 크롭 에셋들을 전면 폐기하고, 마스터 원화 6종(`/mnt/d/사진/inf_egg/*.png`)의 실제 외곽선과 3D 볼륨 테두리를 정밀하게 추적하는 **OpenCV GrabCut & Contour Anti-Aliasing 파이프라인**을 통해 53종의 개별 에셋을 100% 새로 생성하였습니다.

### 🌟 주요 변경 사항 (Core Improvements)

1. **외곽 테두리 100% 추적 (Authentic Contour-Accurate Segmentation)**:
   - 인위적인 타원/원형 마스크를 완전히 배제하고, 원목 판자의 나뭇결 옹이, 밧줄 매듭, 젤리 버튼의 3D 입체 광택 베벨, 짚풀 둥지의 볏짚 가닥, 계란 머리의 새싹까지 실제 원화 테두리를 따라 정밀 세그멘테이션.
   - 1.2px 서브픽셀 가우시안 안티앨리어싱(Anti-Aliasing)을 적용하여 배경과의 계단 현상(Jaggies) 및 테두리 얼룩을 완벽 제거.

2. **완벽한 알파 투명 배경 (Full 32-bit RGBA)**:
   - 256색 팔레트 압축(`mode=P`) 및 배경이 묻어나오는 사각 크롭(`mode=RGB`)을 전면 폐기하고 무손실 32-bit RGBA로 전면 교체.
   - 모든 에셋의 4방 모서리 알파값 `(0, 0, 0, 0)` 투명화 보장 및 내부 100% 불투명 처리.

3. **코드 세션 연동 규격 3종 반영 (Slot Inpainting)**:
   - **상단 헤더 목판 4종**: 프로필(`header_profile_board`), 곡식(`header_wheat_board`), 깃털(`header_feather_board`), 껍데기(`header_shell_board`)의 텍스트/숫자 영역을 주변 원목 질감으로 인페인팅하여 동적 수치가 자연스럽게 표시되는 빈 오목 홈(Empty Recessed Slot) 확립.
   - **홈 둥지 이름 팻말(`signboard_wood_name`)**: '꼬마계란' 글씨를 제거한 무지 원목 팻말로 재가공.
   - **하단 2번 탭(`tab_skin`)**: 마스터 원화의 엠블럼을 정밀 분리하여 '보관함' 글씨 없는 순수 스킨 에셋으로 통일.

4. **단독 배포 및 UI Studio 동기화**:
   - `dist/index.html` 및 `infinite-egg.html` 싱글파일 번들 최신화.
   - `ui-editor.html` (시각적 UI 배치 스튜디오) 내 50종 카탈로그 및 6종 원화 베이스 100% 최신 에셋 동기화.
