# Release v2.15.0 - 불필요 에셋 일괄 제거 및 인터페이스 규약 경량화

## 🌟 개요 (Overview)
- **미사용 에셋 43종 일괄 삭제**: 게임 로직에 직접 사용되지 않는 불완전한 슬라이싱 부품(`src/assets/ui/sliced/`), 구형 플레이스홀더, 중복 목판 에셋을 전면 삭제.
- **인터페이스 규약(`assetRegistry.ts`) 정비**: 실제 게임 로직(`HomeView`, `HUD`, `Controls`, `gameEngine`, `EggsTab`)에서 참조하는 필수 18종 에셋만 남기고 인터페이스 타입(`UIAssetKey`) 및 레지스트리 맵핑을 100% 동기화.
- **번들 최적화**: 미사용 에셋 제거를 통해 코드베이스 및 빌드 번들의 군더더기를 완전히 해소.

---

## 🧹 삭제된 에셋 목록 (43종)
1. **슬라이싱 컴포넌트 전체 (`src/assets/ui/sliced/` 20종)**:
   - `challenge_card_1..3.png`, `mission_card_1..3.png`, `mission_subtab_*.png`
   - `home_btn_start.png`, `home_nest_hero.png`, `home_signpost_name.png`
   - `shop_btn_hatch_1.png`, `shop_btn_hatch_10.png`, `shop_card_*.png`, `skin_btn_equip.png`
2. **구형 UI 목판 및 탭 (`src/assets/ui/` 16종)**:
   - `header_profile_board.png`, `header_shell_board.png`, `header_wheat_board.png`, `btn_settings_cog.png`
   - `dock_wood_plank.png`, `tab_shop.png`, `tab_skin.png`, `tab_home_center.png`, `tab_mission.png`, `tab_challenge.png`
   - `btn_orange_jelly_large.png`, `nest_straw_hero.png`, `panel_rope_wood_large.png`, `panel_wood_card_slot.png`, `signboard_wood_name.png`, `tag_wheat_cost.png`
3. **미사용 배경/트랙/아이콘/구형 달걀 (7종)**:
   - `bg_barn_loft.png`, `bg_barn_sunlight.png`, `track_wooden_bridge.png`
   - `icon_jump_arrow.png`, `icon_turn_arrow.png`, `egg_baby_sprout.png`, `screen_play.png`

---

## 💎 유지된 필수 에셋 목록 (18종)
1. **5대 화면 마스터 에셋 (`src/assets/screens/`)**:
   - `screen_home.png`, `screen_shop.png`, `screen_skin.png`, `screen_mission.png`, `screen_challenge.png`
2. **3D 달걀 원화 8종 (`src/assets/eggs/art/`)**:
   - `egg_art_1.png` ~ `egg_art_8.png`
3. **인게임 HUD 및 조작 에셋 (`src/assets/ui/`, `src/assets/icons/`)**:
   - `btn_wood_square.png` (일시정지 ⏸)
   - `header_feather_board.png` (깃털 HUD 목판)
   - `btn_wood_medium.png` (방향전환 버튼)
   - `btn_orange_jelly_medium.png` (점프 버튼)
   - `prop_golden_feather.png` (트랙 위 캔버스 수집용 깃털)
