# 무한의 계란 (Infinite Egg) - UI 에셋 슬라이싱 및 통합 가이드
> **문서 목적**: 원본 고해상도 디자인 이미지(`D:\사진\inf_egg\*.png`, WSL: `/mnt/d/사진/inf_egg/`)로부터 게임에 필요한 투명 배경 PNG 에셋을 분리(슬라이싱)하고, 이를 `src/assets/assetRegistry.ts` 및 컴포넌트에 연결하여 상용 모바일 게임 수준의 아트 비주얼을 완성하기 위한 UI 세션 전용 가이드입니다.

---

## 1. 개요 및 세션 분업 구조 (Division of Labor)

- **메인(엔진/로직) 세션**:
  - 에셋 레지스트리(`assetRegistry.ts`) 및 Fallback 아키텍처 구축 완료.
  - 곡식(`🌾`) 및 황금 깃털(`🪶`) 신규 재화 경제 시스템 연동 완료.
  - 5대 탭(상점, 스킨, 홈, 미션, 도전) 및 인게임 HUD/조작계 레이아웃 코드 구축 완료.
  - Vite `vite-plugin-singlefile`을 통한 PNG의 Base64 Data URL 자동 인라인(단일 파일 `infinite-egg.html` 100% 호환) 환경 구축 완료.
- **분기된 UI(아트) 세션 (작업자)**:
  - 6장의 원본 이미지에서 25+종의 핵심 UI 요소를 투명 PNG로 분리(크롭 및 누끼).
  - 동적 텍스트/숫자(예: 1,248m, 🪶 1245 등)가 렌더링될 영역은 빈 텍스처/플레이크로 가공(왜곡 없는 텍스트 오버레이 지원).
  - 분리된 PNG를 `src/assets/` 디렉토리에 배치하고 `src/assets/assetRegistry.ts`에 임포트 등록.
  - 화면별 세부 픽셀 패딩/마진/크기 최종 미세 조정.

---

## 2. 원본 이미지 소스 사양 (Source Specifications)

- **위치**: Windows `D:\사진\inf_egg\` / WSL `/mnt/d/사진/inf_egg/`
- **해상도**: `1536 × 2752 px` (공통)
- **컬러 포맷**: `RGBA` (32-bit)
- **이미지 목록**:
  1. `home.png` (6.5 MB): 아늑한 목조 헛간 다락방 로비, 볏짚 둥지, 꼬마 에그, 밧줄 목판 프레임, '출발하기!' 대형 젤리 버튼, 하단 5대 통나무 탭바.
  2. `shop.png` (6.7 MB): 상단 매달린 목판 표지판, '행운의 둥지 부화기' 가챠 보드(1회/10회 버튼), 재화 구매 4구 원목 슬롯 그리드.
  3. `skin.png` (6.6 MB): 계란 쇼케이스 쇼룸, 좌/우 목판 화살표 버튼, '장착됨' 오렌지 버튼, 하단 4×2 오목한 나무 트레이 슬롯 그리드.
  4. `mission.png` (6.5 MB): 상단 서브 탭([일일], [주간], [월간], [누적]), 밧줄로 묶인 3장의 원목 미션 카드, 나무 홈 게이지 바, 오렌지 '받기' 버튼 & 원목 '도전' 버튼.
  5. `challenge.png` (6.6 MB): 3장의 대형 챌린지 원목 카드('무한의 내리막길', '보스 계란의 습격', '타임어택 챌린지'), 오렌지 3D 액션 버튼.
  6. `play.png` (6.8 MB): 인게임 HUD(목판 일시정지, 거리 전광판, 깃털 수집기), 통나무 밧줄 다리 트랙, 황금 깃털 수집 아이템, 좌측 '방향전환' 목판 버튼, 우측 '점프' 대형 오렌지 젤리 버튼.

---

## 3. 타겟 에셋 추출 마스터 테이블 (Asset Catalog & Crop Boxes)

추출된 모든 에셋은 `src/assets/` 하위 폴더에 투명 배경 PNG(RGBA)로 저장합니다.
좌표 표기: `(left, top, right, bottom)` 기준 (1536 × 2752 원본 좌표계).

### 3.1 배경 (Backgrounds) -> `src/assets/backgrounds/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 바운딩 박스 (BBox) | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `bg_barn_sunlight` | `bg_barn_sunlight.png` | `home.png` | `(0, 0, 1536, 2752)` | 캐릭터, 둥지, UI를 배제한 순수 헛간 배경 (또는 캐릭터 뒤 배경 텍스처) |
| `bg_barn_loft` | `bg_barn_loft.png` | `play.png` | `(0, 0, 1536, 2752)` | 인게임 플레이 화면의 다락방 원경 배경 텍스처 |

### 3.2 상단 헤더 & 재화 명판 (Header & Plaques) -> `src/assets/ui/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 BBox | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `header_profile_board` | `header_profile_board.png` | `home.png` | `(40, 50, 460, 210)` | 좌측 프로필 목판 명판 (글자 없이 빈 명판으로 추출) |
| `header_wheat_board` | `header_wheat_board.png` | `home.png` | `(480, 50, 880, 210)` | 곡식(`🌾`) 활동력 목판 명판 (숫자 없이 빈 목판 + 곡식 아이콘) |
| `header_feather_board` | `header_feather_board.png` | `home.png` | `(900, 50, 1340, 210)` | 황금 깃털(`🪶`) 보유량 목판 명판 (숫자 없이 빈 목판 + 깃털 아이콘) |
| `header_shell_board` | `header_shell_board.png` | (합성/가공) | - | 껍데기 상점용 목판 명판 (계란 껍데기 아이콘 + 목판) |
| `btn_settings_cog` | `btn_settings_cog.png` | `home.png` | `(1360, 60, 1500, 200)` | 우측 상단 둥근 목판 톱니바퀴 설정 버튼 |

### 3.3 하단 독 & 5대 탭 (Dock & Tab Navigation) -> `src/assets/ui/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 BBox | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `dock_wood_plank` | `dock_wood_plank.png` | `home.png` | `(0, 2400, 1536, 2752)` | 하단 통나무 짚풀 베이스 독 프레임 바 |
| `tab_shop` | `tab_shop.png` | `home.png` | `(60, 2430, 320, 2710)` | 1번 탭: 상점 천막/카트 아이콘 + 미니 목판 |
| `tab_skin` | `tab_skin.png` | `home.png` | `(330, 2430, 590, 2710)` | 2번 탭: 스킨 옷걸이/계란 아이콘 + 미니 목판 |
| `tab_home_center` | `tab_home_center.png` | `home.png` | `(600, 2360, 936, 2720)` | 3번 탭: 중앙 원형 돌출 볏짚 둥지 화환 집 아이콘 |
| `tab_mission` | `tab_mission.png` | `home.png` | `(946, 2430, 1206, 2710)` | 4번 탭: 미션 양피지/체크 아이콘 + 미니 목판 |
| `tab_challenge` | `tab_challenge.png` | `home.png` | `(1216, 2430, 1476, 2710)` | 5번 탭: 도전 트로피/검 아이콘 + 미니 목판 |

### 3.4 3D 젤리 & 목판 버튼 (Buttons) -> `src/assets/ui/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 BBox | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `btn_orange_jelly_large` | `btn_orange_jelly_large.png` | `home.png` | `(120, 2170, 1416, 2380)` | '출발하기!' 초대형 오렌지 3D 버튼 텍스처 (글자 분리 또는 일체형) |
| `btn_orange_jelly_medium` | `btn_orange_jelly_medium.png` | `play.png` | `(850, 2260, 1436, 2620)` | 인게임 '점프' 및 모달 '받기'에 쓰이는 중형 오렌지 3D 버튼 |
| `btn_wood_medium` | `btn_wood_medium.png` | `play.png` | `(100, 2300, 600, 2580)` | 인게임 '방향전환' 및 미션 '도전'에 쓰이는 목판 사각 버튼 |
| `btn_wood_square` | `btn_wood_square.png` | `play.png` | `(60, 70, 210, 220)` | 인게임 일시정지(`⏸`) 및 쇼케이스 화살표(`<`, `>`)용 정사각 버튼 |
| `tag_wheat_cost` | `tag_wheat_cost.png` | `home.png` | `(570, 2080, 966, 2190)` | 출발 버튼 상단에 걸쳐진 '활동력 🌾 5' 목판 미니 태그 |

### 3.5 패널, 카드 & 둥지 (Panels & Nests) -> `src/assets/ui/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 BBox | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `nest_straw_hero` | `nest_straw_hero.png` | `home.png` | `(200, 1100, 1336, 2050)` | 메인 홈 로비에서 계란이 앉아있는 대형 볏짚 둥지 |
| `panel_rope_wood_large` | `panel_rope_wood_large.png` | `challenge.png` / `mission.png` | `(100, 450, 1436, 1050)` | 밧줄로 묶인 원목 직사각형 카드 패널 |
| `panel_wood_card_slot` | `panel_wood_card_slot.png` | `skin.png` | `(120, 1450, 420, 1850)` | 스킨 보관함용 둥근 오목한 사각 나무 트레이 슬롯 |

### 3.6 인게임 트랙 및 아이템 (In-game Track & Items) -> `src/assets/tracks/`, `src/assets/icons/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 BBox | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `track_wooden_bridge` | `track_wooden_bridge.png` | `play.png` | `(400, 1400, 1150, 1900)` | 밧줄과 통나무 판자로 이루어진 러닝 트랙 상판 타일 |
| `prop_golden_feather` | `prop_golden_feather.png` | `play.png` | `(700, 1100, 850, 1280)` | 트랙 위에 둥실 떠있는 반짝이는 황금 깃털 수집 아이템 |
| `icon_turn_arrow` | `icon_turn_arrow.png` | `play.png` | `(250, 2380, 450, 2520)` | 방향전환 버튼 위의 회전 화살표 엠블럼 |
| `icon_jump_arrow` | `icon_jump_arrow.png` | `play.png` | `(1050, 2360, 1250, 2540)` | 점프 버튼 위의 용수철 상승 곡선 화살표 엠블럼 |

### 3.7 캐릭터 스킨 (Egg Skins) -> `src/assets/eggs/`
| 에셋 키 | 파일명 | 소스 이미지 | 대략적인 BBox | 설명 및 처리 가이드 |
| :--- | :--- | :--- | :--- | :--- |
| `egg_baby_sprout` | `egg_baby_sprout.png` | `home.png` / `skin.png` | `(450, 1000, 1080, 1800)` | 머리에 새싹이 돋아난 꼬마 에그 (기본 캐릭터) 투명 누끼 |

---

## 4. 고속 자동 슬라이싱 파이썬 스크립트 (Pillow/NumPy 기반)

AGY 전역 규칙(Rule 7: 경량 이미지 처리 및 OOM 방지 원칙)에 따라, 수 기가바이트 메모리를 사용하는 무거운 AI 모델 대신 **Pillow(PIL)**를 활용하여 안전하고 빠르게 슬라이싱을 수행할 수 있습니다.

### 4.1 슬라이싱 기본 템플릿 스크립트 예시 (`tools/slice_assets.py`)
```python
import os
from PIL import Image

SRC_DIR = "/mnt/d/사진/inf_egg"
DEST_DIR = "/home/slalglel/workspace/infinite-egg/src/assets"

os.makedirs(f"{DEST_DIR}/ui", exist_ok=True)
os.makedirs(f"{DEST_DIR}/eggs", exist_ok=True)
os.makedirs(f"{DEST_DIR}/tracks", exist_ok=True)
os.makedirs(f"{DEST_DIR}/backgrounds", exist_ok=True)
os.makedirs(f"{DEST_DIR}/icons", exist_ok=True)

def crop_and_save(src_name, bbox, dest_rel_path):
    src_path = os.path.join(SRC_DIR, src_name)
    img = Image.open(src_path)
    cropped = img.crop(bbox)
    dest_path = os.path.join(DEST_DIR, dest_rel_path)
    cropped.save(dest_path, "PNG", optimize=True)
    print(f"Saved: {dest_rel_path} ({cropped.size[0]}x{cropped.size[1]})")

# 1. 홈 헤더 명판 슬라이싱 예시
# crop_and_save("home.png", (480, 50, 880, 210), "ui/header_wheat_board.png")
# crop_and_save("home.png", (900, 50, 1340, 210), "ui/header_feather_board.png")

# 2. 버튼류 슬라이싱 예시
# crop_and_save("play.png", (100, 2300, 600, 2580), "ui/btn_wood_medium.png")
# crop_and_save("play.png", (850, 2260, 1436, 2620), "ui/btn_orange_jelly_medium.png")
```

---

## 5. 투명 배경 및 누끼(Alpha Matte) 가이드

1. **배경과 버튼/아이콘 분리**:
   - 나뭇결 텍스처나 짚풀 등 경계가 불분명한 경우 외곽에 미세한 부드러운 알파 페더링(Alpha feather 1~2px)을 적용하면 화면 배경과 자연스럽게 블렌딩됩니다.
2. **동적 텍스트 분리 원칙 (중요)**:
   - 명판 위에 적힌 숫자(예: `24/50`, `1,245`)는 슬라이싱 시 비워두거나 주변 나무 텍스처로 채워 복원해야 합니다.
   - React 코드에서 `font-fredoka`, `font-jua` 폰트와 다크 엠보싱 텍스트 섀도우로 동적 숫자를 실시간 렌더링하므로, 이미지에 텍스트가 박혀있으면 숫자가 바뀔 때 왜곡이 발생합니다.
3. **9-슬라이스(Nine-Patch) 또는 CSS 프레임 혼합**:
   - 크기가 가변적인 모달 창이나 긴 카드 패널은 고정 크기 이미지 대신, 상/하단 원목 바 및 모서리 밧줄 에셋만 슬라이싱하고 본문은 CSS 타일링을 결합하는 것이 가장 깔끔합니다.

---

## 6. 에셋 등록 및 코드 연결 방법 (`src/assets/assetRegistry.ts`)

UI 세션에서 PNG 파일 생성이 완료되면 `src/assets/assetRegistry.ts`의 상단 매핑 테이블에 임포트 연결만 해주면 됩니다.

```typescript
// src/assets/assetRegistry.ts

// 1. 생성한 PNG 에셋 import
import btnOrangeJellyMedium from './ui/btn_orange_jelly_medium.png';
import btnWoodMedium from './ui/btn_wood_medium.png';
import propGoldenFeather from './icons/prop_golden_feather.png';
import nestStrawHero from './ui/nest_straw_hero.png';

// 2. UI_ASSETS 객체에 등록
const UI_ASSETS: Partial<Record<UIAssetKey, string>> = {
  btn_orange_jelly_medium: btnOrangeJellyMedium,
  btn_wood_medium: btnWoodMedium,
  prop_golden_feather: propGoldenFeather,
  nest_straw_hero: nestStrawHero,
  // ... 추가 에셋 등록
};
```

- **Fallback 보장**: 등록되지 않은 에셋 키는 자동으로 `null`을 반환하므로, 기존 CSS/SVG 컴포넌트가 깨짐 없이 작동합니다. 따라서 하나씩 차례대로 작업하며 점진적으로 반영할 수 있습니다.
- **빌드 검증**: 작업 후 `npm run build`를 실행하여 0 에러 및 `dist/index.html` 단일 파일 생성을 확인합니다.
