import os
import numpy as np
from PIL import Image

SCREENS_DIR = "/home/slalglel/workspace/infinite-egg/src/assets/screens"
UI_DIR = "/home/slalglel/workspace/infinite-egg/src/assets/ui"

print("Starting feedback application pipeline...")

def inpaint_box(img, x1, y1, x2, y2, seed=42):
    """Inpaint a rectangle with smooth vertical blend of surrounding clean wood grain."""
    arr = np.array(img)
    top_clean = arr[max(0, y1-15):y1, x1:x2, :3]
    bot_clean = arr[y2:min(arr.shape[0], y2+15), x1:x2, :3]
    h_box = y2 - y1
    w_box = x2 - x1
    blend = np.zeros((h_box, w_box, 3), dtype=float)
    top_mean = top_clean.mean(axis=0)
    bot_mean = bot_clean.mean(axis=0)
    for i in range(h_box):
        t = i / max(1, h_box - 1)
        blend[i] = (1 - t) * top_mean + t * bot_mean
    np.random.seed(seed)
    noise = np.random.normal(0, 4.5, blend.shape)
    arr[y1:y2, x1:x2, :3] = np.clip(blend + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

# 1. Process screen_home first (clean header + name signboard)
home_path = os.path.join(SCREENS_DIR, "screen_home.png")
home_img = Image.open(home_path).convert("RGB")

print("Processing screen_home.png:")
# Inpaint profile text
home_img = inpaint_box(home_img, 125, 52, 285, 125, seed=51)
# Inpaint wheat numbers
home_img = inpaint_box(home_img, 425, 52, 615, 125, seed=52)
# Inpaint feather numbers
home_img = inpaint_box(home_img, 715, 52, 905, 125, seed=53)
# Inpaint name signboard behind hero egg
home_img = inpaint_box(home_img, 345, 565, 735, 665, seed=54)

# Extract clean tab 2 '스킨' label from home screen before saving
skin_tab_label = home_img.crop((240, 1800, 420, 1910))

home_img.save(home_path, "PNG", optimize=True)
print("  ✔ screen_home.png: header empty slots + blank name signboard saved.")

# 2. Process all other screens: clean header empty slots
other_screens = ["screen_skin.png", "screen_shop.png", "screen_mission.png", "screen_challenge.png"]
for sname in other_screens:
    spath = os.path.join(SCREENS_DIR, sname)
    simg = Image.open(spath).convert("RGB")
    # Clean header empty slots
    simg = inpaint_box(simg, 125, 52, 285, 125, seed=61)
    simg = inpaint_box(simg, 425, 52, 615, 125, seed=62)
    simg = inpaint_box(simg, 715, 52, 905, 125, seed=63)

    # For screen_skin.png: replace tab 2 '보관함' with clean '스킨' label!
    if sname == "screen_skin.png":
        simg.paste(skin_tab_label, (240, 1800))
        print("  ✔ screen_skin.png: replaced '보관함' with '스킨' label!")

    simg.save(spath, "PNG", optimize=True)
    print(f"  ✔ {sname}: header empty slots cleaned and saved.")

# 3. Clean background bg_barn_sunlight as well
bg_sun_path = "/home/slalglel/workspace/infinite-egg/src/assets/backgrounds/bg_barn_sunlight.png"
if os.path.exists(bg_sun_path):
    bg_img = Image.open(bg_sun_path).convert("RGB")
    bg_img = inpaint_box(bg_img, 125, 52, 285, 125, seed=71)
    bg_img = inpaint_box(bg_img, 425, 52, 615, 125, seed=72)
    bg_img = inpaint_box(bg_img, 715, 52, 905, 125, seed=73)
    bg_img = inpaint_box(bg_img, 345, 565, 735, 665, seed=74)
    # Quantize for lightweight size
    bg_opt = bg_img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    bg_opt.save(bg_sun_path, "PNG", optimize=True)
    print("  ✔ bg_barn_sunlight.png: updated with clean slots & blank signboard.")

print("\nFeedback pipeline successfully completed!")
