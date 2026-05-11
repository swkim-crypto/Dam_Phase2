import React from 'react'
import { PRIORITY_CONFIG, PHASES } from '../data/candidates.js'

const REGION_ORDER  = ['Middle Basin','Upper Basin','Lower Valley','Xieng Khouang Highland']
const REGION_LABELS = {
  'Middle Basin':           '중부 유역',
  'Upper Basin':            '상류 유역',
  'Lower Valley':           '하류 계곡',
  'Xieng Khouang Highland': '시엥쿠앙 고원',
}
const PHASE_COLOR = { 1:'#BA7517', 2:'#1D9E75', 3:'#1A7FBD' }

export default function Sidebar({ candidates, selected, onSelect, phase, onPhaseChange }) {
  const grouped = REGION_ORDER.reduce((acc, r) => {
    acc[r] = candidates.filter(c => c.region === r)
    return acc
  }, {})

  const meta  = PHASES[phase]
  const color = PHASE_COLOR[phase]

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

      {/* 차수 탭 */}
      <div style={{ display:'flex', padding:'10px 12px 0', gap:4, flexShrink:0 }}>
        {[1,2,3].map(p => {
          const isActive = p === phase
          const pc = PHASE_COLOR[p]
          return (
            <button key={p} onClick={() => onPhaseChange(p)}
              title={`${PHASES[p].label} · ${PHASES[p].date}\n${PHASES[p].method}`}
              style={{
                flex:1, padding:'6px 0', fontSize:12, fontWeight:700,
                fontFamily:'var(--font-mono)', cursor:'pointer',
                border:`1px solid ${isActive ? pc : 'var(--border)'}`,
                borderBottom:'none', borderRadius:'4px 4px 0 0',
                background: isActive ? `${pc}18` : 'transparent',
                color: isActive ? pc : 'var(--text-sec)',
                boxShadow: isActive ? `inset 0 2px 0 ${pc}` : 'none',
                transition:'all 0.15s',
              }}>
              {PHASES[p].label}
            </button>
          )
        })}
      </div>

      {/* 차수 메타 */}
      <div style={{ padding:'8px 14px 10px', borderBottom:'1px solid var(--border)', background:`${color}0d`, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:10, color:'var(--text-sec)', fontFamily:'var(--font-mono)' }}>{meta.date}</span>
          <span style={{ fontSize:9, padding:'1px 6px', border:`1px solid ${color}`, borderRadius:3, color, fontFamily:'var(--font-mono)', background:`${color}18` }}>
            {meta.demSource ?? 'SRTM GL1 30m'}
          </span>
        </div>
        <div style={{ fontSize:10, color:'var(--text-sec)', fontFamily:'var(--font-mono)', marginBottom:3, lineHeight:1.4 }}>
          {meta.method}
        </div>
        <div style={{ fontSize:10, color, fontFamily:'var(--font-mono)', fontWeight:700 }}>
          기준: {meta.criterion}
        </div>
        {meta.note && (
          <div style={{ fontSize:9, color:'var(--text-sec)', marginTop:4, lineHeight:1.5, opacity:0.8 }}>
            {meta.note}
          </div>
        )}
      </div>

      {/* 후보지 목록 헤더 */}
      <div style={{ padding:'8px 18px 6px', flexShrink:0, borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-sec)', letterSpacing:'0.1em', textTransform:'uppercase' }}>후보지 목록</div>
        <div style={{ fontSize:11, color:'var(--text-pri)', opacity:0.6, marginTop:2 }}>총 {candidates.length}개 · 클릭하여 선택</div>
      </div>

      {/* 후보지 리스트 */}
      <div style={{ overflow:'auto', flex:1 }}>
        {REGION_ORDER.map(region => {
          const items = grouped[region]
          if (!items?.length) return null
          return (
            <div key={region}>
              <div style={{ padding:'10px 18px 5px', fontSize:10, color:'var(--text-sec)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em', textTransform:'uppercase', borderTop:'1px solid var(--border)' }}>
                {REGION_LABELS[region]}
              </div>
              {items.map(c => {
                const cfg   = PRIORITY_CONFIG[c.priority]
                const isSel = selected?.id === c.id
                return (
                  <div key={c.id} onClick={() => onSelect(c)} style={{ padding:'11px 16px', cursor:'pointer', background: isSel ? 'var(--bg-hover)' : 'transparent', borderLeft: isSel ? `3px solid ${cfg.color}` : '3px solid transparent', transition:'all 0.15s', display:'flex', flexDirection:'column', gap:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color: isSel ? cfg.color : 'var(--text-pri)' }}>{c.id}</span>
                      <span style={{ fontSize:10, padding:'2px 8px', background:`${cfg.color}22`, color:cfg.color, border:`1px solid ${cfg.color}66`, borderRadius:10, fontFamily:'var(--font-mono)', fontWeight:700 }}>{c.priority}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-pri)', fontFamily:'var(--font-mono)', opacity:0.75 }}>
                      {c.bed != null ? `Bed ${c.bed}m · ` : ''}V {(c.baseV ?? c.storage_H50 ?? 0).toLocaleString()} Mm³
                    </div>
                    <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color: c.hMin5 <= 60 ? '#1D9E75' : c.hMin5 <= 90 ? '#BA7517' : '#E05C5C' }}>
                      5Mm³: H≥{c.hMin5}m {c.hMin5 <= 60 ? '✓' : c.hMin5 <= 90 ? '△' : '⚠'}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
