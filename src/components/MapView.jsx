import React, { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { PRIORITY_CONFIG, estimateVolume, calcFsl } from '../data/candidates.js'
import { damLengths } from '../data/damLengths.js'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// Cesium 기본 설정
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4Mjk5MGFiMi1kNmQ4LTQ4MjQtOWQ0MC0yMjQxYTA4ZDk1MDciLCJpZCI6MjU4NTY1LCJzdWIiOiJLaW0gU2VvbmcgV29vayIsImlzcyI6Imh0dHBzOi8vaW9uLmNlc2l1bS5jb20iLCJhdWQiOiJLaW0gU2VvbmcgV29va19kZWZhdWx0IiwiaWF0IjoxNzc4NjU2NzE4fQ.Drc4962t4zSjH1BnBDF1wLK5RrangCBnPVpCPmB8a2Q'

// 동적 로딩: 필요할 때만 floodPolygons 로드
let floodPolygonsCache = null

async function loadFloodPolygons() {
  if (floodPolygonsCache) return floodPolygonsCache
  try {
    const module = await import('../data/floodPolygons.js')
    floodPolygonsCache = module.floodPolygons
    console.log('✅ Flood polygons loaded')
    return floodPolygonsCache
  } catch (err) {
    console.error('❌ Failed to load flood polygons:', err)
    return null
  }
}

function nearestStep(h) {
  const steps = [40, 60, 80, 100, 120]
  return steps.reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a)
}

/**
 * MultiPolygon / Polygon GeoJSON geometry → clampToGround 폴리라인만 (채움 없음)
 * polygon fill은 terrain clamp와 충돌하므로 제거
 */
function addFloodPolylines(viewer, geometry, color) {
  const entities = []
  const strokeColor = Cesium.Color.fromCssColorString(color)

  function ringToPositions(ring) {
    const flat = []
    ring.forEach(([lon, lat]) => flat.push(lon, lat))
    return Cesium.Cartesian3.fromDegreesArray(flat)
  }

  function addRings(rings) {
    rings.forEach(ring => {
      const positions = ringToPositions(ring)
      entities.push(
        viewer.entities.add({
          polyline: {
            positions,
            width: 2.5,
            material: strokeColor.withAlpha(0.9),
            clampToGround: true,
          }
        })
      )
    })
  }

  if (geometry.type === 'Polygon') {
    addRings(geometry.coordinates)
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(polygonCoords => addRings(polygonCoords))
  }

  return entities
}

export default function MapView({ candidates, selected, heightM, onSelect, floodVisible }) {
  const cesiumContainer = useRef(null)
  const viewerRef = useRef(null)
  const entitiesRef = useRef({
    markers: [],
    damSymbol: null,
    floodEntities: [],
  })

  const [viewerReady, setViewerReady] = useState(false)
  const [floodPolygons, setFloodPolygons] = useState(null)
  const [isLoadingFlood, setIsLoadingFlood] = useState(false)

  // Cesium Viewer 초기화
  useEffect(() => {
    if (viewerRef.current || !cesiumContainer.current) return

    async function initViewer() {
      const terrainProvider = await Cesium.createWorldTerrainAsync()
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        terrainProvider,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        shadows: false,
        shouldAnimate: false,
      })

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(103.45, 18.85, 50000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      })

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position)
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.candidateData) {
          onSelect(pickedObject.id.candidateData)
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      viewerRef.current = viewer
      setViewerReady(true)  // ← viewer 준비 완료 신호
    }

    initViewer()

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
        setViewerReady(false)
      }
    }
  }, [onSelect])

  // 수몰 데이터 로딩 (floodVisible이 켜질 때만)
  useEffect(() => {
    if (!floodVisible || floodPolygons) return

    setIsLoadingFlood(true)
    loadFloodPolygons().then(data => {
      setFloodPolygons(data)
      setIsLoadingFlood(false)
    })
  }, [floodVisible, floodPolygons])

  // 댐 마커 렌더링
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !candidates || candidates.length === 0) return

    entitiesRef.current.markers.forEach(entity => viewer.entities.remove(entity))
    entitiesRef.current.markers = []

    candidates.forEach(c => {
      const cfg = PRIORITY_CONFIG[c.priority]
      const isSel = selected?.id === c.id
      const sz = isSel ? 46 : 30

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 0),
        billboard: {
          image: createMarkerCanvas(c.id, sz, cfg.color, isSel),
          width: sz,
          height: sz,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 100000, 0.4)
        },
        candidateData: c
      })

      entitiesRef.current.markers.push(entity)
    })
  }, [viewerReady, candidates, selected, heightM])

  // 댐 심볼: 역사다리꼴 채움 폴리곤 + 상단 흰 크레스트 라인
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !selected) return

    // 기존 심볼 제거 (배열로 관리)
    if (entitiesRef.current.damSymbol) {
      entitiesRef.current.damSymbol.forEach(e => viewer.entities.remove(e))
      entitiesRef.current.damSymbol = null
    }

    const steps = [40, 50, 60, 70, 80, 90, 100, 110, 120]
    const nearest = steps.reduce((a, b) => Math.abs(b - heightM) < Math.abs(a - heightM) ? b : a)
    const lenM = damLengths[selected.id]?.[String(nearest)] ?? 800
    const cfg = PRIORITY_CONFIG[selected.priority]
    const damColor = Cesium.Color.fromCssColorString(cfg.color)

    const halfLenDeg = (lenM / 2) / (111320 * Math.cos(selected.lat * Math.PI / 180))
    const topW = halfLenDeg        // 상단(크레스트) 반폭
    const botW = halfLenDeg * 0.4  // 하단(기저) 반폭
    const h = 0.00035              // 남북 방향 두께 (약 40m)

    // 역사다리꼴: 위가 넓고(크레스트) 아래가 좁음(기초)
    const trapPositions = Cesium.Cartesian3.fromDegreesArray([
      selected.lon - topW, selected.lat + h,   // 좌상
      selected.lon + topW, selected.lat + h,   // 우상
      selected.lon + botW, selected.lat - h,   // 우하
      selected.lon - botW, selected.lat - h,   // 좌하
    ])

    // 채움 폴리곤
    const fillEntity = viewer.entities.add({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(trapPositions),
        material: damColor.withAlpha(0.65),
        perPositionHeight: false,
        height: 0,
        classificationType: Cesium.ClassificationType.TERRAIN,
      }
    })

    // 크레스트(상단) 흰 선
    const crestEntity = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          selected.lon - topW, selected.lat + h,
          selected.lon + topW, selected.lat + h,
        ]),
        width: 3,
        material: Cesium.Color.WHITE.withAlpha(0.95),
        clampToGround: true,
      }
    })

    entitiesRef.current.damSymbol = [fillEntity, crestEntity]
  }, [viewerReady, selected, heightM])

  // 수몰 폴리라인 렌더링
  useEffect(() => {
    const viewer = viewerRef.current

    // 기존 수몰 엔티티 제거
    entitiesRef.current.floodEntities.forEach(e => viewer && viewer.entities.remove(e))
    entitiesRef.current.floodEntities = []

    if (!viewer || !selected || !floodVisible || !floodPolygons) return

    const step = nearestStep(heightM)
    const geometry = floodPolygons[selected.id]?.[String(step)]
    if (!geometry) {
      console.log(`수몰 데이터 없음: ${selected.id} / step ${step}`)
      return
    }

    try {
      const newEntities = addFloodPolylines(viewer, geometry, '#1e78ff')
      entitiesRef.current.floodEntities = newEntities
      console.log(`✅ 수몰 렌더링: ${selected.id} / H${step}m → ${newEntities.length}개 엔티티`)
    } catch (e) {
      console.error('Flood polyline error:', e)
    }
  }, [viewerReady, selected, heightM, floodVisible, floodPolygons])

  // 선택된 후보지로 카메라 이동 — 심볼 남쪽 뒤에서 바라봄
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !selected) return

    // 댐은 동서 방향으로 놓임 → 남쪽(위도 -0.02°, 약 2.2km 뒤)에서
    // 북쪽을 향해 비스듬히 내려다보면 심볼이 앞에 잘 보임
    const offsetLat = -0.025   // 남쪽으로 약 2.8km 뒤
    const alt = 5000           // 고도 5km

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        selected.lon,
        selected.lat + offsetLat,
        alt
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),    // 정북 방향
        pitch: Cesium.Math.toRadians(-25),    // 완만하게 내려다봄
        roll: 0.0
      },
      duration: 2.0
    })
  }, [viewerReady, selected])

  const fslDisplay = selected ? calcFsl(selected, heightM) : null

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />

      {/* 수몰 데이터 로딩 표시 */}
      {isLoadingFlood && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(13,33,55,0.95)', border: '1px solid rgba(30,120,255,0.4)', borderRadius: 12, padding: '20px 30px', zIndex: 2000, backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 14, color: '#1e78ff', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
            수몰 데이터 로딩 중...
          </div>
        </div>
      )}

      {/* 수몰 정보 오버레이 */}
      {selected && (
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,33,55,0.92)', border: '1px solid rgba(30,120,255,0.4)', borderRadius: 8, padding: '6px 16px', zIndex: 1000, backdropFilter: 'blur(8px)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#a0bcd0', fontFamily: 'var(--font-mono)' }}>수몰 영역</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e78ff', fontFamily: 'var(--font-mono)' }}>H = {heightM}m</span>
          <span style={{ fontSize: 12, color: '#a0bcd0', fontFamily: 'var(--font-mono)' }}>
            {fslDisplay != null ? `FSL ${fslDisplay}m EL` : '소유역 분석 후 FSL 확정'}
          </span>
        </div>
      )}

      {/* 범례 */}
      <div style={{ position: 'absolute', bottom: 24, left: 16, background: 'rgba(13,33,55,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
        <div style={{ fontSize: 10, color: '#5a7a90', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', marginBottom: 8 }}>범례</div>
        {[{ color: '#1D9E75', label: '최우선' }, { color: '#1A7FBD', label: '2순위' }, { color: '#BA7517', label: '검토필요' }].map(i => (
          <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: i.color, boxShadow: `0 0 6px ${i.color}88` }} />
            <span style={{ color: '#c0d4e0', fontFamily: 'var(--font-mono)' }}>{i.label}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 10, background: 'rgba(30,120,255,0.3)', border: '1.5px solid #1a7fbd', borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: '#c0d4e0', fontFamily: 'var(--font-mono)' }}>수몰 예상 구역</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6, paddingTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="12" viewBox="0 0 22 12">
            <polygon points="0,0 22,0 16,12 6,12" fill="rgba(240,165,0,0.5)" stroke="#f0a500" strokeWidth="1.5" />
            <line x1="0" y1="1" x2="22" y2="1" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
          </svg>
          <span style={{ fontSize: 11, color: '#c0d4e0', fontFamily: 'var(--font-mono)' }}>댐 위치</span>
        </div>
      </div>

      {/* 3D 뷰 컨트롤 안내 */}
      <div style={{ position: 'absolute', bottom: 24, right: 16, background: 'rgba(13,33,55,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
        <div style={{ fontSize: 10, color: '#5a7a90', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>3D 뷰 컨트롤</div>
        <div style={{ fontSize: 11, color: '#c0d4e0', fontFamily: 'var(--font-mono)' }}>🖱️ 좌클릭+드래그: 회전</div>
        <div style={{ fontSize: 11, color: '#c0d4e0', fontFamily: 'var(--font-mono)' }}>🖱️ 우클릭+드래그: 이동</div>
        <div style={{ fontSize: 11, color: '#c0d4e0', fontFamily: 'var(--font-mono)' }}>⚙️ 휠: 줌</div>
      </div>
    </div>
  )
}

// 마커 캔버스 생성 함수
function createMarkerCanvas(id, size, color, isSelected) {
  const canvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
  ctx.fillStyle = isSelected ? color : color + '99'
  ctx.fill()
  ctx.strokeStyle = isSelected ? '#fff' : color
  ctx.lineWidth = isSelected ? 3 : 2
  ctx.stroke()

  ctx.fillStyle = isSelected ? '#0a1628' : '#fff'
  ctx.font = `700 ${isSelected ? 12 : 9}px "Space Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(id, size / 2, size / 2)

  return canvas
}
