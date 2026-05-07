"""
Nam Ngiao Dam Analysis - Backend API
GEE(Google Earth Engine) 연동 수몰 시뮬레이션 서버
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ee
import json
import os

app = FastAPI(title="Nam Ngiao Dam Analysis API")

# CORS 설정 (Cesium 프론트엔드에서 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── GEE 인증 ──
def init_gee():
    """서비스 계정으로 GEE 초기화"""
    try:
        # 환경변수에서 키 읽기 (Render 배포 시)
        key_json = os.environ.get("GEE_SERVICE_KEY")
        if key_json:
            key_data = json.loads(key_json)
        else:
            # 로컬 개발 시 파일에서 읽기
            with open("gee-key.json", "r") as f:
                key_data = json.load(f)

        credentials = ee.ServiceAccountCredentials(
            email=key_data["client_email"],
            key_data=json.dumps(key_data)
        )
        ee.Initialize(
            credentials,
            project="nam-ngiao-dam-analysis"
        )
        print("✅ GEE 초기화 성공")
        return True
    except Exception as e:
        print(f"❌ GEE 초기화 실패: {e}")
        return False

# 서버 시작 시 GEE 초기화
gee_ready = init_gee()

# ── 댐 후보지 데이터 ──
DAM_DATA = {
    "S1": {"lat": 18.443750, "lon": 103.582780, "elBase": 138, "elTop": 198},
    "S2": {"lat": 18.636670, "lon": 103.602083, "elBase": 143, "elTop": 203},
    "S3": {"lat": 18.930560, "lon": 103.543750, "elBase": 329, "elTop": 389},
    "S4": {"lat": 18.781250, "lon": 103.512220, "elBase": 259, "elTop": 319},
    "S5": {"lat": 19.034028, "lon": 103.407638, "elBase": 267, "elTop": 327},
    "S6": {"lat": 19.286389, "lon": 103.188609, "elBase": 989, "elTop": 1049},
    "S7": {"lat": 19.137916, "lon": 103.185417, "elBase": 548, "elTop": 608},
    "S9": {"lat": 19.207776, "lon": 103.538056, "elBase": 1144, "elTop": 1204},
}

# ── 요청 모델 ──
class FloodRequest(BaseModel):
    dam_id: str
    water_level: float = None  # None이면 만수위 사용

# ── API 엔드포인트 ──

@app.get("/")
def root():
    return {
        "status": "running",
        "gee": "connected" if gee_ready else "disconnected",
        "project": "nam-ngiao-dam-analysis"
    }

@app.get("/health")
def health():
    return {"status": "ok", "gee_ready": gee_ready}


@app.post("/flood-simulation")
def flood_simulation(req: FloodRequest):
    """
    수몰 시뮬레이션 - SRTM DEM 기반
    만수위(elTop) 아래 지형을 수몰 구역으로 계산
    GeoJSON으로 반환 → Cesium에서 렌더링
    """
    if not gee_ready:
        raise HTTPException(503, "GEE 연결 안됨")

    if req.dam_id not in DAM_DATA:
        raise HTTPException(404, f"댐 ID '{req.dam_id}' 없음")

    dam = DAM_DATA[req.dam_id]
    water_el = req.water_level if req.water_level else dam["elTop"]

    try:
        # 분석 범위: 댐 중심 25km 반경
        center = ee.Geometry.Point([dam["lon"], dam["lat"]])
        basin = center.buffer(25000)

        # SRTM DEM (30m 해상도)
        dem = ee.Image("USGS/SRTMGL1_003").clip(basin)

        # 수몰 마스크: DEM 고도 < 만수위
        flood_mask = dem.lt(water_el).And(dem.gt(dam["elBase"]))

        # 벡터 변환 (GeoJSON)
        flood_vectors = flood_mask.selfMask().reduceToVectors(
            geometry=basin,
            scale=90,          # 90m 해상도 (속도 vs 정밀도)
            maxPixels=1e7,
            geometryType="polygon",
            eightConnected=False,
            labelProperty="flood",
        )

        # GeoJSON 변환
        geojson = flood_vectors.getInfo()

        # 수몰 면적 계산
        flood_area = flood_mask.multiply(
            ee.Image.pixelArea()
        ).reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=basin,
            scale=90,
            maxPixels=1e7
        ).getInfo()

        area_km2 = flood_area.get("elevation", 0) / 1e6

        return {
            "dam_id": req.dam_id,
            "water_level": water_el,
            "el_base": dam["elBase"],
            "flood_area_km2": round(area_km2, 2),
            "geojson": geojson
        }

    except Exception as e:
        raise HTTPException(500, f"GEE 분석 오류: {str(e)}")


@app.get("/dem-profile/{dam_id}")
def dem_profile(dam_id: str):
    """
    댐 위치 DEM 단면 데이터 반환
    Cesium 3D 단면도 표현용
    """
    if not gee_ready:
        raise HTTPException(503, "GEE 연결 안됨")

    if dam_id not in DAM_DATA:
        raise HTTPException(404, f"댐 ID '{dam_id}' 없음")

    dam = DAM_DATA[dam_id]

    try:
        center = ee.Geometry.Point([dam["lon"], dam["lat"]])

        # 댐 축선 방향으로 5km 단면
        dem = ee.Image("USGS/SRTMGL1_003")

        # 단면선 (동서 방향 5km)
        line = ee.Geometry.LineString([
            [dam["lon"] - 0.025, dam["lat"]],
            [dam["lon"] + 0.025, dam["lat"]]
        ])

        profile = dem.reduceRegion(
            reducer=ee.Reducer.toList(),
            geometry=line.buffer(30),
            scale=30,
            maxPixels=1e6
        ).getInfo()

        return {
            "dam_id": dam_id,
            "center": {"lat": dam["lat"], "lon": dam["lon"]},
            "el_base": dam["elBase"],
            "el_top": dam["elTop"],
            "profile": profile
        }

    except Exception as e:
        raise HTTPException(500, f"DEM 분석 오류: {str(e)}")
