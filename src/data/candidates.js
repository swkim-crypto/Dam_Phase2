// Nam Ngiao Basin — 댐 후보지
// 기준: 상류 방향 flood-fill, 최소 5Mm³ (H=120m 이내 달성)
// S8 제외 (H=120m에서도 4.88Mm³로 미달)

export const BASIN = {
  id: "NAM_NGIAO", name: "Nam Ngiao", namKo: "남지아오",
  country: "Laos", totalCandidates: 8,
  demSource: "SRTM GL1 30m", analysisDate: "2026-04",
  criterion: "상류 저수량 ≥ 5Mm³",
};

export const candidates = [
  {
    id:"S1", lat:18.44333, lon:103.58278, bed:138, baseFsl:198, baseH:60,
    baseV:4834, baseArea:204.3,
    region:"Lower Valley", priority:"검토필요",
    hMin5: 40,   // 5Mm³ 달성 최소 높이
    note:"저지대 계곡, H=40m부터 5Mm³ 달성. 대규모 저수 가능하나 침수 리스크 검토 필요"
  },
  {
    id:"S2", lat:18.63667, lon:103.60083, bed:143, baseFsl:203, baseH:60,
    baseV:5928, baseArea:222.8,
    region:"Lower Valley", priority:"검토필요",
    hMin5: 40,
    note:"저지대 계곡, H=40m부터 5Mm³ 달성. 높은 저수 포텐셜, 하류 영향 검토 필요"
  },
  {
    id:"S3", lat:18.93056, lon:103.54556, bed:329, baseFsl:389, baseH:60,
    baseV:3277, baseArea:110.9,
    region:"Middle Basin", priority:"최우선",
    hMin5: 40,
    note:"중고도 협곡형, H=40m부터 5Mm³ 달성. 댐 부지 조건 우수, 이주 영향 최소"
  },
  {
    id:"S4", lat:18.78083, lon:103.51222, bed:259, baseFsl:319, baseH:60,
    baseV:3114, baseArea:98.2,
    region:"Middle Basin", priority:"최우선",
    hMin5: 40,
    note:"중고도 협곡형, H=40m부터 5Mm³ 달성. Nam Ngiep 2 계열과 유사 입지"
  },
  {
    id:"S5", lat:19.03333, lon:103.40694, bed:267, baseFsl:327, baseH:60,
    baseV:443, baseArea:26.3,
    region:"Upper Basin", priority:"최우선",
    hMin5: 120,
    note:"상류 협곡형, H=120m에서 5Mm³ 달성. 높은 댐 필요, 접근성 검토 필요"
  },
  {
    id:"S6", lat:19.28667, lon:103.18889, bed:989, baseFsl:1049, baseH:60,
    baseV:1398, baseArea:46.6,
    region:"Xieng Khouang Highland", priority:"2순위",
    hMin5: 100,
    note:"고원 고낙차형, H=100m에서 5Mm³ 달성. ROR 발전 적합"
  },
  {
    id:"S7", lat:19.14083, lon:103.15972, bed:596, baseFsl:656, baseH:60,
    baseV:1371, baseArea:44.6,
    region:"Xieng Khouang Highland", priority:"2순위",
    hMin5: 120,
    note:"고원 고낙차형, H=120m에서 5Mm³ 달성. 발전 효율 우수"
  },
  {
    id:"S9", lat:19.20722, lon:103.53750, bed:1144, baseFsl:1204, baseH:60,
    baseV:2114, baseArea:73.3,
    region:"Xieng Khouang Highland", priority:"2순위",
    hMin5: 90,
    note:"고원지대, H=90m에서 5Mm³ 달성. 접근성 불량"
  },
  // S8 제외: H=120m에서도 4.88Mm³로 5Mm³ 기준 미달
];

// 저수량 추정: V ∝ H^2.5 (상류 방향 기준)
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
