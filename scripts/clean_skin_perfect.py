import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = '/home/slalglel/.local/share/fonts/NanumSquareRoundB.ttf'

def clean_common_header(im):
    mask_l = np.zeros(im.shape[:2], dtype=np.uint8)
    region_l = im[45:150, 160:295]
    gray_l = cv2.cvtColor(region_l, cv2.COLOR_BGR2GRAY)
    text_l = ((gray_l > 120) | (gray_l < 55)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    text_l = cv2.dilate(text_l, kernel)
    mask_l[45:150, 160:295] = text_l
    im = cv2.inpaint(im, mask_l, 7, cv2.INPAINT_TELEA)

    mask_m = np.zeros(im.shape[:2], dtype=np.uint8)
    region_m = im[70:128, 548:682]
    gray_m = cv2.cvtColor(region_m, cv2.COLOR_BGR2GRAY)
    text_m = ((gray_m > 105) | (gray_m < 50)).astype(np.uint8) * 255
    text_m = cv2.dilate(text_m, kernel)
    mask_m[70:128, 548:682] = text_m
    im = cv2.inpaint(im, mask_m, 5, cv2.INPAINT_TELEA)

    mask_r = np.zeros(im.shape[:2], dtype=np.uint8)
    region_r = im[70:128, 798:932]
    gray_r = cv2.cvtColor(region_r, cv2.COLOR_BGR2GRAY)
    text_r = ((gray_r > 105) | (gray_r < 50)).astype(np.uint8) * 255
    text_r = cv2.dilate(text_r, kernel)
    mask_r[70:128, 798:932] = text_r
    im = cv2.inpaint(im, mask_r, 5, cv2.INPAINT_TELEA)
    return im

def clean_skin_screen():
    im_skin = cv2.imread('src/assets/screens/screen_skin.png')
    im_shop = cv2.imread('src/assets/screens/screen_shop.png')

    # 1. Header
    im_skin = clean_common_header(im_skin)

    # 2. Tab 2 "보관함" -> "스킨"
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

    # 3. Showcase boards:
    showcase_mask = np.zeros(im_skin.shape[:2], dtype=np.uint8)
    # Signboard 1
    cv2.rectangle(showcase_mask, (410, 675), (670, 765), 255, -1)
    # Signboard 2
    cv2.rectangle(showcase_mask, (340, 775), (740, 925), 255, -1)
    # Button
    cv2.rectangle(showcase_mask, (380, 960), (700, 1070), 255, -1)

    im_skin = cv2.inpaint(im_skin, showcase_mask, 7, cv2.INPAINT_TELEA)

    cv2.imwrite('src/assets/screens/screen_skin.png', im_skin)
    print('screen_skin.png completely cleaned and saved!')

if __name__ == '__main__':
    clean_skin_screen()
