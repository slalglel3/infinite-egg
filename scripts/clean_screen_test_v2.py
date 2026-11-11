import cv2
import numpy as np

def clean_header_and_sign(img_path, out_path):
    im = cv2.imread(img_path)
    
    # 1. Left board:
    # Source clean wood: x: 270 to 375, y: 45 to 155 (w=105, h=110)
    # Target text: x: 155 to 260, y: 45 to 155 (w=105, h=110)
    wood_src = im[45:155, 270:375].copy()
    # Let's clone or paste with feathered edges
    # A feathered alpha mask along horizontal edges
    mask = np.ones((110, 105), dtype=np.float32)
    # feather left and right 10px
    for i in range(12):
        mask[:, i] = i / 12.0
        mask[:, -1 - i] = i / 12.0
    for i in range(8):
        mask[i, :] = np.minimum(mask[i, :], i / 8.0)
        mask[-1 - i, :] = np.minimum(mask[-1 - i, :], i / 8.0)
    
    mask = mask[:, :, np.newaxis]
    target_bg = im[45:155, 155:260].astype(np.float32)
    blended = wood_src.astype(np.float32) * mask + target_bg * (1 - mask)
    im[45:155, 155:260] = blended.astype(np.uint8)

    # Inpaint any remaining text boundary on left board
    left_mask = np.zeros(im.shape[:2], dtype=np.uint8)
    left_region = im[45:155, 150:265]
    gray_l = cv2.cvtColor(left_region, cv2.COLOR_BGR2GRAY)
    # detect high contrast text edges
    text_l = ((gray_l > 140) | (gray_l < 45)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    text_l = cv2.dilate(text_l, kernel)
    left_mask[45:155, 150:265] = text_l
    im = cv2.inpaint(im, left_mask, 5, cv2.INPAINT_TELEA)

    # 2. Middle board (Wheat slot): inner slot x: 508 to 636, y: 70 to 142
    # The slot has a dark brown color. Let's create an inpaint mask of all text inside x: 508 to 636, y: 70 to 142
    mid_mask = np.zeros(im.shape[:2], dtype=np.uint8)
    mid_region = im[70:142, 508:636]
    gray_m = cv2.cvtColor(mid_region, cv2.COLOR_BGR2GRAY)
    text_m = ((gray_m > 110) | (gray_m < 40)).astype(np.uint8) * 255
    text_m = cv2.dilate(text_m, kernel)
    mid_mask[70:142, 508:636] = text_m
    im = cv2.inpaint(im, mid_mask, 5, cv2.INPAINT_TELEA)

    # 3. Right board (Feather slot): inner slot x: 742 to 866, y: 70 to 142
    right_mask = np.zeros(im.shape[:2], dtype=np.uint8)
    right_region = im[70:142, 742:866]
    gray_r = cv2.cvtColor(right_region, cv2.COLOR_BGR2GRAY)
    text_r = ((gray_r > 110) | (gray_r < 40)).astype(np.uint8) * 255
    text_r = cv2.dilate(text_r, kernel)
    right_mask[70:142, 742:866] = text_r
    im = cv2.inpaint(im, right_mask, 5, cv2.INPAINT_TELEA)

    # 4. Signpost (if on screen_home): x: 418 to 660, y: 585 to 668
    if 'screen_home' in img_path:
        sign_mask = np.zeros(im.shape[:2], dtype=np.uint8)
        sign_region = im[600:658, 448:632]
        gray = cv2.cvtColor(sign_region, cv2.COLOR_BGR2GRAY)
        text_pixels = ((gray > 130) | (gray < 65)).astype(np.uint8) * 255
        kernel_sign = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        text_pixels = cv2.dilate(text_pixels, kernel_sign)
        sign_mask[600:658, 448:632] = text_pixels
        im = cv2.inpaint(im, sign_mask, 7, cv2.INPAINT_TELEA)

    cv2.imwrite(out_path, im)
    print(f'Done: {img_path} -> {out_path}')

if __name__ == '__main__':
    clean_header_and_sign('src/assets/screens/screen_home.png', 'test_artifacts/test_cleaned_home_v2.png')
