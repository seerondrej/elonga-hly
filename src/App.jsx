import { useState, useEffect, useMemo, createContext, useContext, useCallback, useRef } from "react";
import { fetchToday, fetchHistory, fetchDebug, USERS, DEFAULT_USER_ID } from './api';

// ═══════════════════════════════════════════════════
// DESIGN SYSTEM — Elonga
// ═══════════════════════════════════════════════════
const LIGHT = {
  bg: "#F2F3F8", card: "#FFFFFF", cardAlt: "#EBEDF3",
  text: "#1E1E4F", textSec: "#475484", textTer: "#7B85A8",
  primary: "#4052F4", primarySoft: "#ECEEFE", primaryMuted: "#7A88F8",
  purple: "#733BE8", purpleSoft: "#F2EBFD",
  pink: "#E83A64", pinkSoft: "#FDECF1",
  green: "#3B7A5E", greenSoft: "#EAF4EF",
  gray: "#475484", graySoft: "#EBEDF3",
  red: "#E83A64", redSoft: "#FDECF1",
  gradStart: "#1E3080", gradEnd: "#4052F4",
  border: "#EBEDF3", borderStrong: "#D7DAE6",
  shadow: "0 2px 12px rgba(30,30,79,0.07)",
  shadowLg: "0 8px 30px rgba(30,30,79,0.10)",
  r: 20, rSm: 14, rXs: 10,
  f: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
  toggleBg: "#EBEDF3",
};
const DARK = {
  bg: "#0D0F1A", card: "#1E1E4F", cardAlt: "#282A52",
  text: "#FFFFFF", textSec: "#AFB5CC", textTer: "#7B85A8",
  primary: "#4052F4", primarySoft: "#1A2058", primaryMuted: "#7A88F8",
  purple: "#9E75F0", purpleSoft: "#2A1858",
  pink: "#F07A98", pinkSoft: "#3A1830",
  green: "#72A790", greenSoft: "#1A3028",
  gray: "#7B85A8", graySoft: "#282A52",
  red: "#F07A98", redSoft: "#3A1830",
  gradStart: "#2840D0", gradEnd: "#5060FF",
  border: "#282A52", borderStrong: "#383A60",
  shadow: "0 2px 12px rgba(0,0,0,0.25)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.35)",
  r: 20, rSm: 14, rXs: 10,
  f: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
  toggleBg: "#383A60",
};

const ThemeCtx = createContext(LIGHT);
const useTheme = () => useContext(ThemeCtx);

const PILLARS = [
  { key: "pohyb", label: "Pohyb", icon: "🏃", maxMin: 150, color: "#4052F4", soft: "#ECEEFE", darkSoft: "#1A2058" },
  { key: "spanek", label: "Spánek", icon: "🌙", maxMin: 90, color: "#733BE8", soft: "#F2EBFD", darkSoft: "#2A1858" },
  { key: "strava", label: "Strava", icon: "🥗", maxMin: 90, color: "#3B7A5E", soft: "#EAF4EF", darkSoft: "#1A3028" },
  { key: "stres", label: "Stres", icon: "🧘", maxMin: 45, color: "#475484", soft: "#EBEDF3", darkSoft: "#282A52" },
  { key: "vztahy", label: "Vztahy", icon: "❤️", maxMin: 30, color: "#E83A64", soft: "#FDECF1", darkSoft: "#3A1830" },
  { key: "monitoring", label: "Monitoring", icon: "📊", maxMin: 30, color: "#7B85A8", soft: "#EBEDF3", darkSoft: "#282A52" },
];

const HRV_STATES = [
  { label: "Pod průměrem", color: "#E83A64", bg: "#FDECF1", darkBg: "#3A1830", mult: 1.0, tag: "Stabilizace" },
  { label: "V normě", color: "#3B7A5E", bg: "#EAF4EF", darkBg: "#1A3028", mult: 1.1, tag: "+10 %" },
  { label: "Nadprůměr", color: "#733BE8", bg: "#F2EBFD", darkBg: "#2A1858", mult: 1.25, tag: "+25 %" },
];

const DEMO = { pohyb: 0.72, spanek: 0.85, strava: 0.55, stres: 0.05, vztahy: 0.65, monitoring: 1.0 };

// Age coefficient: <35 = 1.0, 35-44 = 1.2, >=45 = 1.5 (max)
const calcAgeCoef = (age) => age < 35 ? 1.0 : age < 45 ? 1.2 : 1.5;

const PILLAR_META = {
  pohyb: { desc: "Fyzická aktivita, kroky, tréninky", source: "Apple Health / Google Fit + manuálně", question: "Jak chceš zadávat pohyb?", options: [
    { label: "Synchronizace s Apple Health / Google Fit", desc: "Automaticky přenese kroky, tréninky a aktivitu" },
    { label: "Budu zadávat ručně", desc: "Záznam aktivit ručně po každém cvičení" },
  ]},
  spanek: { desc: "Kvalita a délka spánku", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: [
    { label: "Chci spát určitý počet hodin denně", desc: "Nastavím si cílovou délku spánku" },
    { label: "Chci chodit spát ve stejný čas", desc: "Pravidelný rytmus usínání" },
    { label: "Chci eliminovat modré světlo před spaním", desc: "Omezit obrazovky 1h před spaním" },
  ]},
  strava: { desc: "Výživa, stravovací návyky", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", multiSelect: true, options: [
    { label: "Chci se naučit lepší stravovací návyky", desc: "Tipy a doporučení pro zdravější jídelníček" },
    { label: "Chci zhubnout", desc: "Zdravé hubnutí a sledování pokroku" },
    { label: "Chci mít pravidelný stravovací režim", desc: "Dodržovat pravidelné časy jídel" },
  ]},
  stres: { desc: "Dechová cvičení, meditace, relaxace", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: [
    { label: "Chci se naučit dýchací techniky", desc: "Jednoduché techniky pro zklidnění" },
    { label: "Chci pravidelně meditovat", desc: "Denní meditační návyk" },
    { label: "Chci lépe zvládat stresové situace", desc: "Nástroje pro zvládání stresu v reálném čase" },
  ]},
  vztahy: { desc: "Sociální interakce, kvalitní čas s blízkými", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: [
    { label: "Chci trávit víc kvalitního času s blízkými", desc: "Vědomě plánovat čas s rodinou a přáteli" },
    { label: "Chci být víc v kontaktu s přáteli", desc: "Pravidelně se ozývat a udržovat vztahy" },
  ]},
};

function generateHistory(days, ageCoef = 1.2) {
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const base = 2.8 + Math.sin(i * 0.3) * 0.8 + Math.random() * 1.2;
    const hrs = Math.min(Math.max(base, 0.5), 6);
    const hrvIdx = Math.random() > 0.6 ? 2 : Math.random() > 0.3 ? 1 : 0;
    const boosted = hrs * HRV_STATES[hrvIdx].mult * ageCoef;
    data.push({
      date: d, day: d.toLocaleDateString("cs-CZ", { weekday: "short" }),
      dayNum: d.getDate(), month: d.toLocaleDateString("cs-CZ", { month: "short" }),
      hrsRaw: hrs, hrsBoosted: boosted, hrvIdx,
      pillars: { pohyb: 0.4+Math.random()*0.5, spanek: 0.5+Math.random()*0.45,
        strava: 0.2+Math.random()*0.6, stres: 0.1+Math.random()*0.7,
        vztahy: 0.2+Math.random()*0.6, monitoring: Math.random()>0.15?1.0:0 },
    });
  }
  if (data.length > 0) {
    const t = data[data.length-1]; t.pillars = DEMO;
    t.hrsRaw = PILLARS.reduce((s,p)=>s+p.maxMin*DEMO[p.key],0)/60;
    t.hrsBoosted = t.hrsRaw * HRV_STATES[1].mult * ageCoef; t.hrvIdx = 1;
  }
  return data;
}

// ═══════════════════════════════════════════════════
// HELPER: pillar soft color aware of dark mode
// ═══════════════════════════════════════════════════
function usePillarSoft(p) {
  const T = useTheme();
  return T === DARK ? (p.darkSoft || p.soft) : p.soft;
}

// ═══════════════════════════════════════════════════
// DARK MODE TOGGLE ICON
// ═══════════════════════════════════════════════════
function DarkModeToggle({ dark, onToggle }) {
  const T = useTheme();
  return (
    <div onClick={onToggle} style={{
      width: 50, height: 28, borderRadius: 14, padding: 2, cursor: "pointer",
      background: dark ? "#282A52" : "#EBEDF3",
      transition: "background 0.3s ease", position: "relative",
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 12, background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transform: dark ? "translateX(22px)" : "translateX(0)",
        transition: "transform 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {dark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#E83A64"/>
            {[0,90,180,270].map(a => (
              <line key={a} x1="12" y1="3" x2="12" y2="5" stroke="#E83A64" strokeWidth="2" strokeLinecap="round"
                transform={`rotate(${a} 12 12)`}/>
            ))}
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#7B85A8"/>
          </svg>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// RADAR CHART
// ═══════════════════════════════════════════════════
function RadarChart({ data, pillars, animate }) {
  const T = useTheme();
  const count = pillars.length;
  const size=260,cx=size/2,cy=size/2,maxR=95;
  const getP=(i,v)=>{const a=(Math.PI*2*i)/count-Math.PI/2;return{x:cx+maxR*v*Math.cos(a),y:cy+maxR*v*Math.sin(a)};};
  const pts=pillars.map((_,i)=>getP(i,data[pillars[i].key]||0));
  const path=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ")+" Z";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="rfL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={T.gradStart} stopOpacity="0.2"/><stop offset="100%" stopColor={T.gradEnd} stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id="rsL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={T.gradStart}/><stop offset="100%" stopColor={T.gradEnd}/>
        </linearGradient>
      </defs>
      {[0.25,0.5,0.75,1].map((l,li)=>{const gp=pillars.map((_,i)=>getP(i,l));
        return <path key={li} d={gp.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ")+" Z"} fill="none" stroke={T.border} strokeWidth={li===3?1.2:0.6}/>;
      })}
      {pillars.map((_,i)=>{const p=getP(i,1);return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={T.border} strokeWidth="0.5"/>;} )}
      <path d={path} fill="url(#rfL)" stroke="url(#rsL)" strokeWidth="2.5" strokeLinejoin="round" style={{opacity:animate?1:0,transition:"opacity 0.8s ease"}}/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4.5" fill={T.card} stroke={pillars[i].color} strokeWidth="2.5" style={{transition:"all 0.5s ease",transitionDelay:`${i*50}ms`}}/>)}
      {pillars.map((p,i)=>{const pt=getP(i,1.28);return <text key={i} x={pt.x} y={pt.y+4} textAnchor="middle" fill={T.textSec} fontSize="11" fontFamily={T.f}>{p.icon}</text>;})}
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// GAUGE GRID
// ═══════════════════════════════════════════════════
function GaugeGrid({ data, pillars, animate, periodDays=1, ageCoef=1 }) {
  const T = useTheme();
  const cols = pillars.length <= 2 ? pillars.length : pillars.length <= 4 ? 2 : 3;
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:8,padding:"4px 0",justifyItems:"center"}}>
      {pillars.map((p,idx)=>{
        const val=Math.min(data[p.key]||0,1);const hly=((p.maxMin*val*periodDays*ageCoef)/60).toFixed(1);
        const r=36;const sw=7;const circ=Math.PI*r;const filled=circ*val;
        return (
          <div key={p.key} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 0"}}>
            <svg width={r*2+sw+4} height={r+sw/2+8} viewBox={`0 0 ${r*2+sw+4} ${r+sw/2+8}`}>
              <defs>
                <linearGradient id={`gg-${p.key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={p.color} stopOpacity="0.4"/><stop offset="100%" stopColor={p.color}/>
                </linearGradient>
              </defs>
              <path d={`M ${sw/2+2} ${r+sw/2} A ${r} ${r} 0 0 1 ${r*2+sw/2+2} ${r+sw/2}`}
                fill="none" stroke={T.border} strokeWidth={sw} strokeLinecap="round"/>
              <path d={`M ${sw/2+2} ${r+sw/2} A ${r} ${r} 0 0 1 ${r*2+sw/2+2} ${r+sw/2}`}
                fill="none" stroke={`url(#gg-${p.key})`} strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={animate?circ-filled:circ}
                style={{transition:"stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)",transitionDelay:`${idx*80}ms`}}/>
              <text x={r+sw/2+2} y={r+sw/2-4} textAnchor="middle" fill={T.text}
                fontSize="16" fontWeight="800" fontFamily={T.f}>{hly}</text>
              <text x={r+sw/2+2} y={r+sw/2+8} textAnchor="middle" fill={T.textTer}
                fontSize="8" fontWeight="600" fontFamily={T.f}>hod</text>
            </svg>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
              <span style={{fontSize:14}}>{p.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:T.textSec,fontFamily:T.f}}>{p.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ACTIVITY RINGS (Apple Watch style)
// ═══════════════════════════════════════════════════
function ActivityRings({ data, pillars, animate, periodTotal }) {
  const T = useTheme();
  const isDark = T === DARK;
  const n=pillars.length;
  const sw=7;const ringGap=2;
  const step=sw+ringGap;
  const totalRingSpace=n*sw+(n-1)*ringGap;
  const outerR=totalRingSpace+20;
  const size=(outerR+sw/2+4)*2;
  const cx=size/2;const cy=size/2;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pillars.map((p,idx)=>{
          const val=Math.min(data[p.key]||0,1);
          const r=outerR-(idx*step);
          const circ=2*Math.PI*r;
          const filled=circ*val;
          return (
            <g key={p.key}>
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke={isDark?(p.darkSoft||p.soft):p.soft} strokeWidth={sw}/>
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke={p.color} strokeWidth={sw} strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={animate?circ-filled:circ}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{
                  transition:`stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)`,
                  transitionDelay:`${idx*100}ms`,
                }}/>
            </g>
          );
        })}
        {/* Center value */}
        <text x={cx} y={cy-2} textAnchor="middle" dominantBaseline="central"
          fill={T.text} fontSize="22" fontWeight="800" fontFamily={T.f}>
          {periodTotal.hrs}
        </text>
        <text x={cx} y={cy+16} textAnchor="middle" dominantBaseline="central"
          fill={T.textSec} fontSize="9" fontWeight="500" fontFamily={T.f}>
          {periodTotal.label}
        </text>
      </svg>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:4}}>
        {pillars.map(p=>{
          const val=Math.min(data[p.key]||0,1);
          const hrs=(val*p.maxMin/60).toFixed(1);
          return (
            <div key={p.key} style={{display:"flex",alignItems:"center",gap:3}}>
              <div style={{width:7,height:7,borderRadius:4,background:p.color}}/>
              <span style={{fontSize:10,fontWeight:600,color:T.textSec,fontFamily:T.f}}>{p.label}</span>
              <span style={{fontSize:10,fontWeight:700,color:p.color,fontFamily:T.f}}>{hrs}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BAR CHART
// ═══════════════════════════════════════════════════
function aggregateByWeek(history) {
  const weeks = [];
  const all = [...history];
  while (all.length > 0) {
    const chunk = all.splice(-7);
    const total = chunk.reduce((s, d) => s + d.hrsBoosted, 0);
    const avg = total / chunk.length;
    const last = chunk[chunk.length - 1];
    const first = chunk[0];
    const avgHrv = Math.round(chunk.reduce((s, d) => s + d.hrvIdx, 0) / chunk.length);
    weeks.unshift({ avg, total, label: `${first.dayNum}.–${last.dayNum}.`, date: last.date, count: chunk.length, hrvIdx: avgHrv, items: chunk });
  }
  return weeks.slice(-12);
}
function aggregateByMonth(history) {
  const months = {};
  history.forEach(d => {
    const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
    if (!months[key]) months[key] = { items: [], date: d.date };
    months[key].items.push(d);
  });
  return Object.values(months).map(m => {
    const total = m.items.reduce((s, d) => s + d.hrsBoosted, 0);
    return {
    avg: total / m.items.length,
    total,
    label: m.date.toLocaleDateString("cs-CZ", { month: "short" }),
    date: m.date,
    count: m.items.length,
    hrvIdx: Math.round(m.items.reduce((s, d) => s + d.hrvIdx, 0) / m.items.length),
    items: m.items,
  }}).slice(-12);
}

function BarChartCard({ history, animate }) {
  const T = useTheme();
  const isDark = T === DARK;
  const [barPeriod, setBarPeriod] = useState("day");
  const dayItems = history.slice(-30);
  const [selected, setSelected] = useState(dayItems.length >= 2 ? dayItems.length - 2 : null);
  const weekItems = useMemo(() => aggregateByWeek(history), [history]);
  const monthItems = useMemo(() => aggregateByMonth(history), [history]);

  const items = barPeriod === "day" ? dayItems : barPeriod === "week" ? weekItems : monthItems;
  const sel = selected === null || selected >= items.length ? items.length - 1 : selected;
  const maxH = 6; const chartH = 120;
  const barW = barPeriod === "day" ? 24 : barPeriod === "week" ? 36 : 36;
  const gap = barPeriod === "day" ? 4 : 8;

  const getBarVal = (item) => barPeriod === "day" ? item.hrsBoosted : item.avg;
  const getLabel = (item) => barPeriod === "day" ? item.day : item.label;
  const getTooltipVal = (item) => {
    if (barPeriod === "day") return `${item.hrsBoosted.toFixed(1)}h`;
    const days = (item.total / 24).toFixed(1);
    return `${item.total.toFixed(0)}h (${days} dní)`;
  };
  const getTooltipLabel = (item) => {
    if (barPeriod === "day") return item.date.toLocaleDateString("cs-CZ", { day: "numeric", month: "short" });
    if (barPeriod === "week") return item.label;
    return item.label + " " + item.date.getFullYear();
  };

  return (
    <div style={{background:T.card,borderRadius:T.r,padding:"16px",boxShadow:T.shadow}}>
      <style>{`
        .bar-scroll::-webkit-scrollbar { height: 6px; }
        .bar-scroll::-webkit-scrollbar-track { background: ${T.border}; border-radius: 3px; }
        .bar-scroll::-webkit-scrollbar-thumb { background: ${T.borderStrong}; border-radius: 3px; }
      `}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:3,background:T.primary}}/>
          <span style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:T.f}}>Zdraví</span>
        </div>
        <div style={{display:"flex",background:T.cardAlt,borderRadius:8,padding:2}}>
          {["day","week","month"].map(p=>(
            <button key={p} onClick={()=>{setBarPeriod(p);setSelected(p==="day"&&dayItems.length>=2?dayItems.length-2:null);}} style={{
              padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
              background:barPeriod===p?T.primary:"transparent",
              color:barPeriod===p?"white":T.textTer,
              fontSize:11,fontWeight:600,fontFamily:T.f,transition:"all 0.2s ease",
            }}>{{day:"Den",week:"Týden",month:"Měsíc"}[p]}</button>
          ))}
        </div>
      </div>
      {/* Selected value tooltip — fixed height */}
      <div style={{textAlign:"center",height:20,marginBottom:4}}>
        {items[sel]&&<>
          <span style={{fontSize:13,fontWeight:700,color:T.primary,fontFamily:T.f}}>
            {getTooltipVal(items[sel])}
          </span>
          <span style={{fontSize:11,color:T.textSec,fontFamily:T.f,marginLeft:6}}>
            {getTooltipLabel(items[sel])}
          </span>
        </>}
      </div>
      <div className="bar-scroll" style={{overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}
        ref={el=>{if(el&&barPeriod==="day")el.scrollLeft=el.scrollWidth;}}>
        <div style={{display:"flex",alignItems:"flex-end",gap,minWidth:items.length*(barW+gap)-gap,height:chartH+28}}>
          {items.map((item,i)=>{
            const val=getBarVal(item);
            const pct=Math.min(val/maxH,1);const h=pct*chartH;
            const isSel=sel===i;
            const isHighlighted=isSel;
            return (
              <div key={i} onClick={()=>setSelected(i)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",width:barW,flexShrink:0}}>
                {/* Bar + dot container */}
                <div style={{width:"100%",height:chartH,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",position:"relative"}}>
                  {/* HRV dot — positioned above bar */}
                  <div style={{width:6,height:6,borderRadius:3,marginBottom:4,flexShrink:0,
                    background:HRV_STATES[item.hrvIdx!=null?item.hrvIdx:1].color,
                    opacity:animate?1:0,transition:"opacity 0.4s ease",transitionDelay:`${i*30+300}ms`}}/>
                  <div style={{
                    width:"100%",borderRadius:barPeriod==="day"?6:8,
                    height:animate?Math.max(h,4):4,
                    background:isHighlighted?`linear-gradient(180deg, ${T.gradStart}, ${T.gradEnd}cc)`:T.borderStrong,
                    opacity:isHighlighted?1:0.6,
                    transition:`all 0.5s cubic-bezier(0.34,1.56,0.64,1)`,transitionDelay:`${i*30}ms`,
                  }}/>
                </div>
                {/* Label */}
                <span style={{fontSize:barPeriod==="day"?8:10,fontWeight:isHighlighted?700:400,marginTop:4,
                  color:isHighlighted?T.text:T.textTer,fontFamily:T.f,whiteSpace:"nowrap"}}>
                  {getLabel(item)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Detail Panel (all periods) ── */}
      {(()=>{
        const item = items[sel];
        if (!item) return null;

        // === Resolve source days & display info per period ===
        let displayDate, totalHrs, sourceItems, avgLabel;
        if (barPeriod === "day") {
          const dateObj = item.date;
          const fd = dateObj.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" });
          displayDate = fd.charAt(0).toUpperCase() + fd.slice(1);
          totalHrs = item.hrsBoosted;
          sourceItems = [item];
          // 7-day avg for comparison
          const selIdx = history.indexOf(item);
          const avgSlice = selIdx >= 0 ? history.slice(Math.max(0, selIdx - 6), selIdx + 1) : dayItems.slice(-7);
          const avg7 = avgSlice.reduce((s, x) => s + x.hrsBoosted, 0) / avgSlice.length;
          const diff = totalHrs - avg7;
          avgLabel = diff >= 0 ? `o ${Math.abs(diff).toFixed(1)} h více než průměr` : `o ${Math.abs(diff).toFixed(1)} h méně než průměr`;
        } else if (barPeriod === "week") {
          displayDate = `Týden ${item.label}`;
          totalHrs = item.total;
          sourceItems = item.items || [];
          // Compare to adjacent weeks avg
          const otherWeeks = weekItems.filter((_, i) => i !== sel);
          if (otherWeeks.length > 0) {
            const avgTotal = otherWeeks.reduce((s, w) => s + w.total, 0) / otherWeeks.length;
            const diff = totalHrs - avgTotal;
            avgLabel = diff >= 0 ? `o ${Math.abs(diff).toFixed(1)} h více než průměr týdnů` : `o ${Math.abs(diff).toFixed(1)} h méně než průměr týdnů`;
          } else { avgLabel = ""; }
        } else {
          const fd = item.date.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
          displayDate = fd.charAt(0).toUpperCase() + fd.slice(1);
          totalHrs = item.total;
          sourceItems = item.items || [];
          const otherMonths = monthItems.filter((_, i) => i !== sel);
          if (otherMonths.length > 0) {
            const avgTotal = otherMonths.reduce((s, m) => s + m.total, 0) / otherMonths.length;
            const diff = totalHrs - avgTotal;
            avgLabel = diff >= 0 ? `o ${Math.abs(diff).toFixed(1)} h více než průměr měsíců` : `o ${Math.abs(diff).toFixed(1)} h méně než průměr měsíců`;
          } else { avgLabel = ""; }
        }

        // Stars based on daily avg for week/month, or absolute for day
        const dailyAvgHrs = barPeriod === "day" ? totalHrs : (sourceItems.length > 0 ? totalHrs / sourceItems.length : 0);
        const stars = dailyAvgHrs > 5 ? 3 : dailyAvgHrs > 3 ? 2 : dailyAvgHrs > 1 ? 1 : 0;

        // Pillar averages across source items
        const pillarAvgs = {};
        PILLARS.forEach(p => {
          pillarAvgs[p.key] = sourceItems.length > 0
            ? sourceItems.reduce((s, d) => s + (d.pillars[p.key] || 0), 0) / sourceItems.length
            : 0;
        });

        // HRV state (most common in period)
        const hrvCounts = [0, 0, 0];
        sourceItems.forEach(d => { hrvCounts[d.hrvIdx != null ? d.hrvIdx : 1]++; });
        const dominantHrv = hrvCounts.indexOf(Math.max(...hrvCounts));
        const hrvS = HRV_STATES[dominantHrv];

        // Streak — consecutive days with >0 hours counting back from last day in sourceItems
        let streak = 0;
        if (sourceItems.length > 0) {
          const lastDay = sourceItems[sourceItems.length - 1];
          const lastIdx = history.indexOf(lastDay);
          if (lastIdx >= 0) {
            for (let i = lastIdx; i >= 0; i--) { if (history[i].hrsBoosted > 0) streak++; else break; }
          }
        }

        // Best period badge
        let bestBadge = null;
        if (barPeriod === "day") {
          const dateObj = item.date;
          const dow = dateObj.getDay();
          const monOff = dow === 0 ? 6 : dow - 1;
          const mon = new Date(dateObj); mon.setDate(mon.getDate() - monOff); mon.setHours(0,0,0,0);
          const sun = new Date(mon); sun.setDate(sun.getDate() + 6); sun.setHours(23,59,59,999);
          const wd = history.filter(x => x.date >= mon && x.date <= sun);
          if (wd.length > 0 && wd.every(x => item.hrsBoosted >= x.hrsBoosted)) bestBadge = "Nejlepší den tohoto týdne";
        } else if (barPeriod === "week") {
          if (weekItems.length > 1 && weekItems.every(w => item.total >= w.total)) bestBadge = "Nejlepší týden";
        } else {
          if (monthItems.length > 1 && monthItems.every(m => item.total >= m.total)) bestBadge = "Nejlepší měsíc";
        }

        // Format total hours display
        const hrsDisplay = barPeriod === "day" ? `${totalHrs.toFixed(1)} h` : `${totalHrs.toFixed(0)} h`;
        const daysExtra = barPeriod !== "day" ? ` (${(totalHrs / 24).toFixed(1)} dní)` : "";

        return (
          <div style={{
            borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 12,
            overflow: "hidden", transition: "max-height 0.3s ease, opacity 0.3s ease",
            maxHeight: 500, opacity: 1,
          }}>
            {/* Row 1 — Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.f }}>{displayDate}</span>
              <span style={{ fontSize: 14, letterSpacing: 1 }} title={`${stars}/3`}>
                {"★".repeat(stars)}{"☆".repeat(3 - stars)}
              </span>
            </div>

            {/* Row 2 — Hours summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "white", fontFamily: T.f,
                background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
                borderRadius: 10, padding: "2px 10px",
              }}>{hrsDisplay}{daysExtra}</span>
              {avgLabel && <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.f }}>{avgLabel}</span>}
            </div>

            {/* Row 2.5 — Period stats (week/month only) */}
            {barPeriod !== "day" && sourceItems.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ background: T.cardAlt, borderRadius: T.rXs, padding: "6px 10px", textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.primary, fontFamily: T.f }}>{(totalHrs / sourceItems.length).toFixed(1)}h</div>
                  <div style={{ fontSize: 9, color: T.textTer, fontWeight: 600, fontFamily: T.f, textTransform: "uppercase" }}>Průměr/den</div>
                </div>
                <div style={{ background: T.cardAlt, borderRadius: T.rXs, padding: "6px 10px", textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.green, fontFamily: T.f }}>
                    {Math.max(...sourceItems.map(d => d.hrsBoosted)).toFixed(1)}h
                  </div>
                  <div style={{ fontSize: 9, color: T.textTer, fontWeight: 600, fontFamily: T.f, textTransform: "uppercase" }}>Nejlepší den</div>
                </div>
                <div style={{ background: T.cardAlt, borderRadius: T.rXs, padding: "6px 10px", textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.purple, fontFamily: T.f }}>{sourceItems.length}</div>
                  <div style={{ fontSize: 9, color: T.textTer, fontWeight: 600, fontFamily: T.f, textTransform: "uppercase" }}>Dní</div>
                </div>
              </div>
            )}

            {/* Row 3 — Pillar breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {PILLARS.map(p => {
                const val = pillarAvgs[p.key] || 0;
                const hrs = barPeriod === "day"
                  ? (val * p.maxMin / 60).toFixed(1)
                  : (val * p.maxMin * sourceItems.length / 60).toFixed(1);
                const softBg = isDark ? (p.darkSoft || p.soft) : p.soft;
                const hrsLabel = `${hrs}h`;
                return (
                  <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, width: 18, textAlign: "center", flexShrink: 0 }}>{p.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textSec, fontFamily: T.f, width: 62, flexShrink: 0 }}>{p.label}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: softBg, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(val * 100, 100)}%`, background: p.color, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.text, fontFamily: T.f, width: 44, textAlign: "right", flexShrink: 0 }}>
                      {hrsLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Row 4 — Gamification */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {streak > 1 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: isDark ? PILLARS[1].darkSoft : PILLARS[1].soft,
                  borderRadius: 10, padding: "3px 10px",
                }}>
                  <span style={{ fontSize: 11 }}>🔥</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, fontFamily: T.f }}>{streak} dní v řadě</span>
                </div>
              )}
              {bestBadge && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: isDark ? PILLARS[0].darkSoft : PILLARS[0].soft,
                  borderRadius: 10, padding: "3px 10px",
                }}>
                  <span style={{ fontSize: 11 }}>🏆</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.primary, fontFamily: T.f }}>{bestBadge}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PERIOD SUMMARY
// ═══════════════════════════════════════════════════
function PeriodSummary({ history, period, activePillars }) {
  const T = useTheme();
  const isDark = T === DARK;
  const items=period==="week"?history.slice(-7):history.slice(-30);
  const totalHrs=items.reduce((s,d)=>s+d.hrsBoosted,0);
  const totalDays=(totalHrs/24).toFixed(1);
  const avgHrs=(totalHrs/items.length).toFixed(1);
  const bestDay=items.reduce((b,d)=>d.hrsBoosted>b.hrsBoosted?d:b,items[0]);
  const streakDays=(()=>{let s=0;for(let i=items.length-1;i>=0;i--){if(items[i].hrsBoosted>=2)s++;else break;}return s;})();
  const periodLabel=period==="week"?"Tento týden":"Tento měsíc";
  return (
    <div style={{background:T.card,borderRadius:T.r,padding:"16px",boxShadow:T.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{width:6,height:6,borderRadius:3,background:T.green}}/>
        <span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:T.f}}>{periodLabel}</span>
      </div>
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,fontWeight:800,fontFamily:T.f,lineHeight:1.1,color:T.primary}}>+{totalDays}</div>
        <div style={{fontSize:13,color:T.textSec,fontFamily:T.f,marginTop:2}}>dní zdraví navíc</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {label:"Průměr/den",value:`${avgHrs}h`,color:T.primary,icon:"📊"},
          {label:"Nejlepší den",value:`${bestDay.hrsBoosted.toFixed(1)}h`,color:T.green,icon:"🏆"},
          {label:"Streak",value:`${streakDays}d`,color:T.purple,icon:"🔥"},
        ].map(s=>(
          <div key={s.label} style={{background:T.cardAlt,borderRadius:T.rXs,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:14,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:16,fontWeight:700,color:s.color,fontFamily:T.f}}>{s.value}</div>
            <div style={{fontSize:9,color:T.textTer,fontWeight:600,fontFamily:T.f,marginTop:2,textTransform:"uppercase",letterSpacing:0.3}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
        <div style={{fontSize:11,color:T.textTer,fontWeight:600,fontFamily:T.f,marginBottom:8,textTransform:"uppercase",letterSpacing:0.8}}>Průměrné plnění pilířů</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {activePillars.map(p=>{
            const avg=Math.min(items.reduce((s,d)=>s+(d.pillars[p.key]||0),0)/items.length,1);
            const avgHrs=(avg*p.maxMin/60).toFixed(1);
            const softBg = isDark ? (p.darkSoft || p.soft) : p.soft;
            return(<div key={p.key} style={{display:"flex",alignItems:"center",gap:5,background:softBg,borderRadius:20,padding:"4px 10px"}}>
              <span style={{fontSize:12}}>{p.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:p.color,fontFamily:T.f}}>{avgHrs}h</span>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// NUDGE CARDS
// ═══════════════════════════════════════════════════
const NUDGE_MESSAGES = {
  pohyb: { msg: "Pohyb je královský pilíř — 1 hodina aktivity ti přidá až 2.5h zdraví.", cta: "Otevřít pohybový plán" },
  spanek: { msg: "Kvalitní spánek ti může přidat celou hodinu zdraví denně.", cta: "Nastavit spánkový návyk" },
  strava: { msg: "Správná strava sníží záněty a přidá ti až 1h zdraví denně.", cta: "Přidat stravovací návyk" },
  stres: { msg: "Dechové cvičení + meditace = 0.5h zdraví denně. Stačí 5 minut.", cta: "Vyzkoušet dechové cvičení" },
  vztahy: { msg: "Kvalitní vztahy jsou nejsilnější prediktor zdraví ve stáří.", cta: "Přidat sociální návyk" },
  monitoring: { msg: "Ranní HRV měření ti přidá 0.5h zdraví + odemkne bonus.", cta: "Změřit HRV" },
};

function NudgeCards({ data, activePillars }) {
  const T = useTheme();
  const isDark = T === DARK;
  const low = activePillars.filter(p => data[p.key] < 0.15);
  if (low.length === 0) return null;
  const show = low.slice(0, 2);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {show.map(p => {
        const n = NUDGE_MESSAGES[p.key];
        if (!n) return null;
        const potentialHrs = (p.maxMin / 60).toFixed(1);
        const softBg = isDark ? (p.darkSoft || p.soft) : p.soft;
        return (
          <div key={p.key} style={{
            background:T.card, borderRadius:T.r, padding:"14px 16px",
            boxShadow:T.shadow,
            borderLeft:`4px solid ${p.color}`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:8,background:softBg,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{p.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:T.f}}>{p.label}</div>
                <div style={{fontSize:11,color:p.color,fontWeight:600,fontFamily:T.f}}>+{potentialHrs}h zdraví/den</div>
              </div>
            </div>
            <div style={{fontSize:12,color:T.textSec,lineHeight:1.5,fontFamily:T.f,marginBottom:10}}>{n.msg}</div>
            <div style={{
              display:"inline-flex",alignItems:"center",gap:6,
              background:softBg,borderRadius:20,padding:"7px 14px",cursor:"pointer",
            }}>
              <span style={{fontSize:12,fontWeight:700,color:p.color,fontFamily:T.f}}>{n.cta}</span>
              <span style={{fontSize:12,color:p.color}}>→</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PILLAR PILL
// ═══════════════════════════════════════════════════
function PillarPill({ pillar, value, onChange, celebrated, onCelebrate, ageCoef = 1 }) {
  const T = useTheme();
  const isDark = T === DARK;
  const pct=Math.round(Math.min(value, 1)*100);
  const hly=((pillar.maxMin*Math.min(value,1)*ageCoef)/60).toFixed(1);
  const isFull = pct >= 95;
  const justCompleted = celebrated === pillar.key;
  const softBg = isDark ? (pillar.darkSoft || pillar.soft) : pillar.soft;

  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`,
      position:"relative",overflow:"hidden"}}>
      {justCompleted&&<div style={{
        position:"absolute",inset:0,
        background:`linear-gradient(90deg, ${pillar.color}15, transparent)`,
        borderRadius:8,
        animation:"fadeOut 2s ease forwards",
      }}/>}
      <div style={{width:34,height:34,borderRadius:9,
        background:isFull?`linear-gradient(135deg, ${pillar.color}30, ${pillar.color}10)`:softBg,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,
        boxShadow:isFull?`0 0 12px ${pillar.color}25`:"none",
        transition:"all 0.3s ease",
      }}>
        {isFull?"✅":pillar.icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.f}}>{pillar.label}</span>
            {isFull&&<span style={{fontSize:9,fontWeight:700,color:pillar.color,background:softBg,
              padding:"1px 6px",borderRadius:10,fontFamily:T.f}}>SPLNĚNO</span>}
          </div>
          <span style={{fontSize:12,fontWeight:700,color:pillar.color,background:softBg,padding:"2px 8px",borderRadius:20,fontFamily:T.f}}>{hly}h</span>
        </div>
        <div style={{position:"relative",height:5,borderRadius:3,background:T.border,overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,borderRadius:3,width:`${pct}%`,
            background:isFull?`linear-gradient(90deg, ${pillar.color}, ${pillar.color}CC)`:pillar.color,
            transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow:isFull?`0 0 8px ${pillar.color}40`:"none",
          }}/>
        </div>
        {justCompleted&&<div style={{fontSize:11,fontWeight:600,color:pillar.color,fontFamily:T.f,marginTop:4,
          animation:"slideUp 0.4s ease"}}>
          🎉 {pillar.label} splněn! +{hly}h zdraví dnes
        </div>}
        <input type="range" min="0" max="100" value={pct} onChange={e=>{
          const newVal=Number(e.target.value)/100;
          const wasFull=value>=0.95;const nowFull=newVal>=0.95;
          if(!wasFull&&nowFull&&onCelebrate)onCelebrate(pillar.key);
          onChange(newVal);
        }}
          style={{width:"100%",marginTop:-3,height:18,opacity:0,cursor:"pointer",position:"relative",zIndex:2}}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// THE GAP
// ═══════════════════════════════════════════════════
function TheGap({ data, todayData, hrvState, age, onAgeChange, funcAge, onFuncAgeChange, ageCoef, animate, activePillars, history }) {
  const T = useTheme();
  const effectiveAge = funcAge != null ? funcAge : age;
  // Compute age coefficient locally for slider changes (uses effective age)
  const currentAgeCoef = calcAgeCoef(effectiveAge);
  // Today's hours — always from todayData, not period-dependent, with age coefficient
  const todayMin=activePillars.reduce((s,p)=>s+p.maxMin*(todayData[p.key]||0),0);
  const todayHrs=(todayMin*HRV_STATES[hrvState].mult*currentAgeCoef)/60;
  // Projection uses todayData so it never changes with period filter
  const totalMin=activePillars.reduce((s,p)=>s+p.maxMin*(todayData[p.key]||0),0);
  const boosted=totalMin*HRV_STATES[hrvState].mult*currentAgeCoef;const dailyHrs=boosted/60;
  const yearlyDays=(dailyHrs*365)/24;const remaining=Math.max(65-effectiveAge,0);
  const bonusYears=remaining>0?(yearlyDays*remaining)/365:0;const projected=65+bonusYears;

  // Potential = ALL pillars (not just active), no HRV boost but with age coef — matches onboarding
  const allPillarsMax=PILLARS.reduce((s,p)=>s+p.maxMin,0)/60*currentAgeCoef;
  const allYearlyDays=(allPillarsMax*365)/24;
  const allBonusYears=remaining>0?(allYearlyDays*remaining)/365:0;
  const maxProjected=65+allBonusYears;
  const hasInactive=activePillars.filter(p=>p.key!=="monitoring").length<PILLARS.filter(p=>p.key!=="monitoring").length;

  const scaleMax=Math.max(82,Math.ceil(maxProjected)+2);
  const toPct=yr=>Math.min(Math.max(((yr-effectiveAge)/(scaleMax-effectiveAge))*100,0),100);
  const basePct=toPct(65);const projPct=toPct(Math.min(projected,scaleMax));
  const maxPct=toPct(Math.min(maxProjected,scaleMax));
  const monthItems=history?history.filter(d=>{const now=new Date();return d.date.getMonth()===now.getMonth()&&d.date.getFullYear()===now.getFullYear();}):[];
  const monthTotalHrs=monthItems.reduce((s,d)=>s+d.hrsBoosted,0);
  const monthDays=(monthTotalHrs/24).toFixed(1);
  const untappedYears=(maxProjected-projected).toFixed(1);
  const markers=[];for(let y=Math.ceil(effectiveAge/5)*5;y<=scaleMax;y+=5)if(y>effectiveAge)markers.push(y);
  const ageDiff = Math.round((age - effectiveAge) * 10) / 10;
  return (
    <div style={{background:T.card,borderRadius:T.r,padding:"20px 16px 16px",boxShadow:T.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <div style={{width:6,height:6,borderRadius:3,background:`linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`}}/>
        <span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:T.f}}>Tvá cesta ke zdraví</span>
        <span style={{marginLeft:"auto",fontSize:13,color:T.textTer}}>›</span>
      </div>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:42,fontWeight:800,fontFamily:T.f,lineHeight:1.1,color:T.primary}}>{projected.toFixed(1)}</div>
        <div style={{fontSize:13,color:T.textSec,fontFamily:T.f,marginTop:3}}>let ve zdraví</div>
      </div>

      {/* Potential bar — only when not all pillars active */}
      {hasInactive && <div style={{marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:4,border:`2px dashed ${T.gradStart}88`,background:"transparent"}}/>
          <span style={{fontSize:11,color:T.textTer,fontWeight:500,fontFamily:T.f,fontStyle:"italic"}}>Tvůj potenciál</span>
          <span style={{fontSize:10,color:T.textTer,fontFamily:T.f,marginLeft:"auto"}}>{maxProjected.toFixed(1)} let</span>
        </div>
        <div style={{position:"relative",height:26,borderRadius:13,background:T.cardAlt,overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,
            width:animate?`${maxPct}%`:"0%",borderRadius:13,
            background:`repeating-linear-gradient(90deg, ${T.gradStart}20 0px, ${T.gradStart}20 4px, transparent 4px, transparent 8px)`,
            transition:"width 1.8s cubic-bezier(0.34,1.56,0.64,1)",transitionDelay:"0.6s"}}/>
        </div>
      </div>}

      {/* Your path bar */}
      <div style={{marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:4,background:`linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`}}/>
          <span style={{fontSize:11,color:T.text,fontWeight:600,fontFamily:T.f}}>{hasInactive ? "Tvá cesta" : "Tvůj potenciál"}</span>
          <span style={{fontSize:10,color:T.textTer,fontFamily:T.f,marginLeft:"auto"}}>{projected.toFixed(1)} let</span>
        </div>
        <div style={{position:"relative",height:26,borderRadius:13,background:T.cardAlt,overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:animate?`${projPct}%`:"0%",borderRadius:13,
            background:`linear-gradient(90deg, ${T.gradStart}, ${T.gradEnd})`,
            transition:"width 1.3s cubic-bezier(0.34,1.56,0.64,1)",transitionDelay:"0.2s"}}/>
          {bonusYears>0.2&&<div style={{position:"absolute",top:0,bottom:0,left:`${basePct}%`,
            width:animate?`${projPct-basePct}%`:"0%",
            background:"repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, transparent 2px, transparent 5px)",
            transition:"width 1.3s cubic-bezier(0.34,1.56,0.64,1)",transitionDelay:"0.2s"}}/>}
        </div>
      </div>

      {/* Population average bar */}
      <div style={{marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:4,background:T.borderStrong}}/>
          <span style={{fontSize:11,color:T.textSec,fontWeight:500,fontFamily:T.f}}>Průměr populace</span>
          <span style={{fontSize:10,color:T.textTer,fontFamily:T.f,marginLeft:"auto"}}>65.0 let</span>
        </div>
        <div style={{position:"relative",height:26,borderRadius:13,background:T.cardAlt,overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${basePct}%`,borderRadius:13,background:T.borderStrong}}/>
        </div>
      </div>

      {/* Scale markers */}
      <div style={{position:"relative",height:18,marginTop:4,marginBottom:14}}>
        <div style={{position:"absolute",left:0,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:1,height:5,background:T.textTer}}/><span style={{fontSize:9,color:T.textSec,fontFamily:T.f,fontWeight:600,marginTop:1}}>{age}</span>
        </div>
        {markers.map(yr=><div key={yr} style={{position:"absolute",left:`${toPct(yr)}%`,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:1,height:4,background:T.border}}/><span style={{fontSize:9,color:T.textTer,fontFamily:T.f,marginTop:1}}>{yr}</span>
        </div>)}
      </div>

      {onAgeChange && (
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
            <span style={{fontSize:11,color:T.textTer,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,width:24}}>KV</span>
            <input type="range" className="age-slider" min="20" max="70" step="0.1" value={age} onChange={e=>onAgeChange(Number(e.target.value))}
              style={{flex:1,height:18}}/>
            <span style={{fontSize:16,fontWeight:700,color:T.text,width:36,textAlign:"right",fontFamily:T.f}}>{Number(age).toFixed(1)}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
            <span style={{fontSize:11,color:T.green,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,width:24}}>FV</span>
            <input type="range" className="age-slider" min="20" max="70" step="0.1" value={effectiveAge} onChange={e=>onFuncAgeChange(Number(e.target.value))}
              style={{flex:1,height:18}}/>
            <span style={{fontSize:16,fontWeight:700,color:T.green,width:36,textAlign:"right",fontFamily:T.f}}>{Number(effectiveAge).toFixed(1)}</span>
            <span style={{fontSize:11,fontWeight:600,color:T.purple,background:T.purpleSoft,padding:"2px 6px",borderRadius:T.rXs,fontFamily:T.f}}>×{currentAgeCoef.toFixed(2)}</span>
          </div>
          {ageDiff > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",
              background:T.greenSoft,borderRadius:T.rXs,marginTop:4}}>
              <span style={{fontSize:13}}>💪</span>
              <span style={{fontSize:12,color:T.green,fontWeight:600,fontFamily:T.f}}>
                Tvé tělo je o {ageDiff} {ageDiff === 1 ? "rok" : ageDiff < 5 ? "roky" : "let"} mladší než KV
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{background:`linear-gradient(135deg, ${T.gradStart}0D, ${T.gradEnd}08)`,borderRadius:T.rSm,padding:"12px 14px",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:13,color:T.text,lineHeight:1.6,fontFamily:T.f}}>
          Dnes si svůj zdravý život prodloužil o <span style={{fontWeight:700,color:T.primary}}>{todayHrs.toFixed(1)} hodin</span>.
        </div>
        <div style={{fontSize:12,color:T.textSec,lineHeight:1.5,fontFamily:T.f,marginTop:2}}>
          Za poslední měsíc jsi získal <span style={{fontWeight:600,color:T.pink}}>{monthDays} dní</span> zdraví navíc.
        </div>
      </div>

      {hasInactive&&parseFloat(untappedYears)>0.5&&(
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,padding:"8px 12px",
          background:T.cardAlt,borderRadius:T.rXs,border:`1px dashed ${T.gradStart}40`}}>
          <span style={{fontSize:16}}>✨</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:T.textSec,fontFamily:T.f,lineHeight:1.4}}>
              Nevyužitý potenciál: <span style={{fontWeight:700,color:T.primary}}>+{untappedYears} let</span>
            </div>
            <div style={{fontSize:10,color:T.textTer,fontFamily:T.f,marginTop:1}}>
              Pokryj další pilíře a posuň svou hranici
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DEBUG PANEL
// ═══════════════════════════════════════════════════
function DebugPanel({ userId, onClose }) {
  const T = useTheme();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const changingRef = useRef(false);

  const loadDebug = useCallback(async (d, uid) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDebug(d, uid);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDebug(date, userId); }, [date, userId, loadDebug]);

  const changeDate = (delta) => {
    if (changingRef.current) return;
    changingRef.current = true;
    setDate(prev => {
      const d = new Date(prev + 'T12:00:00');
      d.setDate(d.getDate() + delta);
      return d.toISOString().slice(0, 10);
    });
    setTimeout(() => { changingRef.current = false; }, 300);
  };

  const formatDate = (d) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return 'Dnes';
    if (d === yesterday) return 'Včera';
    return new Date(d + 'T00:00:00').toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const pillarsOrder = ['pohyb', 'spanek', 'strava', 'stres', 'vztahy', 'monitoring'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: T.card, borderRadius: T.r, width: '100%', maxWidth: 420, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: T.shadowLg,
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🐛</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Debug Mode</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20, color: T.textTer, cursor: 'pointer',
          }}>×</button>
        </div>

        {/* Date selector */}
        <div style={{
          padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button type="button" onClick={() => changeDate(-1)} style={{
            background: T.primarySoft, border: 'none', borderRadius: 8, padding: '8px 14px',
            color: T.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>◀ Předchozí</button>
          <div style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{formatDate(date)}</div>
            <div style={{ fontSize: 11, color: T.textTer }}>{date}</div>
          </div>
          <button type="button" onClick={() => changeDate(1)} style={{
            background: T.primarySoft, border: 'none', borderRadius: 8, padding: '8px 14px',
            color: T.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13,
          }}>Další ▶</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading && <div style={{ textAlign: 'center', color: T.textTer, padding: 40 }}>Načítám...</div>}
          {error && <div style={{ color: T.red, padding: 16, background: T.redSoft, borderRadius: 8 }}>{error}</div>}
          {data && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* TOTALS - First and prominent at top */}
              <div style={{
                background: `linear-gradient(135deg, ${T.gradStart}20, ${T.gradEnd}15)`,
                borderRadius: T.r, padding: 16, border: `2px solid ${T.primary}50`,
              }}>
                {/* Main total - BIG */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textTer, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Celkem HLY za den</div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: T.primary, lineHeight: 1 }}>
                    {data.totals.withHrvHours}h
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textTer, marginBottom: 8, textTransform: 'uppercase' }}>Složení výpočtu</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSec }}>
                      <span>Raw (základ)</span>
                      <span style={{ fontWeight: 600, color: T.text }}>{data.totals.rawHours}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSec }}>
                      <span>× Věk <span style={{ color: T.purple, fontWeight: 600 }}>({data.totals.ageCoef})</span></span>
                      <span style={{ fontWeight: 600, color: T.text }}>{data.totals.withAgeHours}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textSec }}>
                      <span>× HRV (různé)</span>
                      <span style={{ fontWeight: 700, color: T.primary }}>{data.totals.withHrvHours}h</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: T.textTer, fontFamily: 'monospace', marginTop: 10, padding: '8px 10px', background: T.cardAlt, borderRadius: 8, textAlign: 'center' }}>
                    {data.totals.formula}
                  </div>
                </div>

                {/* HRV Application Breakdown */}
                {data.totals.breakdown && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textTer, marginBottom: 8, textTransform: 'uppercase' }}>HRV Boost</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12, color: T.text, padding: '8px 10px', background: T.card, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><span style={{ color: T.yellow }}>⚡</span> Včerejší HRV <span style={{ color: T.textTer }}>({data.totals.breakdown.pohyb.hrvMult > 1 ? 'Nadprůměr' : data.totals.breakdown.pohyb.hrvMult === 1 ? 'Pod průměrem' : 'V normě'} ×{data.totals.breakdown.pohyb.hrvMult})</span> → pohyb</span>
                        <span style={{ fontWeight: 700 }}>{data.totals.breakdown.pohyb.hours}h</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.text, padding: '8px 10px', background: T.card, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><span style={{ color: T.yellow }}>⚡</span> Dnešní HRV <span style={{ color: T.textTer }}>({data.totals.breakdown.habitsAndMonitoring.hrvMult > 1.1 ? 'Nadprůměr' : data.totals.breakdown.habitsAndMonitoring.hrvMult > 1 ? 'V normě' : 'Pod průměrem'} ×{data.totals.breakdown.habitsAndMonitoring.hrvMult})</span> → habits + monitoring</span>
                        <span style={{ fontWeight: 700 }}>{data.totals.breakdown.habitsAndMonitoring.hours}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User info */}
              <div style={{ background: T.cardAlt, borderRadius: T.rSm, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textTer, textTransform: 'uppercase' }}>Uživatel</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>
                    {USERS.find(u => u.id === userId)?.name} <span style={{ color: T.textTer, fontWeight: 400 }}>#{userId}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div><span style={{ color: T.textTer }}>KV:</span> <span style={{ fontWeight: 600, color: T.text }}>{data.user.age}</span></div>
                  <div><span style={{ color: T.textTer }}>FV:</span> <span style={{ fontWeight: 600, color: T.green }}>{data.user.funcAge ?? '—'}</span></div>
                  <div><span style={{ color: T.textTer }}>Efektivní:</span> <span style={{ fontWeight: 600, color: T.text }}>{data.user.effectiveAge}</span></div>
                  <div><span style={{ color: T.textTer }}>Koef:</span> <span style={{ fontWeight: 700, color: T.purple }}>×{data.user.ageCoef}</span></div>
                </div>
              </div>

              {/* HRV - Today and Yesterday */}
              {data.hrvInfo && (
                <div style={{ background: T.cardAlt, borderRadius: T.rSm, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textTer, marginBottom: 8, textTransform: 'uppercase' }}>HRV Boost</div>

                  {/* Today's HRV - for habits */}
                  <div style={{ marginBottom: 8, padding: '8px 10px', background: T.card, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.textTer, marginBottom: 4 }}>DNES ({data.hrvInfo.today.date}) → habits + monitoring</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: data.hrvInfo.today.state === 2 ? T.purpleSoft : data.hrvInfo.today.state === 1 ? T.greenSoft : T.redSoft,
                        color: data.hrvInfo.today.state === 2 ? T.purple : data.hrvInfo.today.state === 1 ? T.green : T.red,
                      }}>{data.hrvInfo.today.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>×{data.hrvInfo.today.multiplier}</span>
                      {data.hrvInfo.today.readiness != null && (
                        <span style={{ fontSize: 10, color: T.textTer }}>readiness: {data.hrvInfo.today.readiness}</span>
                      )}
                    </div>
                  </div>

                  {/* Yesterday's HRV - for activity */}
                  <div style={{ padding: '8px 10px', background: T.card, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.textTer, marginBottom: 4 }}>VČERA ({data.hrvInfo.yesterday.date}) → pohyb</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                        background: data.hrvInfo.yesterday.state === 2 ? T.purpleSoft : data.hrvInfo.yesterday.state === 1 ? T.greenSoft : T.redSoft,
                        color: data.hrvInfo.yesterday.state === 2 ? T.purple : data.hrvInfo.yesterday.state === 1 ? T.green : T.red,
                      }}>{data.hrvInfo.yesterday.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>×{data.hrvInfo.yesterday.multiplier}</span>
                      {data.hrvInfo.yesterday.readiness != null && (
                        <span style={{ fontSize: 10, color: T.textTer }}>readiness: {data.hrvInfo.yesterday.readiness}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pillars */}
              {pillarsOrder.map(key => {
                const p = data.pillars[key];
                if (!p) return null;
                return (
                  <div key={key} style={{ background: T.cardAlt, borderRadius: T.rSm, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                          background: p.percent >= 100 ? T.greenSoft : p.percent > 0 ? T.primarySoft : T.graySoft,
                          color: p.percent >= 100 ? T.green : p.percent > 0 ? T.primary : T.textTer,
                        }}>{p.percent}%</span>
                        <span style={{ fontSize: 11, color: T.textTer }}>{p.hours}h</span>
                        <span style={{ fontSize: 9, color: T.green }}>×HRV</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{p.hoursWithHrv}h</span>
                      </div>
                    </div>
                    {p.hrvNote && (
                      <div style={{ fontSize: 10, color: T.purple, marginBottom: 8, fontStyle: 'italic' }}>
                        ⚡ {p.hrvNote}
                      </div>
                    )}

                    {/* Habits breakdown */}
                    {p.source === 'habits' && p.habits && (
                      <div style={{ fontSize: 11, color: T.textSec }}>
                        {/* Rule explanation */}
                        {p.rule && (
                          <div style={{ marginBottom: 8, padding: '6px 8px', background: T.purpleSoft, borderRadius: 6, color: T.purple }}>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>📐 {p.rule.description}</div>
                            <div style={{ fontSize: 10 }}>{p.rule.weights}</div>
                            <div style={{ fontSize: 10, marginTop: 2 }}>{p.rule.example}</div>
                          </div>
                        )}
                        {p.habits.map((h, i) => (
                          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                            <span style={{ color: h.completed ? T.green : T.red }}>{h.completed ? '✓' : '✗'}</span>
                            <span style={{ flex: 1 }}>#{h.id} {h.name}</span>
                            <span style={{ color: T.textTer }}>váha {h.weight}</span>
                            <span style={{ fontWeight: 600 }}>→ {h.contribution.toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6, color: T.textTer }}>
                          Součet: {p.calculation.weightedSum} / max {p.calculation.maxPossible} = {p.calculation.normalized} ({p.percent}%)
                        </div>
                        <div style={{ color: T.textTer }}>
                          {(p.maxMin/60).toFixed(1)}h × {p.calculation.normalized} × Age({data.user.ageCoef}) = {p.hours}h
                        </div>
                        <div style={{ color: T.green, fontWeight: 600 }}>
                          {p.hours}h × HRV({p.hrvMult}) = {p.hoursWithHrv}h
                        </div>
                      </div>
                    )}

                    {/* Activity breakdown */}
                    {p.source === 'activity' && p.activity && (
                      <div style={{ fontSize: 11, color: T.textSec }}>
                        {/* Rule explanation */}
                        {p.rule && (
                          <div style={{ marginBottom: 8, padding: '6px 8px', background: T.purpleSoft, borderRadius: 6, color: T.purple }}>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>📐 {p.rule.description}</div>
                            <div style={{ fontSize: 10 }}>{p.rule.example}</div>
                          </div>
                        )}
                        <div style={{ marginBottom: 4 }}>Activity Plan: {p.activity.completed}/{p.activity.total} splněno</div>
                        {p.activity.items.map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                            <span style={{ color: a.completed ? T.green : T.red }}>{a.completed ? '✓' : '✗'}</span>
                            <span>{a.name}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6, color: T.textTer }}>
                          {(p.maxMin/60).toFixed(1)}h × {p.value.toFixed(2)} × Age({data.user.ageCoef}) = {p.hours}h
                        </div>
                        <div style={{ color: T.green, fontWeight: 600 }}>
                          {p.hours}h × HRV({p.hrvMult}) = {p.hoursWithHrv}h
                        </div>
                      </div>
                    )}

                    {/* Monitoring breakdown */}
                    {p.source === 'measurement' && (
                      <div style={{ fontSize: 11, color: T.textSec }}>
                        <div>HRV měření: {p.hasMeasurement ? '✓ Ano' : '✗ Ne'}</div>
                        <div style={{ color: T.textTer, marginTop: 4 }}>
                          {(p.maxMin/60).toFixed(1)}h × {p.value} × Age({data.user.ageCoef}) = {p.hours}h
                        </div>
                        <div style={{ color: T.green, fontWeight: 600 }}>
                          {p.hours}h × HRV({p.hrvMult}) = {p.hoursWithHrv}h
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Documentation Card */}
              <div style={{ background: T.cardAlt, borderRadius: T.rSm, padding: 14, marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📚</span> Dokumentace výpočtu HLY
                </div>

                {/* Age coefficient */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 6 }}>Věkový koeficient</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
                    <div>• Věk &lt; 35 let: <strong>×1.0</strong></div>
                    <div>• Věk 35-44 let: <strong>×1.2</strong></div>
                    <div>• Věk ≥ 45 let: <strong>×1.5</strong></div>
                    <div style={{ color: T.textTer, marginTop: 4, fontSize: 10 }}>
                      Používá se funkční věk (z HRV měření) pokud je dostupný, jinak chronologický věk.
                    </div>
                  </div>
                </div>

                {/* HRV Boost */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6 }}>HRV Boost</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
                    <div>• Pod průměrem: <strong>×1.0</strong></div>
                    <div>• V normě: <strong>×1.1</strong></div>
                    <div>• Nadprůměr: <strong>×1.25</strong></div>
                    <div style={{ color: T.textTer, marginTop: 4, fontSize: 10 }}>
                      Dnešní HRV → včerejší návyky + dnešní monitoring<br/>
                      Včerejší HRV → včerejší pohyb
                    </div>
                  </div>
                </div>

                {/* Pillars table */}
                <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 8 }}>Pilíře a jejich maximum</div>
                <div style={{ fontSize: 11, color: T.textSec }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <th style={{ textAlign: 'left', padding: '4px 0', color: T.textTer, fontWeight: 600 }}>Pilíř</th>
                        <th style={{ textAlign: 'center', padding: '4px 0', color: T.textTer, fontWeight: 600 }}>Max</th>
                        <th style={{ textAlign: 'center', padding: '4px 0', color: T.textTer, fontWeight: 600 }}>Návyky</th>
                        <th style={{ textAlign: 'right', padding: '4px 0', color: T.textTer, fontWeight: 600 }}>Zdroj</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 0' }}>🏃 Pohyb</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>2.5h</td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'right', fontSize: 10, color: T.textTer }}>Activity Plan</td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 0' }}>😴 Spánek</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>1.5h</td>
                        <td style={{ textAlign: 'center' }}>2</td>
                        <td style={{ textAlign: 'right', fontSize: 10, color: T.textTer }}>Habits</td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 0' }}>🥗 Strava</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>1.5h</td>
                        <td style={{ textAlign: 'center' }}>2</td>
                        <td style={{ textAlign: 'right', fontSize: 10, color: T.textTer }}>Habits</td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 0' }}>🧘 Stres</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>0.8h</td>
                        <td style={{ textAlign: 'center' }}>2</td>
                        <td style={{ textAlign: 'right', fontSize: 10, color: T.textTer }}>Habits</td>
                      </tr>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 0' }}>❤️ Vztahy</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>0.5h</td>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'right', fontSize: 10, color: T.textTer }}>Habits</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0' }}>📊 Monitoring</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>0.5h</td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'right', fontSize: 10, color: T.textTer }}>HRV měření</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Diminishing returns */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Diminishing Returns (návyky)</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
                    <div>• 1. návyk: <strong>100%</strong> hodnoty</div>
                    <div>• 2. návyk: <strong>50%</strong> hodnoty</div>
                    <div>• 3. návyk: <strong>25%</strong> hodnoty</div>
                    <div>• 4. návyk: <strong>12.5%</strong> hodnoty...</div>
                    <div style={{ color: T.textTer, marginTop: 4, fontSize: 10 }}>
                      Vzorec: váha = 0.5^(pořadí-1)
                    </div>
                  </div>
                </div>

                {/* Activity calculation */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Výpočet pohybu</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>
                    <div>• <strong>240 kcal = 1h HLY</strong></div>
                    <div>• 1h intenzivního pohybu (~600 kcal) = 2.5h HLY</div>
                    <div style={{ color: T.textTer, marginTop: 4, fontSize: 10 }}>
                      Hodnota = splněné aktivity / celkem aktivit × max_h
                    </div>
                  </div>
                </div>

                {/* Final formula */}
                <div style={{ marginTop: 14, padding: 10, background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Celkový vzorec</div>
                  <div style={{ fontSize: 11, color: T.textSec, fontFamily: 'monospace', lineHeight: 1.6 }}>
                    <div>HLY = Σ (pilíř_max × hodnota × věk_koef × hrv_boost)</div>
                    <div style={{ marginTop: 6, color: T.textTer, fontSize: 10 }}>
                      Kde hodnota = 0-1 (normalizováno podle splněných návyků/aktivit)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function ElongaHLY() {
  const [darkMode, setDarkMode] = useState(false);
  const T = darkMode ? DARK : LIGHT;

  // Global user selection
  const [userId, setUserId] = useState(DEFAULT_USER_ID);

  const [screen, setScreen] = useState("dashboard");
  const [onbStep, setOnbStep] = useState(0);
  const [onbSetupIdx, setOnbSetupIdx] = useState(0);
  const [onbAnswers, setOnbAnswers] = useState({});
  const [spanekGoals, setSpanekGoals] = useState([]);
  const [spanekHours, setSpanekHours] = useState(7.5);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [multiChoices, setMultiChoices] = useState([]);

  const [enabled, setEnabled] = useState({ pohyb: true, spanek: true, strava: true, stres: true, vztahy: true });
  const togglePillar = (k) => setEnabled(s => ({ ...s, [k]: !s[k] }));
  const activePillars = PILLARS.filter(p => enabled[p.key] || p.key === "monitoring");
  const selectablePillars = PILLARS.filter(p => p.key !== "monitoring");

  const [chartView, setChartView] = useState("radar");
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState(null);
  const [hrvState, setHrvState] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [age, setAge] = useState(37);
  const [funcAge, setFuncAge] = useState(null);
  const [ageCoef, setAgeCoef] = useState(1.0);
  const [celebrated, setCelebrated] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Load real data from API, fall back to demo data on error
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const [todayRes, historyRes] = await Promise.all([
          fetchToday(userId),
          fetchHistory(365, userId),
        ]);
        if (cancelled) return;
        setData(todayRes.pillars);
        setHrvState(todayRes.hrvState);
        if (todayRes.age) setAge(todayRes.age);
        if (todayRes.funcAge != null) setFuncAge(todayRes.funcAge);
        if (todayRes.ageCoef != null) setAgeCoef(todayRes.ageCoef);

        // Transform history entries to match expected shape
        // Use age coefficient from API response
        const historyAgeCoef = todayRes.ageCoef || calcAgeCoef(todayRes.funcAge ?? todayRes.age ?? 37);
        const transformed = historyRes.history.map(entry => {
          const d = new Date(entry.date + 'T00:00:00');
          const pillars = entry.pillars;
          const hrsRaw = PILLARS.reduce((s, p) => s + p.maxMin * (pillars[p.key] || 0), 0) / 60;
          const hrsBoosted = hrsRaw * HRV_STATES[entry.hrvIdx].mult * historyAgeCoef;
          return {
            date: d,
            day: d.toLocaleDateString("cs-CZ", { weekday: "short" }),
            dayNum: d.getDate(),
            month: d.toLocaleDateString("cs-CZ", { month: "short" }),
            hrsRaw,
            hrsBoosted,
            hrvIdx: entry.hrvIdx,
            pillars,
          };
        });
        setHistory(transformed);
      } catch (err) {
        console.error('API failed, using demo data:', err);
        if (cancelled) return;
        setApiError(err.message);
        setData(DEMO);
        setHistory(generateHistory(365));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => { setTimeout(() => setAnimate(true), 150); }, []);
  useEffect(() => { setAnimate(false); setTimeout(() => setAnimate(true), 50); }, [chartView, period, screen, darkMode]);
  useEffect(() => { if (celebrated) { const t = setTimeout(() => setCelebrated(null), 3000); return () => clearTimeout(t); } }, [celebrated]);

  // Current calendar week/month items from history
  const periodItems = useMemo(() => {
    if (period === "day") return null;
    if (period === "week") {
      const now = new Date();
      const dow = now.getDay(); // 0=Sun
      const mondayOffset = dow === 0 ? 6 : dow - 1;
      const monday = new Date(now); monday.setDate(monday.getDate() - mondayOffset);
      monday.setHours(0, 0, 0, 0);
      return history.filter(d => d.date >= monday);
    }
    // Current calendar month
    const now = new Date();
    return history.filter(d => d.date.getMonth() === now.getMonth() && d.date.getFullYear() === now.getFullYear());
  }, [period, history]);

  const periodData = useMemo(() => {
    const d = data || {};
    if (period === "day") return d;
    const items = periodItems || [];
    if (items.length === 0) return d;
    const avg = {};
    PILLARS.forEach(p => { avg[p.key] = items.reduce((s, dd) => s + (dd.pillars[p.key] || 0), 0) / items.length; });
    return avg;
  }, [period, data, periodItems]);

  const totalMin = activePillars.reduce((s, p) => s + p.maxMin * (periodData[p.key] || 0), 0);
  const mainAgeCoef = calcAgeCoef(funcAge != null ? funcAge : age);
  const boosted = totalMin * HRV_STATES[hrvState].mult * mainAgeCoef;
  const totalHrs = (boosted / 60).toFixed(1);
  // Period totals from actual current calendar period
  const periodTotal = useMemo(() => {
    if (period === "day") return { hrs: totalHrs, label: "hodin zdraví", days: 1 };
    const items = periodItems || [];
    const sum = items.reduce((s, d) => s + d.hrsBoosted, 0);
    const daysVal = (sum / 24).toFixed(1);
    return { hrs: `${Math.round(sum)}h`, label: `(${daysVal} dní)`, days: items.length };
  }, [period, periodItems, totalHrs]);
  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const currentAgeCoef = calcAgeCoef(funcAge != null ? funcAge : age);
  const maxHlyDay = (selectablePillars.filter(p => enabled[p.key]).reduce((s, p) => s + p.maxMin, 0) / 60 + 0.5) * currentAgeCoef;

  // ═══════════════════════════════════════════════
  // ONBOARDING
  // ═══════════════════════════════════════════════
  if (screen === "onboarding") {
    const activeForSetup = selectablePillars.filter(p => enabled[p.key]);

    // ── Step 0: Hook ──
    if (onbStep === 0) return (
      <ThemeCtx.Provider value={T}>
      <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: 16, right: 20 }}>
            <DarkModeToggle dark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
          </div>
          <div style={{ width: "100%", maxWidth: 300, marginBottom: 40 }}>
            <div style={{ position: "relative", height: 28, borderRadius: 14, background: T.border, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 14,
                width: animate ? "60%" : "0%", background: T.borderStrong,
                transition: "width 1.5s cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: "0.5s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
              <span style={{ fontSize: 11, color: T.textTer }}>Dnes</span>
              <span style={{ fontSize: 11, color: T.textTer, fontWeight: 600 }}>65 let</span>
              <span style={{ fontSize: 11, color: T.textTer }}>?</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 12,
            textAlign: "center",
            opacity: animate ? 1 : 0, transform: animate ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease", transitionDelay: "0.3s" }}>
            Do kolika let můžeš vést aktivní život ve zdraví?
          </div>
          <div style={{ fontSize: 15, color: T.textSec, lineHeight: 1.6, marginBottom: 40, maxWidth: 300,
            opacity: animate ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "0.8s" }}>
            Průměrný Čech se dožívá <strong style={{ color: T.text }}>65 let ve zdraví</strong>.
            Tvé návyky ti tuhle hranici můžou posunout.
          </div>
          <button onClick={() => setOnbStep(1)} style={{
            width: "100%", maxWidth: 300, padding: "16px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
            color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: T.f,
            boxShadow: `0 4px 20px ${T.gradStart}40`,
            opacity: animate ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "1.2s",
          }}>Chci vědět více</button>
        </div>
      </div>
      </ThemeCtx.Provider>
    );

    // ── Step 1: Pillar selection ──
    if (onbStep === 1) return (
      <ThemeCtx.Provider value={T}>
      <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, padding: "60px 20px 20px" }}>
          <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Krok 1 z 3</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>Které oblasti zdraví chceš řešit?</div>
          <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5, marginBottom: 24 }}>Vyber oblasti, které tě zajímají. Kdykoli si to můžeš změnit v nastavení. Každá z níže uvedených oblastí prodlužuje tvoji aktivní délku života ve zdraví.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectablePillars.map(p => {
              const on = enabled[p.key]; const m = PILLAR_META[p.key];
              const softBg = darkMode ? (p.darkSoft || p.soft) : p.soft;
              return (
                <div key={p.key} onClick={() => togglePillar(p.key)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  background: on ? softBg : T.card, borderRadius: T.r,
                  border: `2px solid ${on ? p.color : T.border}`, cursor: "pointer", transition: "all 0.25s ease",
                  boxShadow: on ? `0 2px 12px ${p.color}15` : T.shadow,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: on ? `${p.color}20` : T.cardAlt,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{m.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: on ? p.color : T.textTer }}>+{(p.maxMin / 60).toFixed(1)}h</div>
                    <div style={{ fontSize: 9, color: T.textTer }}>zdraví/den</div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                    background: on ? p.color : T.toggleBg, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.25s ease" }}>
                    {on && <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 5l4 4 8-8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              background: darkMode ? "#282A52" : "#EBEDF3", borderRadius: T.r, border: `2px solid ${darkMode ? "#383A60" : "#7B85A840"}`, opacity: 0.7 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "#383A60" : "#7B85A820",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Monitoring</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>HRV měření + zadávání aktivit</div>
              </div>
              <div style={{ fontSize: 11, color: "#7B85A8", fontWeight: 600, background: darkMode ? "#383A60" : "#7B85A815", padding: "4px 10px", borderRadius: 20 }}>Vždy aktivní</div>
            </div>
          </div>

          </div>
          <div style={{ position: "sticky", bottom: 0, padding: "16px 20px 32px",
            background: `linear-gradient(transparent, ${T.bg} 20%)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textSec }}>{enabledCount} {enabledCount < 5 ? "pilíře" : "pilířů"}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>až {maxHlyDay.toFixed(1)}h zdraví/den</span>
            </div>
            <button onClick={() => { setOnbSetupIdx(0); setOnbStep(2); }} disabled={enabledCount === 0} style={{
              width: "100%", padding: "16px", borderRadius: 16, border: "none",
              background: enabledCount > 0 ? `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})` : T.border,
              color: enabledCount > 0 ? "white" : T.textTer, fontSize: 16, fontWeight: 700,
              cursor: enabledCount > 0 ? "pointer" : "default", fontFamily: T.f,
              boxShadow: enabledCount > 0 ? `0 4px 20px ${T.gradStart}40` : "none",
            }}>Pokračovat</button>
          </div>
        </div>
      </div>
      </ThemeCtx.Provider>
    );

    // ── Step 2: Quick setup ──
    if (onbStep === 2) {
      const pillar = activeForSetup[onbSetupIdx];
      if (!pillar) { setOnbStep(3); return null; }
      const m = PILLAR_META[pillar.key];

      // ─── SPÁNEK: goal-based questionnaire ───
      if (pillar.key === "spanek") {
        const SPANEK_GOALS = [
          { key: "hours", label: "Spát určitý počet hodin denně", icon: "⏰", desc: "Nastavím si cílovou délku spánku", hasInput: true },
          { key: "bedtime", label: "Stejná doba usínání", icon: "🌙", desc: "Chodit spát každý den ve stejný čas" },
          { key: "bluelight", label: "Eliminace modrého světla před spaním", icon: "📱", desc: "Omezit obrazovky 1h před spaním" },
          { key: "help", label: "Nevím, co by mi pomohlo", icon: "🤔", desc: "Elonga mi poradí na základě mých dat", exclusive: true },
        ];

        const toggleSpanekGoal = (goal) => {
          setSpanekGoals(prev => {
            if (goal.exclusive) return [goal.key];
            const without = prev.filter(k => k !== "help");
            const idx = without.indexOf(goal.key);
            if (idx >= 0) { without.splice(idx, 1); return without; }
            return [...without, goal.key];
          });
        };

        const spanekCanContinue = spanekGoals.length > 0;
        const spanekNext = () => {
          setOnbAnswers(a => ({ ...a, spanek: { goals: spanekGoals, hours: spanekGoals.includes("hours") ? spanekHours : null } }));
          if (onbSetupIdx < activeForSetup.length - 1) setOnbSetupIdx(x => x + 1);
          else setOnbStep(3);
        };

        const formatHours = (h) => {
          return `${h.toFixed(1)}h`;
        };

        return (
          <ThemeCtx.Provider value={T}>
          <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "40px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: darkMode ? "#282A52" : "#ECEEFE",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌙</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Spánek</div>
                    <div style={{ fontSize: 10, color: T.textTer }}>{onbSetupIdx + 1} z {activeForSetup.length}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                  {activeForSetup.map((p, i) => (
                    <div key={p.key} style={{ flex: 1, height: 4, borderRadius: 2,
                      background: i <= onbSetupIdx ? p.color : T.border,
                      opacity: i <= onbSetupIdx ? 1 : 0.4, transition: "all 0.3s ease" }} />
                  ))}
                </div>

                <div style={{ fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>
                  Čeho chceš dosáhnout?
                </div>
                <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5, marginBottom: 24 }}>
                  Vyber 1 nebo více cílů pro lepší spánek
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {SPANEK_GOALS.map(goal => {
                    const on = spanekGoals.includes(goal.key);
                    const accentColor = T.primary;
                    const showPicker = goal.hasInput && on;
                    return (
                      <div key={goal.key} style={{
                        borderRadius: T.rSm,
                        border: on ? `2px solid ${accentColor}` : "none",
                        overflow: "hidden",
                        transition: "all 0.2s ease",
                      }}>
                        <button onClick={() => toggleSpanekGoal(goal)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                            background: on ? (darkMode ? T.primarySoft : "#ECEEFE") : T.card,
                            borderRadius: on ? 0 : T.rSm,
                            border: on ? "none" : "none",
                            boxShadow: on ? "none" : T.shadow,
                            cursor: "pointer", textAlign: "left", fontFamily: T.f, transition: "all 0.2s ease" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: on ? accentColor : T.text }}>{goal.label}</div>
                            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{goal.desc}</div>
                          </div>
                          <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                            background: on ? accentColor : T.toggleBg,
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}>
                            {on && <svg width="10" height="8" viewBox="0 0 14 10"><path d="M1 5l4 4 8-8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </button>

                        {showPicker && (
                          <div style={{ padding: "18px 18px 14px", background: T.card,
                            borderTop: `1px solid ${darkMode ? T.border : "#D7DAE6"}` }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>
                              Kolik hodin chceš spát?
                            </div>
                            <div style={{ textAlign: "center", marginBottom: 12 }}>
                              <span style={{ fontSize: 32, fontWeight: 800, color: accentColor }}>{formatHours(spanekHours)}</span>
                            </div>
                            <style>{`
                              input[type="range"].spanek-hrs { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
                              input[type="range"].spanek-hrs::-webkit-slider-runnable-track { height: 8px; border-radius: 4px; background: linear-gradient(90deg, ${darkMode ? "#1A2058" : "#ECEEFE"}, ${accentColor}); }
                              input[type="range"].spanek-hrs::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: ${accentColor}; border: 3px solid ${T.card}; box-shadow: 0 2px 8px ${accentColor}40; margin-top: -10px; cursor: pointer; }
                            `}</style>
                            <input type="range" className="spanek-hrs" min="5" max="10" step="0.5" value={spanekHours}
                              onChange={e => setSpanekHours(Number(e.target.value))}
                              style={{ width: "100%", height: 28 }} />
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                              <span style={{ fontSize: 11, color: T.textTer }}>5h</span>
                              <span style={{ fontSize: 11, color: T.textTer }}>10h</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ position: "sticky", bottom: 0, padding: "12px 20px 32px",
                background: `linear-gradient(transparent, ${T.bg} 20%)` }}>
                <button onClick={spanekNext} disabled={!spanekCanContinue} style={{
                  width: "100%", padding: "16px", borderRadius: 16, border: "none",
                  background: spanekCanContinue ? `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})` : T.border,
                  color: spanekCanContinue ? "white" : T.textTer, fontSize: 16, fontWeight: 700,
                  cursor: spanekCanContinue ? "pointer" : "default", fontFamily: T.f,
                  boxShadow: spanekCanContinue ? `0 4px 20px ${T.gradStart}40` : "none",
                }}>Pokračovat</button>
                <button onClick={() => {
                  if (onbSetupIdx > 0) setOnbSetupIdx(x => x - 1);
                  else setOnbStep(1);
                }} style={{
                  width: "100%", padding: "12px", marginTop: 8, borderRadius: 12,
                  border: "none", background: "transparent",
                  color: T.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.f,
                }}>← O krok zpět</button>
              </div>
            </div>
          </div>
          </ThemeCtx.Provider>
        );
      }

      // ─── OTHER PILLARS ───
      const pillarSoft = darkMode ? (pillar.darkSoft || pillar.soft) : pillar.soft;
      const isMulti = m.multiSelect;
      const toggleMulti = (label) => {
        setMultiChoices(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
      };
      const multiNext = () => {
        setOnbAnswers(a => ({ ...a, [pillar.key]: multiChoices }));
        setMultiChoices([]);
        if (onbSetupIdx < activeForSetup.length - 1) setOnbSetupIdx(x => x + 1);
        else setOnbStep(3);
      };
      const goBack = () => {
        setMultiChoices([]);
        if (onbSetupIdx > 0) setOnbSetupIdx(x => x - 1);
        else setOnbStep(1);
      };
      return (
        <ThemeCtx.Provider value={T}>
        <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, padding: "40px 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: pillarSoft,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{pillar.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{pillar.label}</div>
                  <div style={{ fontSize: 10, color: T.textTer }}>{onbSetupIdx + 1} z {activeForSetup.length}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                {activeForSetup.map((p, i) => (
                  <div key={p.key} style={{ flex: 1, height: 4, borderRadius: 2,
                    background: i <= onbSetupIdx ? p.color : T.border,
                    opacity: i <= onbSetupIdx ? 1 : 0.4, transition: "all 0.3s ease" }} />
                ))}
              </div>

              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>
                {m.question}
              </div>
              {isMulti && <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.5, marginBottom: 24 }}>
                Vyber 1 nebo více cílů
              </div>}
              {!isMulti && <div style={{ marginBottom: 24 }} />}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {m.options.map((opt, i) => {
                  if (isMulti) {
                    const on = multiChoices.includes(opt.label);
                    return (
                      <div key={i} style={{ borderRadius: T.rSm,
                        border: on ? `2px solid ${T.primary}` : "none",
                        overflow: "hidden", transition: "all 0.2s ease" }}>
                        <button onClick={() => toggleMulti(opt.label)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                            background: on ? (darkMode ? T.primarySoft : "#ECEEFE") : T.card,
                            borderRadius: on ? 0 : T.rSm, border: "none",
                            boxShadow: on ? "none" : T.shadow,
                            cursor: "pointer", textAlign: "left", fontFamily: T.f, transition: "all 0.2s ease" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: on ? T.primary : T.text }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{opt.desc}</div>
                          </div>
                          <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                            background: on ? T.primary : T.toggleBg,
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}>
                            {on && <svg width="10" height="8" viewBox="0 0 14 10"><path d="M1 5l4 4 8-8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </button>
                      </div>
                    );
                  }
                  // single-select: tap to advance
                  return (
                    <button key={i} onClick={() => {
                      setOnbAnswers(a => ({ ...a, [pillar.key]: opt.label }));
                      if (onbSetupIdx < activeForSetup.length - 1) setOnbSetupIdx(x => x + 1);
                      else setOnbStep(3);
                    }}
                      style={{ width: "100%", display: "flex", alignItems: "center", padding: "16px 18px",
                        background: T.card, borderRadius: T.rSm, border: "none",
                        boxShadow: T.shadow,
                        cursor: "pointer", textAlign: "left", fontFamily: T.f, transition: "all 0.2s ease" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ position: "sticky", bottom: 0, padding: "12px 20px 32px",
              background: `linear-gradient(transparent, ${T.bg} 20%)` }}>
              {isMulti && <button onClick={multiNext} disabled={multiChoices.length === 0} style={{
                width: "100%", padding: "16px", borderRadius: 16, border: "none",
                background: multiChoices.length > 0 ? `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})` : T.border,
                color: multiChoices.length > 0 ? "white" : T.textTer, fontSize: 16, fontWeight: 700,
                cursor: multiChoices.length > 0 ? "pointer" : "default", fontFamily: T.f,
                boxShadow: multiChoices.length > 0 ? `0 4px 20px ${T.gradStart}40` : "none",
              }}>Pokračovat</button>}
              <button onClick={goBack} style={{
                width: "100%", padding: "12px", marginTop: isMulti ? 8 : 0, borderRadius: 12,
                border: "none", background: "transparent",
                color: T.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.f,
              }}>← O krok zpět</button>
            </div>
          </div>
        </div>
        </ThemeCtx.Provider>
      );
    }

    // ── Step 3: Potential ──
    if (onbStep === 3) {
      const effectiveAge = funcAge != null ? funcAge : age;
      const onbAgeCoef = calcAgeCoef(effectiveAge);
      const remaining = Math.max(65 - effectiveAge, 0);
      // Active pillars projection (maxHlyDay already includes age coef)
      const potentialYears = remaining > 0 ? ((maxHlyDay * 365 / 24) * remaining) / 365 : 0;
      const projected = 65 + potentialYears;
      // ALL pillars projection (including inactive) with age coef
      const allPillarsMax = PILLARS.reduce((s, p) => s + p.maxMin, 0) / 60 * onbAgeCoef;
      const fullPotentialYears = remaining > 0 ? ((allPillarsMax * 365 / 24) * remaining) / 365 : 0;
      const fullProjected = 65 + fullPotentialYears;
      // Bar percentages
      const basePct = ((65 - effectiveAge) / (80 - effectiveAge)) * 100;
      const projPct = ((projected - effectiveAge) / (80 - effectiveAge)) * 100;
      const fullProjPct = ((fullProjected - effectiveAge) / (80 - effectiveAge)) * 100;
      // Inactive pillars (not enabled, not monitoring)
      const inactivePillars = selectablePillars.filter(p => !enabled[p.key]);
      return (
        <ThemeCtx.Provider value={T}>
        <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", padding: "60px 20px 40px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Krok 3 z 3</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 32 }}>Tvůj potenciál</div>
            <div style={{ textAlign: "center", marginBottom: 32,
              opacity: animate ? 1 : 0, transform: animate ? "scale(1)" : "scale(0.8)",
              transition: "all 1s cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: "0.3s" }}>
              <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: T.primary }}>{projected.toFixed(1)}</div>
              <div style={{ fontSize: 16, color: T.textSec, marginTop: 8 }}>let ve zdraví</div>
            </div>
            <div style={{ marginBottom: 24, opacity: animate ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "0.8s" }}>
              {inactivePillars.length > 0 && <>
              {/* Tvůj potenciál bar (all pillars) — only when not all selected */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: T.primaryMuted, opacity: 0.5 }} />
                  <span style={{ fontSize: 12, color: T.textSec, fontStyle: "italic" }}>Tvůj potenciál</span>
                </div>
                <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{fullProjected.toFixed(1)} let</span>
              </div>
              <div style={{ height: 28, borderRadius: 14, background: T.border, overflow: "hidden", marginBottom: 12, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 14,
                  width: animate ? `${fullProjPct}%` : "0%",
                  background: `repeating-linear-gradient(90deg, ${T.primaryMuted}40 0px, ${T.primaryMuted}40 6px, transparent 6px, transparent 12px)`,
                  transition: "width 2s cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: "0.8s" }} />
              </div>
              </>}
              {/* Tvá cesta / Tvůj potenciál bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})` }} />
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{inactivePillars.length > 0 ? "Tvá cesta" : "Tvůj potenciál"}</span>
                </div>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>{projected.toFixed(1)} let</span>
              </div>
              <div style={{ height: 28, borderRadius: 14, background: T.border, overflow: "hidden", marginBottom: 12, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 14,
                  width: animate ? `${projPct}%` : "0%", background: `linear-gradient(90deg, ${T.gradStart}, ${T.gradEnd})`,
                  transition: "width 2s cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: "1s" }} />
              </div>
              {/* Průměr populace bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: T.borderStrong }} />
                  <span style={{ fontSize: 12, color: T.textSec }}>Průměr populace</span>
                </div>
                <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>65.0 let</span>
              </div>
              <div style={{ height: 28, borderRadius: 14, background: T.border, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${basePct}%`, borderRadius: 14, background: T.borderStrong }} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24,
              opacity: animate ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "1.5s" }}>
              {/* Active pillars */}
              {activePillars.filter(p => p.key !== "monitoring").map(p => {
                const softBg = darkMode ? (p.darkSoft || p.soft) : p.soft;
                return (
                  <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6, background: softBg, borderRadius: 20, padding: "6px 12px" }}>
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>+{(p.maxMin / 60).toFixed(1)}h</span>
                  </div>
                );
              })}
              {/* Inactive pillars — shown dimmed with dashed border */}
              {inactivePillars.map(p => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6,
                  background: "transparent", border: `1.5px dashed ${T.borderStrong}`,
                  borderRadius: 20, padding: "5px 11px", opacity: 0.6 }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.textTer }}>+{(p.maxMin / 60).toFixed(1)}h</span>
                </div>
              ))}
            </div>
            <div style={{ background: `linear-gradient(135deg, ${T.gradStart}0D, ${T.gradEnd}08)`,
              borderRadius: T.rSm, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 32,
              opacity: animate ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "2s" }}>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>
                {inactivePillars.length > 0
                  ? <>Při plnění {enabledCount} pilířů získáváš až{" "}
                      <strong style={{ color: T.primary }}>{maxHlyDay.toFixed(1)} hodin</strong>/den.
                      Se všemi pilíři to může být až{" "}
                      <strong style={{ color: T.primary }}>{allPillarsMax.toFixed(1)} hodin</strong>/den.</>
                  : <>Při plnění všech pilířů můžeš každý den získat až{" "}
                      <strong style={{ color: T.primary }}>{allPillarsMax.toFixed(1)} hodin</strong> zdravého života navíc.</>}
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => setScreen("dashboard")} style={{
              width: "100%", padding: "16px", borderRadius: 16, border: "none",
              background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
              color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: T.f,
              boxShadow: `0 4px 20px ${T.gradStart}40`,
            }}>Pokračovat</button>
          </div>
        </div>
        </ThemeCtx.Provider>
      );
    }
  }

  // ═══════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════
  if (screen === "settings") return (
    <ThemeCtx.Provider value={T}>
    <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
      <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "60px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setScreen("dashboard")} style={{ width: 36, height: 36, borderRadius: 18, background: T.card,
            border: "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: T.shadow, color: T.text }}>←</button>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Nastavení HLY</div>
        </div>
        <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.6, marginBottom: 24 }}>
          Zvol, které pilíře zdraví chceš aktivně sledovat. Monitoring je vždy zapnutý.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selectablePillars.map(p => {
            const on = enabled[p.key]; const m = PILLAR_META[p.key];
            const softBg = darkMode ? (p.darkSoft || p.soft) : p.soft;
            return (
              <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px",
                background: T.card, borderRadius: T.r, boxShadow: T.shadow }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: softBg,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 1 }}>+{(p.maxMin / 60).toFixed(1)}h/den · {m.source}</div>
                </div>
                <div onClick={() => togglePillar(p.key)} style={{
                  width: 50, height: 28, borderRadius: 14, padding: 2, cursor: "pointer",
                  background: on ? p.color : T.toggleBg, transition: "background 0.25s ease" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    transform: on ? "translateX(22px)" : "translateX(0)", transition: "transform 0.25s ease" }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px",
            background: T.card, borderRadius: T.r, opacity: 0.6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: darkMode ? "#282A52" : "#EBEDF3",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Monitoring</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 1 }}>+0.5h/den · Vždy aktivní</div>
            </div>
            <div style={{ width: 50, height: 28, borderRadius: 14, padding: 2, background: "#7B85A8" }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transform: "translateX(22px)" }} />
            </div>
          </div>
        </div>
        </div>
        <div style={{ position: "sticky", bottom: 0, padding: "16px 20px 32px",
          background: `linear-gradient(transparent, ${T.bg} 20%)` }}>
          <div style={{ background: T.card, borderRadius: T.r, padding: "16px", textAlign: "center",
            boxShadow: T.shadowLg }}>
            <div style={{ fontSize: 13, color: T.textSec }}>
              {enabledCount} {enabledCount < 5 ? "pilíře" : "pilířů"} aktivních · max{" "}
              <strong style={{ color: T.primary }}>{maxHlyDay.toFixed(1)}h zdraví/den</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ThemeCtx.Provider>
  );

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (loading) return (
    <ThemeCtx.Provider value={T}>
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>Načítám data…</div>
        <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>Připojuji se k databázi</div>
      </div>
    </div>
    </ThemeCtx.Provider>
  );

  // ═══════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════
  return (
    <ThemeCtx.Provider value={T}>
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.f,display:"flex",justifyContent:"center",padding:"12px 0",
      transition:"background 0.3s ease"}}>
      <style key={darkMode ? "dark" : "light"}>{`
        @keyframes fadeOut { from{opacity:1} to{opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        input[type="range"],
        input[type="range"].age-slider {
          -webkit-appearance: none; appearance: none; background: transparent; width: 100%;
        }
        input[type="range"]::-webkit-slider-runnable-track,
        input[type="range"].age-slider::-webkit-slider-runnable-track {
          height: 4px; border-radius: 2px; background: ${T.border};
        }
        input[type="range"]::-webkit-slider-thumb,
        input[type="range"].age-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${T.primary}; border: 2px solid ${T.card};
          box-shadow: 0 1px 4px rgba(0,0,0,0.15); margin-top: -7px; cursor: pointer;
        }
      `}</style>
      <div style={{width:393,maxWidth:"100%"}}>
        {/* HEADER */}
        <div style={{padding:"14px 20px 6px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:-0.3}}>Healthy Life Years</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <DarkModeToggle dark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
              <button onClick={() => setScreen("settings")} style={{width:36,height:36,borderRadius:18,background:T.card,
                boxShadow:T.shadow, border:"none", cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textSec} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button onClick={() => setShowDebug(true)} style={{width:36,height:36,borderRadius:18,background:T.purple,
                boxShadow:T.shadow, border:"none", cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                🐛
              </button>
            </div>
          </div>
          {/* User switcher - separate row */}
          <div style={{display:"flex",gap:6,marginTop:10}}>
            {USERS.map(u => (
              <button key={u.id} onClick={() => setUserId(u.id)} style={{
                padding:"8px 16px",border:"none",borderRadius:10,fontSize:13,fontWeight:600,
                cursor:"pointer",fontFamily:T.f,transition:"all 0.15s",
                background:userId===u.id?T.primary:T.card,
                color:userId===u.id?"#fff":T.textSec,
                boxShadow:userId===u.id?`0 2px 8px ${T.primary}40`:T.shadow,
              }}>{u.name}</button>
            ))}
          </div>
        </div>

        {/* HERO: THE GAP */}
        <div style={{margin:"10px 16px 4px",background:`linear-gradient(145deg, ${T.gradStart}12, ${T.gradEnd}0A)`,
          borderRadius:T.r,padding:"2px",boxShadow:`0 4px 20px ${T.gradStart}15`}}>
          <TheGap data={periodData} todayData={data} hrvState={hrvState} age={age} onAgeChange={setAge} funcAge={funcAge} onFuncAgeChange={setFuncAge} ageCoef={ageCoef} animate={animate} activePillars={activePillars} history={history}/>
        </div>

        {/* PERIOD TOGGLE */}
        <div style={{margin:"8px 16px 0",display:"flex",background:T.card,borderRadius:T.rSm,padding:3,gap:3,boxShadow:T.shadow}}>
          {["day","week","month"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{
              flex:1,padding:"9px 0",borderRadius:T.rXs,border:"none",
              background:period===p?T.primary:"transparent",
              color:period===p?"white":T.textTer,fontSize:13,fontWeight:700,cursor:"pointer",
              transition:"all 0.25s ease",fontFamily:T.f,
              boxShadow:period===p?`0 2px 8px ${T.primary}40`:"none",
            }}>{{day:"Den",week:"Týden",month:"Měsíc"}[p]}</button>
          ))}
        </div>

        {/* CHARTS — Radar / Kruhy / Budíky — always visible */}
        <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"16px",boxShadow:T.shadow}}>
          <div style={{display:"flex",background:T.cardAlt,borderRadius:T.rSm,padding:3,gap:3,marginBottom:12}}>
            {[{id:"radar",label:"Radar"},{id:"rings",label:"Kruhy"},{id:"gauges",label:"Budíky"}].map(tab=>(
              <button key={tab.id} onClick={()=>setChartView(tab.id)} style={{
                flex:1,padding:"7px 0",borderRadius:T.rXs,border:"none",
                background:chartView===tab.id?T.card:"transparent",
                boxShadow:chartView===tab.id?T.shadow:"none",
                color:chartView===tab.id?T.text:T.textTer,fontSize:12,fontWeight:600,cursor:"pointer",
                transition:"all 0.25s ease",fontFamily:T.f,
              }}>{tab.label}</button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"center",position:"relative"}}>
            {chartView==="radar"&&<RadarChart data={periodData} pillars={activePillars} animate={animate}/>}
            {chartView==="rings"&&<ActivityRings data={periodData} pillars={activePillars} animate={animate} periodTotal={periodTotal}/>}
            {chartView==="gauges"&&<GaugeGrid data={periodData} pillars={activePillars} animate={animate} periodDays={periodTotal.days} ageCoef={mainAgeCoef}/>}
            {chartView==="radar"&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",textAlign:"center",pointerEvents:"none"}}>
              <div style={{fontSize:30,fontWeight:800,color:T.text,lineHeight:1}}>{periodTotal.hrs}</div>
              <div style={{fontSize:10,color:T.textSec,fontWeight:500}}>{periodTotal.label}</div>
            </div>}
          </div>
        </div>

        {/* PILÍŘE ZDRAVÍ — day: interactive, week/month: averaged */}
        {period==="day"&&(
          <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"14px 16px",boxShadow:T.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:3,background:T.primary}}/>
                <span style={{fontSize:13,fontWeight:700,color:T.text}}>Pilíře zdraví</span>
              </div>
              <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:T.primarySoft,color:T.primary}}>
                {Math.round((boosted/360)*100)}%
              </span>
            </div>
            {activePillars.map(p=><PillarPill key={p.key} pillar={p} value={data[p.key]||0}
              onChange={v=>setData(d=>({...d,[p.key]:v}))}
              celebrated={celebrated} onCelebrate={setCelebrated} ageCoef={mainAgeCoef}/>)}
          </div>
        )}
        {(period==="week"||period==="month")&&(()=>{
            const items=periodItems||[];
            if(items.length===0)return null;
            const avgData={};
            activePillars.forEach(p=>{avgData[p.key]=items.reduce((s,d)=>s+(d.pillars[p.key]||0),0)/items.length;});
            const avgTotalMin=activePillars.reduce((s,p)=>s+p.maxMin*(avgData[p.key]||0),0);
            const avgPct=Math.round((avgTotalMin/activePillars.reduce((s,p)=>s+p.maxMin,0))*100);
            return (
              <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"14px 16px",boxShadow:T.shadow}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:6,height:6,borderRadius:3,background:T.primary}}/>
                    <span style={{fontSize:13,fontWeight:700,color:T.text}}>Pilíře zdraví</span>
                    <span style={{fontSize:11,color:T.textTer,fontWeight:500,fontFamily:T.f}}>⌀ {period==="week"?"týden":"měsíc"}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:T.primarySoft,color:T.primary}}>
                    {avgPct}%
                  </span>
                </div>
                {activePillars.map(p=>{
                  const val=Math.min(avgData[p.key]||0,1);const pct=Math.round(val*100);
                  const hly=((p.maxMin*val*items.length*mainAgeCoef)/60).toFixed(1);
                  const isFull=pct>=95;
                  const softBg = darkMode ? (p.darkSoft || p.soft) : p.soft;
                  return (
                    <div key={p.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{width:34,height:34,borderRadius:9,
                        background:isFull?`linear-gradient(135deg, ${p.color}30, ${p.color}10)`:softBg,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,
                        boxShadow:isFull?`0 0 12px ${p.color}25`:"none",
                      }}>
                        {isFull?"✅":p.icon}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.f}}>{p.label}</span>
                            {isFull&&<span style={{fontSize:9,fontWeight:700,color:p.color,background:softBg,
                              padding:"1px 6px",borderRadius:10,fontFamily:T.f}}>SPLNĚNO</span>}
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color:p.color,background:softBg,padding:"2px 8px",borderRadius:20,fontFamily:T.f}}>{hly}h</span>
                        </div>
                        <div style={{position:"relative",height:5,borderRadius:3,background:T.border,overflow:"hidden"}}>
                          <div style={{position:"absolute",left:0,top:0,bottom:0,borderRadius:3,width:animate?`${pct}%`:"0%",
                            background:isFull?`linear-gradient(90deg, ${p.color}, ${p.color}CC)`:p.color,
                            transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                            boxShadow:isFull?`0 0 8px ${p.color}40`:"none",
                          }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        {/* NUDGE CARDS — day only */}
        {period==="day"&&<div style={{margin:"8px 16px"}}>
          <NudgeCards data={data} activePillars={activePillars}/>
        </div>}

        {/* BAR CHART — always visible */}
        <div style={{margin:"8px 16px"}}>
          <BarChartCard history={history} animate={animate}/>
        </div>

        {/* PERIOD SUMMARY — week/month only */}
        {period!=="day"&&<div style={{margin:"8px 16px"}}>
          <PeriodSummary history={history} period={period} activePillars={activePillars}/>
        </div>}

        <div style={{padding:"24px 20px 40px",textAlign:"center"}}>
          <button onClick={() => {
            setScreen("onboarding"); setOnbStep(0); setOnbSetupIdx(0); setOnbAnswers({});
            setSpanekGoals([]); setSpanekHours(7.5); setSelectedOpt(null); setMultiChoices([]);
            setEnabled({ pohyb: true, spanek: true, strava: false, stres: false, vztahy: false });
          }} style={{background:"none",border:"none",cursor:"pointer",
            fontSize:12,fontWeight:600,color:T.textTer,fontFamily:T.f,padding:0}}>
            Resetovat onboarding
          </button>
        </div>

      </div>
    </div>

    {/* Debug panel */}
    {showDebug && <DebugPanel userId={userId} onClose={() => setShowDebug(false)} />}

    </ThemeCtx.Provider>
  );
}
