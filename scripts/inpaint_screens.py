import cv2
import numpy as np
from PIL import Image

def inpaint_home():
    im = cv2.imread('src/assets/screens/screen_home.png')
    mask = np.zeros(im.shape[:2], dtype=np.uint8)

    # 1. Left board text: "LV.3 \n 계란이"
    # x: 180 to 380, y: 65 to 175
    # The wood has a gradient. Inpaint with Telea algorithm (radius 7)
    cv2.rectangle(mask, (175, 65), (380, 175), 255, -1)

    # 2. Middle board text: "24/50"
    # x: 545 to 695, y: 85 to 160
    cv2.rectangle(mask, (545, 85), (695, 160), 255, -1)

    # 3. Right board text: "1,245"
    # x: 785 to 935, y: 85 to 160
    cv2.rectangle(mask, (785, 85), (935, 160), 255, -1)

    # 4. Signpost text: "꼬마 에그"
    # x: 420 to 680, y: 555 to 640
    cv2.rectangle(mask, (420, 555), (680, 640), 255, -1)

    # Inpaint using INPAINT_TELEA
    result = cv2.inpaint(im, mask, 5, cv2.INPAINT_TELEA)

    # Save to test_artifacts for verification
    cv2.imwrite('test_artifacts/cleaned_screen_home.png', result)
    
    # Save crops to inspect
    cleaned_pil = Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))
    cleaned_pil.crop((160, 60, 400, 190)).save('test_artifacts/cleaned_left_board.png')
    cleaned_pil.crop((500, 70, 715, 190)).save('test_artifacts/cleaned_mid_board.png')
    cleaned_pil.crop((740, 70, 960, 190)).save('test_artifacts/cleaned_right_board.png')
    cleaned_pil.crop((350, 500, 750, 700)).save('test_artifacts/cleaned_signpost.png')
    print('Cleaned crops saved successfully!')

if __name__ == '__main__':
    inpaint_home()
