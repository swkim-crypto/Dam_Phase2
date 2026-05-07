import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import MapView from './components/MapView.jsx'
import Header from './components/Header.jsx'
import { getCandidatesByPhase, CURRENT_PHASE } from './data/candidates.js'

export default function App() {
  // ── 차수 상태 추가 ─────────────────────────────
  const [phase, setPhase] = useState(CURRENT_PHASE)

  // 선택된 차수의 후보지 목록 (phase 데이터 flat 병합)
  const candidates = getCandidatesByPhase(phase)

  const [selected, setSelected] = useState(() => getCandidatesByPhase(CURRENT_PHASE)[2])
  const [heightM, setHeightM] = useState(60)

  // 차수 전환 시: 동일 id 후보가 있으면 유지, 없으면 첫 번째로
  const handlePhaseChange = (newPhase) => {
    setPhase(newPhase)
    const newCandidates = getCandidatesByPhase(newPhase)
    const sameId = newCandidates.find(c => c.id === selected?.id)
    setSelected(sameId ?? newCandidates[0])
    setHeightM(60)
  }

  const handleSelect = (c) => { setSelected(c); setHeightM(60) }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg-deep)' }}>
      <Header />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* phase / handlePhaseChange 추가 전달 */}
        <Sidebar
          candidates={candidates}
          selected={selected}
          onSelect={handleSelect}
          phase={phase}
          onPhaseChange={handlePhaseChange}
        />
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <MapView candidates={candidates} selected={selected} heightM={heightM} onSelect={handleSelect} />
        </div>
        <DetailPanel candidate={selected} heightM={heightM} onHeightChange={setHeightM} />
      </div>
    </div>
  )
}
