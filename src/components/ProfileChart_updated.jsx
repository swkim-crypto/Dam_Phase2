import React, { useState, useMemo } from 'react'
import { profiles } from '../data/profiles.js'
import { calcFsl } from '../data/candidates.js'

const W = 580, H = 260
const PAD = { top:22, right:24, bottom:42, left:58 }
const CW = W - PAD.left - PAD.right
const CH = H - PAD.top - PAD.bottom

const RANGE_STEPS = [10, 20, 30, 40, 50, 60, 70]  // km

export default function ProfileChart({ candidate, heightM }) {
  const [mode, setMode]         = useState('cross')
  const [rangeKm, setRangeKm]   = useState(50)       // 종단면 연장 (km)
  const fsl = calcFsl(candidate, heightM)

  const rawData = useMemo(() => {
    const p = profiles[candidate.id]
    return p ? p[mode] : []
  }, [candidate.id, mode])

  // 종단면: rangeKm까지만 잘라냄
  const data = useMemo(() => {
    if (mode !== 'long') return rawData
    const maxD = rangeKm * 1000
    return rawData.filter(p => p.d <= maxD)
  }, [rawData, mode, rangeKm])

  const C = useMemo(() => {
    if (!data.length) return null

    // 횡단면: d=0 중앙(댐축), d<0 상류, d>0 하류
    // 종단면: d=0 좌측(댐),  d>0 상류 (오른쪽으로 갈수록 상류)
    const dMin = mode === 'long' ? 0 : data[0].d
    const dMax = mode === 'long' ? rangeKm * 1000 : data[data.length - 1].d

    const elevs = data.map(p => p.elev)
    const tMin = Math.min(...elevs)
    const tMax = Math.max(...elevs)
    const range = tMax - tMin || 10

    const eMin = tMin - range * 0.04
    const eMax = Math.max(tMax, fsl) + range * 0.12

    const sx = d => PAD.left + ((d - dMin) / (dMax - dMin)) * CW
    const sy = e => PAD.top  + CH - ((e - eMin) / (eMax - eMin)) * CH

    // 지형 path
    const pts = data.filter(p => p.d >= dMin && p.d <= dMax)
    const pathTerrain = [
      `M${sx(dMin).toFixed(1)},${sy(eMin).toFixed(1)}`,
      ...pts.map(p => `L${sx(p.d).toFixed(1)},${sy(p.elev).toFixed(1)}`),
      `L${sx(dMax).toFixed(1)},${sy(eMin).toFixed(1)}`,
      'Z'
    ].join(' ')

    const wY = sy(fsl)

    // 수몰 path
    let waterPath = ''
    const buildWater = (filterFn) => {
      let seg = []
      const flush = () => {
        if (seg.length >= 2) {
          const top = seg.map(([x]) => `${x.toFixed(1)},${wY.toFixed(1)}`).join(' L')
          const bot = [...seg].reverse().map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')
          waterPath += `M${top} L${bot} Z `
        }
        seg = []
      }
      pts.forEach(p => {
        if (filterFn(p) && p.elev < fsl) seg.push([sx(p.d), sy(p.elev)])
        else flush()
      })
      flush()
    }
    if (mode === 'cross') buildWater(p => p.d <= 0)   // 상류만
    else                  buildWater(() => true)        // 전체

    // ── 횡단면: 역삼각형(▽) 댐 ──
    let damTriPath = null, damLength = null
    if (mode === 'cross') {
      const left  = [...pts].filter(p => p.d <= 0).reverse()
      const right = [...pts].filter(p => p.d >= 0)
      let lEdge = null, rEdge = null
      for (let i=0; i<left.length-1; i++) {
        const a=left[i], b=left[i+1]
        if (a.elev<=fsl && b.elev>fsl && b.elev!==a.elev) {
          lEdge = a.d + (fsl-a.elev)/(b.elev-a.elev)*(b.d-a.d); break
        }
      }
      for (let i=0; i<right.length-1; i++) {
        const a=right[i], b=right[i+1]
        if (a.elev<=fsl && b.elev>fsl && b.elev!==a.elev) {
          rEdge = a.d + (fsl-a.elev)/(b.elev-a.elev)*(b.d-a.d); break
        }
      }
      if (lEdge!==null && rEdge!==null) {
        damLength = Math.round(Math.abs(rEdge-lEdge))
        const lx=sx(lEdge), rx=sx(rEdge), cx=sx(0), bedY=sy(candidate.bed)
        if (Number.isFinite(lx)&&Number.isFinite(rx)&&Number.isFinite(bedY))
          damTriPath = `M${lx.toFixed(1)},${wY.toFixed(1)} L${rx.toFixed(1)},${wY.toFixed(1)} L${cx.toFixed(1)},${bedY.toFixed(1)} Z`
      }
    }

    // ── 종단면: 슬림 사다리꼴 댐 측면 (맨 왼쪽, d=0) ──
    let damSidePath = null
    if (mode === 'long') {
      const damX = sx(0)
      const topW=5, botW=14
      const topY2=sy(fsl), botY2=sy(candidate.bed)
      if (Number.isFinite(topY2)&&Number.isFinite(botY2))
        damSidePath = `M${(damX-topW).toFixed(1)},${topY2.toFixed(1)} L${(damX+topW).toFixed(1)},${topY2.toFixed(1)} L${(damX+botW).toFixed(1)},${botY2.toFixed(1)} L${(damX-botW).toFixed(1)},${botY2.toFixed(1)} Z`
    }

    // Y 눈금
    const rawStep = (eMax-eMin)/6
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep||1)))
    const yStep = Math.ceil(rawStep/mag)*mag
    const yTicks = []
    for (let v=Math.ceil(eMin/yStep)*yStep; v<=eMax; v+=yStep) yTicks.push(v)

    // X 눈금
    const xSpan = dMax - dMin
    const xStep = mode==='long'
      ? (rangeKm >= 50 ? 10000 : rangeKm >= 20 ? 5000 : 2000)
      : (xSpan>4000 ? 1000 : 500)
    const xTicks = []
    for (let v=Math.ceil(dMin/xStep)*xStep; v<=dMax; v+=xStep) xTicks.push(v)

    return { sx, sy, dMin, dMax, eMin, eMax, wY,
      pathTerrain, waterPath, damTriPath, damLength, damSidePath, yTicks, xTicks }
  }, [data, fsl, heightM, mode, candidate.bed, rangeKm])

  if (!data.length || !C) return null
  const { sx, sy, dMin, dMax, eMin, eMax, wY,
    pathTerrain, waterPath, damTriPath, damLength, damSidePath, yTicks, xTicks } = C
  const fslInRange = fsl >= eMin && fsl <= eMax

  const fmtX = d => {
    if (mode === 'long') {
      if (d === 0) return '댐'
      return `${(d/1000).toFixed(0)}km`
    }
    return d===0 ? '0' : `${d>0?'+':''}${(d/1000).toFixed(1)}km`
  }

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>

      {/* 탭 + 연장 버튼 */}
      <div style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center', flexWrap:'wrap' }}>
        {[
          { key:'cross', label:'횡단면 (댐 축)' },
          { key:'long',  label:'종단면 (강 방향)' },
        ].map(t => (
          <button key={t.key} onClick={()=>setMode(t.key)} style={{
            padding:'4px 12px', fontSize:12, fontFamily:'var(--font-mono)',
            background: mode===t.key?'var(--acc-teal)':'transparent',
            color:      mode===t.key?'var(--bg-deep)':'#a0bcd0',
            border:    `1px solid ${mode===t.key?'var(--acc-teal)':'rgba(255,255,255,0.15)'}`,
            borderRadius:4, cursor:'pointer', fontWeight: mode===t.key?700:400,
          }}>{t.label}</button>
        ))}
        <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--acc-teal)', marginLeft:4 }}>
          FSL {fsl}m EL
        </span>

        {/* 연장 버튼 (종단면일 때만) */}
        {mode === 'long' && <>
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:11, color:'#a0bcd0', fontFamily:'var(--font-mono)' }}>연장:</span>
          {RANGE_STEPS.map(km => (
            <button key={km} onClick={()=>setRangeKm(km)} style={{
              padding:'3px 7px', fontSize:11, fontFamily:'var(--font-mono)',
              background: rangeKm===km?'var(--acc-amber)':'transparent',
              color:      rangeKm===km?'var(--bg-deep)':'#a0bcd0',
              border:    `1px solid ${rangeKm===km?'var(--acc-amber)':'rgba(255,255,255,0.12)'}`,
              borderRadius:4, cursor:'pointer', fontWeight: rangeKm===km?700:400,
            }}>{km}km</button>
          ))}
        </>}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', display:'block' }}>
        <defs>
          <clipPath id="cc6">
            <rect x={PAD.left} y={PAD.top} width={CW} height={CH}/>
          </clipPath>
        </defs>
        <rect x={PAD.left} y={PAD.top} width={CW} height={CH} fill="rgba(0,0,0,0.3)" rx="3"/>

        {/* Y 그리드 */}
        {yTicks.map(v => {
          const y = sy(v)
          return <g key={v}>
            <line x1={PAD.left} y1={y} x2={PAD.left+CW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <text x={PAD.left-4} y={y+4} textAnchor="end" fontSize="10" fill="#7a9bb5" fontFamily="Space Mono">{v}</text>
          </g>
        })}

        {/* X 그리드 */}
        {xTicks.map(d => {
          const x = sx(d)
          return <g key={d}>
            <line x1={x} y1={PAD.top} x2={x} y2={PAD.top+CH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={x} y={PAD.top+CH+14} textAnchor="middle" fontSize="10"
              fill={d===0&&mode==='long'?'#f0a500':'#7a9bb5'} fontFamily="Space Mono"
              fontWeight={d===0&&mode==='long'?700:400}>
              {fmtX(d)}
            </text>
          </g>
        })}

        <g clipPath="url(#cc6)">
          {/* 수몰 */}
          {waterPath && <path d={waterPath} fill="rgba(30,120,255,0.48)" stroke="none"/>}
          {/* 수면 */}
          {fslInRange && <line x1={PAD.left} y1={wY} x2={PAD.left+CW} y2={wY} stroke="rgba(120,190,255,0.55)" strokeWidth="1"/>}
          {/* 지형 */}
          {pathTerrain && <path d={pathTerrain} fill="rgba(29,158,117,0.45)" stroke="#1d9e75" strokeWidth="1.5"/>}
          {/* FSL 점선 */}
          {fslInRange && <line x1={PAD.left} y1={wY} x2={PAD.left+CW} y2={wY} stroke="#1a7fbd" strokeWidth="1.5" strokeDasharray="6,3"/>}

          {/* 횡단면: 역삼각형 댐 */}
          {mode==='cross' && damTriPath &&
            <path d={damTriPath} fill="rgba(240,165,0,0.88)" stroke="#f0a500" strokeWidth="2"/>}
          {/* 횡단면: 방향 레이블 */}
          {mode==='cross' && <>
            <text x={PAD.left+8} y={PAD.top+15} fontSize="11" fill="#7a9bb5" fontFamily="Space Mono">← 상류</text>
            <text x={PAD.left+CW-8} y={PAD.top+15} textAnchor="end" fontSize="11" fill="#7a9bb5" fontFamily="Space Mono">하류 →</text>
          </>}

          {/* 종단면: 슬림 사다리꼴 댐 측면 (맨 왼쪽) */}
          {mode==='long' && damSidePath &&
            <path d={damSidePath} fill="rgba(240,165,0,0.90)" stroke="#f0a500" strokeWidth="2"/>}
        </g>

        {/* 댐 길이 배지 (횡단면) */}
        {mode==='cross' && damLength && Number.isFinite(damLength) && (
          <g>
            <rect x={PAD.left+CW-114} y={PAD.top+4} width={112} height={26}
              fill="rgba(0,196,180,0.18)" rx="4" stroke="var(--acc-teal)" strokeWidth="1"/>
            <text x={PAD.left+CW-58} y={PAD.top+13} textAnchor="middle" fontSize="9"
              fill="var(--acc-teal)" fontFamily="Space Mono">댐 길이</text>
            <text x={PAD.left+CW-58} y={PAD.top+25} textAnchor="middle" fontSize="12"
              fill="#fff" fontFamily="Space Mono" fontWeight="700">
              {damLength>=1000?`${(damLength/1000).toFixed(2)} km`:`${damLength} m`}
            </text>
          </g>
        )}

        {/* 종단면: 우측 하단에 전체 연장 크게 표시 */}
        {mode==='long' && (()=>{
          const bx = PAD.left+CW-8
          const by = PAD.top+CH-8
          return <>
            {/* 연장 치수선 (하단) */}
            <line x1={PAD.left+16} y1={PAD.top+CH+30} x2={PAD.left+CW} y2={PAD.top+CH+30}
              stroke="#f0e040" strokeWidth="2.5"/>
            <polygon points={`${PAD.left+16},${PAD.top+CH+30} ${PAD.left+24},${PAD.top+CH+26} ${PAD.left+24},${PAD.top+CH+34}`} fill="#f0e040"/>
            <polygon points={`${PAD.left+CW},${PAD.top+CH+30} ${PAD.left+CW-8},${PAD.top+CH+26} ${PAD.left+CW-8},${PAD.top+CH+34}`} fill="#f0e040"/>
            {/* 우측 하단 연장 숫자 */}
            <rect x={bx-90} y={by-32} width={92} height={34}
              fill="rgba(0,0,0,0.55)" rx="5"/>
            <text x={bx-44} y={by-18} textAnchor="middle" fontSize="11"
              fill="#f0e040" fontFamily="Space Mono">상류 연장</text>
            <text x={bx-44} y={by-2} textAnchor="middle" fontSize="20"
              fontWeight="700" fill="#f0e040" fontFamily="Space Mono">{rangeKm} km</text>
          </>
        })()}

        {/* Y축 라벨 */}
        <text x={PAD.left-44} y={PAD.top+CH/2} textAnchor="middle" fontSize="10" fill="#7a9bb5"
          fontFamily="Space Mono" transform={`rotate(-90,${PAD.left-44},${PAD.top+CH/2})`}>고도 (m EL)</text>
      </svg>

      {/* 범례 */}
      <div style={{ display:'flex', gap:14, marginTop:6, flexWrap:'wrap' }}>
        {[
          { color:'#1d9e75',              label:'지형',          box:false, dash:false },
          { color:'rgba(30,120,255,0.7)', label:'수몰 (상류)',   box:false, dash:false },
          { color:'#1a7fbd',              label:`FSL ${fsl}m`,   box:false, dash:true  },
          { color:'#f0a500',              label: mode==='cross'?'댐 (역삼각형)':'댐 측면도', box:true, dash:false },
        ].map(item => (
          <div key={item.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#a0bcd0', fontFamily:'var(--font-mono)' }}>
            {item.box
              ? <div style={{ width:10, height:13, background:item.color, borderRadius:1 }}/>
              : <div style={{ width:20, height:item.dash?0:3, background:item.color,
                  borderTop:item.dash?`2px dashed ${item.color}`:'none', marginTop:item.dash?2:0 }}/>
            }
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
