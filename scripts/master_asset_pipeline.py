import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = '/home/slalglel/.local/share/fonts/NanumSquareRoundB.ttf'

def clean_common_header(im):
    # Left board: clean from x: 160 to 290, y: 45 to 150
    # Copy clean wood texture from x: 295 to 395 (w=100, h=105)
    wood_patch = im[45:150, 295:395].copy()
    
    # Inpaint mask for left board text
    mask_l = np.zeros(im.shape[:2], dtype=np.uint8)
    region_l = im[45:150, 160:295]
    gray_l = cv2.cvtColor(region_l, cv2.COLOR_BGR2GRAY)
    text_l = ((gray_l > 120) | (gray_l < 55)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    text_l = cv2.dilate(text_l, kernel)
    mask_l[45:150, 160:295] = text_l
    im = cv2.inpaint(im, mask_l, 7, cv2.INPAINT_TELEA)

    # Middle slot (Wheat): x: 548 to 682, y: 70 to 128
    mask_m = np.zeros(im.shape[:2], dtype=np.uint8)
    region_m = im[70:128, 548:682]
    gray_m = cv2.cvtColor(region_m, cv2.COLOR_BGR2GRAY)
    text_m = ((gray_m > 105) | (gray_m < 50)).astype(np.uint8) * 255
    text_m = cv2.dilate(text_m, kernel)
    mask_m[70:128, 548:682] = text_m
    im = cv2.inpaint(im, mask_m, 5, cv2.INPAINT_TELEA)

    # Right slot (Feather): x: 798 to 932, y: 70 to 128
    mask_r = np.zeros(im.shape[:2], dtype=np.uint8)
    region_r = im[70:128, 798:932]
    gray_r = cv2.cvtColor(region_r, cv2.COLOR_BGR2GRAY)
    text_r = ((gray_r > 105) | (gray_r < 50)).astype(np.uint8) * 255
    text_r = cv2.dilate(text_r, kernel)
    mask_r[70:128, 798:932] = text_r
    im = cv2.inpaint(im, mask_r, 5, cv2.INPAINT_TELEA)

    return im

def process_screen_home():
    im = cv2.imread('src/assets/screens/screen_home.png')
    im = clean_common_header(im)

    # Signpost: x: 448 to 632, y: 600 to 658
    sign_mask = np.zeros(im.shape[:2], dtype=np.uint8)
    region_s = im[600:658, 448:632]
    gray_s = cv2.cvtColor(region_s, cv2.COLOR_BGR2GRAY)
    text_s = ((gray_s > 120) | (gray_s < 60)).astype(np.uint8) * 255
    text_s = cv2.dilate(text_s, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    sign_mask[600:658, 448:632] = text_s
    im = cv2.inpaint(im, sign_mask, 7, cv2.INPAINT_TELEA)

    cv2.imwrite('src/assets/screens/screen_home.png', im)
    print('screen_home.png processed!')

def process_screen_skin():
    im_skin = cv2.imread('src/assets/screens/screen_skin.png')
    im_shop = cv2.imread('src/assets/screens/screen_shop.png')
    
    im_skin = clean_common_header(im_skin)

    # Fix bottom dock tab 2: Change "보관함" -> "스킨"
    inner_shop = im_shop[1756:1818, 38:202].copy()
    gray = cv2.cvtColor(inner_shop, cv2.COLOR_BGR2GRAY)
    text_m = (gray < 85).astype(np.uint8) * 255
    mask = np.zeros(inner_shop.shape[:2], dtype=np.uint8)
    mask[10:55, 20:145] = text_m[10:55, 20:145]
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    clean_inner = cv2.inpaint(inner_shop, mask, 5, cv2.INPAINT_TELEA)

    pil_inner = Image.fromarray(cv2.cvtColor(clean_inner, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_inner)
    font = ImageFont.truetype(FONT_PATH, 38)
    bbox = draw.textbbox((0, 0), '스킨', font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (clean_inner.shape[1] - tw) // 2
    ty = (clean_inner.shape[0] - th) // 2 - 2
    color = (68, 32, 12)
    draw.text((tx, ty), '스킨', font=font, fill=color, stroke_width=1, stroke_fill=color)
    final_inner = cv2.cvtColor(np.array(pil_inner), cv2.COLOR_RGB2BGR)
    im_skin[1756:1818, 230:394] = final_inner

    cv2.imwrite('src/assets/screens/screen_skin.png', im_skin)
    print('screen_skin.png processed!')

def process_screen_shop():
    im = cv2.imread('src/assets/screens/screen_shop.png')
    im = clean_common_header(im)
    cv2.imwrite('src/assets/screens/screen_shop.png', im)
    print('screen_shop.png processed!')

def process_screen_mission():
    im = cv2.imread('src/assets/screens/screen_mission.png')
    im = clean_common_header(im)
    cv2.imwrite('src/assets/screens/screen_mission.png', im)
    print('screen_mission.png processed!')

def process_screen_challenge():
    im = cv2.imread('src/assets/screens/screen_challenge.png')
    im = clean_common_header(im)
    cv2.imwrite('src/assets/screens/screen_challenge.png', im)
    print('screen_challenge.png processed!')

if __name__ == '__main__':
    process_screen_home()
    process_screen_skin()
    process_screen_shop()
    process_screen_mission()
    process_screen_challenge()
    print('All screens successfully cleaned!')
