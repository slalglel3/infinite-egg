import cv2
import numpy as np

def clean_skin_showcase():
    im = cv2.imread('src/assets/screens/screen_skin.png')

    # Mask for showcase text
    mask = np.zeros(im.shape[:2], dtype=np.uint8)

    # 1. Signboard 1 text: "꼬마 에그 (LITTLE EGG)"
    # global x: 420 to 660, y: 685 to 765
    region_1 = im[685:765, 420:660]
    gray_1 = cv2.cvtColor(region_1, cv2.COLOR_BGR2GRAY)
    text_1 = ((gray_1 > 115) | (gray_1 < 50)).astype(np.uint8) * 255
    text_1 = cv2.dilate(text_1, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    mask[685:765, 420:660] = text_1

    # 2. Signboard 2 text: "점프력 +1.5% \n 속도 +1.0%"
    # global x: 370 to 710, y: 805 to 935
    region_2 = im[805:935, 370:710]
    gray_2 = cv2.cvtColor(region_2, cv2.COLOR_BGR2GRAY)
    text_2 = ((gray_2 > 105) | (gray_2 < 45)).astype(np.uint8) * 255
    text_2 = cv2.dilate(text_2, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    mask[805:935, 370:710] = text_2

    # 3. Button text: "장착됨 (EQUIPPED)"
    # global x: 410 to 670, y: 975 to 1065
    region_3 = im[975:1065, 410:670]
    gray_3 = cv2.cvtColor(region_3, cv2.COLOR_BGR2GRAY)
    text_3 = (gray_3 < 85).astype(np.uint8) * 255
    text_3 = cv2.dilate(text_3, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    mask[975:1065, 410:670] = text_3

    cleaned = cv2.inpaint(im, mask, 7, cv2.INPAINT_TELEA)

    cv2.imwrite('src/assets/screens/screen_skin.png', cleaned)
    cv2.imwrite('test_artifacts/cleaned_skin_showcase_crop.png', cleaned[500:1100, 100:980])
    print('Skin showcase cleaned successfully!')

if __name__ == '__main__':
    clean_skin_showcase()
