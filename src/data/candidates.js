// Nam Ngiao Basin — 댐 후보지
// ──────────────────────────────────────────────────
// 차수별 분석 히스토리
// Phase 1 (2024-03): SRTM + 기존 강중심선, 저수량 ≥ 10Mm³
// Phase 2 (2026-04): SRTM GL1 30m + flood-fill, 저수량 ≥ 5Mm³  ← 현행
// Phase 3: 소유역 완성 후 정밀 분석 예정
// ──────────────────────────────────────────────────

// ── 차수(Phase) 메타정보 ──────────────────────────
export const PHASES = {
  1: {
    label: "1차",
    date: "2024-03",
    method: "SRTM + 기존 강중심선",
    criterion: "상류 저수량 ≥ 10Mm³",
    demSource: "SRTM GL1 30m",
    note: "초기 스크리닝. 강 중심선 부정확·분석범위 광역으로 일부 왜곡",
  },
  2: {
    label: "2차",
    date: "2026-04",
    method: "SRTM GL1 + flood-fill",
    criterion: "상류 저수량 ≥ 5Mm³",
    demSource: "SRTM GL1 30m",
    note: "HydroRIVERS 기반 수계 재생성. 등고선 마스킹으로 범람역 제한",
  },
  3: {
    label: "3차",
    date: "진행중",
    method: "소유역 경계 + DEM 정밀",
    criterion: "상류 저수량 ≥ 5Mm³",
    demSource: "SRTM GL1 30m",
    note: "소유역 완성 후 집수면적 기반 정밀 저수량 재산정 예정",
  },
};

export const CURRENT_PHASE = 2; // 현재 기본 표시 차수

// ── BASIN 메타 ────────────────────────────────────
export const BASIN = {
  id: "NAM_NGIAO", name: "Nam Ngiao", namKo: "남지아오",
  country: "Laos", totalCandidates: 8,
};

// ── 후보지 데이터 ─────────────────────────────────
// phases[N]: 해당 차수에서의 분석 결과
//   - priority: 차수별 우선순위
//   - baseV / baseArea / hMin5: 차수별 추정값
//   - null: 해당 차수에서 미분석 또는 제외
// ─────────────────────────────────────────────────
export const candidates = [
  {
    id: "S1", lat: 18.44333, lon: 103.58278, bed: 138,
    region: "Lower Valley",
    note: "저지대 계곡, H=40m부터 5Mm³ 달성. 대규모 저수 가능하나 침수 리스크 검토 필요",
    phases: {
      1: { priority:"검토필요", baseFsl:198, baseH:60, baseV:4200, baseArea:185.0, hMin5:50 },
      2: { priority:"검토필요", baseFsl:198, baseH:60, baseV:4834, baseArea:204.3, hMin5:40 },
      3: null, // 소유역 분석 후 재검토 예정
    },
  },
  {
    id: "S2", lat: 18.63667, lon: 103.60083, bed: 143,
    region: "Lower Valley",
    note: "저지대 계곡, H=40m부터 5Mm³ 달성. 높은 저수 포텐셜, 하류 영향 검토 필요",
    phases: {
      1: { priority:"검토필요", baseFsl:203, baseH:60, baseV:5100, baseArea:200.0, hMin5:50 },
      2: { priority:"검토필요", baseFsl:203, baseH:60, baseV:5928, baseArea:222.8, hMin5:40 },
      3: null,
    },
  },
  {
    id: "S3", lat: 18.93056, lon: 103.54556, bed: 329,
    region: "Middle Basin",
    note: "중고도 협곡형, H=40m부터 5Mm³ 달성. 댐 부지 조건 우수, 이주 영향 최소",
    phases: {
      1: { priority:"최우선",  baseFsl:389, baseH:60, baseV:2900, baseArea:98.0,  hMin5:50 },
      2: { priority:"최우선",  baseFsl:389, baseH:60, baseV:3277, baseArea:110.9, hMin5:40 },
      3: { priority:"최우선",  baseFsl:389, baseH:60, baseV:3277, baseArea:110.9, hMin5:40 },
    },
  },
  {
    id: "S4", lat: 18.78083, lon: 103.51222, bed: 259,
    region: "Middle Basin",
    note: "중고도 협곡형, H=40m부터 5Mm³ 달성. Nam Ngiep 2 계열과 유사 입지",
    phases: {
      1: { priority:"최우선",  baseFsl:319, baseH:60, baseV:2700, baseArea:88.0,  hMin5:50 },
      2: { priority:"최우선",  baseFsl:319, baseH:60, baseV:3114, baseArea:98.2,  hMin5:40 },
      3: { priority:"최우선",  baseFsl:319, baseH:60, baseV:3114, baseArea:98.2,  hMin5:40 },
    },
  },
  {
    id: "S5", lat: 19.03333, lon: 103.40694, bed: 267,
    region: "Upper Basin",
    note: "상류 협곡형, H=120m에서 5Mm³ 달성. 높은 댐 필요, 접근성 검토 필요",
    phases: {
      1: null, // 1차 저수량 기준(10Mm³) 미달로 미선정
      2: { priority:"최우선",  baseFsl:327, baseH:60, baseV:443,  baseArea:26.3,  hMin5:120 },
      3: { priority:"최우선",  baseFsl:327, baseH:60, baseV:443,  baseArea:26.3,  hMin5:120 },
    },
  },
  {
    id: "S6", lat: 19.28667, lon: 103.18889, bed: 989,
    region: "Xieng Khouang Highland",
    note: "고원 고낙차형, H=100m에서 5Mm³ 달성. ROR 발전 적합",
    phases: {
      1: { priority:"2순위",   baseFsl:1049, baseH:60, baseV:1200, baseArea:40.0, hMin5:110 },
      2: { priority:"2순위",   baseFsl:1049, baseH:60, baseV:1398, baseArea:46.6, hMin5:100 },
      3: { priority:"2순위",   baseFsl:1049, baseH:60, baseV:1398, baseArea:46.6, hMin5:100 },
    },
  },
  {
    id: "S7", lat: 19.14083, lon: 103.15972, bed: 596,
    region: "Xieng Khouang Highland",
    note: "고원 고낙차형, H=120m에서 5Mm³ 달성. 발전 효율 우수",
    phases: {
      1: { priority:"2순위",   baseFsl:656, baseH:60, baseV:1100, baseArea:38.0, hMin5:120 },
      2: { priority:"2순위",   baseFsl:656, baseH:60, baseV:1371, baseArea:44.6, hMin5:120 },
      3: { priority:"2순위",   baseFsl:656, baseH:60, baseV:1371, baseArea:44.6, hMin5:120 },
    },
  },
  {
    id: "S9", lat: 19.20722, lon: 103.53750, bed: 1144,
    region: "Xieng Khouang Highland",
    note: "고원지대, H=90m에서 5Mm³ 달성. 접근성 불량",
    phases: {
      1: null, // 1차 미포함
      2: { priority:"2순위",   baseFsl:1204, baseH:60, baseV:2114, baseArea:73.3, hMin5:90 },
      3: { priority:"2순위",   baseFsl:1204, baseH:60, baseV:2114, baseArea:73.3, hMin5:90 },
    },
  },
  // S8: H=120m에서도 4.88Mm³로 전 차수 기준 미달 → 전체 제외
];

// ── 헬퍼: 특정 차수의 후보만 반환 ─────────────────
export const getCandidatesByPhase = (phase) =>
  candidates
    .filter(c => c.phases[phase] !== null && c.phases[phase] !== undefined)
    .map(c => ({ ...c, ...c.phases[phase] })); // phase 데이터를 flat하게 병합

// ── 저수량/면적 추정 함수 ──────────────────────────
export const estimateVolume = (c, h) => Math.round(c.baseV * Math.pow(h / c.baseH, 2.5));
export const estimateArea   = (c, h) => Math.round(c.baseArea * Math.pow(h / c.baseH, 1.8) * 10) / 10;
export const calcFsl        = (c, h) => c.bed + h;
export const calcEfficiency = (v, a) => Math.round((v / a) * 100) / 100;
export const estimateEvap   = (a)    => Math.round(a * 1.5 * 10) / 10;

export const PRIORITY_CONFIG = {
  "최우선":  { color: "#1D9E75", bg: "#E1F5EE" },
  "2순위":   { color: "#1A7FBD", bg: "#E6F1FB" },
  "검토필요":{ color: "#BA7517", bg: "#FAEEDA" },
};

export const HEIGHT_STEPS = [40, 50, 60, 70, 80, 90, 100, 110, 120];
