import React from 'react'

const ANALYSIS_INFO = {
  basin: {
    id: 'NAM_NGIEP',
    name: 'Nam Ngiep',
    namKo: '남니옙',
    country: 'Laos',
  },
  method: 'SRTM DEM + Flood-fill Analysis',
  demSource: 'SRTM GL1 30m',
  analysisDate: '2026-05',
  totalCandidates: 55,
}

export default function Header() {
  return (
    <div style={{ height:52, background:'var(--bg-panel)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 20px', gap:16, flexShrink:0, zIndex:100 }}>
      <div style={{ width:3, height:24, background:'var(--acc-teal)', borderRadius:2, flexShrink:0 }} />
      <div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--acc-teal)', letterSpacing:'0.08em' }}>
          {ANALYSIS_INFO.basin.id}
        </div>
        <div style={{ fontSize:11, color:'var(--text-sec)', marginTop:1, fontFamily:'var(--font-mono)' }}>
          {ANALYSIS_INFO.basin.namKo} 유역 · 댐 후보지 분석 시스템
        </div>
      </div>
      <div style={{ flex:1 }} />
      {[
        { label:'DEM',   value: ANALYSIS_INFO.demSource },
        { label:'후보지', value: `${ANALYSIS_INFO.totalCandidates}개` },
        { label:'분석일', value: ANALYSIS_INFO.analysisDate },
      ].map(item => (
        <div key={item.label} style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', padding:'4px 12px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:6 }}>
          <div style={{ fontSize:9, color:'var(--text-dim)', fontFamily:'var(--font-mono)', letterSpacing:'0.1em' }}>{item.label}</div>
          <div style={{ fontSize:12, color:'var(--text-pri)', fontFamily:'var(--font-mono)', fontWeight:700 }}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}
