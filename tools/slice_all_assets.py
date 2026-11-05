import os
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import binary_dilation, binary_fill_holes, gaussian_filter

SRC_DIR = "/mnt/d/사진/inf_egg"
DEST_DIR = "/home/slalglel/workspace/infinite-egg/src/assets"

os.makedirs(f"{DEST_DIR}/ui", exist_ok=True)
os.makedirs(f"{DEST_DIR}/eggs", exist_ok=True)
os.makedirs(f"{DEST_DIR}/tracks", exist_ok=True)
os.makedirs(f"{DEST_DIR}/backgrounds", exist_ok=True)
os.makedirs(f"{DEST_DIR}/icons", exist_ok=True)

print("Opening source images...")
home = Image.open(f"{SRC_DIR}/home.png")
play = Image.open(f"{SRC_DIR}/play.png")
skin = Image.open(f"{SRC_DIR}/skin.png")
shop = Image.open(f"{SRC_DIR}/shop.png")
mission = Image.open(f"{SRC_DIR}/mission.png")
challenge = Image.open(f"{SRC_DIR}/challenge.png")
print("All 6 source images loaded successfully.")

def save_png(img, dest_rel_path, auto_trim=True, quantize=True):
    if auto_trim and img.mode == 'RGBA':
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
    if quantize and img.mode == 'RGBA':
        img = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    full_path = os.path.join(DEST_DIR, dest_rel_path)
    img.save(full_path, "PNG", optimize=True)
    kb = os.path.getsize(full_path) / 1024
    print(f"  ✔ Saved: {dest_rel_path} ({img.size[0]}x{img.size[1]}, {kb:.1f} KB)")
    return img

def make_pill_alpha(w, h, pad_x=4, pad_y=4, p=4.0, feather=0.10):
    cx, cy = w / 2, h / 2
    rx, ry = (w - 2 * pad_x) / 2, (h - 2 * pad_y) / 2
    Y, X = np.ogrid[:h, :w]
    dist = ((np.abs(X - cx) / rx)**p + (np.abs(Y - cy) / ry)**p)
    alpha = np.clip((1.04 - dist) / feather, 0, 1) * 255
    return alpha.astype(np.uint8)

def make_circle_alpha(w, h, pad=4, feather=0.08):
    cx, cy = w / 2, h / 2
    r = (min(w, h) - 2 * pad) / 2
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2) / r
    alpha = np.clip((1.03 - dist) / feather, 0, 1) * 255
    return alpha.astype(np.uint8)

def inpaint_wood_slot(arr, x1, y1, x2, y2, seed=42):
    """Inpaints text area with smooth vertical interpolation of surrounding clean wood grain."""
    top_clean = arr[max(0, y1-18):y1, x1:x2, :3]
    bot_clean = arr[y2:min(arr.shape[0], y2+18), x1:x2, :3]
    h_box = y2 - y1
    w_box = x2 - x1
    blend = np.zeros((h_box, w_box, 3), dtype=float)
    top_mean = top_clean.mean(axis=0)
    bot_mean = bot_clean.mean(axis=0)
    for i in range(h_box):
        t = i / max(1, h_box - 1)
        blend[i] = (1 - t) * top_mean + t * bot_mean
    np.random.seed(seed)
    noise = np.random.normal(0, 5.5, blend.shape)
    arr[y1:y2, x1:x2, :3] = np.clip(blend + noise, 0, 255).astype(np.uint8)
    return arr

print("\n--- 1. Backgrounds ---")
bg_barn = home.resize((1080, 1935), Image.Resampling.LANCZOS)
save_png(bg_barn, "backgrounds/bg_barn_sunlight.png", auto_trim=False, quantize=True)

bg_loft = play.resize((1080, 1935), Image.Resampling.LANCZOS)
save_png(bg_loft, "backgrounds/bg_barn_loft.png", auto_trim=False, quantize=True)

print("\n--- 2. Header & Empty Recessed Wood Plaques ---")
# 2.1 Profile plaque (left) - text area (x:150..410) cleared to clean empty wood slot
crop_prof = home.crop((35, 50, 480, 220))
arr_p = np.array(crop_prof)
inpaint_wood_slot(arr_p, 150, 28, 410, 122, seed=44)
alpha_p = make_pill_alpha(arr_p.shape[1], arr_p.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr_p[:,:,:3], alpha_p])), "ui/header_profile_board.png")

# 2.2 Wheat plaque (center-left) - numbers area (x:140..385) cleared to clean empty wood slot
crop_wheat = home.crop((500, 50, 920, 220))
arr_w = np.array(crop_wheat)
inpaint_wood_slot(arr_w, 140, 28, 385, 122, seed=42)
alpha_w = make_pill_alpha(arr_w.shape[1], arr_w.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr_w[:,:,:3], alpha_w])), "ui/header_wheat_board.png")

# 2.3 Feather plaque (center-right) - numbers area (x:135..395) cleared to clean empty wood slot
crop_feather = home.crop((930, 50, 1360, 220))
arr_f = np.array(crop_feather)
inpaint_wood_slot(arr_f, 135, 28, 395, 122, seed=43)
alpha_f = make_pill_alpha(arr_f.shape[1], arr_f.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr_f[:,:,:3], alpha_f])), "ui/header_feather_board.png")

# 2.4 Egg shell plaque (shell market) - empty wood slot
crop_shell = home.crop((500, 50, 920, 220))
arr_s = np.array(crop_shell)
inpaint_wood_slot(arr_s, 140, 28, 385, 122, seed=46)
alpha_s = make_pill_alpha(arr_s.shape[1], arr_s.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr_s[:,:,:3], alpha_s])), "ui/header_shell_board.png")

# 2.5 Settings gear button
crop_cog = home.crop((1360, 55, 1500, 195))
arr_c = np.array(crop_cog)
alpha_c = make_circle_alpha(arr_c.shape[1], arr_c.shape[0], pad=4)
save_png(Image.fromarray(np.dstack([arr_c[:,:,:3], alpha_c])), "ui/btn_settings_cog.png")

print("\n--- 3. Bottom Dock & 5 Tabs (Icons Only, No Baked-in Text) ---")
# 3.1 Dock wood plank base
crop_dock = home.crop((0, 2380, 1536, 2752))
save_png(crop_dock, "ui/dock_wood_plank.png", auto_trim=False)

# Tab icons are cropped specifically from Y: 2415..2595 (emblem only), omitting the bottom label plaque!
# 3.2 Tab 1: Shop
t1 = home.crop((50, 2415, 310, 2595))
arr_t1 = np.array(t1)
alpha_t1 = make_circle_alpha(arr_t1.shape[1], arr_t1.shape[0], pad=4)
save_png(Image.fromarray(np.dstack([arr_t1[:,:,:3], alpha_t1])), "ui/tab_shop.png")

# 3.3 Tab 2: Skin (Clean icon only - No '보관함' baked-in text!)
t2 = home.crop((340, 2415, 600, 2595))
arr_t2 = np.array(t2)
alpha_t2 = make_circle_alpha(arr_t2.shape[1], arr_t2.shape[0], pad=4)
save_png(Image.fromarray(np.dstack([arr_t2[:,:,:3], alpha_t2])), "ui/tab_skin.png")

# 3.4 Tab 3: Home center wreath
t3 = home.crop((600, 2350, 936, 2730))
arr_t3 = np.array(t3)
alpha_t3 = make_circle_alpha(arr_t3.shape[1], arr_t3.shape[0], pad=6)
save_png(Image.fromarray(np.dstack([arr_t3[:,:,:3], alpha_t3])), "ui/tab_home_center.png")

# 3.5 Tab 4: Mission
t4 = home.crop((950, 2415, 1210, 2595))
arr_t4 = np.array(t4)
alpha_t4 = make_circle_alpha(arr_t4.shape[1], arr_t4.shape[0], pad=4)
save_png(Image.fromarray(np.dstack([arr_t4[:,:,:3], alpha_t4])), "ui/tab_mission.png")

# 3.6 Tab 5: Challenge
t5 = home.crop((1240, 2415, 1500, 2595))
arr_t5 = np.array(t5)
alpha_t5 = make_circle_alpha(arr_t5.shape[1], arr_t5.shape[0], pad=4)
save_png(Image.fromarray(np.dstack([arr_t5[:,:,:3], alpha_t5])), "ui/tab_challenge.png")

print("\n--- 4. Buttons ---")
# 4.1 Orange Jump button (Medium 3D Jelly)
jump_crop = play.crop((800, 2200, 1480, 2650))
arr_j = np.array(jump_crop)
mask_j = (arr_j[:,:,0] > 190) & (arr_j[:,:,1] > 90) & (arr_j[:,:,2] < 80)
from scipy.ndimage import label
lbl_j, n_j = label(mask_j)
sizes_j = [np.sum(lbl_j == i) for i in range(1, n_j+1)]
max_idx_j = int(np.argmax(sizes_j) + 1)
main_comp_j = binary_fill_holes(lbl_j == max_idx_j)
btn_mask_j = binary_dilation(main_comp_j, iterations=12)
alpha_j = gaussian_filter(btn_mask_j.astype(float), sigma=1.5)
alpha_j = np.clip(alpha_j * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr_j[:,:,:3], alpha_j])), "ui/btn_orange_jelly_medium.png")

# 4.2 Large Orange Start Button (출발하기!)
save_png(Image.fromarray(np.dstack([arr_j[:,:,:3], alpha_j])), "ui/btn_orange_jelly_large.png")

# 4.3 Wood medium button (Turn / Challenge)
turn_crop = play.crop((50, 2200, 660, 2650))
arr_trn = np.array(turn_crop)
alpha_trn = make_pill_alpha(arr_trn.shape[1], arr_trn.shape[0], pad_x=18, pad_y=20, p=3.8, feather=0.10)
save_png(Image.fromarray(np.dstack([arr_trn[:,:,:3], alpha_trn])), "ui/btn_wood_medium.png")

# 4.4 Wood square button (Pause / Arrows)
pause_crop = play.crop((55, 65, 215, 225))
arr_pau = np.array(pause_crop)
alpha_pau = make_pill_alpha(arr_pau.shape[1], arr_pau.shape[0], pad_x=6, pad_y=6, p=3.5, feather=0.10)
save_png(Image.fromarray(np.dstack([arr_pau[:,:,:3], alpha_pau])), "ui/btn_wood_square.png")

# 4.5 Activity wheat cost tag
crop_tag = home.crop((560, 2060, 976, 2190))
arr_tag = np.array(crop_tag)
alpha_tag = make_pill_alpha(arr_tag.shape[1], arr_tag.shape[0], pad_x=4, pad_y=4, p=3.0)
save_png(Image.fromarray(np.dstack([arr_tag[:,:,:3], alpha_tag])), "ui/tag_wheat_cost.png")

print("\n--- 5. Panels, Cards, Nests & Blank Name Signboard ---")
# 5.1 Hero straw nest
nest_crop = home.crop((180, 1100, 1356, 2050))
arr_nst = np.array(nest_crop)
h_nst, w_nst = arr_nst.shape[:2]
cy, cx = h_nst / 2, w_nst / 2
ry, rx = (h_nst - 20) / 2, (w_nst - 20) / 2
Y, X = np.ogrid[:h_nst, :w_nst]
dist = np.sqrt(((X - cx) / rx)**2 + ((Y - cy) / ry)**2)
alpha_nst = np.clip((1.05 - dist) / 0.18, 0, 1) * 255
save_png(Image.fromarray(np.dstack([arr_nst[:,:,:3], alpha_nst.astype(np.uint8)])), "ui/nest_straw_hero.png")

# 5.2 Blank Wooden Name Signboard ('꼬마계란' 글씨 제거 및 무지 원목 팻말 가공!)
sign_crop = home.crop((400, 780, 1136, 980))
arr_sgn = np.array(sign_crop)
inpaint_wood_slot(arr_sgn, 90, 32, 640, 168, seed=45)
alpha_sgn = make_pill_alpha(arr_sgn.shape[1], arr_sgn.shape[0], pad_x=8, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr_sgn[:,:,:3], alpha_sgn])), "ui/signboard_wood_name.png")

# 5.3 Large rope wood panel
panel_crop = challenge.crop((70, 410, 1466, 1040))
arr_pnl = np.array(panel_crop)
alpha_pnl = make_pill_alpha(arr_pnl.shape[1], arr_pnl.shape[0], pad_x=10, pad_y=10, p=4.0)
save_png(Image.fromarray(np.dstack([arr_pnl[:,:,:3], alpha_pnl])), "ui/panel_rope_wood_large.png")

# 5.4 Wood card slot tray
slot_crop = skin.crop((90, 1430, 420, 1850))
arr_slt = np.array(slot_crop)
alpha_slt = make_pill_alpha(arr_slt.shape[1], arr_slt.shape[0], pad_x=6, pad_y=6, p=3.8)
save_png(Image.fromarray(np.dstack([arr_slt[:,:,:3], alpha_slt])), "ui/panel_wood_card_slot.png")

print("\n--- 6. In-game Tracks, Props & Icons ---")
# 6.1 Wooden bridge track tile
track_crop = play.crop((350, 1350, 1180, 1950))
arr_trk = np.array(track_crop)
alpha_trk = make_pill_alpha(arr_trk.shape[1], arr_trk.shape[0], pad_x=12, pad_y=12, p=3.5)
save_png(Image.fromarray(np.dstack([arr_trk[:,:,:3], alpha_trk])), "tracks/track_wooden_bridge.png")

# 6.2 Floating golden feather prop
feather_crop = play.crop((960, 1450, 1180, 1630))
arr_fth = np.array(feather_crop)
lum_fth = 0.299*arr_fth[:,:,0] + 0.587*arr_fth[:,:,1] + 0.114*arr_fth[:,:,2]
f_mask = lum_fth > 130
f_mask = binary_fill_holes(f_mask)
f_mask = binary_dilation(f_mask, iterations=8)
f_alpha = gaussian_filter(f_mask.astype(float), sigma=2.0)
alpha_fth = np.clip(f_alpha * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr_fth[:,:,:3], alpha_fth])), "icons/prop_golden_feather.png")

# 6.3 Turn arrow emblem
arrow_crop = play.crop((230, 2350, 470, 2550))
arr_arw = np.array(arrow_crop)
lum_arw = 0.299*arr_arw[:,:,0] + 0.587*arr_arw[:,:,1] + 0.114*arr_arw[:,:,2]
a_mask = binary_dilation(lum_arw > 120, iterations=4)
alpha_arw = np.clip(gaussian_filter(a_mask.astype(float), sigma=1.5) * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr_arw[:,:,:3], alpha_arw])), "icons/icon_turn_arrow.png")

# 6.4 Jump arrow emblem
jump_arr_crop = play.crop((1020, 2330, 1260, 2550))
arr_jmp = np.array(jump_arr_crop)
lum_jmp = 0.299*arr_jmp[:,:,0] + 0.587*arr_jmp[:,:,1] + 0.114*arr_jmp[:,:,2]
j_mask = binary_dilation(lum_jmp > 140, iterations=4)
alpha_jmp = np.clip(gaussian_filter(j_mask.astype(float), sigma=1.5) * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr_jmp[:,:,:3], alpha_jmp])), "icons/icon_jump_arrow.png")

print("\n--- 7. Egg Character ---")
egg_crop = skin.crop((460, 420, 1040, 1080))
arr_egg = np.array(egg_crop)
h_e, w_e = arr_egg.shape[:2]
cy_e, cx_e = h_e / 2 + 30, w_e / 2
ry_e, rx_e = (h_e - 30) / 2, (w_e - 30) / 2
Y, X = np.ogrid[:h_e, :w_e]
y_ratio = (Y - cy_e) / ry_e
dist_e = np.sqrt(((X - cx_e) / (rx_e * (1.0 - 0.18 * y_ratio)))**2 + y_ratio**2)
alpha_egg = np.clip((1.04 - dist_e) / 0.08, 0, 1) * 255
save_png(Image.fromarray(np.dstack([arr_egg[:,:,:3], alpha_egg.astype(np.uint8)])), "eggs/egg_baby_sprout.png")

print("\nAll assets re-sliced and updated successfully!")
