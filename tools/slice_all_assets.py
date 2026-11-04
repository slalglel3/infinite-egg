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

def save_png(img, dest_rel_path, auto_trim=True):
    if auto_trim and img.mode == 'RGBA':
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
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

print("\n--- 1. Backgrounds ---")
# Resize slightly for lightning fast web performance while maintaining crisp 2K quality
bg_barn = home.resize((1080, 1935), Image.Resampling.LANCZOS)
save_png(bg_barn, "backgrounds/bg_barn_sunlight.png", auto_trim=False)

bg_loft = play.resize((1080, 1935), Image.Resampling.LANCZOS)
save_png(bg_loft, "backgrounds/bg_barn_loft.png", auto_trim=False)

print("\n--- 2. Header & Plaques ---")
# 2.1 Profile plaque (left)
crop_prof = home.crop((35, 50, 480, 220))
arr = np.array(crop_prof)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/header_profile_board.png")

# 2.2 Wheat plaque (center-left)
crop_wheat = home.crop((500, 50, 920, 220))
arr = np.array(crop_wheat)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/header_wheat_board.png")

# 2.3 Feather plaque (center-right)
crop_feather = home.crop((930, 50, 1360, 220))
arr = np.array(crop_feather)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/header_feather_board.png")

# 2.4 Egg shell plaque (shell market)
# Created with wood board texture
crop_shell = home.crop((500, 50, 920, 220))
arr = np.array(crop_shell)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=8, p=3.5)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/header_shell_board.png")

# 2.5 Settings gear button
crop_cog = home.crop((1360, 55, 1500, 195))
arr = np.array(crop_cog)
alpha = make_circle_alpha(arr.shape[1], arr.shape[0], pad=4)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/btn_settings_cog.png")

print("\n--- 3. Bottom Dock & 5 Tabs ---")
# 3.1 Dock wood plank base
crop_dock = home.crop((0, 2380, 1536, 2752))
save_png(crop_dock, "ui/dock_wood_plank.png", auto_trim=False)

# 3.2 Tab 1: Shop
t1 = home.crop((40, 2420, 320, 2720))
arr = np.array(t1)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=6, p=3.0)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/tab_shop.png")

# 3.3 Tab 2: Skin
t2 = home.crop((330, 2420, 610, 2720))
arr = np.array(t2)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=6, p=3.0)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/tab_skin.png")

# 3.4 Tab 3: Home center wreath
t3 = home.crop((600, 2350, 936, 2730))
arr = np.array(t3)
alpha = make_circle_alpha(arr.shape[1], arr.shape[0], pad=6)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/tab_home_center.png")

# 3.5 Tab 4: Mission
t4 = home.crop((940, 2420, 1220, 2720))
arr = np.array(t4)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=6, p=3.0)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/tab_mission.png")

# 3.6 Tab 5: Challenge
t5 = home.crop((1230, 2420, 1510, 2720))
arr = np.array(t5)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=6, p=3.0)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/tab_challenge.png")

print("\n--- 4. Buttons ---")
# 4.1 Orange Jump button (Medium 3D Jelly)
jump_crop = play.crop((800, 2200, 1480, 2650))
arr = np.array(jump_crop)
mask = (arr[:,:,0] > 190) & (arr[:,:,1] > 90) & (arr[:,:,2] < 80)
from scipy.ndimage import label
lbl, n = label(mask)
sizes = [np.sum(lbl == i) for i in range(1, n+1)]
max_idx = int(np.argmax(sizes) + 1)
main_comp = binary_fill_holes(lbl == max_idx)
btn_mask = binary_dilation(main_comp, iterations=12)
alpha = gaussian_filter(btn_mask.astype(float), sigma=1.5)
alpha = np.clip(alpha * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/btn_orange_jelly_medium.png")

# 4.2 Large Orange Start Button (출발하기!)
# Scale medium button or crop
arr_large = np.array(jump_crop)
alpha_l = gaussian_filter(btn_mask.astype(float), sigma=1.5)
alpha_l = np.clip(alpha_l * 255, 0, 255).astype(np.uint8)
img_large = Image.fromarray(np.dstack([arr_large[:,:,:3], alpha_l]))
save_png(img_large, "ui/btn_orange_jelly_large.png")

# 4.3 Wood medium button (Turn / Challenge)
turn_crop = play.crop((50, 2200, 660, 2650))
arr = np.array(turn_crop)
h, w = arr.shape[:2]
alpha = make_pill_alpha(w, h, pad_x=18, pad_y=20, p=3.8, feather=0.10)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/btn_wood_medium.png")

# 4.4 Wood square button (Pause / Arrows)
pause_crop = play.crop((55, 65, 215, 225))
arr = np.array(pause_crop)
h, w = arr.shape[:2]
alpha = make_pill_alpha(w, h, pad_x=6, pad_y=6, p=3.5, feather=0.10)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/btn_wood_square.png")

# 4.5 Activity wheat cost tag
crop_tag = home.crop((560, 2060, 976, 2190))
arr = np.array(crop_tag)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=4, pad_y=4, p=3.0)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/tag_wheat_cost.png")

print("\n--- 5. Panels, Cards & Nests ---")
# 5.1 Hero straw nest
nest_crop = home.crop((180, 1100, 1356, 2050))
arr = np.array(nest_crop)
h, w = arr.shape[:2]
# Elliptical soft mask for nest
cy, cx = h / 2, w / 2
ry, rx = (h - 20) / 2, (w - 20) / 2
Y, X = np.ogrid[:h, :w]
dist = np.sqrt(((X - cx) / rx)**2 + ((Y - cy) / ry)**2)
alpha = np.clip((1.05 - dist) / 0.18, 0, 1) * 255
alpha = alpha.astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/nest_straw_hero.png")

# 5.2 Large rope wood panel
panel_crop = challenge.crop((70, 410, 1466, 1040))
arr = np.array(panel_crop)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=10, pad_y=10, p=4.0)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/panel_rope_wood_large.png")

# 5.3 Wood card slot tray
slot_crop = skin.crop((90, 1430, 420, 1850))
arr = np.array(slot_crop)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=6, pad_y=6, p=3.8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "ui/panel_wood_card_slot.png")

print("\n--- 6. In-game Tracks, Props & Icons ---")
# 6.1 Wooden bridge track tile
track_crop = play.crop((350, 1350, 1180, 1950))
arr = np.array(track_crop)
alpha = make_pill_alpha(arr.shape[1], arr.shape[0], pad_x=12, pad_y=12, p=3.5)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], alpha])), "tracks/track_wooden_bridge.png")

# 6.2 Floating golden feather prop
feather_crop = play.crop((960, 1450, 1180, 1630))
arr = np.array(feather_crop)
# Golden feather has bright golden luminance; create soft glow alpha
lum = 0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2]
# Feather mask where lum > 140
f_mask = lum > 130
f_mask = binary_fill_holes(f_mask)
f_mask = binary_dilation(f_mask, iterations=8)
f_alpha = gaussian_filter(f_mask.astype(float), sigma=2.0)
f_alpha = np.clip(f_alpha * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], f_alpha])), "icons/prop_golden_feather.png")

# 6.3 Turn arrow emblem
arrow_crop = play.crop((230, 2350, 470, 2550))
arr = np.array(arrow_crop)
lum = 0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2]
a_mask = lum > 120
a_mask = binary_dilation(a_mask, iterations=4)
a_alpha = gaussian_filter(a_mask.astype(float), sigma=1.5)
a_alpha = np.clip(a_alpha * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], a_alpha])), "icons/icon_turn_arrow.png")

# 6.4 Jump arrow emblem
jump_arr_crop = play.crop((1020, 2330, 1260, 2550))
arr = np.array(jump_arr_crop)
lum = 0.299*arr[:,:,0] + 0.587*arr[:,:,1] + 0.114*arr[:,:,2]
j_mask = lum > 140
j_mask = binary_dilation(j_mask, iterations=4)
j_alpha = gaussian_filter(j_mask.astype(float), sigma=1.5)
j_alpha = np.clip(j_alpha * 255, 0, 255).astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], j_alpha])), "icons/icon_jump_arrow.png")

print("\n--- 7. Egg Character ---")
# 7.1 Egg Baby Sprout
egg_crop = skin.crop((460, 420, 1040, 1080))
arr = np.array(egg_crop)
h, w = arr.shape[:2]
# Egg shaped superellipse
cx, cy = w / 2, h / 2 + 30
rx, ry = (w - 30) / 2, (h - 30) / 2
Y, X = np.ogrid[:h, :w]
# Egg is slightly narrower at the top
y_ratio = (Y - cy) / ry
x_width_mod = 1.0 - 0.18 * y_ratio
dist = np.sqrt(((X - cx) / (rx * x_width_mod))**2 + y_ratio**2)
egg_alpha = np.clip((1.04 - dist) / 0.08, 0, 1) * 255
egg_alpha = egg_alpha.astype(np.uint8)
save_png(Image.fromarray(np.dstack([arr[:,:,:3], egg_alpha])), "eggs/egg_baby_sprout.png")

print("\nAll assets sliced and saved successfully!")
