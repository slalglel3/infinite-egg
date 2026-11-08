import os
import shutil
import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes

SRC_DIR = "/mnt/d/사진/inf_egg"
WORKSPACE = "/home/slalglel/workspace/infinite-egg"
ASSETS_DIR = f"{WORKSPACE}/src/assets"

print("=================================================================")
print("  Infinite Egg - Master Contour Asset Slicing Pipeline (OpenCV)")
print("=================================================================")

# 1. Ensure target directories exist
UI_DIR = f"{ASSETS_DIR}/ui"
SLICED_DIR = f"{ASSETS_DIR}/ui/sliced"
TRACKS_DIR = f"{ASSETS_DIR}/tracks"
ICONS_DIR = f"{ASSETS_DIR}/icons"
EGGS_DIR = f"{ASSETS_DIR}/eggs"
EGG_ART_DIR = f"{ASSETS_DIR}/eggs/art"

for d in [UI_DIR, SLICED_DIR, TRACKS_DIR, ICONS_DIR, EGGS_DIR, EGG_ART_DIR]:
    os.makedirs(d, exist_ok=True)

# 2. Clean out old sliced assets (Wipe substandard assets)
print("\n[Step 1] Wiping old sliced individual assets...")
def wipe_pngs_in_dir(directory):
    count = 0
    if os.path.exists(directory):
        for f in os.listdir(directory):
            if f.endswith(".png"):
                os.remove(os.path.join(directory, f))
                count += 1
    print(f"  Removed {count} old PNGs in: {directory}")

wipe_pngs_in_dir(UI_DIR)
wipe_pngs_in_dir(SLICED_DIR)
wipe_pngs_in_dir(TRACKS_DIR)
wipe_pngs_in_dir(ICONS_DIR)
wipe_pngs_in_dir(EGG_ART_DIR)
if os.path.exists(f"{EGGS_DIR}/egg_baby_sprout.png"):
    os.remove(f"{EGGS_DIR}/egg_baby_sprout.png")
    print(f"  Removed: {EGGS_DIR}/egg_baby_sprout.png")

# 3. Load 6 pristine raw images
print("\n[Step 2] Loading 6 pristine source artworks from /mnt/d/사진/inf_egg/ ...")
home_bgr = cv2.imread(f"{SRC_DIR}/home.png")
play_bgr = cv2.imread(f"{SRC_DIR}/play.png")
shop_bgr = cv2.imread(f"{SRC_DIR}/shop.png")
skin_bgr = cv2.imread(f"{SRC_DIR}/skin.png")
mission_bgr = cv2.imread(f"{SRC_DIR}/mission.png")
challenge_bgr = cv2.imread(f"{SRC_DIR}/challenge.png")

print(f"  ✔ home.png: {home_bgr.shape}")
print(f"  ✔ play.png: {play_bgr.shape}")
print(f"  ✔ shop.png: {shop_bgr.shape}")
print(f"  ✔ skin.png: {skin_bgr.shape}")
print(f"  ✔ mission.png: {mission_bgr.shape}")
print(f"  ✔ challenge.png: {challenge_bgr.shape}")

# 4. Core contour extraction function with GrabCut & anti-aliased edge
def extract_element_contour(
    src_img,
    x1, y1, x2, y2,
    margin=25,
    fg_ratio=0.15,
    iters=5,
    blur_sigma=1.2,
    alpha_cut=8,
    morph_k=5,
    inpaint_rects=None,
    custom_fg_mask_func=None
):
    """
    Extracts an individual asset along its authentic outer contour using OpenCV GrabCut.
    Zero geometric pill/circle formulas. Full 32-bit RGBA with smooth anti-aliased edges.
    """
    H, W = src_img.shape[:2]
    cx1 = max(0, x1 - margin)
    cy1 = max(0, y1 - margin)
    cx2 = min(W, x2 + margin)
    cy2 = min(H, y2 + margin)
    
    crop = src_img[cy1:cy2, cx1:cx2].copy()
    ch, cw = crop.shape[:2]
    
    # Apply inpainting for dynamic slots/text if specified
    if inpaint_rects:
        inpaint_mask = np.zeros((ch, cw), dtype=np.uint8)
        for (rx1, ry1, rx2, ry2) in inpaint_rects:
            bx1 = (x1 + rx1) - cx1
            by1 = (y1 + ry1) - cy1
            bx2 = (x1 + rx2) - cx1
            by2 = (y1 + ry2) - cy1
            bx1, by1 = max(0, bx1), max(0, by1)
            bx2, by2 = min(cw, bx2), min(ch, by2)
            inpaint_mask[by1:by2, bx1:bx2] = 255
        crop = cv2.inpaint(crop, inpaint_mask, 5, cv2.INPAINT_TELEA)
        
    mask = np.full((ch, cw), cv2.GC_PR_BGD, dtype=np.uint8)
    
    # Outer border is definite background
    b_margin = max(4, margin // 2)
    mask[:b_margin, :] = cv2.GC_BGD
    mask[-b_margin:, :] = cv2.GC_BGD
    mask[:, :b_margin] = cv2.GC_BGD
    mask[:, -b_margin:] = cv2.GC_BGD
    
    # Bounding rect is probable foreground
    obj_x1 = x1 - cx1
    obj_y1 = y1 - cy1
    obj_x2 = x2 - cx1
    obj_y2 = y2 - cy1
    mask[obj_y1:obj_y2, obj_x1:obj_x2] = cv2.GC_PR_FGD
    
    # Center core is definite foreground
    if custom_fg_mask_func:
        custom_fg_mask_func(mask, obj_x1, obj_y1, obj_x2, obj_y2)
    else:
        dx = int((obj_x2 - obj_x1) * fg_ratio)
        dy = int((obj_y2 - obj_y1) * fg_ratio)
        if dx > 0 and dy > 0:
            mask[obj_y1+dy:obj_y2-dy, obj_x1+dx:obj_x2-dx] = cv2.GC_FGD
            
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    cv2.grabCut(crop, mask, None, bgdModel, fgdModel, iters, cv2.GC_INIT_WITH_MASK)
    fg_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    
    # Morphological closing to seal wood grain and tiny texture crevices
    if morph_k > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (morph_k, morph_k))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        
    # Find contours
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return None
    largest = max(contours, key=cv2.contourArea)
    
    clean_mask = np.zeros_like(fg_mask)
    cv2.drawContours(clean_mask, [largest], -1, 255, thickness=cv2.FILLED)
    
    # Fill internal holes (wood boards, buttons, cards are solid)
    clean_mask = binary_fill_holes(clean_mask > 0).astype(np.uint8) * 255
    
    # Anti-alias edge with Gaussian blur
    blurred = cv2.GaussianBlur(clean_mask.astype(np.float32), (0, 0), blur_sigma)
    alpha = np.where(blurred < alpha_cut, 0, blurred)
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    
    # Combine RGBA
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    rgba = np.dstack([rgb, alpha])
    
    # Auto-trim transparent borders
    non_zero = np.argwhere(alpha > 0)
    if len(non_zero) > 0:
        ty1, tx1 = non_zero.min(axis=0)
        ty2, tx2 = non_zero.max(axis=0) + 1
        rgba = rgba[ty1:ty2, tx1:tx2]
        
    return Image.fromarray(rgba)

def save_asset(img, rel_path):
    dest = os.path.join(ASSETS_DIR, rel_path)
    img.save(dest, "PNG", optimize=True)
    kb = os.path.getsize(dest) / 1024
    print(f"  ✔ Saved: {rel_path} ({img.size[0]}x{img.size[1]} px, {kb:.1f} KB)")
    return dest

# 5. Extract all individual assets along exact contours
print("\n[Step 3] Slicing individual assets along authentic contours...")

# --- 5.1 Common Top Header Boards (Clean Empty Slots) ---
print("\n[5.1] Common Top Header (Empty recessed slots, no baked-in numbers/text)...")

# 1. header_profile_board
res = extract_element_contour(
    home_bgr, 30, 45, 485, 225, margin=25, fg_ratio=0.15,
    inpaint_rects=[(120, 25, 380, 120)] # Inpaint LV.3 계란이
)
save_asset(res, "ui/header_profile_board.png")

# 2. header_wheat_board
res = extract_element_contour(
    home_bgr, 490, 45, 930, 225, margin=25, fg_ratio=0.15,
    inpaint_rects=[(140, 25, 380, 120)] # Inpaint wheat numbers 24/50
)
save_asset(res, "ui/header_wheat_board.png")

# 3. header_feather_board
res = extract_element_contour(
    home_bgr, 920, 45, 1370, 225, margin=25, fg_ratio=0.15,
    inpaint_rects=[(140, 25, 390, 120)] # Inpaint feather numbers 1,245
)
save_asset(res, "ui/header_feather_board.png")

# 4. header_shell_board (Clean empty wood slot)
res = extract_element_contour(
    home_bgr, 490, 45, 930, 225, margin=25, fg_ratio=0.15,
    inpaint_rects=[(130, 20, 390, 125)]
)
save_asset(res, "ui/header_shell_board.png")

# 5. btn_settings_cog (Settings gear wheel contour)
res = extract_element_contour(
    home_bgr, 1350, 45, 1515, 205, margin=20, fg_ratio=0.25, blur_sigma=1.0
)
save_asset(res, "ui/btn_settings_cog.png")

# --- 5.2 Common Bottom Dock & 5 Tabs ---
print("\n[5.2] Common Bottom Dock (Clean icons, unified '스킨' emblem)...")

# 6. dock_wood_plank
dock_crop = home_bgr[2370:2752, :].copy()
dh, dw = dock_crop.shape[:2]
# Top 20px feathered transition
alpha_dock = np.full((dh, dw), 255, dtype=np.uint8)
for r in range(25):
    alpha_dock[r, :] = int(255 * (r / 25.0))
rgb_dock = cv2.cvtColor(dock_crop, cv2.COLOR_BGR2RGB)
save_asset(Image.fromarray(np.dstack([rgb_dock, alpha_dock])), "ui/dock_wood_plank.png")

# 7. tab_shop (Emblem contour)
res = extract_element_contour(home_bgr, 60, 2410, 300, 2590, margin=15, fg_ratio=0.2)
save_asset(res, "ui/tab_shop.png")

# 8. tab_skin (Pure egg emblem contour - no '보관함' text!)
res = extract_element_contour(home_bgr, 350, 2410, 590, 2590, margin=15, fg_ratio=0.2)
save_asset(res, "ui/tab_skin.png")

# 9. tab_home_center (Center wreath & nest)
res = extract_element_contour(home_bgr, 590, 2340, 946, 2740, margin=20, fg_ratio=0.25)
save_asset(res, "ui/tab_home_center.png")

# 10. tab_mission (Scroll emblem contour)
res = extract_element_contour(home_bgr, 950, 2410, 1190, 2590, margin=15, fg_ratio=0.2)
save_asset(res, "ui/tab_mission.png")

# 11. tab_challenge (Trophy emblem contour)
res = extract_element_contour(home_bgr, 1240, 2410, 1480, 2590, margin=15, fg_ratio=0.2)
save_asset(res, "ui/tab_challenge.png")

# --- 5.3 Buttons & Panels ---
print("\n[5.3] Buttons & Main UI Elements...")

# 12. btn_orange_jelly_large & sliced/home_btn_start
res_start = extract_element_contour(home_bgr, 485, 1708, 1050, 1992, margin=25, fg_ratio=0.2)
save_asset(res_start, "ui/btn_orange_jelly_large.png")
save_asset(res_start, "ui/sliced/home_btn_start.png")

# 13. btn_orange_jelly_medium (Play Jump button)
res_jump = extract_element_contour(play_bgr, 800, 2200, 1480, 2650, margin=30, fg_ratio=0.2)
save_asset(res_jump, "ui/btn_orange_jelly_medium.png")

# 14. btn_wood_medium (Play Turn button)
res_turn = extract_element_contour(play_bgr, 50, 2200, 660, 2650, margin=30, fg_ratio=0.2)
save_asset(res_turn, "ui/btn_wood_medium.png")

# 15. btn_wood_square (Play Pause button)
res_pause = extract_element_contour(play_bgr, 50, 55, 230, 235, margin=20, fg_ratio=0.2)
save_asset(res_pause, "ui/btn_wood_square.png")

# 16. tag_wheat_cost (Activity wheat tag)
res_tag = extract_element_contour(home_bgr, 550, 2050, 985, 2200, margin=20, fg_ratio=0.2)
save_asset(res_tag, "ui/tag_wheat_cost.png")

# 17. nest_straw_hero & sliced/home_nest_hero
res_nest = extract_element_contour(home_bgr, 170, 1080, 1370, 2060, margin=35, fg_ratio=0.3)
save_asset(res_nest, "ui/nest_straw_hero.png")

res_nest_hero = extract_element_contour(home_bgr, 245, 770, 1290, 1541, margin=30, fg_ratio=0.25)
save_asset(res_nest_hero, "ui/sliced/home_nest_hero.png")

# 18. signboard_wood_name & sliced/home_signpost_name (Blank natural wood, no '꼬마계란')
res_sign = extract_element_contour(
    home_bgr, 390, 770, 1150, 990, margin=25, fg_ratio=0.2,
    inpaint_rects=[(120, 35, 620, 155)]
)
save_asset(res_sign, "ui/signboard_wood_name.png")

res_sign_slice = extract_element_contour(
    home_bgr, 522, 811, 1013, 949, margin=20, fg_ratio=0.2,
    inpaint_rects=[(60, 20, 420, 110)]
)
save_asset(res_sign_slice, "ui/sliced/home_signpost_name.png")

# 19. panel_rope_wood_large
res_panel = extract_element_contour(challenge_bgr, 60, 400, 1476, 1060, margin=30, fg_ratio=0.2)
save_asset(res_panel, "ui/panel_rope_wood_large.png")

# 20. panel_wood_card_slot
res_slot = extract_element_contour(skin_bgr, 80, 1420, 430, 1860, margin=25, fg_ratio=0.2)
save_asset(res_slot, "ui/panel_wood_card_slot.png")

# --- 5.4 Sliced Cards & Subtabs ---
print("\n[5.4] Tab-Specific Sliced Cards & Subtabs (GrabCut Contour Segmented)...")

# Challenge Cards 1, 2, 3
save_asset(extract_element_contour(challenge_bgr, 122, 770, 1413, 1197, margin=25), "ui/sliced/challenge_card_1.png")
save_asset(extract_element_contour(challenge_bgr, 122, 1265, 1413, 1692, margin=25), "ui/sliced/challenge_card_2.png")
save_asset(extract_element_contour(challenge_bgr, 122, 1761, 1413, 2187, margin=25), "ui/sliced/challenge_card_3.png")

# Mission Subtabs
save_asset(extract_element_contour(mission_bgr, 173, 454, 451, 619, margin=20), "ui/sliced/mission_subtab_daily.png")
save_asset(extract_element_contour(mission_bgr, 476, 454, 755, 619, margin=20), "ui/sliced/mission_subtab_weekly.png")
save_asset(extract_element_contour(mission_bgr, 780, 454, 1059, 619, margin=20), "ui/sliced/mission_subtab_achieve.png")
save_asset(extract_element_contour(mission_bgr, 1085, 454, 1365, 619, margin=20), "ui/sliced/mission_subtab_season.png")

# Mission Cards 1, 2, 3
save_asset(extract_element_contour(mission_bgr, 122, 770, 1413, 1197, margin=25), "ui/sliced/mission_card_1.png")
save_asset(extract_element_contour(mission_bgr, 122, 1265, 1413, 1692, margin=25), "ui/sliced/mission_card_2.png")
save_asset(extract_element_contour(mission_bgr, 122, 1761, 1413, 2187, margin=25), "ui/sliced/mission_card_3.png")

# Shop Hatch Buttons
save_asset(extract_element_contour(shop_bgr, 314, 1067, 737, 1279, margin=25), "ui/sliced/shop_btn_hatch_1.png")
save_asset(extract_element_contour(shop_bgr, 798, 1067, 1221, 1279, margin=25), "ui/sliced/shop_btn_hatch_10.png")

# Shop Currency Cards
save_asset(extract_element_contour(shop_bgr, 145, 1499, 752, 1843, margin=25), "ui/sliced/shop_card_wheat_10.png")
save_asset(extract_element_contour(shop_bgr, 775, 1499, 1382, 1843, margin=25), "ui/sliced/shop_card_wheat_50.png")
save_asset(extract_element_contour(shop_bgr, 145, 1857, 752, 2201, margin=25), "ui/sliced/shop_card_feathers.png")
save_asset(extract_element_contour(shop_bgr, 775, 1857, 1382, 2201, margin=25), "ui/sliced/shop_card_goldbox.png")

# Skin Equip Button
save_asset(extract_element_contour(skin_bgr, 430, 1073, 1105, 1307, margin=25), "ui/sliced/skin_btn_equip.png")

# --- 5.5 In-game Tracks, Props & Icons ---
print("\n[5.5] In-Game Tracks & Icons...")

# Track Wooden Bridge
res_track = extract_element_contour(play_bgr, 340, 1340, 1190, 1960, margin=30, fg_ratio=0.2)
save_asset(res_track, "tracks/track_wooden_bridge.png")

# Prop Golden Feather (Clean glow contour)
cx1, cy1, cx2, cy2 = 940, 1430, 1200, 1650
f_crop = play_bgr[cy1:cy2, cx1:cx2].copy()
f_hsv = cv2.cvtColor(f_crop, cv2.COLOR_BGR2HSV)
f_mask = cv2.inRange(f_hsv, (14, 70, 100), (38, 255, 255))
f_cnts, _ = cv2.findContours(f_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
if f_cnts:
    f_largest = max(f_cnts, key=cv2.contourArea)
    clean_f = np.zeros_like(f_mask)
    cv2.drawContours(clean_f, [f_largest], -1, 255, cv2.FILLED)
    f_blurred = cv2.GaussianBlur(clean_f.astype(np.float32), (0,0), 1.5)
    f_alpha = np.where(f_blurred < 8, 0, f_blurred)
    f_alpha = np.clip(f_alpha, 0, 255).astype(np.uint8)
    nz = np.argwhere(f_alpha > 0)
    ty1, tx1 = nz.min(axis=0)
    ty2, tx2 = nz.max(axis=0) + 1
    f_rgba = np.dstack([cv2.cvtColor(f_crop, cv2.COLOR_BGR2RGB), f_alpha])[ty1:ty2, tx1:tx2]
    save_asset(Image.fromarray(f_rgba), "icons/prop_golden_feather.png")

# Turn Arrow Icon (Curved white/cream arrow)
t_crop = play_bgr[2340:2560, 220:480].copy()
t_gray = cv2.cvtColor(t_crop, cv2.COLOR_BGR2GRAY)
_, t_bin = cv2.threshold(t_gray, 140, 255, cv2.THRESH_BINARY)
t_bin[:10, :] = 0
t_bin[-10:, :] = 0
t_bin[:, :10] = 0
t_bin[:, -10:] = 0
t_cnts, _ = cv2.findContours(t_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
if t_cnts:
    t_lg = max(t_cnts, key=cv2.contourArea)
    t_mask = np.zeros_like(t_bin)
    cv2.drawContours(t_mask, [t_lg], -1, 255, cv2.FILLED)
    t_alpha = np.clip(cv2.GaussianBlur(t_mask.astype(np.float32), (0,0), 1.5), 0, 255).astype(np.uint8)
    save_asset(Image.fromarray(np.dstack([cv2.cvtColor(t_crop, cv2.COLOR_BGR2RGB), t_alpha])), "icons/icon_turn_arrow.png")

# Jump Arrow Icon (Rising arrow)
j_crop = play_bgr[2340:2540, 1030:1250].copy()
j_gray = cv2.cvtColor(j_crop, cv2.COLOR_BGR2GRAY)
_, j_bin = cv2.threshold(j_gray, 165, 255, cv2.THRESH_BINARY)
j_bin[:10, :] = 0
j_bin[-10:, :] = 0
j_bin[:, :10] = 0
j_bin[:, -10:] = 0
j_cnts, _ = cv2.findContours(j_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
if j_cnts:
    j_lg = max(j_cnts, key=cv2.contourArea)
    j_mask = np.zeros_like(j_bin)
    cv2.drawContours(j_mask, [j_lg], -1, 255, cv2.FILLED)
    j_blurred = cv2.GaussianBlur(j_mask.astype(np.float32), (0,0), 1.2)
    j_alpha = np.where(j_blurred < 8, 0, j_blurred)
    j_alpha = np.clip(j_alpha, 0, 255).astype(np.uint8)
    nz = np.argwhere(j_alpha > 0)
    ty1, tx1 = nz.min(axis=0)
    ty2, tx2 = nz.max(axis=0) + 1
    j_rgba = np.dstack([cv2.cvtColor(j_crop, cv2.COLOR_BGR2RGB), j_alpha])[ty1:ty2, tx1:tx2]
    save_asset(Image.fromarray(j_rgba), "icons/icon_jump_arrow.png")

# --- 5.6 Egg Character & 8 Skins ---
print("\n[5.6] Egg Character & 8 Skins (Grid from skin.png)...")

# Hero Baby Sprout Egg
res_egg_hero = extract_element_contour(skin_bgr, 460, 420, 1070, 1080, margin=30, fg_ratio=0.25)
save_asset(res_egg_hero, "eggs/egg_baby_sprout.png")

# 8 Egg Art Cards
egg_coords = [
    # Row 1
    (152, 1697, 373, 1965),
    (490, 1697, 711, 1965),
    (828, 1697, 1049, 1965),
    (1166, 1697, 1387, 1965),
    # Row 2
    (152, 2055, 373, 2323),
    (490, 2055, 711, 2323),
    (828, 2055, 1049, 2323),
    (1166, 2055, 1387, 2323),
]

for idx, (ex1, ey1, ex2, ey2) in enumerate(egg_coords, start=1):
    res_art = extract_element_contour(skin_bgr, ex1, ey1, ex2, ey2, margin=20, fg_ratio=0.2)
    save_asset(res_art, f"eggs/art/egg_art_{idx}.png")

print("\n=================================================================")
print("  All 53 Individual Assets Sliced Along Exact Contours Successfully!")
print("=================================================================")
