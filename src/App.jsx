import { useState, useEffect } from "react";

/* ══ CONSTANTS ══ */
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "https://qnxeyoxashvbljjmqkrp.supabase.co";
const SB_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";

const THEMES = {
  default: { primary:"#2D6A4F", light:"#d8f3dc", dark:"#1b4332" },
  forest:  { primary:"#1a3a2a", light:"#c8e6c9", dark:"#0d1f17" },
  ocean:   { primary:"#1565c0", light:"#bbdefb", dark:"#0d47a1" },
};

const XP_PER_MODULE = { grammar:5, vocabulary:5, reading:20, mistakes:10, quiz:10, peel:50 };

const UNLOCKS = [
  { xp:100,  type:"peel",        label:"Advanced PEEL Topics",      desc:"Unlock 4 challenging writing topics",   icon:"📝" },
  { xp:200,  type:"theme",       label:"Dark Forest Theme",          desc:"Unlock a deep green visual theme",      icon:"🌲" },
  { xp:500,  type:"level",       label:"Intermediate Level",         desc:"Automatically move to Intermediate",    icon:"🌿" },
  { xp:800,  type:"exercises",   label:"Advanced Exercises",         desc:"Unlock harder grammar & quiz sets",     icon:"🎯" },
  { xp:1000, type:"theme",       label:"Ocean Blue Theme",           desc:"Unlock a blue ocean visual theme",      icon:"🌊" },
  { xp:1500, type:"level",       label:"Advanced Level",             desc:"Automatically move to Advanced",        icon:"🌳" },
  { xp:2000, type:"certificate", label:"Certificate of Achievement", desc:"Download your official PDF certificate",icon:"🏆" },
];

const ENCOURAGE = [
  { title:"🔥 Already done today!", body:"You've already earned XP for this module today. Come back tomorrow!", sub:"Extra practice = extra mastery." },
  { title:"💪 Great dedication!", body:"No XP today — you already earned it! But every session builds skills.", sub:"Consistency is the key to mastery." },
  { title:"⭐ You're on fire!", body:"XP already collected today. Your commitment shows real growth!", sub:"See you tomorrow for fresh XP!" },
  { title:"🎯 Keep practising!", body:"Today's XP is secured. Extra practice makes you better every day!", sub:"The best students practise without rewards." },
];

/* ══ SUPABASE ══ */
const sbH = (t) => ({ "Content-Type":"application/json", "apikey":SB_KEY, "Authorization":`Bearer ${t||SB_KEY}`, "Prefer":"return=representation" });
const sbGet    = (p,t) => fetch(`${SB_URL}/rest/v1/${p}`, { headers:sbH(t) }).then(r=>r.json());
const sbPost   = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`, { method:"POST", headers:sbH(t), body:JSON.stringify(b) }).then(r=>r.json());
const sbPatch  = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`, { method:"PATCH", headers:{...sbH(t),"Prefer":"return=representation"}, body:JSON.stringify(b) }).then(r=>r.json());
const sbUpsert = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`, { method:"POST", headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=representation"}, body:JSON.stringify(b) }).then(r=>r.json());
const authSignUp = (e,p) => fetch(`${SB_URL}/auth/v1/signup`, { method:"POST", headers:{"Content-Type":"application/json","apikey":SB_KEY}, body:JSON.stringify({email:e,password:p}) }).then(r=>r.json());
const authSignIn = (e,p) => fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method:"POST", headers:{"Content-Type":"application/json","apikey":SB_KEY}, body:JSON.stringify({email:e,password:p}) }).then(r=>r.json());

/* ══ HELPERS ══ */
const todayStr = () => new Date().toISOString().slice(0,10);
const getLvl = (xp) => {
  if (xp<500)  return { name:"Bronze",   color:"#cd7f32", min:0,    next:500  };
  if (xp<1500) return { name:"Silver",   color:"#9e9e9e", min:500,  next:1500 };
  if (xp<3000) return { name:"Gold",     color:"#ffd700", min:1500, next:3000 };
  return               { name:"Platinum", color:"#4fc3f7", min:3000, next:5000 };
};
const rnd = (arr) => arr[Math.floor(Math.random()*arr.length)];
const wc  = (txt) => txt.trim().split(/\s+/).filter(w=>w.length>0).length;

/* ══ UI COMPONENTS ══ */
const Btn = ({ onClick, children, full, secondary, disabled, style={} }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ width:full?"100%":"auto", background:secondary?"transparent":"var(--g)",
      color:secondary?"var(--g)":"#fff", border:secondary?"2px solid var(--g)":"none",
      borderRadius:12, padding:"12px 20px", fontWeight:700, fontSize:14,
      cursor:disabled?"not-allowed":"pointer", opacity:disabled?.5:1,
      marginTop:8, fontFamily:"inherit", ...style }}>
    {children}
  </button>
);
const Card = ({ children, style={} }) => (
  <div style={{ background:"#fff", borderRadius:16, padding:18, boxShadow:"0 2px 12px #0001", ...style }}>{children}</div>
);
const Tag = ({ children, color, textColor }) => (
  <span style={{ background:color||"var(--lt)", color:textColor||"var(--g)", borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:600 }}>{children}</span>
);
const Loader = ({ text="Loading…" }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:48, gap:16 }}>
    <div style={{ width:40, height:40, border:"4px solid var(--lt)", borderTop:"4px solid var(--g)", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
    <p style={{ color:"var(--g)", fontWeight:600, fontSize:14, textAlign:"center" }}>{text}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ══ OFFLINE (IndexedDB) ══ */
const openDB = () => new Promise((res,rej) => {
  const req = indexedDB.open("writeup-offline",1);
  req.onupgradeneeded = e => { const db=e.target.result; if(!db.objectStoreNames.contains("content")) db.createObjectStore("content",{keyPath:"key"}); };
  req.onsuccess = e => res(e.target.result);
  req.onerror   = e => rej(e.target.error);
});
const cacheItem = async (key,data) => {
  try { const db=await openDB(); const tx=db.transaction("content","readwrite"); tx.objectStore("content").put({key,data,cachedAt:new Date().toISOString()}); await new Promise(r=>{tx.oncomplete=r;tx.onerror=r;}); } catch{}
};
const getCached = async (key) => {
  try { const db=await openDB(); const tx=db.transaction("content","readonly"); const req=tx.objectStore("content").get(key); return new Promise(r=>{req.onsuccess=()=>r(req.result?.data||null);req.onerror=()=>r(null);}); } catch { return null; }
};
const isOfflineReady = async () => { const r=await getCached("offline_ready"); return !!r?.ready; };
const cacheAll = async () => {
  for(let i=0;i<GRAMMAR_BANK.length;i++) await cacheItem(`grammar_${i}`,GRAMMAR_BANK[i]);
  for(let i=0;i<VOCAB_BANK.length;i++)   await cacheItem(`vocab_${i}`,VOCAB_BANK[i]);
  for(let i=0;i<MISTAKES_BANK.length;i++) await cacheItem(`mistake_${i}`,MISTAKES_BANK[i]);
  await cacheItem("offline_ready",{ready:true});
  return true;
};

/* ══ NOTIFICATIONS ══ */
const NOTIF = {
  daily: [
    {title:"✍️ WriteUP UPGC", body:"Your daily English challenge is ready! Keep your streak going 🔥"},
    {title:"📚 Time to learn!", body:"New grammar exercise + word of the day waiting for you."},
    {title:"🎯 Daily challenge!", body:"Complete today's modules and earn XP. Don't break your streak!"},
  ],
  levelUp: (l) => ({title:"🏆 Level Up!", body:`Congratulations! You just reached ${l} level. Keep pushing! 🎉`}),
  peelLow: (s) => ({title:"💪 Keep improving!", body:`Your PEEL score was ${s}/20. Review the feedback and try again!`}),
  weekly:  {title:"📅 Weekly Challenge!", body:"A new weekly challenge just dropped! Complete all 6 modules this week for bonus XP 🌟"},
};
const showNotif = (title,body) => { if(Notification?.permission==="granted") new Notification(title,{body,icon:"/favicon.svg",vibrate:[200,100,200]}); };
const reqNotif  = async () => { if(!("Notification" in window)) return "unsupported"; if(Notification.permission==="granted") return "granted"; return Notification.requestPermission(); };
const registerSW = async () => { if(!("serviceWorker" in navigator)) return null; try { return await navigator.serviceWorker.register("/sw.js"); } catch{ return null; } };
const scheduleDailyReminder = (sw, timeStr) => {
  if(!sw||Notification?.permission!=="granted") return;
  const [h,m]=timeStr.split(":").map(Number);
  const next=new Date(); next.setHours(h,m,0,0);
  if(next<=new Date()) next.setDate(next.getDate()+1);
  sw.active?.postMessage({type:"SCHEDULE_NOTIFICATION",...rnd(NOTIF.daily),delay:next-new Date()});
  localStorage.setItem("writeup_notif_time",timeStr);
};

/* ══ CERTIFICATE ══ */
const generateCert = (name,level,xp,date) => {
  const c=document.createElement("canvas"); c.width=800; c.height=560;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#f9fbe7"; ctx.fillRect(0,0,800,560);
  ctx.strokeStyle="#2D6A4F"; ctx.lineWidth=8; ctx.strokeRect(20,20,760,520);
  ctx.strokeStyle="#81c784"; ctx.lineWidth=3; ctx.strokeRect(30,30,740,500);
  ctx.fillStyle="#2D6A4F"; ctx.font="bold 36px Georgia,serif"; ctx.textAlign="center";
  ctx.fillText("WriteUP UPGC",400,90);
  ctx.font="17px Georgia,serif"; ctx.fillStyle="#555";
  ctx.fillText("Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire",400,120);
  ctx.fillStyle="#2D6A4F"; ctx.fillRect(100,135,600,3);
  ctx.font="bold 26px Georgia,serif"; ctx.fillStyle="#1b4332";
  ctx.fillText("Certificate of Achievement",400,180);
  ctx.font="17px Georgia,serif"; ctx.fillStyle="#333";
  ctx.fillText("This certifies that",400,225);
  ctx.font="bold 40px Georgia,serif"; ctx.fillStyle="#2D6A4F";
  ctx.fillText(name,400,278);
  const nw=ctx.measureText(name).width;
  ctx.fillStyle="#81c784"; ctx.fillRect(400-nw/2,288,nw,3);
  ctx.font="17px Georgia,serif"; ctx.fillStyle="#333";
  ctx.fillText("has successfully completed the WriteUP UPGC Academic English Programme",400,330);
  ctx.fillText(`reaching ${level} level with ${xp} XP earned`,400,360);
  ctx.font="bold 15px Georgia,serif"; ctx.fillStyle="#2D6A4F";
  [["Level",level],["XP Earned",String(xp)],["Date",date]].forEach(([l,v],i)=>{
    const x=160+i*220;
    ctx.fillText(l,x,415); ctx.font="13px Georgia,serif"; ctx.fillStyle="#555";
    ctx.fillText(v,x,435); ctx.font="bold 15px Georgia,serif"; ctx.fillStyle="#2D6A4F";
  });
  ctx.fillStyle="#888"; ctx.font="12px Georgia,serif";
  ctx.fillText("This certificate was issued by WriteUP UPGC — writeup-upgc.vercel.app",400,510);
  return c.toDataURL("image/png");
};

/* ══ ANALYTICS ══ */
const getWeekNum = () => { const d=new Date(),o=new Date(d.getFullYear(),0,1); return Math.ceil((((d-o)/86400000)+o.getDay()+1)/7); };

const savePlacement = async (uid,tk,scores,level) => {
  try {
    await sbPost("placement_results",{user_id:uid,grammar_score:scores.Grammar,vocab_score:scores.Vocabulary,reading_score:scores.Reading,total_score:scores.Grammar+scores.Vocabulary+scores.Reading,level_assigned:level,week_number:getWeekNum()},tk);
    await sbPatch(`users?id=eq.${uid}`,{initial_level:level,initial_score:scores.Grammar+scores.Vocabulary+scores.Reading,current_level:level},tk);
  } catch(e){ console.error(e); }
};

const saveSession = async (uid,tk,{module,score,total,passed,xpEarned,timeSec,errors=[],title=""}) => {
  try {
    const accuracy = total>0 ? Math.round((score/total)*100) : 0;
    await sbPost("module_sessions",{user_id:uid,module,score,total_questions:total,accuracy,passed,xp_earned:xpEarned,time_spent_sec:timeSec,errors_detail:errors,content_title:title},tk);
    const field = {grammar:"grammar_accuracy",vocabulary:"vocab_accuracy",quiz:"quiz_accuracy"}[module];
    if(field){
      const prev = await sbGet(`users?id=eq.${uid}&select=${field},total_sessions,total_time_minutes`,tk);
      const u = prev?.[0]||{};
      const newAcc = u[field]===0 ? accuracy : Math.round(((u[field]||0)+accuracy)/2);
      await sbPatch(`users?id=eq.${uid}`,{[field]:newAcc,total_sessions:(u.total_sessions||0)+1,total_time_minutes:(u.total_time_minutes||0)+Math.round(timeSec/60),last_active_date:todayStr()},tk);
    }
  } catch(e){ console.error(e); }
};

const savePeel = async (uid,tk,{topic,attemptNum,vals,scores,timeSec}) => {
  try {
    const wordTotal = Object.values(vals).reduce((a,v)=>a+wc(v),0);
    const prev = await sbGet(`peel_attempts?user_id=eq.${uid}&order=created_at.desc&limit=1&select=total_score`,tk);
    const prevScore = prev?.[0]?.total_score||0;
    await sbPost("peel_attempts",{user_id:uid,topic,attempt_number:attemptNum,point_text:vals.point,explanation_text:vals.explanation,evidence_text:vals.evidence,link_text:vals.link,score_point:scores.point,score_expl:scores.expl,score_evidence:scores.evidence,score_link:scores.link,score_grammar:scores.grammar,score_length:scores.length,total_score:scores.total,passed:scores.total>=10,time_spent_sec:timeSec,word_count_total:wordTotal,score_improvement:scores.total-prevScore},tk);
    const u2 = await sbGet(`users?id=eq.${uid}&select=peel_avg_score,peel_attempts_total`,tk);
    const u = u2?.[0]||{};
    const newAvg = (u.peel_attempts_total||0)===0 ? scores.total : Math.round(((u.peel_avg_score||0)*(u.peel_attempts_total||0)+scores.total)/((u.peel_attempts_total||0)+1));
    await sbPatch(`users?id=eq.${uid}`,{peel_avg_score:newAvg,peel_attempts_total:(u.peel_attempts_total||0)+1,last_active_date:todayStr()},tk);
  } catch(e){ console.error(e); }
};

const saveXpHistory = async (uid,tk,xpEarned,moduleId) => {
  try {
    const ex = await sbGet(`xp_history?user_id=eq.${uid}&date=eq.${todayStr()}`,tk);
    const prev = ex?.[0];
    if(prev){
      await sbPatch(`xp_history?user_id=eq.${uid}&date=eq.${todayStr()}`,{xp_earned:(prev.xp_earned||0)+xpEarned,modules_done:[...(prev.modules_done||[]),moduleId]},tk);
    } else {
      await sbPost("xp_history",{user_id:uid,date:todayStr(),xp_earned:xpEarned,modules_done:[moduleId]},tk);
    }
  } catch(e){ console.error(e); }
};

const saveSnapshot = async (uid,tk,u) => {
  try {
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-weekStart.getDay());
    const ws = weekStart.toISOString().slice(0,10);
    const wn = getWeekNum(); const yr = new Date().getFullYear();
    const xpW = await sbGet(`xp_history?user_id=eq.${uid}&date=gte.${ws}&select=xp_earned`,tk);
    const weekXp = (xpW||[]).reduce((a,r)=>a+(r.xp_earned||0),0);
    const snap = {user_id:uid,week_start:ws,week_number:wn,year:yr,level:u.current_level||u.level||"Beginner",xp_total:u.xp||0,xp_gained_week:weekXp,days_active:u.days_active||0,grammar_accuracy:u.grammar_accuracy||0,vocab_accuracy:u.vocab_accuracy||0,quiz_accuracy:u.quiz_accuracy||0,peel_avg_score:u.peel_avg_score||0,peel_attempts:u.peel_attempts_total||0,streak_at_snapshot:u.streak||0};
    const ex2 = await sbGet(`weekly_snapshots?user_id=eq.${uid}&week_number=eq.${wn}&year=eq.${yr}`,tk);
    if(ex2?.[0]) await sbPatch(`weekly_snapshots?user_id=eq.${uid}&week_number=eq.${wn}&year=eq.${yr}`,snap,tk);
    else await sbPost("weekly_snapshots",snap,tk);
  } catch(e){ console.error(e); }
};

/* ══════════════════════════════════════
   CONTENT BANKS
══════════════════════════════════════ */
const GRAMMAR_BANK = [
  {title:"Present Simple — Habits",instruction:"Choose the correct verb form.",question:"She ___ to the library every Tuesday morning.",opts:["go","goes","is going","has gone"],ans:1,explanation:"We use present simple for habits. 'Every Tuesday' signals a routine, so 'goes' is correct.",tip:"Present simple = habits/routines. Key words: always, usually, every day, never, sometimes."},
  {title:"Uncountable Nouns",instruction:"Choose the correct sentence.",question:"Which sentence is grammatically correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,explanation:"'Advice' is uncountable — it has no plural form. Always say 'some advice' or 'a piece of advice'.",tip:"Uncountable nouns (no plural -s): advice, information, furniture, equipment, news, progress."},
  {title:"Second Conditional",instruction:"Choose the correct form.",question:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,explanation:"Second conditional = If + past simple + would + base verb. It describes hypothetical situations.",tip:"Structure: 'If + subject + past simple, subject + would + base verb.'"},
  {title:"Relative Clauses",instruction:"Choose the correct relative pronoun.",question:"The student ___ scored highest in the test received a prize.",opts:["which","whose","who","whom"],ans:2,explanation:"Use 'who' for people in relative clauses. 'Which' is for things.",tip:"Who = people. Which = things. Whose = possession. That = people or things (informal)."},
  {title:"Articles: A / An",instruction:"Choose the correct article.",question:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,explanation:"'University' starts with a /j/ sound (consonant sound), so we use 'a', not 'an'. The rule depends on SOUND.",tip:"Use 'an' before vowel SOUNDS: an hour, an umbrella. Use 'a' before consonant SOUNDS: a university, a European."},
  {title:"Past Perfect",instruction:"Choose the correct tense.",question:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,explanation:"Past perfect (had + past participle) is used for an action completed BEFORE another past action.",tip:"Past perfect = had + past participle. Signal words: by the time, already, before, after."},
  {title:"Passive Voice",instruction:"Choose the correct passive form.",question:"All assignments ___ before the end of the semester.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,explanation:"Passive voice = modal + be + past participle. 'Must be submitted' is correct.",tip:"Passive voice: subject + be + past participle. Active: 'Students submit essays.' Passive: 'Essays are submitted.'"},
  {title:"Gerund vs Infinitive",instruction:"Choose the correct form.",question:"She avoided ___ the difficult questions during the debate.",opts:["to answer","answer","answering","answered"],ans:2,explanation:"'Avoid' must always be followed by a gerund (-ing form). Using an infinitive after 'avoid' is incorrect.",tip:"Verbs + gerund: avoid, enjoy, finish, consider, suggest. Verbs + infinitive: want, need, decide, hope, plan."},
  {title:"Subject-Verb Agreement",instruction:"Choose the correct verb.",question:"Neither the students nor the teacher ___ aware of the schedule change.",opts:["were","are","was","is"],ans:2,explanation:"With 'neither...nor', the verb agrees with the NEAREST subject. 'Teacher' is singular, so we use 'was'.",tip:"Neither...nor / either...or: the verb agrees with the closest subject."},
  {title:"Reported Speech",instruction:"Choose the correct reported speech form.",question:"She said: 'I am preparing for my exams.' → She said that she ___ for her exams.",opts:["is preparing","was preparing","has been preparing","prepares"],ans:1,explanation:"In reported speech, present continuous (am preparing) shifts to past continuous (was preparing).",tip:"Backshift: am/is → was | have → had | will → would | can → could."},
  {title:"Prepositions with Adjectives",instruction:"Choose the correct preposition.",question:"She is very good ___ mathematics and statistics.",opts:["in","on","at","for"],ans:2,explanation:"In English, we say 'good at' a subject or skill. 'Good in' or 'good on' are incorrect.",tip:"Fixed expressions: good at, bad at, interested in, responsible for, afraid of, proud of."},
  {title:"Present Perfect vs Past Simple",instruction:"Choose the correct tense.",question:"I ___ my homework, so I can go out now.",opts:["finish","finished","have finished","had finished"],ans:2,explanation:"Present perfect is used when a past action has a result in the present. 'I have finished' explains why I can go out now.",tip:"Present perfect = have/has + past participle. Use for recent actions with present results."},
];

const VOCAB_BANK = [
  {word:"Analyse",phonetic:"/ˈæn.ə.laɪz/",french:"Analyser",partOfSpeech:"verb",definition:"To examine something carefully and in detail in order to understand it fully.",example:"The students must ___ the poem before writing their critical essay.",blank:"analyse",opts:["analyse","ignore","copy","avoid"],ans:0,memory_tip:"Think of 'ana' (apart) + 'lyse' (loosen). To analyse is to break something apart to understand each piece."},
  {word:"Significant",phonetic:"/sɪɡˈnɪf.ɪ.kənt/",french:"Important / Significatif",partOfSpeech:"adjective",definition:"Important or large enough to have a noticeable effect or to be worth attention.",example:"There has been a ___ improvement in her academic writing since last semester.",blank:"significant",opts:["significant","small","boring","strange"],ans:0,memory_tip:"'Sign' is inside significant — something significant gives a clear sign that it matters."},
  {word:"Coherent",phonetic:"/kəʊˈhɪə.rənt/",french:"Cohérent / Logique",partOfSpeech:"adjective",definition:"Logical, well-organised, and easy to understand; all parts connecting well together.",example:"A well-written essay must present a ___ argument that flows from beginning to end.",blank:"coherent",opts:["emotional","coherent","confusing","short"],ans:1,memory_tip:"'Co' (together) + 'here' (stick). Coherent ideas stick together in a logical way."},
  {word:"Evidence",phonetic:"/ˈev.ɪ.dəns/",french:"Preuve",partOfSpeech:"noun (uncountable)",definition:"Facts, information, or signs that show whether a claim or belief is true or valid.",example:"Every argument in an academic essay must be supported by reliable ___.",blank:"evidence",opts:["opinion","evidence","feeling","title"],ans:1,memory_tip:"'Evident' — something evident is easy to see, just like evidence makes the truth visible."},
  {word:"Conclude",phonetic:"/kənˈkluːd/",french:"Conclure",partOfSpeech:"verb",definition:"To decide that something is true after carefully considering all available information.",example:"Based on the research findings, we can ___ that education significantly reduces poverty.",blank:"conclude",opts:["begin","wonder","conclude","forget"],ans:2,memory_tip:"'Con' + 'clude' (close). To conclude is to close your thinking with a final decision."},
  {word:"Fundamental",phonetic:"/ˌfʌn.dəˈmen.təl/",french:"Fondamental / Essentiel",partOfSpeech:"adjective",definition:"Forming the necessary base or core of something; of central and essential importance.",example:"Critical thinking is a ___ skill that all university students must develop.",blank:"fundamental",opts:["optional","fundamental","difficult","rare"],ans:1,memory_tip:"'Fund' = foundation. Fundamental = what everything else is built upon."},
  {word:"Illustrate",phonetic:"/ˈɪl.ə.streɪt/",french:"Illustrer / Démontrer",partOfSpeech:"verb",definition:"To make the meaning of something clearer by providing examples, diagrams, or evidence.",example:"This graph will clearly ___ how students' scores have improved over three years.",blank:"illustrate",opts:["hide","illustrate","remove","question"],ans:1,memory_tip:"'Illustrate' contains 'lustre' (light). You shed light on an idea with a clear example."},
  {word:"Consequence",phonetic:"/ˈkɒn.sɪ.kwəns/",french:"Conséquence",partOfSpeech:"noun",definition:"A result or effect of an action, decision, or condition.",example:"Poor time management can have serious academic ___s, including failing examinations.",blank:"consequence",opts:["reason","consequence","beginning","title"],ans:1,memory_tip:"'Con' + 'sequence' — consequences follow in sequence after an action, like dominoes."},
  {word:"Emphasise",phonetic:"/ˈem.fə.saɪz/",french:"Souligner / Insister sur",partOfSpeech:"verb",definition:"To show that something is especially important or deserves particular attention.",example:"The professor always ___ the importance of proofreading before submitting any assignment.",blank:"emphasise",opts:["ignore","forget","emphasise","remove"],ans:2,memory_tip:"'Em' + 'phase' — to put something in sharp focus, like a camera emphasising one subject."},
  {word:"Relevant",phonetic:"/ˈrel.ɪ.vənt/",french:"Pertinent / Approprié",partOfSpeech:"adjective",definition:"Closely connected or appropriate to the subject or matter being discussed.",example:"Make sure all the evidence you include in your essay is ___ to your main argument.",blank:"relevant",opts:["relevant","old","boring","random"],ans:0,memory_tip:"'Relevant' shares a root with 'relate'. Relevant information relates directly to your topic."},
  {word:"Justify",phonetic:"/ˈdʒʌs.tɪ.faɪ/",french:"Justifier",partOfSpeech:"verb",definition:"To show or prove that a decision, action, or statement is reasonable.",example:"You must ___ every claim you make in an academic essay with reliable evidence.",blank:"justify",opts:["hide","justify","ignore","repeat"],ans:1,memory_tip:"'Just' = fair/right. To justify means to show that something is fair and well-reasoned."},
  {word:"Approach",phonetic:"/əˈprəʊtʃ/",french:"Approche / Méthode",partOfSpeech:"noun/verb",definition:"A way of dealing with a situation or problem.",example:"The researcher used a qualitative ___ to study students' writing habits.",blank:"approach",opts:["problem","mistake","approach","question"],ans:2,memory_tip:"Think of 'approach' as stepping closer to a solution — you get nearer to it step by step."},
];

const READING_BANK = [
  {title:"Education and Development in Africa",topic:"Education · Development",passage:`Education is widely recognised as one of the most powerful tools for sustainable development in Africa. Countries that invest seriously in schools and universities tend to experience stronger economic growth, lower poverty rates, and more stable governments. In Côte d'Ivoire, the government has significantly increased spending on education over the past decade, resulting in higher enrolment rates at both primary and secondary levels.\n\nHowever, significant challenges remain. A shortage of qualified teachers in rural areas, limited access to technology, and inadequate school infrastructure continue to hinder progress. Many students in remote regions must walk several kilometres each day simply to attend school.\n\nDespite these obstacles, research consistently shows the transformative power of education. Students who complete secondary school are three times more likely to find formal employment than those who drop out.`,glossary:[{word:"sustainable",definition:"able to continue over a long period without causing damage"},{word:"enrolment",definition:"the process of officially registering in a school or course"},{word:"infrastructure",definition:"the basic physical structures needed for a society to function"},{word:"transformative",definition:"causing a major positive change"}],questions:[{q:"What does the passage say about countries that invest in education?",opts:["They face more economic problems","They experience stronger growth and lower poverty","They have fewer qualified teachers","They spend less on healthcare"],ans:1},{q:"What challenge regarding teachers is mentioned?",opts:["Too many teachers in cities","Shortage of qualified teachers in rural areas","Teachers are not well paid","Teachers refuse to work in villages"],ans:1},{q:"How much more likely are secondary school graduates to find work?",opts:["Twice as likely","Four times as likely","Three times as likely","Five times as likely"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy · Academic Success",passage:`Reading is arguably the single most important habit that a university student can cultivate. Research consistently demonstrates that students who read widely perform significantly better in examinations and produce higher quality written work. Reading expands vocabulary, sharpens comprehension skills, and develops the kind of critical thinking that academic success demands.\n\nIn many African universities, however, access to books and academic journals remains severely limited. Physical libraries are often under-resourced, and the cost of purchasing textbooks places a heavy financial burden on students and their families.\n\nA student who commits to reading for just thirty minutes each day can experience a measurable improvement in their academic performance within a single semester. The habit of reading is not a luxury — it is a daily discipline and a fundamental necessity for anyone who aspires to academic excellence.`,glossary:[{word:"cultivate",definition:"to develop a skill or habit through regular effort"},{word:"comprehension",definition:"the ability to understand something fully"},{word:"aspires",definition:"has a strong desire to achieve something great"},{word:"discipline",definition:"the ability to control your behaviour and follow a regular practice"}],questions:[{q:"What does the passage say reading does for students?",opts:["Makes them popular","Improves exam performance and writing quality","Replaces the need for lectures","Only helps with vocabulary"],ans:1},{q:"What financial challenge related to reading is mentioned?",opts:["Libraries are too expensive to build","Students cannot afford textbooks","Professors charge for reading lists","Digital books are too costly"],ans:1},{q:"What does the author say about reading for 30 minutes a day?",opts:["It is too little to make a difference","It leads to measurable academic improvement","It only helps in the first year","It replaces the need for studying"],ans:1}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature · Culture",passage:`Chinua Achebe is widely regarded as the father of modern African literature in English. His landmark novel, Things Fall Apart, published in 1958, tells the story of Okonkwo — a proud Igbo warrior whose life is disrupted by the arrival of European colonisers in Nigeria. The novel was groundbreaking because it presented African culture entirely from an African perspective.\n\nPrior to Achebe's work, Africa had largely been portrayed in European literature as a dark, primitive continent. Achebe set out to challenge this misrepresentation. He wrote in English but filled his prose with Igbo proverbs and oral traditions, creating a unique literary style.\n\nThings Fall Apart has since been translated into more than fifty languages and is studied in schools and universities across the world. Achebe believed deeply that literature had the power to change how individuals and societies understand themselves.`,glossary:[{word:"landmark",definition:"something important that marks a significant achievement"},{word:"groundbreaking",definition:"new and very important; doing something never done before"},{word:"misrepresentation",definition:"a false or misleading description of something"},{word:"prose",definition:"written language in its ordinary form, not poetry"}],questions:[{q:"Why is Things Fall Apart considered groundbreaking?",opts:["It was the first novel written in Africa","It presented African culture from an African perspective","It was written in the Igbo language","It was the longest African novel ever written"],ans:1},{q:"How did Achebe incorporate African culture into his English writing?",opts:["By refusing to use English grammar","By translating directly from Igbo","By using Igbo proverbs and oral traditions","By writing only about traditional ceremonies"],ans:2},{q:"Into how many languages has Things Fall Apart been translated?",opts:["Over 20","Over 30","Over 40","More than 50"],ans:3}]},
  {title:"Climate Change and Africa",topic:"Environment · Science",passage:`Climate change poses one of the most serious threats to Africa's development, even though the continent contributes relatively little to global greenhouse gas emissions. Rising temperatures, unpredictable rainfall, and increasingly frequent extreme weather events are already disrupting agriculture and threatening food security.\n\nIn the Sahel region, prolonged droughts have made farming increasingly difficult. Millions of people who depend on rain-fed agriculture are being forced to migrate to cities, placing enormous pressure on urban infrastructure.\n\nAt the same time, Africa possesses extraordinary natural resources that could support a green energy transition. The continent receives more solar energy than any other region on Earth. Experts argue that with the right investment, Africa could become a global leader in renewable energy production.`,glossary:[{word:"emissions",definition:"gases released into the atmosphere causing climate change"},{word:"livelihoods",definition:"ways of earning money and supporting oneself"},{word:"transition",definition:"a process of changing from one state to another"},{word:"renewable",definition:"naturally replenished and not permanently depleted when used"}],questions:[{q:"What does the passage say about Africa's contribution to climate change?",opts:["Africa is the biggest contributor","Africa contributes very little to global emissions","Africa produces no greenhouse gases","Africa is not affected by climate change"],ans:1},{q:"What is happening in the Sahel region?",opts:["Farmers are becoming wealthy","Cities are being abandoned","Droughts are forcing farmers to migrate","New farms are being created"],ans:2},{q:"What natural advantage does Africa have for green energy?",opts:["The most wind energy","The largest coal reserves","More solar energy than any other region","The deepest ocean currents"],ans:2}]},
];

const MISTAKES_BANK = [
  {title:"'Make' vs 'Do'",french_pattern:"Faire une erreur / Faire ses devoirs / Faire un effort",wrong_english:"I did a mistake in my essay and I must do an effort to improve.",correct_english:"I made a mistake in my essay and I must make an effort to improve.",rule:"Use MAKE for: mistakes, decisions, progress, noise, an effort, a difference. Use DO for: homework, exercises, work, research, a course, one's best. These are fixed collocations that must be memorised.",extra_examples:[{wrong:"She did a good decision to study English.",right:"She made a good decision to study English."},{wrong:"He is doing progress in his writing.",right:"He is making progress in his writing."},{wrong:"Can you make this exercise for me?",right:"Can you do this exercise for me?"}]},
  {title:"'Since' vs 'For'",french_pattern:"J'étudie l'anglais depuis 3 ans / depuis 2021",wrong_english:"I study English since 3 years and I am at UPGC since 2022.",correct_english:"I have been studying English for 3 years and I have been at UPGC since 2022.",rule:"'Since' refers to a specific point in time (since 2021, since Monday). 'For' refers to a duration (for 3 years, for two months). Both require the present perfect tense in English, NOT the present simple.",extra_examples:[{wrong:"She lives here since 5 years.",right:"She has lived here for 5 years."},{wrong:"I wait for you since 2 o'clock.",right:"I have been waiting for you since 2 o'clock."}]},
  {title:"'Actually' ≠ 'Actuellement'",french_pattern:"Actuellement, je travaille à l'UPGC",wrong_english:"Actually, I am a student at UPGC right now.",correct_english:"Currently, I am a student at UPGC.",rule:"'Actually' is a false friend! In English, 'actually' means 'in fact' or 'to tell the truth'. For 'actuellement' in French, use 'currently', 'at present', or 'at the moment'.",extra_examples:[{wrong:"Actually, the economy is growing fast.",right:"Currently, the economy is growing fast."},{wrong:"He actually studies medicine.",right:"He is currently studying medicine."}]},
  {title:"Double Negatives",french_pattern:"Je n'ai rien dit / Je ne vais nulle part",wrong_english:"I didn't say nothing. I don't know nobody here.",correct_english:"I didn't say anything. I don't know anybody here.",rule:"English does NOT allow double negatives. Use either 'not...anything' or 'nothing' alone — never both together. Two negatives cancel each other out in English.",extra_examples:[{wrong:"She doesn't know nothing about grammar.",right:"She doesn't know anything about grammar."},{wrong:"He never tells nobody his problems.",right:"He never tells anybody his problems."}]},
  {title:"'Assist' vs 'Attend'",french_pattern:"J'ai assisté au cours / J'ai assisté à la conférence",wrong_english:"I assisted the lecture this morning.",correct_english:"I attended the lecture this morning.",rule:"'Assist' in English means to help or support someone. 'Attend' means to be present at an event, meeting, or class. This is one of the most common false friends for French speakers.",extra_examples:[{wrong:"She assisted the wedding ceremony.",right:"She attended the wedding ceremony."},{wrong:"All students must assist the orientation day.",right:"All students must attend the orientation day."}]},
  {title:"Plural of Uncountable Nouns",french_pattern:"Des informations / Des conseils / Des bagages",wrong_english:"She gave me some useful informations and good advices.",correct_english:"She gave me some useful information and good advice.",rule:"Several nouns countable in French are UNCOUNTABLE in English: information, advice, furniture, equipment, luggage, news, research, knowledge, progress, feedback. They never take a plural -s.",extra_examples:[{wrong:"The news are very bad today.",right:"The news is very bad today."},{wrong:"Can you give me some advices?",right:"Can you give me some advice?"}]},
  {title:"Verb Tense: Future Plans",french_pattern:"Je fais ça demain / Je vais à Abidjan la semaine prochaine",wrong_english:"I study tomorrow instead of going out.",correct_english:"I am going to study tomorrow instead of going out.",rule:"For personal future plans, use 'going to' + base verb. Present simple is only used for fixed timetables and schedules (e.g. 'The train leaves at 9am').",extra_examples:[{wrong:"She travels to Abidjan next week.",right:"She is travelling to Abidjan next week."},{wrong:"I eat with my family tonight.",right:"I am going to eat with my family tonight."}]},
];

const QUIZ_BANK = [
  [{q:"Which sentence is correct?",opts:["She don't study hard.","She doesn't study hard.","She not study hard.","She studies not hard."],ans:1,exp:"Negative: subject + doesn't/don't + base verb. 'She doesn't study' is correct."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts that support an argument","A type of essay"],ans:2,exp:"Evidence = facts or information that prove something is true."},{q:"In PEEL writing, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link. The Link connects back to the main argument."},{q:"'She gave me some ___.' Which is correct?",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable in English — no plural, no 'a/an'. Say 'some advice'."},{q:"'Actually' in English means:",opts:["Currently","In fact / To be honest","Often","Always"],ans:1,exp:"'Actually' is a false friend! It means 'in fact', not 'currently'. Use 'currently' for 'actuellement'."}],
  [{q:"Choose the correct form: 'I ___ here since 2020.'",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect: 'I have lived here since 2020'."},{q:"What does 'coherent' mean?",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured, easy to understand — essential for academic writing."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct. Use 'make' for mistakes, decisions, progress."},{q:"What type of noun is 'information'?",opts:["Countable","Uncountable","Proper","Abstract only"],ans:1,exp:"'Information' is uncountable — no plural -s. Say 'some information' or 'a piece of information'."},{q:"Correct passive voice: 'The essay ___ by Friday.'",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive: modal + be + past participle. 'Must be submitted' is correct."}],
  [{q:"'Despite ___ tired, she continued studying.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing): 'Despite being tired'."},{q:"What does 'fundamental' mean?",opts:["Optional","Very difficult","Forming the essential base","Interesting"],ans:2,exp:"Fundamental = forming the foundation; of central, essential importance."},{q:"'I assisted the conference.' What is the error?",opts:["'I' should be 'We'","'assisted' should be 'attended'","'conference' is wrong","No error"],ans:1,exp:"'Assist' = to help. 'Attend' = to be present at an event. Say 'attended the conference'."},{q:"Reported speech: 'I am preparing.' → She said she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Backshift: present continuous → past continuous in reported speech."},{q:"Academic synonym for 'show':",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' is the academic equivalent of 'show'. Also: illustrate, indicate, reveal."}],
  [{q:"Correct future plan sentence:",opts:["I study tonight.","I am going to study tonight.","I will to study tonight.","I studying tonight."],ans:1,exp:"For personal future plans, use 'going to' + base verb."},{q:"What does 'relevant' mean?",opts:["Very impressive","Directly connected to the topic","Old and out of date","Difficult to understand"],ans:1,exp:"Relevant = directly connected and appropriate to the subject being discussed."},{q:"Correct use of 'for' and 'since':",opts:["I've studied here since two years.","I've studied here for 2019.","I've studied here for two years.","I study here since two years."],ans:2,exp:"'For' + duration. 'Since' + point in time. Both need present perfect."},{q:"Best option: 'She ___ her assignment before the deadline.'",opts:["submits","submitted","had submitted","submitting"],ans:1,exp:"Past simple for a completed action at a specific past time."},{q:"What is the purpose of 'Evidence' in PEEL?",opts:["To restate the point","To provide proof for your argument","To conclude the essay","To introduce a new topic"],ans:1,exp:"Evidence provides concrete proof — statistics, quotes, or examples that make your argument credible."}],
];

const WORD_MINIMUMS = {
  Beginner:     { point:10, explanation:20, evidence:10, link:10 },
  Intermediate: { point:15, explanation:40, evidence:20, link:15 },
  Advanced:     { point:25, explanation:60, evidence:25, link:20 },
};

const PEEL_TOPICS = [
  {title:"Technology in Education",prompt:"Should technology be used more widely in African universities?",guidance:{point:"State your main position clearly in 1-2 sentences.",explanation:"Explain WHY technology would help — give at least 2 specific reasons.",evidence:"Include a specific statistic or research finding with a named source.",link:"Connect your argument back to the question about African universities."},example:{point:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",explanation:"With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace, reinforcing difficult content outside the classroom.",evidence:"According to a UNESCO report (2022), students who regularly use digital learning tools score on average 35% higher on standardised assessments.",link:"Given this evidence, increasing technological integration in African universities is an urgent educational priority that would directly improve outcomes and prepare graduates for a digital global economy."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",guidance:{point:"State whether you agree or disagree clearly.",explanation:"Give 2-3 well-developed reasons — economic, social, and cultural.",evidence:"Include a specific statistic or real-world example.",link:"Connect to national development or global equality."},example:{point:"Boys and girls must have completely equal access to education if African nations are to achieve their full potential.",explanation:"When girls are denied education, entire communities lose half their intellectual potential. Educated women invest more in their children's health and schooling, creating a positive generational cycle. Gender equality in education also promotes civic participation and strengthens democracy.",evidence:"The World Bank (2021) reported that every additional year a girl spends in education can increase her future earnings by up to 10%.",link:"For these reasons, gender equality in education is not simply a moral question — it is a strategic economic investment whose returns benefit entire communities."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",guidance:{point:"Take a clear position — do not argue both sides equally.",explanation:"Give 2-3 specific, concrete ways social media affects student life.",evidence:"Use a specific study or statistic with a named source.",link:"Return directly to the question about university students."},example:{point:"For the majority of university students, social media causes significantly more harm than good.",explanation:"Students who spend excessive time on platforms like TikTok and Instagram frequently report difficulty concentrating, as the constant stimulation trains the brain to expect rapid, fragmented information. This undermines the sustained focus that academic reading and essay writing require.",evidence:"A study from Harvard University (2020) found that students spending more than 3 hours daily on social media had GPAs 20% lower than those who limited usage to under one hour.",link:"While social media offers some networking benefits, the evidence shows its negative impact on concentration and academic performance makes it far more harmful than helpful for university students."}},
  {title:"English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students today.",guidance:{point:"State clearly why English is essential for Ivorian students.",explanation:"Think about career opportunities, research access, and global communication.",evidence:"Use a fact or statistic related to English in Africa.",link:"Connect to what Ivorian students should do as a result."},example:{point:"Mastering English has become an essential skill for Ivorian students who wish to compete in today's globalised professional and academic environment.",explanation:"English is the dominant language of international business, scientific research, and global communication. Graduates who are not proficient in English are immediately at a competitive disadvantage when applying for international scholarships or multinational positions.",evidence:"The African Development Bank estimates that English proficiency can increase an African graduate's starting salary by as much as 25% compared to monolingual peers.",link:"For these compelling reasons, Ivorian students should treat English not as an optional requirement, but as one of the most strategic investments in their professional future."}},
];

const PEEL_THEORY = {
  what:"PEEL is a method for writing clear, well-structured academic paragraphs. Each letter stands for one essential part of the paragraph.",
  why:"Academic writing requires logical organisation. Without a clear structure, even good ideas fail to convince the reader. PEEL ensures every paragraph has a purpose, develops an argument, provides proof, and connects back to the essay question.",
  parts:[
    {letter:"P",name:"Point",color:"#e3f2fd",icon:"📌",role:"Your opening sentence. State your main argument clearly and directly.",do:"Start with a strong, confident statement. Avoid 'I think' in formal academic writing.",dont:"Do not begin with a question or a quote. Get straight to the point."},
    {letter:"E",name:"Explanation",color:"#e8f5e9",icon:"💬",role:"Develop your point by explaining WHY it is true. Give 2-3 logical reasons.",do:"Use linking words: 'Furthermore', 'In addition', 'This means that'. Each sentence should add new information.",dont:"Do not simply repeat your Point. Every sentence must add new reasoning."},
    {letter:"E",name:"Evidence",color:"#fff3e0",icon:"📚",role:"Provide concrete proof — a statistic, a study, a real example, or an expert quote.",do:"Introduce your evidence: 'According to...', 'A study by... found that...'. Be as specific as possible.",dont:"Never use vague evidence like 'studies show' without naming the study."},
    {letter:"L",name:"Link",color:"#fce4ec",icon:"🔗",role:"Close the paragraph by connecting your argument back to the essay question.",do:"Use: 'Therefore...', 'This demonstrates that...', 'It is clear from the evidence that...'",dont:"Do not introduce new arguments in the Link. Synthesise and reconnect."},
  ],
  badExample:{
    topic:"Should technology be used more in African universities?",
    paragraph:"Technology is good for students. Many students use phones. The internet has a lot of information. Students can find things easily. So technology is important.",
    annotations:[
      {part:"Point",text:"Technology is good for students.",issue:"❌ Too vague. 'Good' is not academic vocabulary. The argument is not specific enough — good in what way?"},
      {part:"Explanation",text:"Many students use phones. The internet has a lot of information. Students can find things easily.",issue:"❌ Three unconnected observations, not a logical explanation. No linking words are used."},
      {part:"Evidence",text:"(No evidence provided)",issue:"❌ There is no evidence at all. This makes the argument unconvincing and unacademic."},
      {part:"Link",text:"So technology is important.",issue:"❌ Too brief and does not connect back to African universities. 'So' is too informal."},
    ]
  },
  goodExample:{
    topic:"Should technology be used more in African universities?",
    paragraph:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning. With smartphones and reliable internet connections, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace. According to a UNESCO report (2022), students who regularly use digital learning tools score 35% higher on standardised assessments. Given this compelling evidence, increasing technological integration in African universities is an urgent academic priority that would directly improve educational outcomes.",
    annotations:[
      {part:"Point",text:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",issue:"✅ Clear, specific, and directly addresses the question. Uses strong academic vocabulary. Includes 'because' to signal reasoning."},
      {part:"Explanation",text:"With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace.",issue:"✅ Two well-developed reasons, logically connected with 'Furthermore'. Each sentence adds new information."},
      {part:"Evidence",text:"According to a UNESCO report (2022), students who regularly use digital learning tools score 35% higher on standardised assessments.",issue:"✅ Specific, credible, and properly introduced. Names the source (UNESCO) and the year (2022) with a precise statistic."},
      {part:"Link",text:"Given this compelling evidence, increasing technological integration in African universities is an urgent academic priority that would directly improve educational outcomes.",issue:"✅ Directly reconnects to the question about African universities. Uses 'Given this compelling evidence' to signal synthesis."},
    ]
  }
};

const SCORING_CRITERIA = [
  {id:"point",    label:"Clarity & Precision (Point)",        max:4},
  {id:"expl",     label:"Logical Development (Explanation)",  max:4},
  {id:"evidence", label:"Quality of Evidence",                max:4},
  {id:"link",     label:"Cohesion & Link",                    max:3},
  {id:"grammar",  label:"Grammar & Academic Vocabulary",      max:3},
  {id:"length",   label:"Length & Development",               max:2},
];

/* ══════════════════════════════════════
   PLACEMENT TEST
══════════════════════════════════════ */
const PLACEMENT = [
  {section:"Grammar",    q:"'She ___ to school every day.'",opts:["go","goes","going","gone"],ans:1},
  {section:"Grammar",    q:"Error: 'The informations are on the table.'",opts:["The","informations","are","table"],ans:1},
  {section:"Grammar",    q:"'If I ___ rich, I would travel.'",opts:["am","was","were","be"],ans:2},
  {section:"Grammar",    q:"Correct sentence:",opts:["She don't like coffee.","She doesn't likes coffee.","She doesn't like coffee.","She not like coffee."],ans:2},
  {section:"Grammar",    q:"'Despite ___ tired, he finished.'",opts:["be","being","been","to be"],ans:1},
  {section:"Vocabulary", q:"'Analyse' means:",opts:["To ignore","To study carefully","To write quickly","To memorise"],ans:1},
  {section:"Vocabulary", q:"'Her essay was very ___.' (well-organised)",opts:["confusing","coherent","boring","long"],ans:1},
  {section:"Vocabulary", q:"'Evidence' means:",opts:["A feeling","A guess","Facts that support an argument","A question"],ans:2},
  {section:"Vocabulary", q:"FALSE FRIEND for French speakers:",opts:["Book","Actually","Table","School"],ans:1},
  {section:"Vocabulary", q:"'The study requires ___ data.'",opts:["emotional","empirical","fictional","random"],ans:1},
  {section:"Reading",    q:"Why did Okonkwo work hard?",opts:["To become rich","To travel","To overcome his father's failures","To win a prize"],ans:2},
  {section:"Reading",    q:"'Education was the light…' — Literary device?",opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {section:"Reading",    q:"'Jaja's face was expressionless, but his hand shook.' — This suggests:",opts:["He was happy","He was calm","He was hiding emotions","He was cold"],ans:2},
  {section:"Reading",    q:"A 'glossary' is:",opts:["A list of questions","A list of word definitions","A summary","A bibliography"],ans:1},
  {section:"Reading",    q:"'Concluded' means:",opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
];

function PlacementTest({onDone}) {
  const [i,setI]     = useState(0);
  const [sel,setSel] = useState(null);
  const [conf,setConf] = useState(false);
  const [scores,setScores] = useState({Grammar:0,Vocabulary:0,Reading:0});
  const q = PLACEMENT[i];
  const sIcons = {Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const sColors = {Grammar:"#e3f2fd",Vocabulary:"#fff3e0",Reading:"#f3e5f5"};
  const sections = ["Grammar","Vocabulary","Reading"];
  const sIdx = sections.indexOf(q.section);

  const confirm = () => {
    if(sel===null) return;
    if(sel===q.ans) setScores(s=>({...s,[q.section]:s[q.section]+1}));
    setConf(true);
  };
  const next = () => {
    if(i<PLACEMENT.length-1){ setI(p=>p+1); setSel(null); setConf(false); }
    else {
      const fs={...scores}; if(sel===q.ans) fs[q.section]++;
      const total=fs.Grammar+fs.Vocabulary+fs.Reading;
      onDone({level:total>=11?"Advanced":total>=6?"Intermediate":"Beginner",scores:fs,total});
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:20,paddingTop:16}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:"#1b4332",margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Question {i+1}/{PLACEMENT.length}</span>
            <span style={{color:"#2D6A4F",fontWeight:700}}>{Math.round((i/PLACEMENT.length)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
            <div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(i/PLACEMENT.length)*100}%`,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {sections.map((s,si)=>(
              <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:si<sIdx?"#2D6A4F":si===sIdx?"#81c784":"#e0e0e0"}}/>
                <span style={{fontSize:11,color:si<=sIdx?"#2D6A4F":"#bbb",fontWeight:si===sIdx?700:400}}>{sIcons[s]} {s}</span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{marginBottom:14}}>
          <div style={{background:sColors[q.section],borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#1b4332"}}>{sIcons[q.section]} {q.section}</span>
          </div>
          <p style={{fontWeight:600,color:"#1b4332",fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p>
        </Card>
        {q.opts.map((o,oi)=>{
          const correct=oi===q.ans,picked=oi===sel;
          let bg="#fff",border="#e0e0e0";
          if(conf){if(correct){bg="#e8f5e9";border="#2D6A4F"}else if(picked){bg="#ffebee";border="#e53935"}}
          else if(picked){bg="#d8f3dc";border="#2D6A4F"}
          return <button key={oi} onClick={()=>!conf&&setSel(oi)}
            style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
            {conf&&correct?"✅ ":conf&&picked&&!correct?"❌ ":""}{o}
          </button>;
        })}
        {!conf
          ? <button onClick={confirm} disabled={sel===null}
              style={{width:"100%",background:sel===null?"#ccc":"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:sel===null?"not-allowed":"pointer",marginTop:8,fontFamily:"inherit"}}>
              Confirm Answer
            </button>
          : <button onClick={next}
              style={{width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>
              {i<PLACEMENT.length-1?"Next →":"See My Level 🎯"}
            </button>
        }
      </div>
    </div>
  );
}

function LevelResult({result,onContinue}) {
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Your content will focus on essential grammar, core vocabulary, and accessible reading.",Intermediate:"Your content will challenge you with more complex grammar and academic vocabulary.",Advanced:"Your content will develop your academic writing and critical reading skills."};
  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <Card style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:64,marginBottom:8}}>{icons[result.level]}</div>
          <h2 style={{color:"#2D6A4F",fontSize:24,margin:"0 0 4px"}}>Your Level:</h2>
          <div style={{background:"#d8f3dc",borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 12px"}}>
            <span style={{fontSize:22,fontWeight:900,color:"#1b4332"}}>{result.level}</span>
          </div>
          <p style={{color:"#555",fontSize:14,lineHeight:1.7}}>{descs[result.level]}</p>
        </Card>
        <Card style={{marginBottom:16}}>
          <h4 style={{color:"#1b4332",margin:"0 0 12px"}}>📊 Your Scores</h4>
          {Object.entries(result.scores).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:"#1b4332"}}>{k}</span>
                <span style={{color:"#2D6A4F",fontWeight:700}}>{v}/5</span>
              </div>
              <div style={{background:"#e8f5e9",borderRadius:99,height:8}}>
                <div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(v/5)*100}%`,transition:"width .6s"}}/>
              </div>
            </div>
          ))}
          <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,color:"#1b4332"}}>Total</span>
            <span style={{color:"#2D6A4F",fontWeight:800}}>{result.total}/15</span>
          </div>
        </Card>
        <button onClick={onContinue} style={{width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
          Start Learning →
        </button>
      </div>
    </div>
  );
}

/* ══ AUTH ══ */
function Landing({go}) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1b4332 0%,#2D6A4F 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:60,marginBottom:10}}>✍️</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 6px"}}>WriteUP UPGC</h1>
      <p style={{opacity:.85,fontSize:15,marginBottom:4}}>Academic English for L2 Students</p>
      <p style={{opacity:.6,fontSize:12,marginBottom:36}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:40}}>
        <button onClick={()=>go("login")} style={{background:"#fff",color:"#2D6A4F",border:"none",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Log In</button>
        <button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid #fff",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Sign Up</button>
      </div>
      <div style={{display:"flex",gap:20,opacity:.7,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>
        {["🌐 PWA","🆓 Free","🎯 Level Test","📚 Rich Content","💾 Cloud Save"].map(t=><span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

function AuthForm({mode,onDone,onSwitch}) {
  const [f,setF] = useState({name:"",email:"",pw:""});
  const [loading,setL] = useState(false);
  const [err,setErr] = useState("");
  const upd = k => e => setF(p=>({...p,[k]:e.target.value}));

  const submit = async () => {
    if(!f.email||!f.pw) return setErr("Please fill all fields.");
    if(mode==="register"&&!f.name) return setErr("Please enter your name.");
    setL(true); setErr("");
    try {
      if(mode==="register"){
        const res = await authSignUp(f.email,f.pw);
        if(res.error){ setErr(res.error.message||"Registration failed."); setL(false); return; }
        const uid = res.user?.id;
        if(uid){
          await sbPost("users",{id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",placement_done:false,last_login:todayStr()},res.access_token);
          onDone({id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:true,token:res.access_token});
        }
      } else {
        const res = await authSignIn(f.email,f.pw);
        if(res.error){ setErr("Invalid email or password."); setL(false); return; }
        const uid = res.user?.id; const token = res.access_token;
        const profiles = await sbGet(`users?id=eq.${uid}`,token);
        const profile = profiles?.[0];
        if(profile){
          const last = new Date(profile.last_login);
          const diff = Math.floor((new Date()-last)/(1000*60*60*24));
          const newStreak = diff===1?profile.streak+1:diff>1?1:profile.streak;
          await sbPatch(`users?id=eq.${uid}`,{last_login:todayStr(),streak:newStreak},token);
          onDone({...profile,streak:newStreak,isNew:!profile.placement_done,token});
        } else { setErr("Profile not found. Please sign up."); }
      }
    } catch { setErr("Connection error. Please try again."); }
    setL(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:"#2D6A4F",margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register"&&<input placeholder="Full name" value={f.name} onChange={upd("name")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>}
        <input placeholder="Email address" type="email" value={f.email} onChange={upd("email")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <input placeholder="Password (min. 6 characters)" type="password" value={f.pw} onChange={upd("pw")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        {err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        {loading ? <Loader text={mode==="login"?"Logging in…":"Creating account…"}/> :
          <button onClick={submit} style={{width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>
            {mode==="login"?"Log In":"Register & Take Placement Test"}
          </button>
        }
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="login"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:"#2D6A4F",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span>
        </p>
      </Card>
    </div>
  );
}

/* ══ MAIN APP ══ */
const MODS = [
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",    sub:"Random exercise every session",     color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",   sub:"Random word every session",         color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Guided Writing",    sub:"PEEL paragraph + AI feedback",      color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",      sub:"Random passage every session",      color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes",  sub:"Random error lesson every session", color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",        sub:"5 random questions every session",  color:"#fff8e1"},
];

const BADGES_DEF = [
  {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
  {icon:"🔥",name:"Streak 7",      desc:"Log in 7 days in a row"},
  {icon:"📐",name:"Grammar Master",desc:"Complete 30 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 30 vocabulary words"},
  {icon:"🍃",name:"PEEL Expert",   desc:"Submit 5 PEEL paragraphs"},
  {icon:"🌍",name:"African Reader",desc:"Complete 10 reading passages"},
];

export default function WriteUpApp() {
  const [screen,setScreen]       = useState("landing");
  const [user,setUser]           = useState(null);
  const [token,setToken]         = useState(null);
  const [placement,setPlacement] = useState(null);
  const [tab,setTab]             = useState("home");
  const [activeMod,setActiveMod] = useState(null);
  const [xp,setXp]               = useState(0);
  const [streak,setStreak]       = useState(1);
  const [doneToday,setDoneToday] = useState([]);
  const [badges,setBadges]       = useState([]);
  const [showEncourage,setShowEncourage] = useState(null);
  const [theme,setTheme]         = useState(() => THEMES[localStorage.getItem("writeup_theme")||"default"]||THEMES.default);
  const [swReg,setSwReg]         = useState(null);

  const G  = theme.primary;
  const LT = theme.light;
  const DK = theme.dark;

  useEffect(() => {
    registerSW().then(reg => {
      setSwReg(reg);
      const savedTime = localStorage.getItem("writeup_notif_time");
      const enabled = localStorage.getItem("writeup_notif_enabled")==="true";
      if(enabled && savedTime && Notification?.permission==="granted") scheduleDailyReminder(reg,savedTime);
      if(new Date().getDay()===1) showNotif(NOTIF.weekly.title,NOTIF.weekly.body);
    });
  },[]);

  // ── Android back button handler ──
  useEffect(() => {
    const handleBack = (e) => {
      // If a module is open → go back to home
      if (activeMod) {
        e.preventDefault();
        setActiveMod(null);
        loadToday(user?.id, token);
        return;
      }
      // If on a sub-screen → go back to app home
      if (screen === "result" || screen === "placement") {
        e.preventDefault();
        return;
      }
      // If on a tab other than home → go to home tab
      if (tab !== "home") {
        e.preventDefault();
        setTab("home");
        return;
      }
      // If encouragement overlay is open → close it
      if (showEncourage) {
        e.preventDefault();
        setShowEncourage(null);
        return;
      }
      // Otherwise let the browser handle it (minimise app)
    };

    // Push a state so we can intercept popstate
    window.history.pushState({ page: "app" }, "");
    window.addEventListener("popstate", handleBack);

    return () => window.removeEventListener("popstate", handleBack);
  }, [activeMod, tab, screen, showEncourage, user, token]);
  useEffect(() => {
    if(!user?.id||!token) return;
    const newLevel = xp>=1500?"Advanced":xp>=500?"Intermediate":"Beginner";
    if(placement?.level !== newLevel){
      setPlacement(p=>({...p,level:newLevel}));
      sbPatch(`users?id=eq.${user.id}`,{level:newLevel,current_level:newLevel},token);
    }
  },[xp]);

  const loadToday = async (uid,tk) => {
    try {
      const data = await sbGet(`daily_progress?user_id=eq.${uid}&date=eq.${todayStr()}&completed=eq.true&select=module`,tk);
      setDoneToday(Array.isArray(data)?data.map(d=>d.module):[]);
    } catch {}
  };

  const loadBadges = async (uid,tk) => {
    try {
      const data = await sbGet(`user_badges?user_id=eq.${uid}&select=badge_name`,tk);
      setBadges(Array.isArray(data)?data.map(d=>d.badge_name):[]);
    } catch {}
  };

  const afterAuth = async (u) => {
    setUser(u); setToken(u.token); setXp(u.xp||0); setStreak(u.streak||1);
    if(u.isNew){ setScreen("placement"); }
    else {
      setPlacement({level:u.level||"Beginner"});
      await loadToday(u.id,u.token);
      await loadBadges(u.id,u.token);
      setScreen("app");
    }
  };

  const afterPlacement = async (result) => {
    setPlacement(result);
    if(user?.id){
      await sbPatch(`users?id=eq.${user.id}`,{level:result.level,placement_done:true},token);
      await savePlacement(user.id,token,result.scores,result.level);
    }
    setScreen("result");
  };

  const awardBadge = async (name) => {
    if(badges.includes(name)||!user?.id) return;
    try { await sbPost("user_badges",{user_id:user.id,badge_name:name},token); } catch {}
    setBadges(p=>[...p,name]);
  };

  const addXp = async (n, moduleId, sessionData={}) => {
    // Already earned XP today for this module?
    if(doneToday.includes(moduleId)){
      setShowEncourage(rnd(ENCOURAGE));
      return;
    }
    const xpToAdd = XP_PER_MODULE[moduleId]||n;
    const newXp   = xp + xpToAdd;
    const oldLvl  = getLvl(xp).name;
    const newLvl  = getLvl(newXp).name;
    setXp(newXp);
    setDoneToday(p=>[...p,moduleId]);
    if(oldLvl!==newLvl){ const m=NOTIF.levelUp(newLvl); setTimeout(()=>showNotif(m.title,m.body),1000); }
    if(user?.id){
      try {
        await sbUpsert("daily_progress",{user_id:user.id,date:todayStr(),module:moduleId,completed:true,xp_earned:xpToAdd},token);
        await sbPatch(`users?id=eq.${user.id}`,{xp:newXp},token);
        await saveXpHistory(user.id,token,xpToAdd,moduleId);
        if(sessionData.module) await saveSession(user.id,token,{...sessionData,xpEarned:xpToAdd});
        if(sessionData.peelData) await savePeel(user.id,token,sessionData.peelData);
        const ud = await sbGet(`users?id=eq.${user.id}`,token);
        if(ud?.[0]) await saveSnapshot(user.id,token,ud[0]);
        if(moduleId==="peel") awardBadge("First Write");
        if(streak>=7) awardBadge("Streak 7");
      } catch(e){ console.error(e); }
    }
  };

  if(screen==="landing")    return <Landing go={setScreen}/>;
  if(screen==="login")      return <AuthForm mode="login"    onDone={afterAuth} onSwitch={()=>setScreen("register")}/>;
  if(screen==="register")   return <AuthForm mode="register" onDone={afterAuth} onSwitch={()=>setScreen("login")}/>;
  if(screen==="placement")  return <PlacementTest onDone={afterPlacement}/>;
  if(screen==="result")     return <LevelResult result={placement} onContinue={()=>{ loadToday(user?.id,token); setScreen("app"); }}/>;

  const lvl   = getLvl(xp);
  const pct   = Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100);
  const level = placement?.level||"Beginner";

  return (
    <div style={{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:"#f0f7f4",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column","--g":G,"--lt":LT,"--dk":DK}}>
      {/* HEADER */}
      <div style={{background:G,color:"#fff",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontWeight:900,fontSize:16}}>✍️ WriteUP UPGC</div>
          <div style={{fontSize:11,opacity:.75}}>{user?.name} · {level}</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>🔥{streak}</div><div style={{fontSize:10,opacity:.7}}>streak</div></div>
          <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>⭐{xp}</div><div style={{fontSize:10,opacity:.7}}>XP</div></div>
          <div style={{background:lvl.color,color:"#000",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:800}}>{lvl.name}</div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
        {activeMod
          ? <ModShell mod={activeMod} level={level} addXp={addXp} G={G} LT={LT} DK={DK}
              onBack={()=>{ setActiveMod(null); loadToday(user?.id,token); }}/>
          : tab==="home"    ? <Home setMod={setActiveMod} xp={xp} lvl={lvl} pct={pct} level={level} doneToday={doneToday} G={G} LT={LT} DK={DK}/>
          : tab==="profile" ? <Profile user={user} xp={xp} lvl={lvl} level={level} badges={badges} streak={streak} G={G} LT={LT} DK={DK}/>
          : tab==="board"   ? <Board userId={user?.id} myXp={xp} token={token} G={G} LT={LT} DK={DK}/>
          : <SettingsScreen user={user} xp={xp} placement={placement} G={G} LT={LT} DK={DK}
              onThemeChange={t=>{ setTheme(t); localStorage.setItem("writeup_theme",Object.keys(THEMES).find(k=>THEMES[k]===t)||"default"); }}
              onLogout={async()=>{ setScreen("landing"); setUser(null); setToken(null); }}/>
        }
      </div>

      {/* ENCOURAGEMENT OVERLAY */}
      {showEncourage&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setShowEncourage(null)}>
          <div style={{background:"#fff",borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:64,marginBottom:12}}>
              {["🌟","💪","🔥","⭐","🎯"][Math.floor(Math.random()*5)]}
            </div>
            <h3 style={{color:G,margin:"0 0 8px",fontSize:20}}>{showEncourage.title}</h3>
            <p style={{color:"#555",fontSize:14,lineHeight:1.7,margin:"0 0 8px"}}>{showEncourage.body}</p>
            <p style={{color:"#888",fontSize:13,fontStyle:"italic",margin:"0 0 20px"}}>{showEncourage.sub}</p>
            <button onClick={()=>setShowEncourage(null)}
              style={{background:G,color:"#fff",border:"none",borderRadius:12,padding:"12px 32px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
              Keep Practising! 💪
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      {!activeMod&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:"#fff",borderTop:"1px solid #e8f5e9",display:"flex"}}>
          {[["home","🏠","Home"],["profile","👤","Profile"],["board","🏆","Ranks"],["settings","⚙️","More"]].map(([t,ic,lb])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",padding:"10px 0",cursor:"pointer",color:tab===t?G:"#aaa",fontWeight:tab===t?800:400,fontSize:11}}>
              <div style={{fontSize:22}}>{ic}</div>{lb}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ HOME ══ */
function Home({setMod,xp,lvl,pct,level,doneToday,G,LT,DK}) {
  const nextUnlock = UNLOCKS.find(u=>u.xp>xp);
  const prevUnlock = [...UNLOCKS].reverse().find(u=>u.xp<=xp);
  return (
    <div style={{padding:18}}>
      <Card style={{marginBottom:14,background:`linear-gradient(135deg,${DK},${G})`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📅 {todayStr()}</div>
        <div style={{fontWeight:800,fontSize:16,marginBottom:2}}>{doneToday.length>=MODS.length?"🎉 All done today!":"Today's Activities"}</div>
        <div style={{fontSize:12,opacity:.75}}>{doneToday.length}/{MODS.length} completed · Level: {level}</div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {MODS.map(m=>(
            <div key={m.id} style={{width:28,height:28,borderRadius:"50%",background:doneToday.includes(m.id)?"#fff":"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {doneToday.includes(m.id)?m.icon:"·"}
            </div>
          ))}
        </div>
      </Card>
      <Card style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
          <span style={{fontWeight:700,color:G}}>{lvl.name} · {level}</span>
          <span style={{color:"#888"}}>{xp}/{lvl.next} XP</span>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:99,height:10}}>
          <div style={{background:G,height:10,borderRadius:99,width:`${pct}%`,transition:"width .5s"}}/>
        </div>
        <p style={{color:"#888",fontSize:12,marginTop:6}}>{lvl.next-xp} XP to next level</p>
      </Card>
      {nextUnlock&&(
        <Card style={{marginBottom:14,background:"#fff8e1",borderLeft:"3px solid #f9a825"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#e65100",fontWeight:700,marginBottom:2}}>🔓 Next Unlock — {nextUnlock.xp} XP</div>
              <div style={{fontWeight:700,color:DK,fontSize:13}}>{nextUnlock.icon} {nextUnlock.label}</div>
              <div style={{fontSize:12,color:"#666"}}>{nextUnlock.desc}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:800,color:"#e65100",fontSize:16}}>{nextUnlock.xp-xp}</div>
              <div style={{fontSize:10,color:"#888"}}>XP away</div>
            </div>
          </div>
          <div style={{background:"#ffe082",borderRadius:99,height:6,marginTop:8}}>
            <div style={{background:"#f9a825",height:6,borderRadius:99,width:`${Math.min(100,Math.round(((xp-(prevUnlock?.xp||0))/(nextUnlock.xp-(prevUnlock?.xp||0)))*100))}%`,transition:"width .5s"}}/>
          </div>
        </Card>
      )}
      {MODS.map(m=>(
        <button key={m.id} onClick={()=>setMod(m)}
          style={{width:"100%",background:"#fff",border:`1.5px solid ${LT}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px #0001",textAlign:"left",marginBottom:10}}>
          <div style={{background:m.color,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:DK,fontSize:14}}>{m.name}</div>
            <div style={{color:"#888",fontSize:12,marginTop:2}}>{m.sub}</div>
          </div>
          {doneToday.includes(m.id)
            ?<span style={{background:"#e8f5e9",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700}}>✅ Done</span>
            :<span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>+{XP_PER_MODULE[m.id]} XP</span>}
        </button>
      ))}
    </div>
  );
}

/* ══ MOD SHELL ══ */
function ModShell({mod,level,addXp,onBack,G,LT,DK}) {
  return (
    <div style={{padding:18}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div>
        <div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div>
      </div>
      {mod.id==="grammar"    && <GrammarMod    addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="vocabulary" && <VocabMod      addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="peel"       && <PeelMod       addXp={addXp} onBack={onBack} level={level} G={G} LT={LT} DK={DK}/>}
      {mod.id==="reading"    && <ReadingMod    addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="mistakes"   && <MistakesMod   addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="quiz"       && <QuizMod       addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
    </div>
  );
}

/* ══ DONE SCREEN ══ */
function DoneScreen({xp,onBack,earnNow,G}) {
  useEffect(()=>{ if(earnNow) earnNow(); },[]);
  return (
    <div style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#666"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p>
      <p style={{color:"#888",fontSize:13}}>Progress saved ✅</p>
      <button onClick={onBack} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>← Back to Modules</button>
    </div>
  );
}

/* ══ GRAMMAR ══ */
function GrammarMod({addXp,onBack,G,LT,DK}) {
  const [c]        = useState(()=>rnd(GRAMMAR_BANK));
  const [sel,setSel] = useState(null);
  const [done,setDone] = useState(false);
  const [startTime] = useState(Date.now);
  const confirmed = sel!==null;
  const correct   = sel===c.ans;

  if(done) return <DoneScreen xp={XP_PER_MODULE.grammar} onBack={onBack} G={G}
    earnNow={()=>addXp(XP_PER_MODULE.grammar,"grammar",{module:"grammar",score:correct?1:0,total:1,passed:correct,timeSec:Math.round((Date.now()-startTime)/1000),errors:correct?[]:[{question:c.question,chosen:c.opts[sel],correct:c.opts[c.ans]}],title:c.title})}/>;

  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:12,color:"#888"}}>📚 Topic</div>
        <div style={{fontWeight:800,color:DK,fontSize:16}}>{c.title}</div>
        <div style={{fontSize:13,color:"#555",marginTop:4}}>{c.instruction}</div>
      </Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.question}</p></Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans, isP=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){ if(isP&&isC){bg="#e8f5e9";border=G}else if(isP&&!isC){bg="#ffebee";border="#e53935"}else if(!isP&&isC&&!correct){bg="#fff9c4";border="#f9a825"} }
        else if(isP){bg=LT;border=G}
        return <button key={oi} onClick={()=>!confirmed&&setSel(oi)}
          style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
          {confirmed&&isP&&isC?"✅ ":confirmed&&isP&&!isC?"❌ ":confirmed&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.explanation}</p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct
          ? <button onClick={()=>setDone(true)} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>Earn +{XP_PER_MODULE.grammar} XP →</button>
          : <button onClick={onBack} style={{width:"100%",background:"transparent",color:G,border:`2px solid ${G}`,borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>← Try another exercise</button>}
      </>}
    </div>
  );
}

/* ══ VOCABULARY ══ */
function VocabMod({addXp,onBack,G,LT,DK}) {
  const [c]        = useState(()=>rnd(VOCAB_BANK));
  const [phase,setPhase] = useState("learn");
  const [sel,setSel] = useState(null);
  const [done,setDone] = useState(false);
  const [startTime] = useState(Date.now);
  const confirmed = sel!==null;
  const correct   = sel===c.ans;

  if(done) return <DoneScreen xp={XP_PER_MODULE.vocabulary} onBack={onBack} G={G}
    earnNow={()=>addXp(XP_PER_MODULE.vocabulary,"vocabulary",{module:"vocabulary",score:correct?1:0,total:1,passed:correct,timeSec:Math.round((Date.now()-startTime)/1000),title:c.word})}/>;

  if(phase==="learn") return (
    <div>
      <Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:6}}>📚 Word to Learn</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><h2 style={{color:G,margin:"0 0 2px",fontSize:26}}>{c.word}</h2><div style={{color:"#999",fontSize:12}}>{c.phonetic} · <em>{c.partOfSpeech}</em></div></div>
          <span style={{background:"#fff3e0",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.french}</span>
        </div>
        <div style={{background:"#f9fbe7",borderRadius:10,padding:12,margin:"12px 0 0"}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>📖 Definition</div>
          <p style={{color:"#333",fontSize:14,margin:0,lineHeight:1.7}}>{c.definition}</p>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:10,padding:12,marginTop:10}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>🧠 Memory Tip</div>
          <p style={{color:DK,fontSize:13,margin:0,lineHeight:1.6}}>{c.memory_tip}</p>
        </div>
      </Card>
      <button onClick={()=>setPhase("practice")} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>Practice this word →</button>
    </div>
  );

  return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.example}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans, isP=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){ if(isP&&isC){bg="#e8f5e9";border=G}else if(isP&&!isC){bg="#ffebee";border="#e53935"}else if(!isP&&isC&&!correct){bg="#fff9c4";border="#f9a825"} }
        else if(isP){bg=LT;border=G}
        return <button key={oi} onClick={()=>!confirmed&&setSel(oi)}
          style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&isP&&isC?"✅ ":confirmed&&isP&&!isC?"❌ ":confirmed&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}
          </p>
        </Card>
        {correct
          ? <button onClick={()=>setDone(true)} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>Earn +{XP_PER_MODULE.vocabulary} XP →</button>
          : <button onClick={onBack} style={{width:"100%",background:"transparent",color:G,border:`2px solid ${G}`,borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>← Try another word</button>}
      </>}
    </div>
  );
}

/* ══ PEEL ══ */
function PeelMod({addXp,onBack,level,G,LT,DK}) {
  const [phase,setPhase]   = useState("theory");
  const [c]                = useState(()=>rnd(PEEL_TOPICS));
  const [theoryTab,setTab] = useState(0);
  const [step,setStep]     = useState(0);
  const [vals,setVals]     = useState({point:"",explanation:"",evidence:"",link:""});
  const [feedback,setFeedback] = useState(null);
  const [aiLoading,setAiL] = useState(false);
  const [attempts,setAttempts] = useState(0);
  const [startTime]        = useState(Date.now);
  const keys   = ["point","explanation","evidence","link"];
  const labels = ["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minW   = WORD_MINIMUMS[level]||WORD_MINIMUMS.Beginner;

  const getAI = async (isRev=false) => {
    setAiL(true);
    try {
      const res = await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        prompt:`You are a strict but fair English writing examiner for ${level} university students in Côte d'Ivoire (French speakers). This is attempt ${attempts+1}.${isRev?" The student has revised based on previous feedback.":""}\n\nTOPIC: "${c.prompt}"\nPoint: ${vals.point}\nExplanation: ${vals.explanation}\nEvidence: ${vals.evidence}\nLink: ${vals.link}\n\nRespond in this EXACT format:\n\n---SCORES---\nPOINT: [0-4]/4\nEXPLANATION: [0-4]/4\nEVIDENCE: [0-4]/4\nLINK: [0-3]/3\nGRAMMAR: [0-3]/3\nLENGTH: [0-2]/2\nTOTAL: [sum]/20\n---END SCORES---\n\n---FEEDBACK---\n\n## Overall Assessment\n[2-3 honest sentences. State the score and what it reflects.]\n\n## 📌 Point — [score]/4\n[Evaluate clarity. List issues with ⚠️ "[sentence]" → Problem: [why] → Fix: [improved version]. If strong: ✅ Strong — [praise]]\n\n## 💬 Explanation — [score]/4\n[Evaluate logic. List issues with ⚠️ "[sentence]" → Problem: [why] → Fix: [improved version]. If strong: ✅ Strong]\n\n## 📚 Evidence — [score]/4\n[Evaluate specificity. If weak: provide model sentence with named source.]\n\n## 🔗 Link — [score]/3\n[Evaluate reconnection to topic. If weak: provide model link sentence.]\n\n## ✏️ Grammar & Vocabulary — [score]/3\n[List 2-3 errors: ❌ "[wrong]" / ✅ "[correct]" / 📖 Rule: [explanation]. Suggest 2 stronger academic words.]\n\n## 📏 Length — [score]/2\n[Comment on whether each section meets minimums: Point=${minW.point}w, Explanation=${minW.explanation}w, Evidence=${minW.evidence}w, Link=${minW.link}w]\n\n## 🎯 Priority Actions\n1. [Most critical action]\n2. [Second action]\n3. [Third action]\n\n## 💪 Encouragement\n[1-2 warm sentences acknowledging effort.]\n---END FEEDBACK---`,
        maxTokens:1500
      })});
      const data = await res.json();
      const text = data.text||"";
      const sm = text.match(/---SCORES---([\s\S]*?)---END SCORES---/);
      const fm = text.match(/---FEEDBACK---([\s\S]*?)---END FEEDBACK---/);
      let scores = {point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0};
      if(sm){
        const s=sm[1];
        scores.point    = parseInt(s.match(/POINT:\s*(\d)/)?.[1]||0);
        scores.expl     = parseInt(s.match(/EXPLANATION:\s*(\d)/)?.[1]||0);
        scores.evidence = parseInt(s.match(/EVIDENCE:\s*(\d)/)?.[1]||0);
        scores.link     = parseInt(s.match(/LINK:\s*(\d)/)?.[1]||0);
        scores.grammar  = parseInt(s.match(/GRAMMAR:\s*(\d)/)?.[1]||0);
        scores.length   = parseInt(s.match(/LENGTH:\s*(\d)/)?.[1]||0);
        scores.total    = scores.point+scores.expl+scores.evidence+scores.link+scores.grammar+scores.length;
      }
      const passed = scores.total>=10;
      setFeedback({text:fm?fm[1].trim():text,scores,passed});
      setAttempts(a=>a+1);
      setPhase("feedback");
      if(!passed && localStorage.getItem("writeup_notif_peel")!=="false"){
        setTimeout(()=>{ const m=NOTIF.peelLow(scores.total); showNotif(m.title,m.body); },3000);
      }
    } catch {
      setFeedback({text:"Feedback could not be loaded. Please check your connection.",scores:{point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0},passed:false});
      setPhase("feedback");
    }
    setAiL(false);
  };

  const renderFb = (text) => {
    if(!text) return null;
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("⚠️")) return <div key={i} style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:8,padding:"8px 12px",margin:"6px 0",fontSize:13,color:"#856404"}}>{line}</div>;
      if(line.startsWith("→ Problem:")) return <div key={i} style={{background:"#ffebee",borderLeft:"3px solid #e53935",padding:"6px 10px",margin:"3px 0 3px 12px",fontSize:13,color:"#c62828",lineHeight:1.6}}>{line}</div>;
      if(line.startsWith("→ Fix:"))    return <div key={i} style={{background:"#e8f5e9",borderLeft:`3px solid ${G}`,padding:"6px 10px",margin:"3px 0 8px 12px",fontSize:13,color:DK,lineHeight:1.6}}>{line}</div>;
      if(line.startsWith("❌"))        return <div key={i} style={{background:"#ffebee",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:"#c62828"}}>{line}</div>;
      if(line.startsWith("✅")&&!line.includes("Strong")) return <div key={i} style={{background:"#e8f5e9",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:DK}}>{line}</div>;
      if(line.startsWith("📖 Rule:"))  return <div key={i} style={{background:"#e3f2fd",borderRadius:6,padding:"6px 10px",margin:"4px 0 8px",fontSize:12,color:"#1565c0"}}>{line}</div>;
      if(line.startsWith("##"))        return <h4 key={i} style={{color:G,margin:"16px 0 8px",fontSize:14,borderBottom:`1px solid ${LT}`,paddingBottom:4}}>{line.replace(/^#+\s*/,"")}</h4>;
      if(line.trim()==="")             return <div key={i} style={{height:4}}/>;
      return <p key={i} style={{margin:"4px 0",fontSize:13,color:"#333",lineHeight:1.7}}>{line}</p>;
    });
  };

  // THEORY
  if(phase==="theory") return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
        <div style={{fontSize:11,opacity:.8,marginBottom:4}}>📚 Before you write · Level: {level}</div>
        <h3 style={{margin:"0 0 6px",fontSize:18}}>Understanding PEEL</h3>
        <p style={{margin:0,fontSize:13,opacity:.85,lineHeight:1.6}}>{PEEL_THEORY.what}</p>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {["What & Why","P — Point","E — Explanation","E — Evidence","L — Link"].map((t,idx)=>(
          <button key={idx} onClick={()=>setTab(idx)}
            style={{background:theoryTab===idx?G:"#fff",color:theoryTab===idx?"#fff":DK,border:`1.5px solid ${theoryTab===idx?G:"#ddd"}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
            {t}
          </button>
        ))}
      </div>
      {theoryTab===0&&(
        <div>
          <Card style={{marginBottom:12}}><h4 style={{color:G,margin:"0 0 8px"}}>❓ What is PEEL?</h4><p style={{fontSize:14,color:"#333",lineHeight:1.8,margin:0}}>{PEEL_THEORY.what}</p></Card>
          <Card style={{marginBottom:12}}><h4 style={{color:G,margin:"0 0 8px"}}>🎯 Why use PEEL?</h4><p style={{fontSize:14,color:"#333",lineHeight:1.8,margin:0}}>{PEEL_THEORY.why}</p></Card>
          <Card style={{background:"#fff8e1",marginBottom:12}}>
            <h4 style={{color:"#e65100",margin:"0 0 10px"}}>📐 The 4 Parts</h4>
            {PEEL_THEORY.parts.map(p=>(
              <div key={p.name} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                <div style={{background:p.color,borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{p.icon}</div>
                <div><div style={{fontWeight:700,color:DK,fontSize:14}}>{p.letter} — {p.name}</div><div style={{fontSize:12,color:"#666",lineHeight:1.5}}>{p.role}</div></div>
              </div>
            ))}
          </Card>
          <Card style={{background:LT,marginBottom:12}}>
            <h4 style={{color:G,margin:"0 0 8px"}}>📏 Word Minimums for {level}</h4>
            {keys.map(k=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #c8e6c9"}}>
                <span style={{fontWeight:600,color:DK,textTransform:"capitalize"}}>{k}</span>
                <span style={{color:G,fontWeight:700}}>min {minW[k]} words</span>
              </div>
            ))}
          </Card>
        </div>
      )}
      {theoryTab>0&&theoryTab<5&&(()=>{
        const p=PEEL_THEORY.parts[theoryTab-1];
        return (
          <div>
            <Card style={{background:p.color,marginBottom:12,borderLeft:`4px solid ${G}`}}>
              <div style={{fontSize:32,marginBottom:6}}>{p.icon}</div>
              <h3 style={{color:DK,margin:"0 0 6px"}}>{p.letter} — {p.name}</h3>
              <p style={{fontSize:14,color:"#444",lineHeight:1.8,margin:0}}>{p.role}</p>
            </Card>
            <Card style={{background:"#e8f5e9",marginBottom:12}}><div style={{fontWeight:700,color:G,marginBottom:8,fontSize:13}}>✅ DO</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.do}</p></Card>
            <Card style={{background:"#ffebee",marginBottom:12}}><div style={{fontWeight:700,color:"#c62828",marginBottom:8,fontSize:13}}>❌ DON'T</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.dont}</p></Card>
          </div>
        );
      })()}
      <div style={{display:"flex",gap:10,marginTop:4}}>
        {theoryTab>0&&<button onClick={()=>setTab(t=>t-1)} style={{background:"transparent",color:G,border:`2px solid ${G}`,borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Previous</button>}
        {theoryTab<4
          ? <button onClick={()=>setTab(t=>t+1)} style={{flex:1,background:G,color:"#fff",border:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Next →</button>
          : <button onClick={()=>setPhase("bad")} style={{flex:1,background:G,color:"#fff",border:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>See Examples →</button>}
      </div>
    </div>
  );

  // BAD EXAMPLE
  if(phase==="bad") return (
    <div>
      <Card style={{background:"#ffebee",marginBottom:14,borderLeft:"4px solid #e53935"}}>
        <div style={{fontWeight:800,color:"#c62828",fontSize:16,marginBottom:4}}>❌ Weak Paragraph</div>
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>Topic: {PEEL_THEORY.badExample.topic}</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.8,fontStyle:"italic",background:"#fff",borderRadius:10,padding:12,margin:0}}>{PEEL_THEORY.badExample.paragraph}</p>
      </Card>
      <h4 style={{color:DK,marginBottom:10}}>🔍 Why is this weak?</h4>
      {PEEL_THEORY.badExample.annotations.map((a,i)=>(
        <Card key={i} style={{marginBottom:10,borderLeft:"3px solid #e53935"}}>
          <div style={{fontWeight:700,color:"#c62828",fontSize:12,marginBottom:6}}>❌ {a.part}</div>
          {a.text&&<p style={{fontSize:13,color:"#333",fontStyle:"italic",margin:"0 0 6px",background:"#fff9f9",padding:"6px 10px",borderRadius:8}}>"{a.text}"</p>}
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{a.issue}</p>
        </Card>
      ))}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button onClick={()=>setPhase("theory")} style={{background:"transparent",color:G,border:`2px solid ${G}`,borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Theory</button>
        <button onClick={()=>setPhase("good")} style={{flex:1,background:G,color:"#fff",border:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>See Good Example →</button>
      </div>
    </div>
  );

  // GOOD EXAMPLE
  if(phase==="good") return (
    <div>
      <Card style={{background:"#e8f5e9",marginBottom:14,borderLeft:`4px solid ${G}`}}>
        <div style={{fontWeight:800,color:G,fontSize:16,marginBottom:4}}>✅ Strong Paragraph</div>
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>Topic: {PEEL_THEORY.goodExample.topic}</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.9,background:"#fff",borderRadius:10,padding:12,margin:0}}>{PEEL_THEORY.goodExample.paragraph}</p>
      </Card>
      <h4 style={{color:DK,marginBottom:10}}>🔍 Why is this strong?</h4>
      {PEEL_THEORY.goodExample.annotations.map((a,i)=>(
        <Card key={i} style={{marginBottom:10,borderLeft:`3px solid ${G}`}}>
          <div style={{fontWeight:700,color:G,fontSize:12,marginBottom:6}}>✅ {a.part}</div>
          <p style={{fontSize:13,color:"#333",fontStyle:"italic",margin:"0 0 6px",background:"#f9fbe7",padding:"6px 10px",borderRadius:8}}>"{a.text}"</p>
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{a.issue}</p>
        </Card>
      ))}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button onClick={()=>setPhase("bad")} style={{background:"transparent",color:G,border:`2px solid ${G}`,borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>← Bad Example</button>
        <button onClick={()=>setPhase("write")} style={{flex:1,background:G,color:"#fff",border:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Write My Paragraph →</button>
      </div>
    </div>
  );

  // WRITE
  if(phase==="write") return (
    <div>
      {attempts>0&&<Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision #{attempts} — Apply the feedback carefully.</p></Card>}
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888"}}>📝 Topic · {level}</div>
        <div style={{fontWeight:800,color:DK,fontSize:15,marginTop:2}}>{c.title}</div>
        <div style={{color:"#555",fontSize:13,marginTop:4,lineHeight:1.6}}>{c.prompt}</div>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {keys.map((k,idx)=>(
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div style={{height:6,borderRadius:99,background:vals[k]&&wc(vals[k])>=minW[k]?G:vals[k]?"#f57c00":idx===step?"#81c784":"#e0e0e0",marginBottom:4,transition:"background .3s"}}/>
            <div style={{fontSize:10,color:idx<=step?G:"#bbb",fontWeight:idx===step?800:400}}>{k.charAt(0).toUpperCase()}</div>
          </div>
        ))}
      </div>
      {(()=>{
        const p=PEEL_THEORY.parts[step];
        return (
          <div>
            <Card style={{background:p.color,marginBottom:10,borderLeft:`4px solid ${G}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div><div style={{fontSize:12,color:"#666",marginTop:4,lineHeight:1.5}}>{p.role}</div></div>
                <div style={{background:G,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0,textAlign:"center"}}>min {minW[keys[step]]}<br/>words</div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:"#555"}}><strong>DO:</strong> {p.do}</div>
            </Card>
            <Card style={{background:"#f0f7f4",marginBottom:10}}>
              <div style={{fontSize:11,color:"#888",marginBottom:4}}>📋 Model:</div>
              <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.8,fontStyle:"italic"}}>"{c.example[keys[step]]}"</p>
            </Card>
            <textarea value={vals[keys[step]]} onChange={e=>setVals(p=>({...p,[keys[step]]:e.target.value}))}
              placeholder={`Write your ${keys[step]} here… (min ${minW[keys[step]]} words)`} rows={5}
              style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wc(vals[keys[step]])>=minW[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4,marginBottom:10}}>
              <span style={{color:wc(vals[keys[step]])>=minW[keys[step]]?G:wc(vals[keys[step]])>0?"#f57c00":"#aaa",fontWeight:600}}>
                {wc(vals[keys[step]])} / {minW[keys[step]]} words {wc(vals[keys[step]])>=minW[keys[step]]?"✅":wc(vals[keys[step]])>0?"⚠️":""}
              </span>
              <span style={{color:"#aaa"}}>{vals[keys[step]].length} chars</span>
            </div>
            {step>0&&vals[keys[step-1]]&&(
              <Card style={{background:"#fafafa",marginBottom:10}}>
                <div style={{fontSize:11,color:"#888",marginBottom:4}}>📄 Your {keys[step-1]}:</div>
                <p style={{fontSize:12,color:"#555",margin:0,lineHeight:1.6,fontStyle:"italic"}}>"{vals[keys[step-1]]}"</p>
              </Card>
            )}
            <button onClick={()=>{if(step<3)setStep(s=>s+1);else getAI(attempts>0);}}
              disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoading}
              style={{width:"100%",background:!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoading?"#ccc":G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoading?"not-allowed":"pointer",marginTop:8,fontFamily:"inherit"}}>
              {aiLoading?"Analysing…":step<3?`Next: ${labels[step+1]} →`:"🤖 Submit for Assessment"}
            </button>
          </div>
        );
      })()}
    </div>
  );

  // FEEDBACK
  if(phase==="feedback"&&feedback) return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${feedback.scores.total>=15?DK:feedback.scores.total>=10?"#f57c00":"#c62828"},${feedback.scores.total>=15?G:feedback.scores.total>=10?"#ff9800":"#e53935"})`,color:"#fff",marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:13,opacity:.85,marginBottom:4}}>📊 Attempt #{attempts} · {feedback.passed?"✅ PASSED":"❌ REVISION REQUIRED"}</div>
        <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{feedback.scores.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div>
        <div style={{fontSize:14,fontWeight:700,opacity:.9}}>
          {feedback.scores.total>=17?"🏆 Excellent":feedback.scores.total>=14?"👏 Good":feedback.scores.total>=10?"📈 Passed":"💪 Below Average"}
        </div>
        {!feedback.passed&&<div style={{fontSize:12,opacity:.85,marginTop:6,background:"rgba(0,0,0,.2)",borderRadius:8,padding:"6px 12px"}}>You need 10/20 to pass. Read the feedback, revise, and resubmit.</div>}
      </Card>
      <Card style={{marginBottom:14}}>
        <h4 style={{color:DK,margin:"0 0 12px"}}>📋 Score Breakdown</h4>
        {SCORING_CRITERIA.map(cr=>{
          const s=feedback.scores[cr.id]||0;
          const pct=Math.round((s/cr.max)*100);
          return (
            <div key={cr.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:600,color:DK}}>{cr.label}</span>
                <span style={{color:pct>=75?G:pct>=50?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span>
              </div>
              <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
                <div style={{background:pct>=75?G:pct>=50?"#f57c00":"#e53935",height:8,borderRadius:99,width:`${pct}%`,transition:"width .6s"}}/>
              </div>
            </div>
          );
        })}
      </Card>
      <Card style={{marginBottom:14}}>
        <h4 style={{color:G,marginBottom:12}}>🔍 Detailed Analysis</h4>
        <div>{renderFb(feedback.text)}</div>
      </Card>
      <Card style={{background:"#f9fbe7",marginBottom:14}}>
        <h5 style={{color:DK,margin:"0 0 12px"}}>📄 Your Paragraph</h5>
        {keys.map(k=>(
          <div key={k} style={{marginBottom:12,paddingBottom:12,borderBottom:k!=="link"?"1px solid #eee":"none"}}>
            <div style={{fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{k}</div>
            <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.7}}>{vals[k]}</p>
          </div>
        ))}
      </Card>
      {feedback.passed ? (
        <div>
          <Card style={{background:LT,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:36,marginBottom:4}}>🎉</div>
            <p style={{color:G,fontWeight:700,margin:0}}>Congratulations! You passed with {feedback.scores.total}/20.</p>
            <p style={{color:"#555",fontSize:13,margin:"4px 0 0"}}>+{XP_PER_MODULE.peel} XP earned!</p>
          </Card>
          <button onClick={()=>addXp(XP_PER_MODULE.peel,"peel",{module:"peel",score:feedback.scores.total,total:20,passed:true,timeSec:Math.round((Date.now()-startTime)/1000),title:c.title,peelData:{topic:c.prompt,attemptNum:attempts,vals,scores:feedback.scores,timeSec:Math.round((Date.now()-startTime)/1000)}})}
            style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
            Claim +{XP_PER_MODULE.peel} XP & Continue →
          </button>
        </div>
      ) : (
        <div>
          <Card style={{background:"#fff3e0",marginBottom:14,borderLeft:"3px solid #f57c00"}}>
            <h5 style={{color:"#e65100",margin:"0 0 8px"}}>🔄 What to do now:</h5>
            <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.8}}>1. Read every ⚠️ highlighted sentence above carefully.<br/>2. Read each "→ Problem" and "→ Fix".<br/>3. Rewrite your paragraph applying all corrections.<br/>4. Resubmit — you must reach 10/20 to pass.</p>
          </Card>
          <button onClick={()=>{setPhase("write");setStep(0);}}
            style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
            🔄 Revise My Paragraph →
          </button>
        </div>
      )}
    </div>
  );

  return <Loader text="Loading…"/>;
}

/* ══ READING ══ */
function ReadingMod({addXp,onBack,G,LT,DK}) {
  const [c]      = useState(()=>rnd(READING_BANK));
  const [phase,setPhase] = useState("read");
  const [ans,setAns]     = useState([null,null,null]);
  const [checked,setChecked] = useState(false);
  const [done,setDone]   = useState(false);
  const [startTime]      = useState(Date.now);
  const score = ans.filter((a,i)=>a===c.questions[i]?.ans).length;

  if(done) return <DoneScreen xp={XP_PER_MODULE.reading} onBack={onBack} G={G}
    earnNow={()=>addXp(XP_PER_MODULE.reading,"reading",{module:"reading",score,total:3,passed:score>=2,timeSec:Math.round((Date.now()-startTime)/1000),title:c.title})}/>;

  if(phase==="read") return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        {c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <div style={{fontWeight:700,color:"#e65100",marginBottom:10,fontSize:13}}>📖 Glossary</div>
        {c.glossary.map(g=><div key={g.word} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}><strong style={{color:DK,minWidth:110,flexShrink:0}}>{g.word}</strong><span style={{color:"#555",lineHeight:1.5}}>{g.definition}</span></div>)}
      </Card>
      <button onClick={()=>setPhase("quiz")} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>Answer Questions →</button>
    </div>
  );

  return (
    <div>
      <h4 style={{color:DK,marginBottom:14}}>📝 Comprehension Questions</h4>
      {c.questions.map((q,qi)=>(
        <Card key={qi} style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10,lineHeight:1.6}}>{qi+1}. {q.q}</p>
          {q.opts.map((o,oi)=>{
            const isC=oi===q.ans, isP=oi===ans[qi];
            let bg="#f9f9f9",border="#e0e0e0";
            if(checked){ if(isP&&isC){bg="#e8f5e9";border=G}else if(isP&&!isC){bg="#ffebee";border="#e53935"}else if(!isP&&isC){bg="#fff9c4";border="#f9a825"} }
            else if(isP){bg=LT;border=G}
            return <button key={oi} onClick={()=>{if(!checked)setAns(a=>{const n=[...a];n[qi]=oi;return n;})}}
              style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${border}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":checked&&!isP&&isC?"💡 ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ? <button onClick={()=>setChecked(true)} disabled={ans.includes(null)}
            style={{width:"100%",background:ans.includes(null)?"#ccc":G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:ans.includes(null)?"not-allowed":"pointer",marginTop:8,fontFamily:"inherit"}}>
            Check Answers
          </button>
        : <div>
            <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
              <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong>
            </Card>
            <button onClick={()=>setDone(true)} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>
              Earn +{XP_PER_MODULE.reading} XP
            </button>
          </div>}
    </div>
  );
}

/* ══ MISTAKES ══ */
function MistakesMod({addXp,onBack,G,LT,DK}) {
  const [c]    = useState(()=>rnd(MISTAKES_BANK));
  const [done,setDone] = useState(false);
  const [startTime] = useState(Date.now);
  if(done) return <DoneScreen xp={XP_PER_MODULE.mistakes} onBack={onBack} G={G}
    earnNow={()=>addXp(XP_PER_MODULE.mistakes,"mistakes",{module:"mistakes",score:1,total:1,passed:true,timeSec:Math.round((Date.now()-startTime)/1000),title:c.title})}/>;
  return (
    <div>
      <Card style={{borderLeft:"4px solid #ff9800",marginBottom:14}}>
        <span style={{background:"#fff3e0",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.title}</span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
          <span style={{fontSize:18}}>🇫🇷</span>
          <span style={{fontSize:13,color:"#666",fontStyle:"italic",lineHeight:1.5}}>French: <strong>{c.french_pattern}</strong></span>
        </div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:8}}>❌ Common Error</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong_english}"</p></Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>✅ Correct English</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.correct_english}"</p></Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}><div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:8}}>📐 Rule</div><p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p></Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>📝 More Examples</div>
        {c.extra_examples.map((e,i)=>(
          <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<c.extra_examples.length-1?"1px solid #f0f0f0":"none"}}>
            <div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.wrong}</div>
            <div style={{fontSize:13,color:G}}>✅ {e.right}</div>
          </div>
        ))}
      </Card>
      <button onClick={()=>setDone(true)} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>
        Got it! Earn +{XP_PER_MODULE.mistakes} XP
      </button>
    </div>
  );
}

/* ══ QUIZ ══ */
function QuizMod({addXp,onBack,G,LT,DK}) {
  const [qs]    = useState(()=>rnd(QUIZ_BANK));
  const [i,setI] = useState(0);
  const [sel,setSel] = useState(null);
  const [score,setScore] = useState(0);
  const [review,setReview] = useState(false);
  const [done,setDone] = useState(false);
  const [startTime] = useState(Date.now);
  const q = qs[i];
  const confirmed = sel!==null;
  const correct   = sel===q?.ans;

  if(done) return <DoneScreen xp={score*6} onBack={onBack} G={G}
    earnNow={()=>addXp(score*6,"quiz",{module:"quiz",score,total:qs.length,passed:score>=3,timeSec:Math.round((Date.now()-startTime)/1000),title:"Daily Quiz"})}/>;

  if(review) return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#666",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
        <p style={{color:"#888",fontSize:13}}>{score>=4?"Excellent!":score>=2?"Good effort — keep practising!":"Review the lessons and try again!"}</p>
      </Card>
      <Card style={{background:LT,marginBottom:14}}>
        <p style={{margin:0,fontSize:13,color:G,fontWeight:600}}>⭐ XP earned: +{score*6} (6 XP per correct answer)</p>
      </Card>
      {score>0
        ? <button onClick={()=>setDone(true)} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>Claim +{score*6} XP →</button>
        : <button onClick={onBack} style={{width:"100%",background:"transparent",color:G,border:`2px solid ${G}`,borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>← No XP — Try again tomorrow</button>}
    </div>
  );

  const next = () => { if(i<qs.length-1){ setI(p=>p+1); setSel(null); } else setReview(true); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}>
        <span>Q {i+1}/{qs.length}</span>
        <span style={{color:G,fontWeight:700}}>Score: {score}/{i+(confirmed?1:0)}</span>
      </div>
      <div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}>
        <div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const isC=oi===q.ans, isP=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){ if(isP&&isC){bg="#e8f5e9";border=G}else if(isP&&!isC){bg="#ffebee";border="#e53935"}else if(!isP&&isC&&!correct){bg="#fff9c4";border="#f9a825"} }
        else if(isP){bg=LT;border=G}
        return <button key={oi} onClick={()=>{if(!confirmed){ setSel(oi); if(oi===q.ans) setScore(s=>s+1); }}}
          style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&isP&&isC?"✅ ":confirmed&&isP&&!isC?"❌ ":confirmed&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p>
        </Card>
        <button onClick={next} style={{width:"100%",background:G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>
          {i<qs.length-1?"Next Question →":"See Results"}
        </button>
      </>}
    </div>
  );
}

/* ══ PROFILE ══ */
function Profile({user,xp,lvl,level,badges,streak,G,LT,DK}) {
  return (
    <div style={{padding:18}}>
      <div style={{background:`linear-gradient(135deg,${DK},${G})`,borderRadius:20,padding:24,color:"#fff",textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:52,marginBottom:8}}>👤</div>
        <div style={{fontWeight:900,fontSize:20}}>{user?.name}</div>
        <div style={{opacity:.75,fontSize:13,marginBottom:6}}>{user?.email}</div>
        <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"6px 16px",display:"inline-block",fontSize:14,fontWeight:700,marginBottom:12}}>🎯 {level}</div>
        <div style={{display:"flex",justifyContent:"center",gap:28}}>
          {[["⭐",xp,"XP"],["🔥",streak,"Streak"],["🏅",lvl.name,"Level"]].map(([ic,v,lb])=>(
            <div key={lb}><div style={{fontWeight:800,fontSize:17}}>{v}</div><div style={{fontSize:11,opacity:.75}}>{lb}</div></div>
          ))}
        </div>
      </div>
      <h3 style={{color:DK,marginBottom:12}}>🏅 Badges</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {BADGES_DEF.map(b=>{
          const earned=badges.includes(b.name);
          return <div key={b.name} style={{background:earned?"#fff":"#f5f5f5",borderRadius:14,padding:14,opacity:earned?1:.55,boxShadow:earned?"0 2px 8px #0002":"none"}}>
            <div style={{fontSize:28}}>{b.icon}</div>
            <div style={{fontWeight:700,fontSize:13,color:DK,marginTop:4}}>{b.name}</div>
            <div style={{fontSize:11,color:"#777",lineHeight:1.4}}>{b.desc}</div>
            {!earned&&<div style={{fontSize:10,color:"#bbb",marginTop:4}}>🔒 Locked</div>}
          </div>;
        })}
      </div>
    </div>
  );
}

/* ══ LEADERBOARD ══ */
function Board({userId,myXp,token,G,LT,DK}) {
  const [lb,setLb]     = useState([]);
  const [loading,setL] = useState(true);
  const [myRank,setMyRank] = useState(null);
  const [lastRef,setLastRef] = useState(null);

  const fetchLb = async () => {
    try {
      const data = await sbGet("public_leaderboard?limit=10",token);
      if(Array.isArray(data)){
        const updated = data.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp);
        setLb(updated);
        const all = await sbGet("public_leaderboard?limit=50",token);
        if(Array.isArray(all)){
          const allU = all.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp);
          const rank = allU.findIndex(u=>u.id===userId)+1;
          setMyRank(rank>0?rank:null);
        }
      }
    } catch(e){ console.error(e); }
    setL(false); setLastRef(new Date());
  };

  useEffect(()=>{ fetchLb(); const iv=setInterval(fetchLb,30000); return ()=>clearInterval(iv); },[myXp]);

  const medals = ["🥇","🥈","🥉"];
  const lvlColors = {Bronze:"#cd7f32",Silver:"#9e9e9e",Gold:"#ffd700",Platinum:"#4fc3f7",Beginner:"#81c784",Intermediate:"#42a5f5",Advanced:"#ab47bc"};

  return (
    <div style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h3 style={{color:DK,margin:"0 0 4px"}}>🏆 Leaderboard</h3>
          <p style={{color:"#888",fontSize:12,margin:0}}>{lastRef?`Updated ${lastRef.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:""}</p>
        </div>
        <button onClick={fetchLb} style={{background:LT,border:"none",borderRadius:10,padding:"6px 12px",color:G,fontWeight:700,fontSize:12,cursor:"pointer"}}>🔄 Refresh</button>
      </div>
      {myRank&&myRank>10&&(
        <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
          <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📍 Your Rank</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:32,fontWeight:900}}>#{myRank}</div>
            <div><div style={{fontWeight:700}}>Keep going!</div><div style={{fontSize:12,opacity:.8}}>⭐ {myXp} XP</div></div>
          </div>
        </Card>
      )}
      {loading&&<Loader text="Loading leaderboard…"/>}
      {!loading&&lb.length===0&&<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>🏆</div><p style={{color:"#888"}}>No students yet. Be the first!</p></Card>}
      {lb.slice(0,10).map((l,idx)=>{
        const isMe=l.id===userId, rank=idx+1;
        return (
          <div key={l.id} style={{background:isMe?LT:"#fff",border:isMe?`2px solid ${G}`:"1px solid #eee",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:10,boxShadow:rank<=3?"0 2px 12px #0002":"none"}}>
            <div style={{width:36,textAlign:"center",flexShrink:0}}>
              {rank<=3?<span style={{fontSize:24}}>{medals[idx]}</span>:<span style={{fontSize:14,fontWeight:800,color:"#bbb"}}>#{rank}</span>}
            </div>
            <div style={{width:36,height:36,borderRadius:"50%",background:isMe?G:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:isMe?"#fff":"#999"}}>
              {l.name?.charAt(0)?.toUpperCase()||"?"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:isMe?800:600,color:isMe?G:DK,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}{isMe?" (You)":""}</div>
              <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
                {l.level&&<span style={{fontSize:10,fontWeight:700,color:lvlColors[l.level]||"#888"}}>{l.level}</span>}
                {l.streak>0&&<span style={{fontSize:11,color:"#888"}}>🔥{l.streak}</span>}
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:800,color:G,fontSize:15}}>⭐{isMe?myXp:l.xp}</div>
              {l.peel_avg_score>0&&<div style={{fontSize:10,color:"#aaa"}}>PEEL:{l.peel_avg_score}/20</div>}
            </div>
          </div>
        );
      })}
      {!loading&&lb.length>0&&(
        <Card style={{background:"#f9fbe7",marginTop:8}}>
          <div style={{fontSize:12,color:"#888",marginBottom:8}}>📊 Stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["👥 Students",lb.length],["🏆 Top XP",`${lb[0]?.xp||0} XP`],["📍 Your Rank",myRank?`#${myRank}`:"—"],["⭐ Your XP",`${myXp} XP`]].map(([l,v])=>(
              <div key={l} style={{textAlign:"center",background:"#fff",borderRadius:10,padding:"8px 4px"}}>
                <div style={{fontSize:13,fontWeight:700,color:DK}}>{v}</div>
                <div style={{fontSize:11,color:"#888"}}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══ SETTINGS ══ */
function SettingsScreen({user,xp,placement,onThemeChange,onLogout,G,LT,DK}) {
  const [notifPerm,setNotifPerm] = useState(typeof Notification!=="undefined"?Notification.permission:"default");
  const [notifTime,setNotifTime] = useState(localStorage.getItem("writeup_notif_time")||"08:00");
  const [saving,setSaving]       = useState(false);
  const [saved,setSaved]         = useState(false);
  const [offlineStatus,setOff]   = useState("checking");
  const [caching,setCaching]     = useState(false);
  const [activeTheme,setActiveTheme] = useState(localStorage.getItem("writeup_theme")||"default");
  const [swReg,setSwReg]         = useState(null);

  useEffect(()=>{
    registerSW().then(reg=>setSwReg(reg));
    isOfflineReady().then(r=>setOff(r?"ready":"not_cached"));
  },[]);

  const enableNotif = async () => {
    const p = await reqNotif();
    setNotifPerm(p);
    if(p==="granted"){ localStorage.setItem("writeup_notif_enabled","true"); scheduleDailyReminder(swReg,notifTime); showNotif("✅ Notifications enabled!","Daily reminder set for "+notifTime); }
  };
  const saveNotif = () => {
    setSaving(true);
    if(Notification?.permission==="granted") scheduleDailyReminder(swReg,notifTime);
    setTimeout(()=>{ setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000); },500);
  };
  const handleCache = async () => {
    setCaching(true);
    try { await cacheAll(); setOff("ready"); showNotif("✅ Cached!","Content available offline."); }
    catch { alert("Could not cache. Please try again."); }
    setCaching(false);
  };
  const handleTheme = (key) => { setActiveTheme(key); localStorage.setItem("writeup_theme",key); onThemeChange(THEMES[key]); };
  const handleCert  = () => {
    const url = generateCert(user?.name||"Student",placement?.level||"Beginner",xp,new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}));
    const a=document.createElement("a"); a.href=url; a.download=`WriteUP_Certificate_${(user?.name||"Student").replace(/\s+/g,"_")}.png`; a.click();
  };

  const lvl = getLvl(xp);
  const canForest = xp>=200, canOcean = xp>=1000, canCert = xp>=2000;

  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>⚙️ Settings</h3>

      {/* Profile */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#888",marginBottom:2}}>Logged in as</div>
        <div style={{fontWeight:700,color:DK,fontSize:15}}>{user?.name}</div>
        <div style={{fontSize:13,color:"#888",marginBottom:8}}>{user?.email}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{placement?.level||"Beginner"}</span>
          <span style={{background:"#e3f2fd",color:"#1565c0",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>⭐ {xp} XP</span>
          <span style={{background:"#fff8e1",color:"#f57c00",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{lvl.name}</span>
        </div>
      </Card>

      {/* Themes */}
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>🎨 Visual Themes</div>
        {[{key:"default",name:"🌿 Default Green",locked:false,req:0},{key:"forest",name:"🌲 Dark Forest",locked:!canForest,req:200},{key:"ocean",name:"🌊 Ocean Blue",locked:!canOcean,req:1000}].map(t=>(
          <div key={t.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"10px 12px",borderRadius:12,background:activeTheme===t.key?"#e8f5e9":t.locked?"#f5f5f5":"#fff",border:activeTheme===t.key?`2px solid ${G}`:"1.5px solid #eee",opacity:t.locked?.6:1}}>
            <div>
              <div style={{fontWeight:700,color:DK,fontSize:13}}>{t.name}</div>
              {t.locked&&<div style={{fontSize:11,color:"#f57c00"}}>🔒 Unlock at {t.req} XP ({t.req-xp} more)</div>}
            </div>
            {!t.locked&&<button onClick={()=>handleTheme(t.key)} style={{background:activeTheme===t.key?G:"#e0e0e0",color:activeTheme===t.key?"#fff":"#555",border:"none",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              {activeTheme===t.key?"Active":"Apply"}
            </button>}
          </div>
        ))}
      </Card>

      {/* Certificate */}
      <Card style={{marginBottom:14,background:canCert?"#f9fbe7":"#f5f5f5",opacity:canCert?1:.7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,color:DK,fontSize:15}}>🏆 Certificate</div>
            <div style={{fontSize:12,color:"#888",marginTop:3}}>{canCert?"Download your official achievement certificate":"🔒 Unlock at 2000 XP — "+String(2000-xp)+" more needed"}</div>
          </div>
          {canCert&&<button onClick={handleCert} style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>⬇️ Download</button>}
        </div>
        {!canCert&&<div style={{background:"#ffe082",borderRadius:99,height:6,marginTop:10}}><div style={{background:"#f9a825",height:6,borderRadius:99,width:`${Math.min(100,Math.round((xp/2000)*100))}%`,transition:"width .5s"}}/></div>}
      </Card>

      {/* Offline */}
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:6}}>📴 Offline Mode</div>
        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Cache Grammar, Vocabulary & Mistakes locally for use without internet.</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:offlineStatus==="ready"?"#4caf50":offlineStatus==="checking"?"#ff9800":"#bbb"}}/>
          <span style={{fontSize:13,color:"#555",fontWeight:600}}>{offlineStatus==="ready"?"✅ Cached & Ready":offlineStatus==="checking"?"Checking…":"Not cached yet"}</span>
        </div>
        <button onClick={handleCache} disabled={caching||offlineStatus==="ready"}
          style={{width:"100%",background:offlineStatus==="ready"?"#e8f5e9":G,color:offlineStatus==="ready"?G:"#fff",border:offlineStatus==="ready"?`1.5px solid ${G}`:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:14,cursor:caching||offlineStatus==="ready"?"default":"pointer",fontFamily:"inherit",opacity:caching?.7:1}}>
          {caching?"⏳ Caching…":offlineStatus==="ready"?"✅ Already cached":"📥 Cache for Offline Use"}
        </button>
        {offlineStatus==="ready"&&<button onClick={async()=>{await cacheItem("offline_ready",{ready:false});setOff("not_cached");}} style={{width:"100%",background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",marginTop:6,fontFamily:"inherit"}}>Clear cache</button>}
      </Card>

      {/* Notifications */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontWeight:700,color:DK,fontSize:15}}>🔔 Notifications</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{notifPerm==="granted"?"✅ Enabled":notifPerm==="denied"?"❌ Blocked in browser":"Not yet enabled"}</div>
          </div>
          {notifPerm!=="granted"&&notifPerm!=="denied"&&<button onClick={enableNotif} style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Enable</button>}
        </div>
        {notifPerm==="granted"&&<>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:DK,marginBottom:6}}>⏰ Daily reminder time</div>
            <input type="time" value={notifTime} onChange={e=>setNotifTime(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${G}`,borderRadius:10,padding:"10px 14px",fontSize:15,outline:"none",fontFamily:"inherit",color:DK}}/>
          </div>
          <button onClick={saveNotif} style={{width:"100%",background:saved?"#e8f5e9":G,color:saved?G:"#fff",border:saved?`1.5px solid ${G}`:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}>
            {saving?"Saving…":saved?"✅ Saved!":"Save Settings"}
          </button>
        </>}
      </Card>

      {/* Privacy */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14}}>🔒 Privacy</div>
        <div style={{fontSize:12,color:"#888",marginTop:4}}>ARTCI compliance n°2013-450 · Secured by Supabase</div>
      </Card>

      <button onClick={onLogout} style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Log Out
      </button>
    </div>
  );
}
