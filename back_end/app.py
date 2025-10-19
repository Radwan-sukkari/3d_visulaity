from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np

from plane_segmentation import fit_plane_ransac, get_plane_point
from bspline import compute_bspline, compute_catmull_rom_spline

app = FastAPI(title="3D Processing API")

# CORS للسماح للـ Frontend بالاتصال
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # في الإنتاج استخدم النطاقات المحددة
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Models ====================

class Point3D(BaseModel):
    x: float
    y: float
    z: float


class PlaneSegmentationRequest(BaseModel):
    points: List[List[float]]  # [[x,y,z], ...]
    threshold: float = 0.05
    max_iterations: int = 1000


class PlaneSegmentationResponse(BaseModel):
    plane: dict  # {normal: [nx,ny,nz], d: float, point: [x,y,z]}
    inliers: List[List[float]]
    num_inliers: int


class BSplineRequest(BaseModel):
    control_points: List[List[float]]  # [[x,y,z], ...]
    degree: int = 3
    num_samples: int = 100
    method: str = "bspline"  # "bspline" أو "catmull-rom"


class BSplineResponse(BaseModel):
    curve_points: List[List[float]]
    num_points: int


# ==================== Endpoints ====================

@app.get("/")
def read_root():
    return {
        "message": "3D Processing API",
        "endpoints": ["/segment_plane", "/bspline"]
    }


@app.post("/segment_plane", response_model=PlaneSegmentationResponse)
def segment_plane(request: PlaneSegmentationRequest):
    """
    استخراج مستوى من سحابة نقاط باستخدام RANSAC
    """
    try:
        points = np.array(request.points)
        
        if len(points) < 3:
            raise HTTPException(status_code=400, detail="Need at least 3 points")
        
        # تشغيل RANSAC
        normal, d, inliers = fit_plane_ransac(
            points,
            threshold=request.threshold,
            max_iterations=request.max_iterations
        )
        
        # احصل على نقطة على المستوى
        plane_point = get_plane_point(normal, d)
        
        return PlaneSegmentationResponse(
            plane={
                "normal": normal.tolist(),
                "d": float(d),
                "point": plane_point.tolist()
            },
            inliers=inliers.tolist(),
            num_inliers=len(inliers)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.post("/bspline", response_model=BSplineResponse)
def create_bspline(request: BSplineRequest):
    """
    إنشاء منحنى B-Spline أو Catmull-Rom من نقاط التحكم
    """
    try:
        control_points = np.array(request.control_points)
        
        if len(control_points) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 control points")
        
        # اختر الطريقة
        if request.method == "catmull-rom":
            curve_points = compute_catmull_rom_spline(
                control_points,
                num_samples=request.num_samples
            )
        else:  # bspline
            curve_points = compute_bspline(
                control_points,
                degree=min(request.degree, len(control_points) - 1),
                num_samples=request.num_samples
            )
        
        return BSplineResponse(
            curve_points=curve_points.tolist(),
            num_points=len(curve_points)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)