import cv2
import numpy as np

def inpaint_nest_egg(img_path, out_path):
    im = cv2.imread(img_path)
    
    # Bounding box of egg: x: 410 to 615, y: 720 to 1090
    mask = np.zeros(im.shape[:2], dtype=np.uint8)
    
    # Ellipse mask over egg body
    center = ((415 + 610) // 2, (750 + 1075) // 2)
    axes = ((610 - 415) // 2 + 5, (1075 - 750) // 2 + 5)
    cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
    
    # Also mask the little sprout at the top: x: 480 to 540, y: 710 to 760
    cv2.rectangle(mask, (480, 705), (540, 765), 255, -1)
    
    # Inpaint using Telea with radius 9
    cleaned = cv2.inpaint(im, mask, 9, cv2.INPAINT_TELEA)
    
    cv2.imwrite(out_path, cleaned)
    print(f'Empty nest saved to {out_path}')

if __name__ == '__main__':
    inpaint_nest_egg('src/assets/screens/screen_home.png', 'test_artifacts/test_empty_nest.png')
