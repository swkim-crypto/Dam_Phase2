import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import MapView from './components/MapView.jsx'
import Header from './components/Header.jsx'
import { candidates } from './data/candidates.js'

export default function App() {
  const [selected, setSelected] = useState(candidates[2])
  const [heightM, setHeightM] = useState(60)

  const handleSelect = (c) => { setSelected(c); setHeightM(60) }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg-deep)' }}>
      <Header />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar candidates={candidates} selected={selected} onSelect={handleSelect} />
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          <MapView candidates={candidates} selected={selected} heightM={heightM} onSelect={handleSelect} />
        </div>
        <DetailPanel candidate={selected} heightM={heightM} onHeightChange={setHeightM} />
      </div>
    </div>
  )
}
