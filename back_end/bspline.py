import numpy as np
from scipy import interpolate
from typing import List

def compute_bspline(
    control_points: np.ndarray,
    degree: int = 3,
    num_samples: int = 100
) -> np.ndarray:
    """
    حساب B-Spline من نقاط التحكم
    
    Args:
        control_points: نقاط التحكم [[x,y,z], ...]
        degree: درجة المنحنى (عادة 3 = cubic)
        num_samples: عدد النقاط المولدة على المنحنى
    
    Returns:
        curve_points: نقاط المنحنى [[x,y,z], ...]
    """
    n_points = len(control_points)
    
    if n_points < degree + 1:
        raise ValueError(f"Need at least {degree + 1} control points for degree {degree}")
    
    # أنشئ knot vector موحد
    num_knots = n_points + degree + 1
    knots = np.linspace(0, 1, num_knots)
    
    # أنشئ B-Spline لكل محور (x, y, z)
    tck_x = (knots, control_points[:, 0], degree)
    tck_y = (knots, control_points[:, 1], degree)
    tck_z = (knots, control_points[:, 2], degree)
    
    # عيّن المنحنى
    u = np.linspace(0, 1, num_samples)
    
    try:
        x = interpolate.splev(u, tck_x)
        y = interpolate.splev(u, tck_y)
        z = interpolate.splev(u, tck_z)
    except Exception as e:
        raise ValueError(f"Failed to compute spline: {str(e)}")
    
    curve_points = np.column_stack([x, y, z])
    return curve_points


def compute_catmull_rom_spline(
    control_points: np.ndarray,
    num_samples: int = 100,
    alpha: float = 0.5
) -> np.ndarray:
    """
    حساب Catmull-Rom Spline (بديل أسهل من B-Spline)
    المنحنى يمر بكل نقاط التحكم
    """
    n_points = len(control_points)
    if n_points < 2:
        raise ValueError("Need at least 2 control points")
    
    if n_points == 2:
        t = np.linspace(0, 1, num_samples).reshape(-1, 1)
        return (1 - t) * control_points[0] + t * control_points[1]
    
    p0 = 2 * control_points[0] - control_points[1]
    pn = 2 * control_points[-1] - control_points[-2]
    extended = np.vstack([p0, control_points, pn])
    
    curve_points = []
    segments = len(extended) - 3
    
    for i in range(segments):
        p = extended[i:i+4]
        
        # Catmull-Rom matrix
        t = np.linspace(0, 1, num_samples // segments + 1)
        
        for t_val in t[:-1] if i < segments - 1 else t:
            t2 = t_val * t_val
            t3 = t2 * t_val
            
            point = (
                0.5 * (
                    (2 * p[1]) +
                    (-p[0] + p[2]) * t_val +
                    (2*p[0] - 5*p[1] + 4*p[2] - p[3]) * t2 +
                    (-p[0] + 3*p[1] - 3*p[2] + p[3]) * t3
                )
            )
            curve_points.append(point)
    
    return np.array(curve_points)