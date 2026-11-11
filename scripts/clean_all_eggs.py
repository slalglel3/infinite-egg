import cv2
import numpy as np

def clean_egg(input_path, output_path):
    im = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if im.shape[2] == 3:
        im = cv2.cvtColor(im, cv2.COLOR_BGR2BGRA)
    
    bgr = im[:, :, :3]
    h, w = bgr.shape[:2]
    
    # 1. Flood fill background from multiple edge points
    flood_mask = np.zeros((h + 2, w + 2), np.uint8)
    tol = (32, 32, 32)
    
    seeds = [
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
        (w // 2, 2), (w // 2, h - 3), (2, h // 2), (w - 3, h // 2),
        (5, 5), (w - 6, 5), (5, h - 6), (w - 6, h - 6)
    ]
    for pt in seeds:
        if 0 <= pt[0] < w and 0 <= pt[1] < h:
            cv2.floodFill(bgr.copy(), flood_mask, pt, (0, 0, 0), tol, tol, cv2.FLOODFILL_FIXED_RANGE)
            
    bg_mask = (flood_mask[1:h+1, 1:w+1] == 1)
    
    # Also color distance to brown shelf color: BGR (16, 30, 58)
    shelf_bgr = np.array([16, 30, 58], dtype=np.float32)
    dist = np.linalg.norm(bgr.astype(np.float32) - shelf_bgr, axis=2)
    # If near edges and close to shelf color, also mask out
    edge_zone = np.zeros((h, w), dtype=bool)
    edge_zone[:15, :] = True
    edge_zone[-25:, :] = True
    edge_zone[:, :15] = True
    edge_zone[:, -15:] = True
    bg_mask = bg_mask | (edge_zone & (dist < 40))
    
    # 2. Main egg mask
    egg_mask = (~bg_mask).astype(np.uint8) * 255
    
    # Keep only the largest connected component (the egg itself)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(egg_mask, connectivity=8)
    if num_labels > 1:
        # stat[i, cv2.CC_STAT_AREA] - find max area excluding background (label 0)
        max_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        clean_mask = (labels == max_label).astype(np.uint8) * 255
    else:
        clean_mask = egg_mask

    # Morphological close to ensure solid interior
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel)
    
    # Smooth edges with 1px Gaussian blur
    smooth_alpha = cv2.GaussianBlur(clean_mask, (3, 3), 0)
    
    im[:, :, 3] = smooth_alpha
    cv2.imwrite(output_path, im)
    print(f'Cleaned {input_path} -> {output_path}')

if __name__ == '__main__':
    for i in range(1, 7):
        clean_egg(f'src/assets/eggs/art/egg_art_{i}.png', f'test_artifacts/cleaned_egg_{i}.png')
