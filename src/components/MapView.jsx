import React, { useEffect, useRef } from 'react'
import { PRIORITY_CONFIG, estimateVolume, calcFsl } from '../data/candidates.js'
import { floodPolygons } from '../data/floodPolygons.js'

// 가장 가까운 높이 단계 찾기
function nearestStep(h) {
  const steps = [40,50,60,70,80,90,100,110,120]
  return steps.reduce((a,b) => Math.abs(b-h) < Math.abs(a-h) ? b : a)
}

export default function MapView({ candidates, selected, heightM, onSelect }) {
  const mapRef      = useRef(null)
  const leafletMap  = useRef(null)
  const markers     = useRef({})
  const floodLayer  = useRef(null)

  // 지도 초기화
  useEffect(() => {
    if (leafletMap.current || !window.L) return
    const map = window.L.map(mapRef.current, {
      center:[18.9, 103.35], zoom:9, zoomControl:true, attributionControl:true
    })
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:18, attribution:'© OpenStreetMap | SRTM GL1'
    }).addTo(map)
    leafletMap.current = map
  }, [])

  // 수몰 폴리곤 업데이트
  useEffect(() => {
    const L = window.L, map = leafletMap.current
    if (!L || !map || !selected) return

    if (floodLayer.current) { floodLayer.current.remove(); floodLayer.current = null }

    const step = nearestStep(heightM)
    const polyData = floodPolygons[selected.id]?.[String(step)]
    if (!polyData) return

    try {
      // pane 'overlayPane'(400) 아래 별도 pane 사용 → 마커(600)보다 아래
      if (!map.getPane('floodPane')) {
        map.createPane('floodPane')
        map.getPane('floodPane').style.zIndex = 350
      }
      const layer = L.geoJSON({ type:'Feature', geometry: polyData }, {
        pane: 'floodPane',
        style: {
          color: '#1a7fbd', weight: 1.5, opacity: 0.85,
          fillColor: '#1e78ff', fillOpacity: 0.30,
        }
      }).addTo(map)
      floodLayer.current = layer
    } catch(e) { console.error('Flood polygon error:', e) }
  }, [selected, heightM])

  // 마커 업데이트
  useEffect(() => {
    const L = window.L, map = leafletMap.current
    if (!L || !map) return
    Object.values(markers.current).forEach(m => m.remove())
    markers.current = {}

    candidates.forEach(c => {
      const cfg   = PRIORITY_CONFIG[c.priority]
      const isSel = selected?.id === c.id
      const v     = isSel ? estimateVolume(c, heightM) : c.baseV
      const fsl   = isSel ? calcFsl(c, heightM) : c.baseFsl
      const h     = isSel ? heightM : c.baseH
      const sz    = isSel ? 46 : 30

      const icon = L.divIcon({
        className:'',
        iconSize:[sz,sz], iconAnchor:[sz/2,sz/2],
        html:`<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${cfg.color}${isSel?'':'99'};border:${isSel?3:2}px solid ${isSel?'#fff':cfg.color};display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:${isSel?12:9}px;font-weight:700;color:${isSel?'#0a1628':'#fff'};box-shadow:0 0 ${isSel?18:6}px ${cfg.color}99;cursor:pointer;z-index:${isSel?1000:100};">${c.id}</div>`,
      })

      const tip = `<div style="font-family:'Space Mono',monospace;font-size:12px;line-height:1.9;background:#0d2137;border:1px solid ${cfg.color}55;color:#e8eef4;padding:8px 12px;border-radius:8px;min-width:160px;">
        <b style="color:${cfg.color};font-size:14px;">${c.id}</b> <span style="color:#a0bcd0">${c.priority}</span><br/>
        Bed: ${c.bed} m EL<br/>H: ${h} m<br/>FSL: ${fsl} m EL<br/>
        V: <b style="color:#00c4b4;">${v.toLocaleString()} Mm³</b></div>`

      const marker = L.marker([c.lat, c.lon], { icon, zIndexOffset: isSel ? 1000 : 0 })
        .addTo(map)
        .bindTooltip(tip, { permanent:false, direction:'top', offset:[0,-sz/2-4], opacity:1, className:'dam-tip' })
        .on('click', () => onSelect(c))
      markers.current[c.id] = marker
    })
  }, [candidates, selected, heightM, onSelect])

  // 선택 시 지도 이동
  useEffect(() => {
    const map = leafletMap.current
    if (!map || !selected) return
    map.setView([selected.lat, selected.lon], Math.max(map.getZoom(), 10), { animate:true })
  }, [selected])

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

      {/* 수몰 정보 오버레이 */}
      {selected && (
        <div style={{
          position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
          background:'rgba(13,33,55,0.92)', border:'1px solid rgba(30,120,255,0.4)',
          borderRadius:8, padding:'6px 16px', zIndex:1000,
          backdropFilter:'blur(8px)', display:'flex', gap:16, alignItems:'center',
        }}>
          <span style={{ fontSize:12, color:'#a0bcd0', fontFamily:'var(--font-mono)' }}>
            수몰 영역
          </span>
          <span style={{ fontSize:13, fontWeight:700, color:'#1e78ff', fontFamily:'var(--font-mono)' }}>
            H = {heightM}m
          </span>
          <span style={{ fontSize:12, color:'#a0bcd0', fontFamily:'var(--font-mono)' }}>
            FSL {calcFsl(selected, heightM)}m EL
          </span>
        </div>
      )}

      {/* 범례 */}
      <div style={{
        position:'absolute', bottom:24, left:16,
        background:'rgba(13,33,55,0.92)', border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:10, padding:'10px 14px', zIndex:1000, backdropFilter:'blur(8px)',
      }}>
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
      </div>

      <style>{`.dam-tip.leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;}`}</style>
    </div>
  )
}
