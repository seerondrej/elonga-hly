import { useState, useEffect, useMemo, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════
// DESIGN SYSTEM — Elonga
// ═══════════════════════════════════════════════════
const LIGHT = {
  bg: "#F5F6FA", card: "#FFFFFF", cardAlt: "#ECEEF5",
  text: "#1A1B2E", textSec: "#8B8DA3", textTer: "#A9ADC1",
  primary: "#3D3BF3", primarySoft: "#ECEEFF", primaryMuted: "#6E6CF7",
  pink: "#E8467C", pinkSoft: "#FFF0F4",
  green: "#22B573", greenSoft: "#EAFAF2",
  orange: "#F5A623", orangeSoft: "#FFF8EC",
  red: "#FF4757", redSoft: "#FFF0F2",
  gradStart: "#3D3BF3", gradEnd: "#7B6CFF",
  border: "#ECEEF5", borderStrong: "#D8DBE8",
  shadow: "0 2px 12px rgba(26,29,46,0.07)",
  shadowLg: "0 8px 30px rgba(26,29,46,0.10)",
  r: 20, rSm: 14, rXs: 10,
  f: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
  toggleBg: "#E8E9F2",
};
const DARK = {
  bg: "#13141F", card: "#1E1F2E", cardAlt: "#282940",
  text: "#FFFFFF", textSec: "#9B9DB8", textTer: "#6B6D82",
  primary: "#4946FF", primarySoft: "#2A2B50", primaryMuted: "#7B79FF",
  pink: "#FF6B8A", pinkSoft: "#3A1F2A",
  green: "#34D399", greenSoft: "#1A3A2A",
  orange: "#FBBF24", orangeSoft: "#3A3020",
  red: "#FF6B6B", redSoft: "#3A1F1F",
  gradStart: "#4946FF", gradEnd: "#8B7CFF",
  border: "#2A2B40", borderStrong: "#3A3B55",
  shadow: "0 2px 12px rgba(0,0,0,0.25)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.35)",
  r: 20, rSm: 14, rXs: 10,
  f: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
  toggleBg: "#3A3B55",
};

const ThemeCtx = createContext(LIGHT);
const useTheme = () => useContext(ThemeCtx);

const PILLARS = [
  { key: "pohyb", label: "Pohyb", icon: "🏃", maxMin: 150, color: "#3D3BF3", soft: "#ECEEFF", darkSoft: "#2A2B50" },
  { key: "spanek", label: "Spánek", icon: "🌙", maxMin: 60, color: "#7B6CFF", soft: "#F0F1FF", darkSoft: "#2D2B50" },
  { key: "strava", label: "Strava", icon: "🥗", maxMin: 60, color: "#F5A623", soft: "#FFF8EC", darkSoft: "#3A3020" },
  { key: "stres", label: "Stres", icon: "🧘", maxMin: 30, color: "#22B573", soft: "#EAFAF2", darkSoft: "#1A3A2A" },
  { key: "vztahy", label: "Vztahy", icon: "❤️", maxMin: 30, color: "#E8467C", soft: "#FFF0F4", darkSoft: "#3A1F2A" },
  { key: "monitoring", label: "Monitoring", icon: "📊", maxMin: 30, color: "#9B8FFF", soft: "#F3F1FF", darkSoft: "#2D2A50" },
];

const HRV_STATES = [
  { label: "Pod průměrem", color: "#FF4757", bg: "#FFF0F2", darkBg: "#3A1F1F", mult: 1.0, tag: "Stabilizace" },
  { label: "V normě", color: "#22B573", bg: "#EAFAF2", darkBg: "#1A3A2A", mult: 1.1, tag: "+10 %" },
  { label: "Nadprůměr", color: "#F5A623", bg: "#FFF8EC", darkBg: "#3A3020", mult: 1.25, tag: "+25 %" },
];

const DEMO = { pohyb: 0.72, spanek: 0.85, strava: 0.55, stres: 0.05, vztahy: 0.65, monitoring: 1.0 };

const PILLAR_META = {
  pohyb: { desc: "Fyzická aktivita, kroky, tréninky", source: "Apple Health / Google Fit + manuálně", question: "Jak chceš zadávat pohyb?", options: ["Synchronizace s Apple Health / Google Fit", "Budu zadávat ručně"] },
  spanek: { desc: "Kvalita a délka spánku", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: ["Chci spát určitý počet hodin denně", "Chci chodit spát ve stejný čas", "Chci eliminovat modré světlo před spaním"] },
  strava: { desc: "Výživa, stravovací návyky", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: ["Chci jíst pravidelněji", "Chci snížit příjem cukru", "Chci držet intermittent fasting"] },
  stres: { desc: "Dechová cvičení, meditace, relaxace", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: ["Chci se naučit dýchací techniky", "Chci pravidelně meditovat", "Chci lépe zvládat stresové situace"] },
  vztahy: { desc: "Sociální interakce, kvalitní čas s blízkými", source: "Zdravý návyk (self-report)", question: "Čeho chceš dosáhnout?", options: ["Chci trávit víc kvalitního času s blízkými", "Chci být víc v kontaktu s přáteli"] },
};

function generateHistory(days) {
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const base = 2.8 + Math.sin(i * 0.3) * 0.8 + Math.random() * 1.2;
    const hrs = Math.min(Math.max(base, 0.5), 6);
    const hrvIdx = Math.random() > 0.6 ? 2 : Math.random() > 0.3 ? 1 : 0;
    const boosted = hrs * HRV_STATES[hrvIdx].mult;
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
    t.hrsBoosted = t.hrsRaw * HRV_STATES[1].mult; t.hrvIdx = 1;
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
    <button onClick={onToggle} style={{
      width: 44, height: 44, borderRadius: 22, border: "none", cursor: "pointer",
      background: dark ? "#2A2B45" : T.card,
      boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(26,29,46,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.3s ease",
    }}>
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" fill="#FBBF24"/>
          {[0,45,90,135,180,225,270,315].map(a => (
            <line key={a} x1="12" y1="2" x2="12" y2="5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"
              transform={`rotate(${a} 12 12)`}/>
          ))}
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#6B6D82"/>
        </svg>
      )}
    </button>
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
function GaugeGrid({ data, pillars, animate }) {
  const T = useTheme();
  const cols = pillars.length <= 2 ? pillars.length : pillars.length <= 4 ? 2 : 3;
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap:8,padding:"4px 0",justifyItems:"center"}}>
      {pillars.map((p,idx)=>{
        const val=data[p.key]||0;const hly=((p.maxMin*val)/60).toFixed(1);
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
// BAR CHART
// ═══════════════════════════════════════════════════
function BarChart({ history, period, animate }) {
  const T = useTheme();
  const items = period==="week"?history.slice(-7):history.slice(-30);
  const maxH=6; const barW=period==="week"?32:8; const gap=period==="week"?8:3;
  const chartW=items.length*(barW+gap)-gap; const chartH=120;
  return (
    <div style={{overflowX:period==="month"?"auto":"hidden",padding:"0 4px"}}>
      <svg width={Math.max(chartW,300)} height={chartH+28} viewBox={`0 0 ${Math.max(chartW,300)} ${chartH+28}`}>
        <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gradStart}/><stop offset="100%" stopColor={T.gradEnd} stopOpacity="0.6"/></linearGradient></defs>
        {[0,2,4,6].map(v=>{const y=chartH-(v/maxH)*chartH;return(<g key={v}><line x1="0" y1={y} x2={Math.max(chartW,300)} y2={y} stroke={T.border} strokeWidth="0.5" strokeDasharray="4 4"/>{v>0&&<text x={Math.max(chartW,300)-2} y={y-3} textAnchor="end" fill={T.textTer} fontSize="9" fontFamily={T.f}>{v}h</text>}</g>);})}
        {items.map((item,i)=>{const h=(item.hrsBoosted/maxH)*chartH;const x=i*(barW+gap);const isToday=i===items.length-1;
          return(<g key={i}>
            <rect x={x} y={animate?chartH-h:chartH} width={barW} height={animate?h:0} rx={barW>10?6:3}
              fill={isToday?"url(#barGrad)":T.borderStrong} style={{transition:`all 0.6s cubic-bezier(0.34,1.56,0.64,1)`,transitionDelay:`${i*25}ms`}}/>
            {barW>10&&<circle cx={x+barW/2} cy={animate?chartH-h-6:chartH-6} r="3" fill={HRV_STATES[item.hrvIdx].color}
              style={{transition:"all 0.6s ease",transitionDelay:`${i*25+200}ms`}}/>}
            <text x={x+barW/2} y={chartH+14} textAnchor="middle" fill={isToday?T.text:T.textTer}
              fontSize={period==="week"?"10":"8"} fontWeight={isToday?"700":"400"} fontFamily={T.f}>
              {period==="week"?item.day:(i%5===0||isToday?item.dayNum:"")}
            </text>
          </g>);
        })}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CUMULATIVE TREND
// ═══════════════════════════════════════════════════
function CumulativeTrend({ history, period, animate }) {
  const T = useTheme();
  const items=period==="week"?history.slice(-7):history.slice(-30);
  const chartW=320,chartH=80;
  let cumHrs=0;
  const points=items.map(item=>{cumHrs+=item.hrsBoosted;return cumHrs;});
  const maxCum=points[points.length-1]||1;
  const cumDays=(maxCum/24).toFixed(1);
  const pathD=points.map((v,i)=>{const x=(i/(points.length-1))*chartW;const y=chartH-(v/maxCum)*(chartH-10);return`${i===0?"M":"L"} ${x} ${y}`;}).join(" ");
  const areaD=pathD+` L ${chartW} ${chartH} L 0 ${chartH} Z`;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
        <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.f}}>Kumulativní HLY</span>
        <span style={{fontSize:20,fontWeight:800,color:T.primary,fontFamily:T.f}}>{cumDays} <span style={{fontSize:12,fontWeight:500,color:T.textSec}}>dní</span></span>
      </div>
      <svg width={chartW} height={chartH+20} viewBox={`0 0 ${chartW} ${chartH+20}`} style={{width:"100%"}}>
        <defs>
          <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gradStart} stopOpacity="0.15"/><stop offset="100%" stopColor={T.gradEnd} stopOpacity="0.02"/></linearGradient>
          <linearGradient id="cumLine" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={T.gradStart}/><stop offset="100%" stopColor={T.gradEnd}/></linearGradient>
        </defs>
        <path d={areaD} fill="url(#cumFill)" style={{opacity:animate?1:0,transition:"opacity 1s ease"}}/>
        <path d={pathD} fill="none" stroke="url(#cumLine)" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="1000" strokeDashoffset={animate?0:1000} style={{transition:"stroke-dashoffset 1.5s ease"}}/>
        {points.length>0&&<circle cx={chartW} cy={chartH-(points[points.length-1]/maxCum)*(chartH-10)}
          r="5" fill={T.card} stroke={T.gradEnd} strokeWidth="2.5"
          style={{opacity:animate?1:0,transition:"opacity 0.5s ease",transitionDelay:"1.2s"}}/>}
        {items.map((item,idx)=>{
          if(period==="week"||(idx%7===0||idx===items.length-1)){
            const x=(idx/(items.length-1))*chartW;
            return <text key={idx} x={x} y={chartH+14} textAnchor="middle" fill={T.textTer} fontSize="9" fontFamily={T.f}>{period==="week"?item.day:`${item.dayNum}.`}</text>;
          }
          return null;
        })}
      </svg>
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
        <div style={{fontSize:40,fontWeight:800,fontFamily:T.f,lineHeight:1.1,
          background:`linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
          backgroundClip:"text",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>+{totalDays}</div>
        <div style={{fontSize:13,color:T.textSec,fontFamily:T.f,marginTop:2}}>dní zdraví navíc</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {label:"Průměr/den",value:`${avgHrs}h`,color:T.primary,icon:"📊"},
          {label:"Nejlepší den",value:`${bestDay.hrsBoosted.toFixed(1)}h`,color:T.green,icon:"🏆"},
          {label:"Streak",value:`${streakDays}d`,color:T.orange,icon:"🔥"},
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
          {activePillars.map(p=>{const avg=items.reduce((s,d)=>s+(d.pillars[p.key]||0),0)/items.length;const pct=Math.round(avg*100);
            const softBg = isDark ? (p.darkSoft || p.soft) : p.soft;
            return(<div key={p.key} style={{display:"flex",alignItems:"center",gap:5,background:softBg,borderRadius:20,padding:"4px 10px"}}>
              <span style={{fontSize:12}}>{p.icon}</span>
              <span style={{fontSize:11,fontWeight:700,color:p.color,fontFamily:T.f}}>{pct}%</span>
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
  pohyb: { msg: "Pohyb je královský pilíř — 1 hodina aktivity ti přidá až 2.5h HLY.", cta: "Otevřít pohybový plán" },
  spanek: { msg: "Kvalitní spánek ti může přidat celou hodinu HLY denně.", cta: "Nastavit spánkový návyk" },
  strava: { msg: "Správná strava sníží záněty a přidá ti až 1h HLY denně.", cta: "Přidat stravovací návyk" },
  stres: { msg: "Dechové cvičení + meditace = 0.5h HLY denně. Stačí 5 minut.", cta: "Vyzkoušet dechové cvičení" },
  vztahy: { msg: "Kvalitní vztahy jsou nejsilnější prediktor zdraví ve stáří.", cta: "Přidat sociální návyk" },
  monitoring: { msg: "Ranní HRV měření ti přidá 0.5h HLY + odemkne bonus.", cta: "Změřit HRV" },
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
                <div style={{fontSize:11,color:p.color,fontWeight:600,fontFamily:T.f}}>+{potentialHrs}h HLY/den</div>
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
function PillarPill({ pillar, value, onChange, celebrated, onCelebrate }) {
  const T = useTheme();
  const isDark = T === DARK;
  const pct=Math.round(value*100);const hly=((pillar.maxMin*value)/60).toFixed(1);
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
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:600,color:pillar.color,background:softBg,padding:"1px 7px",borderRadius:20,fontFamily:T.f}}>{pct}%</span>
            <span style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:T.f}}>{hly}h</span>
          </div>
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
          🎉 {pillar.label} splněn! +{hly}h HLY dnes
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
function TheGap({ data, hrvState, age, onAgeChange, animate, activePillars }) {
  const T = useTheme();
  const totalMin=activePillars.reduce((s,p)=>s+p.maxMin*(data[p.key]||0),0);
  const boosted=totalMin*HRV_STATES[hrvState].mult;const dailyHrs=boosted/60;
  const yearlyDays=(dailyHrs*365)/24;const remaining=Math.max(65-age,0);
  const bonusYears=remaining>0?(yearlyDays*remaining)/365:0;const projected=65+bonusYears;

  const maxMin=activePillars.reduce((s,p)=>s+p.maxMin,0);
  const maxBoosted=maxMin*1.25;const maxDailyHrs=maxBoosted/60;
  const maxYearlyDays=(maxDailyHrs*365)/24;
  const maxBonusYears=remaining>0?(maxYearlyDays*remaining)/365:0;
  const maxProjected=65+maxBonusYears;

  const scaleMax=Math.max(82,Math.ceil(maxProjected)+2);
  const toPct=yr=>Math.min(Math.max(((yr-age)/(scaleMax-age))*100,0),100);
  const basePct=toPct(65);const projPct=toPct(Math.min(projected,scaleMax));
  const maxPct=toPct(Math.min(maxProjected,scaleMax));
  const monthDays=Math.round(yearlyDays/12);
  const untappedYears=(maxProjected-projected).toFixed(1);
  const markers=[];for(let y=Math.ceil(age/5)*5;y<=scaleMax;y+=5)if(y>age)markers.push(y);
  return (
    <div style={{background:T.card,borderRadius:T.r,padding:"20px 16px 16px",boxShadow:T.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <div style={{width:6,height:6,borderRadius:3,background:`linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`}}/>
        <span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:T.f}}>Tvá cesta ke zdraví</span>
        <span style={{marginLeft:"auto",fontSize:13,color:T.textTer}}>›</span>
      </div>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:42,fontWeight:800,fontFamily:T.f,lineHeight:1.1,
          background:`linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,backgroundClip:"text",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>{projected.toFixed(1)}</div>
        <div style={{fontSize:13,color:T.textSec,fontFamily:T.f,marginTop:3}}>let ve zdraví</div>
      </div>

      {/* Potential bar */}
      <div style={{marginBottom:6}}>
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
      </div>

      {/* Your path bar */}
      <div style={{marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:8,height:8,borderRadius:4,background:`linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`}}/>
          <span style={{fontSize:11,color:T.text,fontWeight:600,fontFamily:T.f}}>Tvá cesta</span>
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
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"8px 0"}}>
          <span style={{fontSize:11,color:T.textTer,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Věk</span>
          <input type="range" min="20" max="70" value={age} onChange={e=>onAgeChange(Number(e.target.value))}
            style={{flex:1,height:18}}/>
          <span style={{fontSize:16,fontWeight:700,color:T.text,width:28,textAlign:"right",fontFamily:T.f}}>{age}</span>
        </div>
      )}

      <div style={{background:`linear-gradient(135deg, ${T.gradStart}0D, ${T.gradEnd}08)`,borderRadius:T.rSm,padding:"12px 14px",border:`1px solid ${T.border}`}}>
        <div style={{fontSize:13,color:T.text,lineHeight:1.6,fontFamily:T.f}}>
          Dnes si své HLY prodloužil o <span style={{fontWeight:700,color:T.primary}}>{dailyHrs.toFixed(1)} hodin</span>.
        </div>
        <div style={{fontSize:12,color:T.textSec,lineHeight:1.5,fontFamily:T.f,marginTop:2}}>
          Za poslední měsíc jsi získal <span style={{fontWeight:600,color:T.pink}}>{monthDays} dní</span> zdraví navíc.
        </div>
      </div>

      {parseFloat(untappedYears)>0.5&&(
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
// MAIN APP
// ═══════════════════════════════════════════════════
export default function ElongaHLY() {
  const [darkMode, setDarkMode] = useState(false);
  const T = darkMode ? DARK : LIGHT;

  const [screen, setScreen] = useState("onboarding");
  const [onbStep, setOnbStep] = useState(0);
  const [onbSetupIdx, setOnbSetupIdx] = useState(0);
  const [onbAnswers, setOnbAnswers] = useState({});
  const [spanekGoals, setSpanekGoals] = useState([]);
  const [spanekHours, setSpanekHours] = useState(7.5);

  const [enabled, setEnabled] = useState({ pohyb: true, spanek: true, strava: false, stres: false, vztahy: false });
  const togglePillar = (k) => setEnabled(s => ({ ...s, [k]: !s[k] }));
  const activePillars = PILLARS.filter(p => enabled[p.key] || p.key === "monitoring");
  const selectablePillars = PILLARS.filter(p => p.key !== "monitoring");

  const [chartView, setChartView] = useState("radar");
  const [period, setPeriod] = useState("day");
  const [data, setData] = useState(DEMO);
  const [hrvState, setHrvState] = useState(1);
  const [animate, setAnimate] = useState(false);
  const [age, setAge] = useState(40);
  const [celebrated, setCelebrated] = useState(null);
  const history = useMemo(() => generateHistory(30), []);

  useEffect(() => { setTimeout(() => setAnimate(true), 150); }, []);
  useEffect(() => { setAnimate(false); setTimeout(() => setAnimate(true), 50); }, [chartView, period, screen, darkMode]);
  useEffect(() => { if (celebrated) { const t = setTimeout(() => setCelebrated(null), 3000); return () => clearTimeout(t); } }, [celebrated]);

  const periodData = useMemo(() => {
    if (period === "day") return data;
    const items = period === "week" ? history.slice(-7) : history.slice(-30);
    const avg = {};
    PILLARS.forEach(p => { avg[p.key] = items.reduce((s, d) => s + (d.pillars[p.key] || 0), 0) / items.length; });
    return avg;
  }, [period, data, history]);

  const totalMin = activePillars.reduce((s, p) => s + p.maxMin * (periodData[p.key] || 0), 0);
  const boosted = totalMin * HRV_STATES[hrvState].mult;
  const totalHrs = (boosted / 60).toFixed(1);
  const enabledCount = Object.values(enabled).filter(Boolean).length;
  const maxHlyDay = selectablePillars.filter(p => enabled[p.key]).reduce((s, p) => s + p.maxMin, 0) / 60 + 0.5;

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
                    <div style={{ fontSize: 9, color: T.textTer }}>HLY/den</div>
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
              background: darkMode ? "#2D2A50" : "#F3F1FF", borderRadius: T.r, border: `2px solid ${darkMode ? "#3D3A60" : "#9B8FFF40"}`, opacity: 0.7 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: darkMode ? "#3D3A60" : "#9B8FFF20",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Monitoring</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>HRV měření + zadávání aktivit</div>
              </div>
              <div style={{ fontSize: 11, color: "#9B8FFF", fontWeight: 600, background: darkMode ? "#3D3A60" : "#9B8FFF15", padding: "4px 10px", borderRadius: 20 }}>Vždy aktivní</div>
            </div>
          </div>

          </div>
          <div style={{ position: "sticky", bottom: 0, padding: "16px 20px 32px",
            background: `linear-gradient(transparent, ${T.bg} 20%)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: T.textSec }}>{enabledCount} {enabledCount < 5 ? "pilíře" : "pilířů"}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>až {maxHlyDay.toFixed(1)}h HLY/den</span>
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
          const whole = Math.floor(h);
          const half = h % 1 >= 0.5;
          return half ? `${whole}h 30min` : `${whole}h`;
        };

        return (
          <ThemeCtx.Provider value={T}>
          <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, padding: "40px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: darkMode ? "#2D2B50" : "#F0F1FF",
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
                            background: on ? (darkMode ? T.primarySoft : "#ECEEFF") : T.card,
                            borderRadius: on ? 0 : T.rSm,
                            border: on ? "none" : "none",
                            boxShadow: on ? "none" : T.shadow,
                            cursor: "pointer", textAlign: "left", fontFamily: T.f, transition: "all 0.2s ease" }}>
                          <span style={{ fontSize: 22 }}>{goal.icon}</span>
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
                            borderTop: `1px solid ${darkMode ? T.border : "#E8E9FF"}` }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>
                              Kolik hodin chceš spát?
                            </div>
                            <div style={{ textAlign: "center", marginBottom: 12 }}>
                              <span style={{ fontSize: 32, fontWeight: 800, color: accentColor }}>{formatHours(spanekHours)}</span>
                            </div>
                            <style>{`
                              input[type="range"].spanek-hrs { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
                              input[type="range"].spanek-hrs::-webkit-slider-runnable-track { height: 8px; border-radius: 4px; background: linear-gradient(90deg, ${darkMode ? "#2A2B50" : "#F0F1FF"}, ${accentColor}); }
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

      // ─── OTHER PILLARS: simple single question ───
      const pillarSoft = darkMode ? (pillar.darkSoft || pillar.soft) : pillar.soft;
      return (
        <ThemeCtx.Provider value={T}>
        <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", padding: "60px 20px 40px" }}>
            <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
              Krok 2 z 3 · {onbSetupIdx + 1}/{activeForSetup.length}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {activeForSetup.map((p, i) => (
                <div key={p.key} style={{ flex: 1, height: 4, borderRadius: 2,
                  background: i <= onbSetupIdx ? p.color : T.border,
                  opacity: i <= onbSetupIdx ? 1 : 0.4, transition: "all 0.4s ease" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: pillarSoft,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{pillar.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{pillar.label}</div>
                <div style={{ fontSize: 13, color: pillar.color, fontWeight: 600 }}>Až +{(pillar.maxMin / 60).toFixed(1)}h HLY/den</div>
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 20 }}>{m.question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {m.options.map((opt, i) => (
                <button key={i} onClick={() => {
                  setOnbAnswers(a => ({ ...a, [pillar.key]: opt }));
                  if (onbSetupIdx < activeForSetup.length - 1) setOnbSetupIdx(x => x + 1);
                  else setOnbStep(3);
                }} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "16px 18px",
                  background: T.card, borderRadius: T.rSm, border: `2px solid ${T.border}`,
                  cursor: "pointer", textAlign: "left", fontFamily: T.f, fontSize: 14, fontWeight: 500, color: T.text,
                  boxShadow: T.shadow,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: T.cardAlt,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: T.textSec, fontWeight: 700, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</div>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
        </ThemeCtx.Provider>
      );
    }

    // ── Step 3: Potential ──
    if (onbStep === 3) {
      const remaining = Math.max(65 - age, 0);
      const potentialYears = remaining > 0 ? ((maxHlyDay * 365 / 24) * remaining) / 365 : 0;
      const projected = 65 + potentialYears;
      const basePct = ((65 - age) / (80 - age)) * 100;
      const projPct = ((projected - age) / (80 - age)) * 100;
      return (
        <ThemeCtx.Provider value={T}>
        <div style={{ background: T.bg, fontFamily: T.f, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 393, maxWidth: "100%", minHeight: "100vh", padding: "60px 20px 40px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, color: T.textTer, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Krok 3 z 3</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 32 }}>Tvůj potenciál</div>
            <div style={{ textAlign: "center", marginBottom: 32,
              opacity: animate ? 1 : 0, transform: animate ? "scale(1)" : "scale(0.8)",
              transition: "all 1s cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: "0.3s" }}>
              <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1,
                background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})`,
                backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>{projected.toFixed(1)}</div>
              <div style={{ fontSize: 16, color: T.textSec, marginTop: 8 }}>let ve zdraví</div>
            </div>
            <div style={{ marginBottom: 24, opacity: animate ? 1 : 0, transition: "opacity 0.8s ease", transitionDelay: "0.8s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: `linear-gradient(135deg, ${T.gradStart}, ${T.gradEnd})` }} />
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>Tvá cesta</span>
              </div>
              <div style={{ height: 28, borderRadius: 14, background: T.border, overflow: "hidden", marginBottom: 12, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 14,
                  width: animate ? `${projPct}%` : "0%", background: `linear-gradient(90deg, ${T.gradStart}, ${T.gradEnd})`,
                  transition: "width 2s cubic-bezier(0.34,1.56,0.64,1)", transitionDelay: "1s" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: T.borderStrong }} />
                <span style={{ fontSize: 12, color: T.textSec }}>Průměr populace</span>
              </div>
              <div style={{ height: 28, borderRadius: 14, background: T.border, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${basePct}%`, borderRadius: 14, background: T.borderStrong }} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24,
              opacity: animate ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "1.5s" }}>
              {activePillars.map(p => {
                const softBg = darkMode ? (p.darkSoft || p.soft) : p.soft;
                return (
                  <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6, background: softBg, borderRadius: 20, padding: "6px 12px" }}>
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>+{(p.maxMin / 60).toFixed(1)}h</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: `linear-gradient(135deg, ${T.gradStart}0D, ${T.gradEnd}08)`,
              borderRadius: T.rSm, padding: "16px", border: `1px solid ${T.border}`, marginBottom: 32,
              opacity: animate ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: "2s" }}>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.6 }}>
                Při plnění {enabledCount} pilířů můžeš každý den získat až{" "}
                <strong style={{ color: T.primary }}>{maxHlyDay.toFixed(1)} hodin</strong> zdravého života navíc.
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
            <div style={{ width: 40, height: 40, borderRadius: 10, background: darkMode ? "#2D2A50" : "#F3F1FF",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Monitoring</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 1 }}>+0.5h/den · Vždy aktivní</div>
            </div>
            <div style={{ width: 50, height: 28, borderRadius: 14, padding: 2, background: "#9B8FFF" }}>
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
              <strong style={{ color: T.primary }}>{maxHlyDay.toFixed(1)}h HLY/den</strong>
            </div>
          </div>
        </div>
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
        input[type="range"] {
          -webkit-appearance: none; appearance: none; background: transparent;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 4px; border-radius: 2px; background: ${T.border};
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${T.primary}; border: 2px solid ${T.card};
          box-shadow: 0 1px 4px rgba(0,0,0,0.15); margin-top: -7px; cursor: pointer;
        }
      `}</style>
      <div style={{width:393,maxWidth:"100%"}}>
        {/* HEADER */}
        <div style={{padding:"14px 20px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:-0.3}}>Healthy Life Years</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <DarkModeToggle dark={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            <button onClick={() => setScreen("settings")} style={{width:44,height:44,borderRadius:22,background:T.card,
              boxShadow:T.shadow, border:"none", cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.textSec} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
          </div>
        </div>

        {/* HERO: THE GAP */}
        <div style={{margin:"10px 16px 4px",background:`linear-gradient(145deg, ${T.gradStart}12, ${T.gradEnd}0A)`,
          borderRadius:T.r,padding:"2px",boxShadow:`0 4px 20px ${T.gradStart}15`}}>
          <TheGap data={periodData} hrvState={hrvState} age={age} onAgeChange={setAge} animate={animate} activePillars={activePillars}/>
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

        {/* DAY VIEW */}
        {period==="day"&&<>
          <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"16px",boxShadow:T.shadow}}>
            <div style={{display:"flex",background:T.cardAlt,borderRadius:T.rSm,padding:3,gap:3,marginBottom:12}}>
              {[{id:"radar",label:"Radar"},{id:"gauges",label:"Budíky"}].map(tab=>(
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
              {chartView==="radar"?<RadarChart data={data} pillars={activePillars} animate={animate}/>:<GaugeGrid data={data} pillars={activePillars} animate={animate}/>}
              {chartView==="radar"&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%, -50%)",textAlign:"center",pointerEvents:"none"}}>
                <div style={{fontSize:30,fontWeight:800,color:T.text,lineHeight:1}}>{totalHrs}</div>
                <div style={{fontSize:10,color:T.textSec,fontWeight:500}}>HLY hodin</div>
              </div>}
            </div>
          </div>

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
              celebrated={celebrated} onCelebrate={setCelebrated}/>)}
          </div>

          <div style={{margin:"8px 16px"}}>
            <NudgeCards data={data} activePillars={activePillars}/>
          </div>
        </>}

        {/* WEEK / MONTH VIEW */}
        {(period==="week"||period==="month")&&<>
          <div style={{margin:"8px 16px"}}><PeriodSummary history={history} period={period} activePillars={activePillars}/></div>

          <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"16px",boxShadow:T.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{width:6,height:6,borderRadius:3,background:T.primary}}/>
              <span style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:T.f}}>Denní HLY</span>
              <span style={{marginLeft:"auto",fontSize:11,color:T.textTer,fontFamily:T.f}}>max 6h/den</span>
            </div>
            <BarChart history={history} period={period} animate={animate}/>
          </div>

          <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"16px",boxShadow:T.shadow}}>
            <CumulativeTrend history={history} period={period} animate={animate}/>
          </div>

          {/* Pilíře — averaged */}
          {(()=>{
            const items=period==="week"?history.slice(-7):history.slice(-30);
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
                  const val=avgData[p.key]||0;const pct=Math.round(val*100);
                  const days=period==="week"?7:30;
                  const hly=((p.maxMin*val*days)/60).toFixed(1);
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
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <span style={{fontSize:11,fontWeight:600,color:p.color,background:softBg,padding:"1px 7px",borderRadius:20,fontFamily:T.f}}>{pct}%</span>
                            <span style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:T.f}}>{hly}h</span>
                          </div>
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
        </>}

        {/* HRV RESILIENCE BOOST */}
        <div style={{margin:"8px 16px",background:T.card,borderRadius:T.r,padding:"14px 16px 12px",boxShadow:T.shadow}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.green}}/>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>HRV Resilience Boost</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            {HRV_STATES.map((s,i)=>(
              <button key={i} onClick={()=>setHrvState(i)} style={{
                flex:1,padding:"9px 4px",borderRadius:T.rSm,border:"none",
                background:hrvState===i?(darkMode?s.darkBg:s.bg):T.cardAlt,
                outline:hrvState===i?`2px solid ${s.color}`:`2px solid transparent`,
                cursor:"pointer",transition:"all 0.25s ease",
              }}>
                <div style={{fontSize:17,fontWeight:800,color:hrvState===i?s.color:T.textTer,fontFamily:T.f}}>×{s.mult}</div>
                <div style={{fontSize:9,color:hrvState===i?s.color:T.textTer,fontWeight:600,marginTop:2,fontFamily:T.f}}>{s.tag}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"24px 20px 40px",textAlign:"center"}}>
          <button onClick={() => {
            setScreen("onboarding"); setOnbStep(0); setOnbSetupIdx(0); setOnbAnswers({});
            setSpanekGoals([]); setSpanekHours(7.5);
            setEnabled({ pohyb: true, spanek: true, strava: false, stres: false, vztahy: false });
          }} style={{background:"none",border:"none",cursor:"pointer",
            fontSize:12,fontWeight:600,color:T.textTer,fontFamily:T.f,padding:0}}>
            Resetovat onboarding
          </button>
        </div>

      </div>
    </div>
    </ThemeCtx.Provider>
  );
}
