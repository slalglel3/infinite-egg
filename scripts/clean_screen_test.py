import cv2
import numpy as np
from PIL import Image

def clean_image(img_path, out_path):
    im = cv2.imread(img_path)
    h, w = im.shape[:2]
    
    # --- 1. Left Board (Avatar name/level) ---
    # Copy clean wood texture from x: 275~375, y: 52~138
    # Source patch: w=100, h=86
    # Target patch: x: 165~265, y: 52~138
    src_wood = im[52:138, 275:375].copy()
    
    # We can use seamlessClone to blend the clean wood patch into the text area!
    # Target center: x = (165 + 265)//2 = 215, y = (52 + 138)//2 = 95
    mask_left = 255 * np.ones(src_wood.shape, src_wood.dtype)
    im = cv2.seamlessClone(src_wood, im, mask_left, (215, 95), cv2.NORMAL_CLONE)
    
    # --- 2. Middle Board (Wheat number slot) ---
    # Recessed slot inner: x: 512 to 628, y: 80 to 132
    # Sample the clean dark brown color from x: 620, y: 105
    slot_color_mid = im[105, 624].tolist() # [B, G, R]
    # Fill with slight blur/gradient of slot color
    slot_mid_mask = np.zeros(im.shape[:2], dtype=np.uint8)
    cv2.rectangle(slot_mid_mask, (515, 80), (626, 132), 255, -1)
    im = cv2.inpaint(im, slot_mid_mask, 5, cv2.INPAINT_TELEA)
    
    # --- 3. Right Board (Feather number slot) ---
    # Recessed slot inner: x: 745 to 855, y: 80 to 132
    slot_right_mask = np.zeros(im.shape[:2], dtype=np.uint8)
    cv2.rectangle(slot_right_mask, (745, 80), (855, 132), 255, -1)
    im = cv2.inpaint(im, slot_right_mask, 5, cv2.INPAINT_TELEA)
    
    # --- 4. Signpost (if on screen_home) ---
    # Sign text: x: 450 to 630, y: 605 to 655
    # Let's check if this is screen_home or screen_skin
    if 'screen_home' in img_path:
        # Inpaint text "꼬마 에그"
        sign_mask = np.zeros(im.shape[:2], dtype=np.uint8)
        # Precise text mask inside the sign
        sign_region = im[600:658, 448:632]
        gray = cv2.cvtColor(sign_region, cv2.COLOR_BGR2GRAY)
        text_pixels = ((gray > 130) | (gray < 65)).astype(np.uint8) * 255
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        text_pixels = cv2.dilate(text_pixels, kernel)
        sign_mask[600:658, 448:632] = text_pixels
        im = cv2.inpaint(im, sign_mask, 7, cv2.INPAINT_TELEA)

    cv2.imwrite(out_path, im)
    print(f'Processed {img_path} -> {out_path}')

if __name__ == '__main__':
    clean_image('src/assets/screens/screen_home.png', 'test_artifacts/test_cleaned_home.png')
