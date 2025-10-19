import numpy as np
from typing import List, Tuple

def fit_plane_ransac(
    points: np.ndarray,
    threshold: float = 0.05,
    max_iterations: int = 1000,
    min_inliers: int = 10
) -> Tuple[np.ndarray, float, np.ndarray]:
    """
    RANSAC لإيجاد أفضل مستوى من سحابة نقاط
    
    Returns:
        normal: متجه عمودي على المستوى [nx, ny, nz]
        d: المسافة من الأصل
        inliers: النقاط التي تنتمي للمستوى
    """
    best_inliers = []
    best_normal = None
    best_d = None
    
    n_points = len(points)
    if n_points < 3:
        raise ValueError("Need at least 3 points")
    
    for _ in range(max_iterations):
        # اختر 3 نقاط عشوائية
        idx = np.random.choice(n_points, 3, replace=False)
        sample = points[idx]
        
        # احسب المستوى من 3 نقاط
        v1 = sample[1] - sample[0]
        v2 = sample[2] - sample[0]
        normal = np.cross(v1, v2)
        
        if np.linalg.norm(normal) < 1e-6:
            continue
            
        normal = normal / np.linalg.norm(normal)
        d = -np.dot(normal, sample[0])
        
        # احسب المسافة لكل النقاط
        distances = np.abs(np.dot(points, normal) + d)
        inliers = points[distances < threshold]
        
        # احفظ أفضل نتيجة
        if len(inliers) > len(best_inliers):
            best_inliers = inliers
            best_normal = normal
            best_d = d
    
    if len(best_inliers) < min_inliers:
        raise ValueError(f"Could not find plane with enough inliers (found {len(best_inliers)})")
    
    # أعد حساب المستوى باستخدام كل الـ inliers (least squares)
    centroid = np.mean(best_inliers, axis=0)
    centered = best_inliers - centroid
    _, _, vt = np.linalg.svd(centered)
    best_normal = vt[2]
    best_d = -np.dot(best_normal, centroid)
    
    return best_normal, best_d, best_inliers


def get_plane_point(normal: np.ndarray, d: float) -> np.ndarray:
    """احصل على نقطة على المستوى"""
    # أوجد أصغر مركب وضع النقطة على المحور المقابل
    abs_normal = np.abs(normal)
    min_idx = np.argmin(abs_normal)
    
    point = np.zeros(3)
    if min_idx == 0:
        point[1] = 1.0
        point[2] = (-d - normal[1] * point[1]) / normal[2] if abs(normal[2]) > 1e-6 else 0
    elif min_idx == 1:
        point[0] = 1.0
        point[2] = (-d - normal[0] * point[0]) / normal[2] if abs(normal[2]) > 1e-6 else 0
    else:
        point[0] = 1.0
        point[1] = (-d - normal[0] * point[0]) / normal[1] if abs(normal[1]) > 1e-6 else 0
    
    return point