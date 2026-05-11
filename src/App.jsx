import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import MapView from './components/MapView.jsx'
import Header from './components/Header.jsx'
import { getCandidatesByPhase, CURRENT_PHASE } from './data/candidates.js'

export default function App() {
  const [phase, setPhase] = useState(CURRENT_PHASE)
  const candidates = getCandidatesByPhase(phase)

  const [selected, setSelected] = useState(() => getCandidatesByPhase(CURRENT_PHASE)[0])
  const [heightM, setHeightM] = useState(60)
  const [floodVisible, setFloodVisible] = useState(true)

  const handleFloodToggle = () => setFloodVisible(v => !v)
  const handleSelect = (c) => { setSelected(c); setHeightM(60); setFloodVisible(true) }

  const handlePhaseChange = (newPhase) => {
    setPhase(newPhase)
    const next = getCandidatesByPhase(newPhase)
    const same = next.find(c => c.id === selected?.id)
    setSelected(same ?? next[0])
    setHeightM(60)
  }


  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg-deep)' }}>
      <Header phase={phase} />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar
          candidates={candidates}
          selected={selected}
          onSelect={handleSelect}
          phase={phase}
          onPhaseChange={handlePhaseChange}
        />
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <MapView candidates={candidates} selected={selected} heightM={heightM} onSelect={handleSelect} floodVisible={floodVisible} />
        </div>
        <DetailPanel candidate={selected} heightM={heightM} onHeightChange={setHeightM} floodVisible={floodVisible} onFloodToggle={handleFloodToggle} />
      </div>
    </div>
  )
}
