import React from 'react'

const PRIORITY_CONFIG = {
  '최우선':  { color: '#1D9E75', bg: '#E1F5EE' },
  '2순위':   { color: '#1A7FBD', bg: '#E6F1FB' },
  '검토필요':{ color: '#BA7517', bg: '#FAEEDA' },
}

export default function Sidebar({ candidates, selected, onSelect }) {
  return (
    <div style={{ width:250, background:'var(--bg-panel)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>

      {/* 프로젝트 타이틀 */}
      <div style={{ padding:'12px 18px 10px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text-sec)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>
          NAM NGIEP BASIN
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-pri)', fontFamily:'var(--font-mono)' }}>
          댐 후보지 분석 시스템
        </div>
      </div>

      {/* 분석 정보 */}
      <div style={{ padding:'8px 14px 10px', borderBottom:'1px solid var(--border)', background:'rgba(0,196,180,0.05)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:10, color:'var(--text-sec)', fontFamily:'var(--font-mono)' }}>2026-05</span>
          <span style={{ fontSize:9, padding:'1px 6px', border:'1px solid var(--acc-teal)', borderRadius:3, color:'var(--acc-teal)', fontFamily:'var(--font-mono)', background:'rgba(0,196,180,0.15)' }}>
            SRTM GL1 30m
          </span>
        </div>
        <div style={{ fontSize:10, color:'var(--text-sec)', fontFamily:'var(--font-mono)', marginBottom:3, lineHeight:1.4 }}>
          SRTM DEM + Flood-fill Analysis
        </div>
        <div style={{ fontSize:10, color:'var(--acc-teal)', fontFamily:'var(--font-mono)', fontWeight:700 }}>
          총 {candidates.length}개 후보지
        </div>
      </div>

      {/* 후보지 목록 헤더 */}
      <div style={{ padding:'8px 18px 6px', flexShrink:0, borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-sec)', letterSpacing:'0.1em', textTransform:'uppercase' }}>후보지 목록</div>
        <div style={{ fontSize:11, color:'var(--text-pri)', opacity:0.6, marginTop:2 }}>클릭하여 선택</div>
      </div>

      {/* 후보지 리스트 */}
      <div style={{ overflow:'auto', flex:1 }}>
        {candidates.map(c => {
          const cfg   = PRIORITY_CONFIG[c.priority]
          const isSel = selected?.id === c.id
          return (
            <div key={c.id} onClick={() => onSelect(c)} style={{ 
              padding:'11px 16px', cursor:'pointer', 
              background: isSel ? 'var(--bg-hover)' : 'transparent', 
              borderLeft: isSel ? `3px solid ${cfg.color}` : '3px solid transparent', 
              transition:'all 0.15s', display:'flex', flexDirection:'column', gap:5,
              borderBottom:'1px solid rgba(255,255,255,0.03)'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color: isSel ? cfg.color : 'var(--text-pri)' }}>{c.id}</span>
                <span style={{ fontSize:10, padding:'2px 8px', background:`${cfg.color}22`, color:cfg.color, border:`1px solid ${cfg.color}66`, borderRadius:10, fontFamily:'var(--font-mono)', fontWeight:700 }}>{c.priority}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text-pri)', fontFamily:'var(--font-mono)', opacity:0.75 }}>
                Bed {c.bed}m · V {c.baseV.toLocaleString()} Mm³
              </div>
              <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'#8aafc8' }}>
                Stream Order {c.streamOrder} · {c.drainageArea.toFixed(1)} km²
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
