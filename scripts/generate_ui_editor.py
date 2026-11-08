import os
import json
import base64
from PIL import Image

WORKSPACE = '/home/slalglel/workspace/infinite-egg'

# 1. Asset Registry with metadata (Category, Name, Usage, Description)
ASSET_CATALOG = [
    # --- 공통 상단 헤더 & 하단 독 ---
    {
        'id': 'header_profile_board',
        'path': f'{WORKSPACE}/src/assets/ui/header_profile_board.png',
        'category': 'COMMON',
        'name': '프로필 원목 목판',
        'usage': '상단 공통 헤더 좌측 (LV, 계란이 닉네임)',
        'desc': '플레이어 레벨과 유저 닉네임이 새겨지는 나뭇결 프로필 프레임'
    },
    {
        'id': 'header_wheat_board',
        'path': f'{WORKSPACE}/src/assets/ui/header_wheat_board.png',
        'category': 'COMMON',
        'name': '활동력 곡식 목판',
        'usage': '상단 공통 헤더 중앙 좌측',
        'desc': '현재 활동력 곡식 수량(24/50)을 보여주는 오목한 다크 우드 홈'
    },
    {
        'id': 'header_feather_board',
        'path': f'{WORKSPACE}/src/assets/ui/header_feather_board.png',
        'category': 'COMMON',
        'name': '황금 깃털 목판',
        'usage': '상단 공통 헤더 중앙 우측',
        'desc': '보유 중인 메인 재화 황금 깃털 수량을 보여주는 원목 목판'
    },
    {
        'id': 'header_shell_board',
        'path': f'{WORKSPACE}/src/assets/ui/header_shell_board.png',
        'category': 'COMMON',
        'name': '계란 껍데기 목판',
        'usage': '상점 진입 시 또는 껍데기 환전 안내',
        'desc': '가챠 중복 시 획득하는 특수 재화 계란 껍데기 수량 표시 목판'
    },
    {
        'id': 'btn_settings_cog',
        'path': f'{WORKSPACE}/src/assets/ui/btn_settings_cog.png',
        'category': 'COMMON',
        'name': '설정 톱니바퀴 버튼',
        'usage': '상단 공통 헤더 우측 끝',
        'desc': '사운드 설정 및 데이터 초기화 팝업을 호출하는 3D 원목 톱니 버튼'
    },
    {
        'id': 'dock_wood_plank',
        'path': f'{WORKSPACE}/src/assets/ui/dock_wood_plank.png',
        'category': 'COMMON',
        'name': '하단 독 베이스 프레임',
        'usage': '화면 하단 5대 탭 베이스',
        'desc': '5개 탭 버튼을 안정적으로 받쳐주는 통나무와 짚풀 재질의 바닥 프레임'
    },
    {
        'id': 'tab_shop',
        'path': f'{WORKSPACE}/src/assets/ui/tab_shop.png',
        'category': 'COMMON',
        'name': '1번 상점 탭 버튼',
        'usage': '하단 독 1번째 슬롯',
        'desc': '상점/부화 화면으로 이동하는 장바구니 아이콘 탭'
    },
    {
        'id': 'tab_skin',
        'path': f'{WORKSPACE}/src/assets/ui/tab_skin.png',
        'category': 'COMMON',
        'name': '2번 스킨 탭 버튼',
        'usage': '하단 독 2번째 슬롯',
        'desc': '계란 스킨 보관함으로 이동하는 달걀 아이콘 탭'
    },
    {
        'id': 'tab_home_center',
        'path': f'{WORKSPACE}/src/assets/ui/tab_home_center.png',
        'category': 'COMMON',
        'name': '3번 홈 탭 중앙 둥지',
        'usage': '하단 독 3번째 중앙 슬롯',
        'desc': '로비/홈 화면으로 복귀하는 대형 원형 짚풀 둥지 탭'
    },
    {
        'id': 'tab_mission',
        'path': f'{WORKSPACE}/src/assets/ui/tab_mission.png',
        'category': 'COMMON',
        'name': '4번 미션 탭 버튼',
        'usage': '하단 독 4번째 슬롯',
        'desc': '일일/주간/업적 농장 일과표로 이동하는 두루마리 아이콘 탭'
    },
    {
        'id': 'tab_challenge',
        'path': f'{WORKSPACE}/src/assets/ui/tab_challenge.png',
        'category': 'COMMON',
        'name': '5번 도전 탭 버튼',
        'usage': '하단 독 5번째 슬롯',
        'desc': '원정 챌린지 모드로 이동하는 트로피/불꽃 아이콘 탭'
    },

    # --- 홈 화면 전용 슬라이스 요소 ---
    {
        'id': 'home_btn_start',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/home_btn_start.png',
        'category': 'HOME',
        'name': '[출발하기!] 대형 3D 버튼',
        'usage': '홈 화면 하단 중앙',
        'desc': '누르면 즉시 주행을 시작하는 황금 테두리의 대형 오렌지 3D 버튼'
    },
    {
        'id': 'home_nest_hero',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/home_nest_hero.png',
        'category': 'HOME',
        'name': '3D 짚풀 둥지 & 아기 달걀',
        'usage': '홈 화면 중앙 메인',
        'desc': '아기 달걀이 편안하게 휴식하고 있는 푹신한 짚풀 둥지 본체'
    },
    {
        'id': 'home_signpost_name',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/home_signpost_name.png',
        'category': 'HOME',
        'name': '둥지 뒤 원목 이름 팻말',
        'usage': '홈 화면 둥지 뒤편',
        'desc': '현재 장착된 달걀의 고유 명칭이 표시되는 나무 팻말 슬롯'
    },

    # --- 상점 화면 전용 슬라이스 요소 ---
    {
        'id': 'shop_btn_hatch_1',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/shop_btn_hatch_1.png',
        'category': 'SHOP',
        'name': '[1회 부화] 3D 버튼 (🪶 100)',
        'usage': '상점 상단 좌측',
        'desc': '황금 깃털 100개를 소모하여 달걀 1개를 부화시키는 3D 주황 젤리 버튼'
    },
    {
        'id': 'shop_btn_hatch_10',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/shop_btn_hatch_10.png',
        'category': 'SHOP',
        'name': '[10회 부화] 3D 버튼 (🪶 900)',
        'usage': '상점 상단 우측',
        'desc': '황금 깃털 900개를 소모하여 달걀 10개를 연속 부화시키는 3D 주황 젤리 버튼'
    },
    {
        'id': 'shop_card_wheat_10',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/shop_card_wheat_10.png',
        'category': 'SHOP',
        'name': '곡식 10개 구매 카드 (🪶 50)',
        'usage': '상점 하단 상품 그리드 1번',
        'desc': '깃털 50개로 활동력 곡식 10개를 충전하는 원목 카드'
    },
    {
        'id': 'shop_card_wheat_50',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/shop_card_wheat_50.png',
        'category': 'SHOP',
        'name': '곡식 50개 구매 카드 (🪶 200)',
        'usage': '상점 하단 상품 그리드 2번',
        'desc': '깃털 200개로 활동력 곡식 50개를 충전하는 대용량 원목 카드'
    },
    {
        'id': 'shop_card_feathers',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/shop_card_feathers.png',
        'category': 'SHOP',
        'name': '깃털 바구니 카드 (매일 무료)',
        'usage': '상점 하단 상품 그리드 3번',
        'desc': '매일 1회 무료 황금 깃털을 수령하는 짚풀 바구니 상품 카드'
    },
    {
        'id': 'shop_card_goldbox',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/shop_card_goldbox.png',
        'category': 'SHOP',
        'name': '황금 보물 상자 카드 (껍데기 환전)',
        'usage': '상점 하단 상품 그리드 4번',
        'desc': '계란 껍데기 50개를 깃털 300개로 대량 환전하는 고급 보물 상자 카드'
    },

    # --- 스킨 화면 전용 슬라이스 요소 ---
    {
        'id': 'skin_btn_equip',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/skin_btn_equip.png',
        'category': 'SKIN',
        'name': '[장착하기] 3D 버튼',
        'usage': '스킨 화면 중앙',
        'desc': '선택된 달걀을 대표 캐릭터로 장착하는 3D 주황 젤리 버튼'
    },

    # --- 8종 3D 고화질 달걀 캐릭터 ---
    {
        'id': 'egg_art_1',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_1.png',
        'category': 'EGG',
        'name': '황금 달걀 (기본형)',
        'usage': '기본 제공 대표 캐릭터',
        'desc': '자연산 유기농 황금빛 달걀. 가장 친근하고 부드러운 오리지널 3D 에그'
    },
    {
        'id': 'egg_art_2',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_2.png',
        'category': 'EGG',
        'name': '촉촉 반숙란',
        'usage': '2번 슬롯 대표 스킨',
        'desc': '노른자가 부드럽게 살아있는 온천 반숙란. 말랑한 탄성 보유'
    },
    {
        'id': 'egg_art_3',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_3.png',
        'category': 'EGG',
        'name': '점박이 메추리알',
        'usage': '3번 슬롯 대표 스킨',
        'desc': '작고 날렵한 야생의 메추리알. 민첩한 코너링 특화'
    },
    {
        'id': 'egg_art_4',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_4.png',
        'category': 'EGG',
        'name': '아기 공룡알',
        'usage': '4번 슬롯 대표 스킨',
        'desc': '선사 시대의 신비로운 원시 에그. 단단한 껍질 방어력 보유'
    },
    {
        'id': 'egg_art_5',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_5.png',
        'category': 'EGG',
        'name': '사이버 에그 2099',
        'usage': '5번 슬롯 대표 스킨',
        'desc': '미래형 홀로그램 네온 달걀. 광자 부스트 특화'
    },
    {
        'id': 'egg_art_6',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_6.png',
        'category': 'EGG',
        'name': '은하수 오로라란',
        'usage': '6번 슬롯 대표 스킨',
        'desc': '우주의 별빛이 쏟아지는 신비란. 중력 제어 특화'
    },
    {
        'id': 'egg_art_7',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_7.png',
        'category': 'EGG',
        'name': '정의의 경찰란',
        'usage': '7번 슬롯 대표 스킨',
        'desc': '내리막길의 질서를 지키는 수호자 달걀'
    },
    {
        'id': 'egg_art_8',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_8.png',
        'category': 'EGG',
        'name': '눈부신 황금알',
        'usage': '8번 슬롯 대표 스킨',
        'desc': '찬란한 광채를 내뿜는 전설의 보물 황금알'
    },

    # --- 미션 화면 전용 요소 ---
    {
        'id': 'mission_subtab_daily',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_subtab_daily.png',
        'category': 'MISSION',
        'name': '[일일] 서브탭 버튼',
        'usage': '미션 상단 서브탭 1번',
        'desc': '매일 초기화되는 일일 과제 필터링 탭'
    },
    {
        'id': 'mission_subtab_weekly',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_subtab_weekly.png',
        'category': 'MISSION',
        'name': '[주간] 서브탭 버튼',
        'usage': '미션 상단 서브탭 2번',
        'desc': '일주일 단위로 진행되는 주간 미션 필터링 탭'
    },
    {
        'id': 'mission_subtab_achieve',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_subtab_achieve.png',
        'category': 'MISSION',
        'name': '[업적] 서브탭 버튼',
        'usage': '미션 상단 서브탭 3번',
        'desc': '누적 마일스톤 및 평생 업적 필터링 탭'
    },
    {
        'id': 'mission_subtab_season',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_subtab_season.png',
        'category': 'MISSION',
        'name': '[시즌] 서브탭 버튼',
        'usage': '미션 상단 서브탭 4번',
        'desc': '시즌 한정 특별 도전 과제 필터링 탭'
    },
    {
        'id': 'mission_card_1',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_card_1.png',
        'category': 'MISSION',
        'name': '미션 목판 카드 1번',
        'usage': '미션 화면 상단 카드 슬롯',
        'desc': '첫 걸음 및 기본 모험 달성 과제 카드'
    },
    {
        'id': 'mission_card_2',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_card_2.png',
        'category': 'MISSION',
        'name': '미션 목판 카드 2번',
        'usage': '미션 화면 중앙 카드 슬롯',
        'desc': '점프 훈련 및 조작 특화 달성 과제 카드'
    },
    {
        'id': 'mission_card_3',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/mission_card_3.png',
        'category': 'MISSION',
        'name': '미션 목판 카드 3번',
        'usage': '미션 화면 하단 카드 슬롯',
        'desc': '재화 수집 및 장거리 주행 달성 과제 카드'
    },

    # --- 도전 모드 전용 요소 ---
    {
        'id': 'challenge_card_1',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/challenge_card_1.png',
        'category': 'CHALLENGE',
        'name': '스피드 러너 챌린지 카드',
        'usage': '도전 화면 상단 카드',
        'desc': '1.4배속 초고속 내리막길 도전 모드 카드'
    },
    {
        'id': 'challenge_card_2',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/challenge_card_2.png',
        'category': 'CHALLENGE',
        'name': '황금알 채굴 대작전 카드',
        'usage': '도전 화면 중앙 카드',
        'desc': '재화와 깃털이 2배로 쏟아지는 보너스 파티 맵 카드'
    },
    {
        'id': 'challenge_card_3',
        'path': f'{WORKSPACE}/src/assets/ui/sliced/challenge_card_3.png',
        'category': 'CHALLENGE',
        'name': '지옥의 1스텝 칼턴 카드',
        'usage': '도전 화면 하단 카드',
        'desc': '1스텝 지그재그 극한 난이도 하드코어 맵 카드'
    },

    # --- 버튼 & 범용 패널 ---
    {
        'id': 'btn_orange_jelly_large',
        'path': f'{WORKSPACE}/src/assets/ui/btn_orange_jelly_large.png',
        'category': 'UI',
        'name': '대형 오렌지 젤리 버튼',
        'usage': '출발하기, 주요 CTA 버튼',
        'desc': '입체적인 젤리 질감의 대형 오렌지 버튼'
    },
    {
        'id': 'btn_orange_jelly_medium',
        'path': f'{WORKSPACE}/src/assets/ui/btn_orange_jelly_medium.png',
        'category': 'UI',
        'name': '중형 오렌지 젤리 버튼',
        'usage': '점프, 받기, 확인 버튼',
        'desc': '입체적인 젤리 질감의 중형 오렌지 버튼'
    },
    {
        'id': 'btn_wood_medium',
        'path': f'{WORKSPACE}/src/assets/ui/btn_wood_medium.png',
        'category': 'UI',
        'name': '원목 사각 버튼',
        'usage': '도전, 입장, 상세 보기',
        'desc': '나뭇결 테두리의 직사각형 원목 버튼'
    },
    {
        'id': 'btn_wood_square',
        'path': f'{WORKSPACE}/src/assets/ui/btn_wood_square.png',
        'category': 'UI',
        'name': '정사각 원목 버튼',
        'usage': '이전/다음 화살표, 일시정지',
        'desc': '나뭇결 테두리의 1:1 정사각 원목 버튼'
    },
    {
        'id': 'nest_straw_hero',
        'path': f'{WORKSPACE}/src/assets/ui/nest_straw_hero.png',
        'category': 'UI',
        'name': '짚풀 둥지 (단독 오브젝트)',
        'usage': '홈/상점 계란 받침대',
        'desc': '달걀이 안착할 수 있는 짚풀 재질의 원형 둥지'
    },
    {
        'id': 'panel_wood_card_slot',
        'path': f'{WORKSPACE}/src/assets/ui/panel_wood_card_slot.png',
        'category': 'UI',
        'name': '오목한 나무 슬롯 카드',
        'usage': '아이템 슬롯, 미션 배경',
        'desc': '음각으로 파여진 원목 슬롯 프레임'
    },
    {
        'id': 'tag_wheat_cost',
        'path': f'{WORKSPACE}/src/assets/ui/tag_wheat_cost.png',
        'category': 'UI',
        'name': '[활동력 🌾 5] 비용 태그',
        'usage': '출발 버튼 부착 비용 태그',
        'desc': '출발 시 곡식 5개가 차감됨을 안내하는 목판 태그'
    },

    # --- 인게임 주행 트랙 및 아이템 ---
    {
        'id': 'track_wooden_bridge',
        'path': f'{WORKSPACE}/src/assets/tracks/track_wooden_bridge.png',
        'category': 'INGAME',
        'name': '밧줄 통나무 다리 주행로',
        'usage': '인게임 2.5D 주행 발판',
        'desc': '달걀이 굴러가는 밧줄과 통나무로 연결된 다리'
    },
    {
        'id': 'prop_golden_feather',
        'path': f'{WORKSPACE}/src/assets/icons/prop_golden_feather.png',
        'category': 'INGAME',
        'name': '황금 깃털 인게임 아이템',
        'usage': '주행 중 수집 아이템',
        'desc': '길 위에서 획득할 수 있는 반짝이는 황금빛 깃털'
    },
    {
        'id': 'icon_jump_arrow',
        'path': f'{WORKSPACE}/src/assets/icons/icon_jump_arrow.png',
        'category': 'INGAME',
        'name': '점프 원형 조작 버튼',
        'usage': '인게임 우측 하단 컨트롤러',
        'desc': '위로 솟구치는 점프 화살표가 새겨진 3D 조작 버튼'
    },
    {
        'id': 'icon_turn_arrow',
        'path': f'{WORKSPACE}/src/assets/icons/icon_turn_arrow.png',
        'category': 'INGAME',
        'name': '방향전환 원형 조작 버튼',
        'usage': '인게임 좌측 하단 컨트롤러',
        'desc': '90도 꺾이는 방향전환 화살표가 새겨진 3D 조작 버튼'
    },
]

# 2. Master Background Screens (가이드 및 배경용)
SCREEN_CATALOG = [
    { 'id': 'screen_home', 'name': '홈 (Home)', 'path': f'{WORKSPACE}/src/assets/screens/screen_home.png' },
    { 'id': 'screen_shop', 'name': '상점 (Shop)', 'path': f'{WORKSPACE}/src/assets/screens/screen_shop.png' },
    { 'id': 'screen_skin', 'name': '스킨 (Skin)', 'path': f'{WORKSPACE}/src/assets/screens/screen_skin.png' },
    { 'id': 'screen_mission', 'name': '미션 (Mission)', 'path': f'{WORKSPACE}/src/assets/screens/screen_mission.png' },
    { 'id': 'screen_challenge', 'name': '도전 (Challenge)', 'path': f'{WORKSPACE}/src/assets/screens/screen_challenge.png' },
    { 'id': 'screen_play', 'name': '주행 플레이 (Play)', 'path': f'{WORKSPACE}/src/assets/screens/screen_play.png' },
]

def load_base64_data_uri(path):
    if not os.path.exists(path):
        return None
    with open(path, 'rb') as f:
        data = f.read()
    b64 = base64.b64encode(data).decode('utf-8')
    return f'data:image/png;base64,{b64}'

def build_editor_html():
    print('Encoding all assets to base64...')
    assets_data = []
    for item in ASSET_CATALOG:
        uri = load_base64_data_uri(item['path'])
        if not uri:
            print(f'Warning: Missing asset {item["path"]}')
            continue
        try:
            im = Image.open(item['path'])
            w, h = im.size
        except Exception:
            w, h = (100, 100)
            
        assets_data.append({
            'id': item['id'],
            'category': item['category'],
            'name': item['name'],
            'usage': item['usage'],
            'desc': item['desc'],
            'width': w,
            'height': h,
            'dataUri': uri
        })

    screens_data = []
    for s in SCREEN_CATALOG:
        uri = load_base64_data_uri(s['path'])
        if uri:
            screens_data.append({
                'id': s['id'],
                'name': s['name'],
                'dataUri': uri
            })

    print(f'Total assets encoded: {len(assets_data)}')
    print(f'Total screens encoded: {len(screens_data)}')

    assets_json = json.dumps(assets_data, ensure_ascii=False)
    screens_json = json.dumps(screens_data, ensure_ascii=False)

    template_path = f'{WORKSPACE}/scripts/ui_editor_template.html'
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()

    html_content = template_content.replace('__ASSETS_JSON__', assets_json).replace('__SCREENS_JSON__', screens_json)

    out_file = f'{WORKSPACE}/ui-editor.html'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f'UI Editor successfully generated at: {out_file} (Size: {os.path.getsize(out_file) // 1024} KB)')

    dist_dir = f'{WORKSPACE}/dist'
    if os.path.exists(dist_dir):
        dist_out = f'{dist_dir}/ui-editor.html'
        with open(dist_out, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f'Copied to: {dist_out}')

if __name__ == '__main__':
    build_editor_html()
