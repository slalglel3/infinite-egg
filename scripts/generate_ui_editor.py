import os
import json
import base64
from PIL import Image

WORKSPACE = '/home/slalglel/workspace/infinite-egg'

# 1. Active Asset Catalog (게임 로직에 실제로 사용되는 에셋)
ASSET_CATALOG = [
    # --- 3D 달걀 스킨 원화 8종 ---
    {
        'id': 'egg_art_1',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_1.png',
        'category': 'EGG',
        'name': '1번 달걀: 꼬마 에그 (새싹)',
        'usage': '기본 캐릭터 스킨',
        'desc': '머리 위에 파릇파릇한 초록 새싹이 돋아난 귀여운 꼬마 달걀'
    },
    {
        'id': 'egg_art_2',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_2.png',
        'category': 'EGG',
        'name': '2번 달걀: 껍질 깬 에그',
        'usage': '스킨 2번 슬롯',
        'desc': '껍질을 살짝 깨고 호기심 어린 눈망울을 반짝이는 달걀'
    },
    {
        'id': 'egg_art_3',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_3.png',
        'category': 'EGG',
        'name': '3번 달걀: 병아리 에그',
        'usage': '스킨 3번 슬롯',
        'desc': '노란 솜털 깃털과 부리가 돋아난 아기 병아리 달걀'
    },
    {
        'id': 'egg_art_4',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_4.png',
        'category': 'EGG',
        'name': '4번 달걀: 털모자 에그 (겨울)',
        'usage': '스킨 4번 슬롯',
        'desc': '따스한 빨간 털모자와 방울을 쓴 포근한 겨울 달걀'
    },
    {
        'id': 'egg_art_5',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_5.png',
        'category': 'EGG',
        'name': '5번 달걀: 해적 선장 에그',
        'usage': '스킨 5번 슬롯',
        'desc': '해골 안대와 멋진 가죽 삼각모를 쓴 용감한 해적 달걀'
    },
    {
        'id': 'egg_art_6',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_6.png',
        'category': 'EGG',
        'name': '6번 달걀: 닭 앞치마 에그',
        'usage': '스킨 6번 슬롯',
        'desc': '닭 볏과 체크무늬 앞치마를 두른 장인 정신의 달걀'
    },
    {
        'id': 'egg_art_7',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_7.png',
        'category': 'EGG',
        'name': '7번 달걀: 우주 비행사 에그',
        'usage': '스킨 7번 슬롯',
        'desc': '투명 바이저 우주 헬멧을 착용한 미지의 탐험가 달걀'
    },
    {
        'id': 'egg_art_8',
        'path': f'{WORKSPACE}/src/assets/eggs/art/egg_art_8.png',
        'category': 'EGG',
        'name': '8번 달걀: 황금 왕관 에그',
        'usage': '스킨 8번 슬롯 (최종 히든)',
        'desc': '빛나는 황금 보석 왕관을 쓴 전설의 왕 달걀'
    },

    # --- 인게임 HUD & 컨트롤 조작 에셋 ---
    {
        'id': 'header_feather_board',
        'path': f'{WORKSPACE}/src/assets/ui/header_feather_board.png',
        'category': 'INGAME',
        'name': '황금 깃털 카운터 목판',
        'usage': '인게임 HUD 우상단 깃털 표시',
        'desc': '주행 중 획득한 황금 깃털 수량을 표시하는 원목 프레임'
    },
    {
        'id': 'btn_wood_square',
        'path': f'{WORKSPACE}/src/assets/ui/btn_wood_square.png',
        'category': 'INGAME',
        'name': '일시정지 [⏸] 목판 버튼',
        'usage': '인게임 HUD 좌상단',
        'desc': '게임을 잠시 멈추고 메뉴를 여는 정사각 원목 버튼'
    },
    {
        'id': 'btn_wood_medium',
        'path': f'{WORKSPACE}/src/assets/ui/btn_wood_medium.png',
        'category': 'INGAME',
        'name': '[방향전환] 직사각 목판 버튼',
        'usage': '인게임 조작부 좌측',
        'desc': '코너에서 달걀의 구르는 방향을 회전시키는 조작 버튼'
    },
    {
        'id': 'btn_orange_jelly_medium',
        'path': f'{WORKSPACE}/src/assets/ui/btn_orange_jelly_medium.png',
        'category': 'INGAME',
        'name': '[점프] 3D 오렌지 젤리 버튼',
        'usage': '인게임 조작부 우측',
        'desc': '끊어진 길과 건초 더미를 뛰어넘는 3D 젤리 버튼'
    },
    {
        'id': 'prop_golden_feather',
        'path': f'{WORKSPACE}/src/assets/icons/prop_golden_feather.png',
        'category': 'INGAME',
        'name': '수집용 황금 깃털 오브젝트',
        'usage': '트랙 위 캔버스 2D 렌더링',
        'desc': '주행 중 획득 가능한 반짝이는 황금 깃털 아이템'
    },
]

# 2. Master Background Screens (무손상 원본 원화 배경 가이드)
SCREEN_CATALOG = [
    { 'id': 'screen_home', 'name': '홈 (Home)', 'path': f'{WORKSPACE}/src/assets/screens/screen_home.png' },
    { 'id': 'screen_shop', 'name': '상점 (Shop)', 'path': f'{WORKSPACE}/src/assets/screens/screen_shop.png' },
    { 'id': 'screen_skin', 'name': '스킨 (Skin)', 'path': f'{WORKSPACE}/src/assets/screens/screen_skin.png' },
    { 'id': 'screen_mission', 'name': '미션 (Mission)', 'path': f'{WORKSPACE}/src/assets/screens/screen_mission.png' },
    { 'id': 'screen_challenge', 'name': '도전 (Challenge)', 'path': f'{WORKSPACE}/src/assets/screens/screen_challenge.png' },
]

def load_base64_data_uri(filepath):
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
    ext = os.path.splitext(filepath)[1].lower()
    mime = 'image/png' if ext == '.png' else 'image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/webp'
    return f'data:{mime};base64,{encoded}'

def build_editor_html():
    print('Encoding active assets to base64...')
    assets_data = []
    for item in ASSET_CATALOG:
        uri = load_base64_data_uri(item['path'])
        if not uri:
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

    print(f'Total active assets encoded: {len(assets_data)}')
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
