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
  const steps = [40,60,80,100,120]
  return steps.reduce((a,b) => Math.abs(b-h) < Math.abs(a-h) ? b : a)
}

export default function MapView({ candidates, selected, heightM, onSelect, floodVisible }) {
  const cesiumContainer = useRef(null)
  const viewerRef = useRef(null)
  const entitiesRef = useRef({
    markers: [],
    damSymbol: null,
    floodPolygon: null
  })
  
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

      // 기본 카메라 위치 설정 (Nam Ngiep 유역)
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(103.45, 18.85, 50000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0.0
        }
      })

      // 마우스 클릭 이벤트
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position)
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.candidateData) {
          onSelect(pickedObject.id.candidateData)
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      viewerRef.current = viewer
    }

    initViewer()

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [onSelect])

  // 수몰 데이터 로딩
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

    // 기존 마커 제거
    entitiesRef.current.markers.forEach(entity => viewer.entities.remove(entity))
    entitiesRef.current.markers = []

    candidates.forEach(c => {
      const cfg = PRIORITY_CONFIG[c.priority]
      const isSel = selected?.id === c.id
      const v = isSel ? estimateVolume(c, heightM) : c.baseV
      const fsl = isSel ? calcFsl(c, heightM) : c.baseFsl
      const h = isSel ? heightM : c.baseH
      const sz = isSel ? 46 : 30

      // Cesium 엔티티 생성 - clampToGround로 지면에 붙임
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 0),
        billboard: {
          image: createMarkerCanvas(c.id, sz, cfg.color, isSel),
          width: sz,
          height: sz,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 🔥 지면에 붙임
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.0, 100000, 0.4)
        },
        candidateData: c // 클릭 이벤트용 데이터
      })

      entitiesRef.current.markers.push(entity)
    })
  }, [candidates, selected, heightM])

  // 댐 심볼 (역사다리꼴) 렌더링
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !selected) return

    // 기존 댐 심볼 제거
    if (entitiesRef.current.damSymbol) {
      viewer.entities.remove(entitiesRef.current.damSymbol)
      entitiesRef.current.damSymbol = null
    }

    const steps = [40,50,60,70,80,90,100,110,120]
    const nearest = steps.reduce((a,b) => Math.abs(b-heightM)<Math.abs(a-heightM)?b:a)
    const lenM = damLengths[selected.id]?.[String(nearest)] ?? 800
    const cfg = PRIORITY_CONFIG[selected.priority]

    // 댐 길이를 위도/경도로 변환 (동서 방향으로 표시)
    const halfLenDeg = (lenM / 2) / (111320 * Math.cos(selected.lat * Math.PI / 180))

    // 역사다리꼴 폴리곤 (위가 넓고 아래가 좁음)
    const topWidth = halfLenDeg
    const bottomWidth = halfLenDeg * 0.5
    const height = 0.0003 // 약간의 세로 크기

    const linePositions = Cesium.Cartesian3.fromDegreesArray([
      selected.lon - topWidth, selected.lat + height/2,
      selected.lon + topWidth, selected.lat + height/2,
      selected.lon + bottomWidth, selected.lat - height/2,
      selected.lon - bottomWidth, selected.lat - height/2,
      selected.lon - topWidth, selected.lat + height/2,
    ])

    const entity = viewer.entities.add({
      polyline: {
        positions: linePositions,
        width: 3,
        material: Cesium.Color.fromCssColorString(cfg.color).withAlpha(0.9),
        clampToGround: true,
      }
    })

    entitiesRef.current.damSymbol = entity
  }, [selected, heightM])

  // 수몰 폴리곤 렌더링
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !selected || !floodVisible || !floodPolygons) return

    // 기존 수몰 폴리곤 제거
    if (entitiesRef.current.floodPolygon) {
      viewer.dataSources.remove(entitiesRef.current.floodPolygon)
      entitiesRef.current.floodPolygon = null
    }

    const step = nearestStep(heightM)
    const polyData = floodPolygons[selected.id]?.[String(step)]
    if (!polyData) return

    try {
      // GeoJSON으로 직접 로드
      const geoJson = {
        type: 'Feature',
        geometry: polyData,
        properties: {}
      }

      Cesium.GeoJsonDataSource.load(geoJson, {
        fill: Cesium.Color.fromCssColorString('#1e78ff').withAlpha(0.35),
        stroke: Cesium.Color.fromCssColorString('#1a7fbd'),
        strokeWidth: 2,
        clampToGround: true,
      }).then(dataSource => {
        viewer.dataSources.add(dataSource)
        entitiesRef.current.floodPolygon = dataSource
      })

      entitiesRef.current.floodPolygon = entity
    } catch (e) {
      console.error('Flood polygon error:', e)
    }
  }, [selected, heightM, floodVisible, floodPolygons])

  // 선택된 후보지로 카메라 이동
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !selected) return

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selected.lon, selected.lat, 15000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      },
      duration: 2.0
    })
  }, [selected])

  const fslDisplay = selected ? calcFsl(selected, heightM) : null

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <div ref={cesiumContainer} style={{ width:'100%', height:'100%' }} />

      {/* 수몰 데이터 로딩 표시 */}
      {isLoadingFlood && (
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', background:'rgba(13,33,55,0.95)', border:'1px solid rgba(30,120,255,0.4)', borderRadius:12, padding:'20px 30px', zIndex:2000, backdropFilter:'blur(12px)' }}>
          <div style={{ fontSize:14, color:'#1e78ff', fontFamily:'var(--font-mono)', textAlign:'center' }}>
            수몰 데이터 로딩 중...
          </div>
        </div>
      )}

      {/* 수몰 정보 오버레이 */}
      {selected && (
        <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', background:'rgba(13,33,55,0.92)', border:'1px solid rgba(30,120,255,0.4)', borderRadius:8, padding:'6px 16px', zIndex:1000, backdropFilter:'blur(8px)', display:'flex', gap:16, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#a0bcd0', fontFamily:'var(--font-mono)' }}>수몰 영역</span>
          <span style={{ fontSize:13, fontWeight:700, color:'#1e78ff', fontFamily:'var(--font-mono)' }}>H = {heightM}m</span>
          <span style={{ fontSize:12, color:'#a0bcd0', fontFamily:'var(--font-mono)' }}>
            {fslDisplay != null ? `FSL ${fslDisplay}m EL` : '소유역 분석 후 FSL 확정'}
          </span>
        </div>
      )}

      {/* 범례 */}
      <div style={{ position:'absolute', bottom:24, left:16, background:'rgba(13,33,55,0.92)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', zIndex:1000, backdropFilter:'blur(8px)' }}>
        <div style={{ fontSize:10, color:'#5a7a90', fontFamily:'var(--font-mono)', letterSpacing:'0.12em', marginBottom:8 }}>범례</div>
        {[{color:'#1D9E75',label:'최우선'},{color:'#1A7FBD',label:'2순위'},{color:'#BA7517',label:'검토필요'}].map(i=>(
          <div key={i.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:12 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:i.color, boxShadow:`0 0 6px ${i.color}88` }}/>
            <span style={{ color:'#c0d4e0', fontFamily:'var(--font-mono)' }}>{i.label}</span>
          </div>
        ))}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:6, paddingTop:6, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:18, height:10, background:'rgba(30,120,255,0.35)', border:'1.5px solid #1a7fbd', borderRadius:2 }}/>
          <span style={{ fontSize:11, color:'#c0d4e0', fontFamily:'var(--font-mono)' }}>수몰 예상 구역</span>
        </div>
        {/* 댐 심볼 범례 */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:6, paddingTop:6, display:'flex', alignItems:'center', gap:8 }}>
          <svg width="22" height="12" viewBox="0 0 22 12">
            <polygon points="0,0 22,0 16,12 6,12" fill="rgba(240,165,0,0.5)" stroke="#f0a500" strokeWidth="1.5"/>
            <line x1="0" y1="1" x2="22" y2="1" stroke="#ffffff" strokeWidth="1.5" opacity="0.9"/>
          </svg>
          <span style={{ fontSize:11, color:'#c0d4e0', fontFamily:'var(--font-mono)' }}>댐 위치</span>
        </div>
      </div>

      {/* 3D 뷰 컨트롤 안내 */}
      <div style={{ position:'absolute', bottom:24, right:16, background:'rgba(13,33,55,0.92)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 12px', zIndex:1000, backdropFilter:'blur(8px)' }}>
        <div style={{ fontSize:10, color:'#5a7a90', fontFamily:'var(--font-mono)', marginBottom:4 }}>3D 뷰 컨트롤</div>
        <div style={{ fontSize:11, color:'#c0d4e0', fontFamily:'var(--font-mono)' }}>🖱️ 좌클릭+드래그: 회전</div>
        <div style={{ fontSize:11, color:'#c0d4e0', fontFamily:'var(--font-mono)' }}>🖱️ 우클릭+드래그: 이동</div>
        <div style={{ fontSize:11, color:'#c0d4e0', fontFamily:'var(--font-mono)' }}>⚙️ 휠: 줌</div>
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

  // 원형 배경
  ctx.beginPath()
  ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI)
  ctx.fillStyle = isSelected ? color : color + '99'
  ctx.fill()
  ctx.strokeStyle = isSelected ? '#fff' : color
  ctx.lineWidth = isSelected ? 3 : 2
  ctx.stroke()

  // 텍스트
  ctx.fillStyle = isSelected ? '#0a1628' : '#fff'
  ctx.font = `700 ${isSelected ? 12 : 9}px "Space Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(id, size/2, size/2)

  return canvas
}
