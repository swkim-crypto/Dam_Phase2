// Nam Ngiep Basin — 댐 후보지
// ──────────────────────────────────────────────────
// Phase 1 (2026-04): SRTM GL1 + flood-fill, S1~S9
// Phase 2 (2026-05): HydroRIVERS + 유향 적용, C1~C5
// Phase 3~: 소유역 완성 후 정밀 분석 예정
// ──────────────────────────────────────────────────

export const PHASES = {
  1: {
    label:     '1차',
    date:      '2026-04',
    method:    'SRTM GL1 + flood-fill',
    criterion: '상류 저수량 ≥ 5Mm³',
    demSource: 'SRTM GL1 30m',
    note:      '초기 분석. 강 중심선 재생성, 등고선 마스킹으로 범람역 제한',
  },
  2: {
    label:     '2차',
    date:      '2026-05',
    method:    'HydroRIVERS + 유향(NEXT_DOWN) 적용',
    criterion: '저수량 ≥ 5Mm³ (쐐기형 근사 추정)',
    demSource: 'HydroRIVERS / SRTM GL1 30m',
    note:      '575개 세그먼트 → ORD_STRA≥3, ORD_FLOW≤5, ORD_CLAS≤4 필터 → 5개 선정. 소유역 미완성으로 저수량은 근사치',
  },
  3: {
    label:     '3차',
    date:      '2026-05',
    method:    'SRTM DEM + Order-6 유향/유역 분석',
    criterion: '집수면적 ≥ 900km², 경사 > 0.003, 저수량 ≥ 5Mm³',
    demSource: 'SRTM GL1 30m',
    note:      '575개 하천 세그먼트 → Order-6 필터 → 경사·집수면적 조건 → 5km 클러스터링 → T1~T9 선정',
  },
}

export const CURRENT_PHASE = 3

export const BASIN = {
  id:              'NAM_NGIEP',
  name:            'Nam Ngiep',
  namKo:           '남니옙',
  country:         'Laos',
  totalCandidates: 23,
  demSource:       'SRTM GL1 30m',
  analysisDate:    '2026-05',
  criterion:       '상류 저수량 ≥ 5Mm³',
}

// ══════════════════════════════════════════════════
// Phase 1 — flood-fill 기반 (S1~S9)
// ══════════════════════════════════════════════════
const phase1Candidates = [
  {
    id:'S1', lat:18.44333, lon:103.58278, bed:138,
    region:'Lower Valley', priority:'검토필요',
    baseFsl:198, baseH:60, baseV:4834, baseArea:204.3, hMin5:40,
    note:'저지대 계곡, H=40m부터 5Mm³ 달성. 대규모 저수 가능하나 침수 리스크 검토 필요',
  },
  {
    id:'S2', lat:18.63667, lon:103.60083, bed:143,
    region:'Lower Valley', priority:'검토필요',
    baseFsl:203, baseH:60, baseV:5928, baseArea:222.8, hMin5:40,
    note:'저지대 계곡, H=40m부터 5Mm³ 달성. 높은 저수 포텐셜, 하류 영향 검토 필요',
  },
  {
    id:'S3', lat:18.93056, lon:103.54556, bed:329,
    region:'Middle Basin', priority:'최우선',
    baseFsl:389, baseH:60, baseV:3277, baseArea:110.9, hMin5:40,
    note:'중고도 협곡형, H=40m부터 5Mm³ 달성. 댐 부지 조건 우수, 이주 영향 최소',
  },
  {
    id:'S4', lat:18.78083, lon:103.51222, bed:259,
    region:'Middle Basin', priority:'최우선',
    baseFsl:319, baseH:60, baseV:3114, baseArea:98.2, hMin5:40,
    note:'중고도 협곡형, H=40m부터 5Mm³ 달성. Nam Ngiep 2 계열과 유사 입지',
  },
  {
    id:'S5', lat:19.03333, lon:103.40694, bed:267,
    region:'Upper Basin', priority:'최우선',
    baseFsl:327, baseH:60, baseV:443, baseArea:26.3, hMin5:120,
    note:'상류 협곡형, H=120m에서 5Mm³ 달성. 높은 댐 필요, 접근성 검토 필요',
  },
  {
    id:'S6', lat:19.28667, lon:103.18889, bed:989,
    region:'Xieng Khouang Highland', priority:'2순위',
    baseFsl:1049, baseH:60, baseV:1398, baseArea:46.6, hMin5:100,
    note:'고원 고낙차형, H=100m에서 5Mm³ 달성. ROR 발전 적합',
  },
  {
    id:'S7', lat:19.14083, lon:103.15972, bed:596,
    region:'Xieng Khouang Highland', priority:'2순위',
    baseFsl:656, baseH:60, baseV:1371, baseArea:44.6, hMin5:120,
    note:'고원 고낙차형, H=120m에서 5Mm³ 달성. 발전 효율 우수',
  },
  {
    id:'S9', lat:19.20722, lon:103.53750, bed:1144,
    region:'Xieng Khouang Highland', priority:'2순위',
    baseFsl:1204, baseH:60, baseV:2114, baseArea:73.3, hMin5:90,
    note:'고원지대, H=90m에서 5Mm³ 달성. 접근성 불량',
  },
  // S8: H=120m에서도 4.88Mm³ 미달 → 제외
]

// ══════════════════════════════════════════════════
// Phase 2 — HydroRIVERS + 유향 적용 (C1~C5)
// bed / baseFsl / baseArea: 소유역 미완성으로 null
// ProfileChart / floodPolygons 데이터 없음 → 안전 처리
// ══════════════════════════════════════════════════
const phase2Candidates = [
  {
    id:'C1', lat:18.4083, lon:103.5937,
    bed:null, baseFsl:null, baseH:60, baseV:14.7, baseArea:null, hMin5:20,
    region:'Lower Valley', priority:'최우선',
    storage_H20:5.0, storage_H30:9.7, storage_H50:23.5, storage_H80:55.2,
    upland_skm:4515, dis_av_cms:135.3, ord_flow:4, ord_stra:5,
    note:'ORD_FLOW=4 대하천. H=20m에서 5Mm³ 달성. 집수면적 4,515km², 유량 135m³/s',
  },
  {
    id:'C2', lat:18.6396, lon:103.6021,
    bed:null, baseFsl:null, baseH:60, baseV:13.7, baseArea:null, hMin5:30,
    region:'Lower Valley', priority:'최우선',
    storage_H20:4.7, storage_H30:9.1, storage_H50:22.2, storage_H80:52.4,
    upland_skm:4150, dis_av_cms:117.5, ord_flow:4, ord_stra:5,
    note:'ORD_FLOW=4 대하천. H=30m에서 5Mm³ 달성. 집수면적 4,150km², 유량 117m³/s',
  },
  {
    id:'C3', lat:18.7604, lon:103.4312,
    bed:null, baseFsl:null, baseH:60, baseV:11.7, baseArea:null, hMin5:30,
    region:'Middle Basin', priority:'최우선',
    storage_H20:4.0, storage_H30:7.8, storage_H50:19.4, storage_H80:46.4,
    upland_skm:3386, dis_av_cms:84.9, ord_flow:5, ord_stra:5,
    note:'ORD_FLOW=5 중간하천. H=30m에서 5Mm³ 달성. 집수면적 3,386km², 유량 84m³/s',
  },
  {
    id:'C4', lat:18.9812, lon:103.4896,
    bed:null, baseFsl:null, baseH:60, baseV:9.5, baseArea:null, hMin5:30,
    region:'Middle Basin', priority:'2순위',
    storage_H20:3.1, storage_H30:6.2, storage_H50:15.8, storage_H80:38.3,
    upland_skm:2444, dis_av_cms:49.8, ord_flow:5, ord_stra:5,
    note:'ORD_FLOW=5 중간하천. H=30m에서 5Mm³ 달성. 집수면적 2,444km², 유량 49m³/s',
  },
  {
    id:'C5', lat:19.1687, lon:103.3562,
    bed:null, baseFsl:null, baseH:60, baseV:5.5, baseArea:null, hMin5:50,
    region:'Upper Basin', priority:'2순위',
    storage_H20:1.7, storage_H30:3.5, storage_H50:9.1, storage_H80:22.4,
    upland_skm:908, dis_av_cms:17.8, ord_flow:5, ord_stra:4,
    note:'ORD_FLOW=5 상류 소하천. H=50m에서 5Mm³ 달성. 집수면적 908km², 유량 17m³/s',
  },
]

// Phase 3 — 소유역 완성 후 추가
const phase3Candidates = [
  {
    id:'T1', lat:18.5847, lon:103.60487,
    bed:161, baseFsl:null, baseH:60, baseV:23.7, baseArea:null, hMin5:30,
    region:'Lower Valley', priority:'2순위',
    storage_H20:3.8, storage_H30:8.5, storage_H50:23.7, storage_H80:60.6,
    upland_skm:4114, slope:0.00392, ord_stra:6, linkno:2686,
    note:'Order-6 메인하천 (LINKNO=2686). 경사=0.0039, 집수면적=4,114km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T2', lat:18.64993, lon:103.56365,
    bed:171, baseFsl:null, baseH:60, baseV:21.1, baseArea:null, hMin5:30,
    region:'Lower Valley', priority:'2순위',
    storage_H20:3.4, storage_H30:7.6, storage_H50:21.1, storage_H80:53.9,
    upland_skm:3663, slope:0.00438, ord_stra:6, linkno:2674,
    note:'Order-6 메인하천 (LINKNO=2674). 경사=0.0044, 집수면적=3,663km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T3', lat:18.64763, lon:103.51382,
    bed:204, baseFsl:null, baseH:60, baseV:20.8, baseArea:null, hMin5:30,
    region:'Lower Valley', priority:'최우선',
    storage_H20:3.3, storage_H30:7.5, storage_H50:20.8, storage_H80:53.3,
    upland_skm:3619, slope:0.01614, ord_stra:6, linkno:2671,
    note:'Order-6 메인하천 (LINKNO=2671). 경사=0.0161, 집수면적=3,619km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T4', lat:18.67646, lon:103.46457,
    bed:224, baseFsl:null, baseH:60, baseV:20.6, baseArea:null, hMin5:30,
    region:'Lower Valley', priority:'최우선',
    storage_H20:3.3, storage_H30:7.4, storage_H50:20.6, storage_H80:52.8,
    upland_skm:3587, slope:0.01755, ord_stra:6, linkno:2661,
    note:'Order-6 메인하천 (LINKNO=2661). 경사=0.0175, 집수면적=3,587km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T5', lat:18.71776, lon:103.4384,
    bed:238, baseFsl:null, baseH:60, baseV:19.2, baseArea:null, hMin5:30,
    region:'Lower Valley', priority:'2순위',
    storage_H20:3.1, storage_H30:6.9, storage_H50:19.2, storage_H80:49.1,
    upland_skm:3338, slope:0.00823, ord_stra:6, linkno:2650,
    note:'Order-6 메인하천 (LINKNO=2650). 경사=0.0082, 집수면적=3,338km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T6', lat:18.82496, lon:103.42451,
    bed:246, baseFsl:null, baseH:60, baseV:15.9, baseArea:null, hMin5:30,
    region:'Middle Basin', priority:'2순위',
    storage_H20:2.5, storage_H30:5.7, storage_H50:15.9, storage_H80:40.6,
    upland_skm:2760, slope:0.0049, ord_stra:6, linkno:2634,
    note:'Order-6 메인하천 (LINKNO=2634). 경사=0.0049, 집수면적=2,760km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T7', lat:18.86429, lon:103.45685,
    bed:262, baseFsl:null, baseH:60, baseV:15.3, baseArea:null, hMin5:30,
    region:'Middle Basin', priority:'2순위',
    storage_H20:2.5, storage_H30:5.5, storage_H50:15.3, storage_H80:39.2,
    upland_skm:2665, slope:0.00641, ord_stra:6, linkno:2627,
    note:'Order-6 메인하천 (LINKNO=2627). 경사=0.0064, 집수면적=2,665km². H=30m에서 5Mm³ 달성.',
  },
  {
    id:'T8', lat:19.07826, lon:103.34716,
    bed:327, baseFsl:null, baseH:60, baseV:8.9, baseArea:null, hMin5:50,
    region:'Upper Basin', priority:'검토필요',
    storage_H20:1.4, storage_H30:3.2, storage_H50:8.9, storage_H80:22.8,
    upland_skm:1552, slope:0.00424, ord_stra:6, linkno:2591,
    note:'Order-6 메인하천 (LINKNO=2591). 경사=0.0042, 집수면적=1,552km². H=50m에서 5Mm³ 달성.',
  },
  {
    id:'T9', lat:19.14041, lon:103.33477,
    bed:395, baseFsl:null, baseH:60, baseV:5.3, baseArea:null, hMin5:50,
    region:'Upper Basin', priority:'검토필요',
    storage_H20:0.9, storage_H30:1.9, storage_H50:5.3, storage_H80:13.6,
    upland_skm:924, slope:0.03221, ord_stra:6, linkno:2580,
    note:'Order-6 메인하천 (LINKNO=2580). 경사=0.0322, 집수면적=924km². H=50m에서 5Mm³ 달성.',
  },
]

const PHASE_CANDIDATES = {
  1: phase1Candidates,
  2: phase2Candidates,
  3: phase3Candidates,
}

export const getCandidatesByPhase = (phase) => PHASE_CANDIDATES[phase] ?? []

// 하위 호환 (기존 코드가 직접 참조하는 경우)
export const candidates = phase3Candidates

// ── 저수량 추정 ───────────────────────────────────
// Phase 2(C1~C5): 시나리오 직접 보간
// Phase 1(S1~S9): H^2.5 스케일링
export const estimateVolume = (c, h) => {
  if (c.storage_H20 !== undefined) {
    const pts = [[20,c.storage_H20],[30,c.storage_H30],[50,c.storage_H50],[80,c.storage_H80]]
    for (let i = 0; i < pts.length - 1; i++) {
      const [h0,v0] = pts[i], [h1,v1] = pts[i+1]
      if (h >= h0 && h <= h1)
        return Math.round((v0 + (v1-v0)*(h-h0)/(h1-h0)) * 10) / 10
    }
    if (h < 20) return Math.round(c.storage_H20 * Math.pow(h/20, 2.5) * 10) / 10
    return Math.round(c.storage_H80 * Math.pow(h/80, 2.5) * 10) / 10
  }
  return Math.round(c.baseV * Math.pow(h / c.baseH, 2.5))
}

// null-safe 헬퍼들
export const estimateArea   = (c, h) =>
  c.baseArea != null ? Math.round(c.baseArea * Math.pow(h / c.baseH, 1.8) * 10) / 10 : null

export const calcFsl        = (c, h) =>
  c.bed != null ? c.bed + h : null

export const calcEfficiency = (v, a) =>
  (v != null && a != null && a !== 0) ? Math.round((v / a) * 100) / 100 : null

export const estimateEvap   = (a) =>
  a != null ? Math.round(a * 1.5 * 10) / 10 : null

export const PRIORITY_CONFIG = {
  '최우선':  { color: '#1D9E75', bg: '#E1F5EE' },
  '2순위':   { color: '#1A7FBD', bg: '#E6F1FB' },
  '검토필요':{ color: '#BA7517', bg: '#FAEEDA' },
}

export const HEIGHT_STEPS = [40, 50, 60, 70, 80, 90, 100, 110, 120]
