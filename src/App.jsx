import { useState, useEffect } from "react";

/* ══ CONFIG ══ */
const SB_URL = "https://qnxeyoxashvbljjmqkrp.supabase.co";
const SB_KEY = "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";
const G0 = "#2D6A4F", LT0 = "#d8f3dc", DK0 = "#1b4332";

const THEMES = {
  default: { primary:"#2D6A4F", light:"#d8f3dc", dark:"#1b4332" },
  forest:  { primary:"#1a3a2a", light:"#c8e6c9", dark:"#0d1f17" },
  ocean:   { primary:"#1565c0", light:"#bbdefb", dark:"#0d47a1" },
};
const XP_MOD = { grammar:5, vocabulary:5, reading:20, mistakes:10, quiz:10, peel:50 };
const UNLOCKS = [
  { xp:100,  type:"peel",        label:"Advanced PEEL Topics",       desc:"Unlock 4 challenging writing topics",    icon:"📝" },
  { xp:200,  type:"theme",       label:"Dark Forest Theme",           desc:"Unlock a deep green visual theme",       icon:"🌲" },
  { xp:500,  type:"level",       label:"Intermediate Level",          desc:"Automatically move to Intermediate",     icon:"🌿" },
  { xp:1000, type:"theme",       label:"Ocean Blue Theme",            desc:"Unlock a blue ocean visual theme",       icon:"🌊" },
  { xp:1500, type:"level",       label:"Advanced Level",              desc:"Automatically move to Advanced",         icon:"🌳" },
  { xp:2000, type:"certificate", label:"Certificate of Achievement",  desc:"Download your official PDF certificate", icon:"🏆" },
];
const ENCOURAGE = [
  { title:"🔥 Already done today!", body:"XP already earned for this module. Come back tomorrow!", sub:"Extra practice = extra mastery." },
  { title:"💪 Great dedication!",   body:"No XP today — you already earned it! Every session builds skills.", sub:"Consistency is the key." },
  { title:"⭐ You're on fire!",      body:"XP collected! Your commitment shows real growth.",              sub:"See you tomorrow for fresh XP!" },
];
const WORD_MIN = {
  Beginner:     { point:10, explanation:20, evidence:10, link:10 },
  Intermediate: { point:15, explanation:40, evidence:20, link:15 },
  Advanced:     { point:25, explanation:60, evidence:25, link:20 },
};

/* ══ SUPABASE ══ */
const sbH = t => ({ "Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${t||SB_KEY}`,"Prefer":"return=representation" });
const sbGet    = (p,t)   => fetch(`${SB_URL}/rest/v1/${p}`,{headers:sbH(t)}).then(r=>r.json()).catch(()=>[]);
const sbPost   = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",headers:sbH(t),body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const sbPatch  = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`,{method:"PATCH",headers:{...sbH(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const sbUpsert = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const authUp   = (e,p)   => fetch(`${SB_URL}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const authIn   = (e,p)   => fetch(`${SB_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

/* ══ HELPERS ══ */
const today  = () => new Date().toISOString().slice(0,10);
const rnd    = a  => a[Math.floor(Math.random()*a.length)];
const wc     = s  => s.trim().split(/\s+/).filter(Boolean).length;
const getLvl = xp => {
  if(xp<500)  return {name:"Bronze",  color:"#cd7f32",min:0,   next:500 };
  if(xp<1500) return {name:"Silver",  color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",    color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};

/* ══ localStorage safe helpers ══ */
const lsGet = (key, fallback="") => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const lsSet = (key, value) => {
  try { localStorage.setItem(key, value); } catch {}
};

/* ══ OFFLINE ══ */
const openDB = () => new Promise((res,rej)=>{
  const r=indexedDB.open("writeup-v1",1);
  r.onupgradeneeded=e=>{if(!e.target.result.objectStoreNames.contains("c"))e.target.result.createObjectStore("c",{keyPath:"k"});};
  r.onsuccess=e=>res(e.target.result); r.onerror=e=>rej(e);
});
const dbSet = async(k,v)=>{try{const db=await openDB();const tx=db.transaction("c","readwrite");tx.objectStore("c").put({k,v});await new Promise(r=>{tx.oncomplete=r;tx.onerror=r;});}catch{}};
const dbGet = async k=>{try{const db=await openDB();const tx=db.transaction("c","readonly");const r=tx.objectStore("c").get(k);return new Promise(res=>{r.onsuccess=()=>res(r.result?.v||null);r.onerror=()=>res(null);});}catch{return null;}};
const isOffline = async()=>{const r=await dbGet("ready");return !!r;};

/* ══ NOTIFICATIONS ══ */
const showNotif=(title,body)=>{if(typeof Notification!=="undefined"&&Notification.permission==="granted")new Notification(title,{body,icon:"/icon.svg"});};
const reqNotif =async()=>{if(typeof Notification==="undefined")return"unsupported";if(Notification.permission==="granted")return"granted";return Notification.requestPermission();};
const regSW    =async()=>{if(!("serviceWorker"in navigator))return null;try{return await navigator.serviceWorker.register("/sw.js");}catch{return null;}};

/* ══ CERTIFICATE ══ */
const makeCert=(name,level,xp,date)=>{
  const c=document.createElement("canvas");c.width=800;c.height=560;
  const x=c.getContext("2d");
  x.fillStyle="#f9fbe7";x.fillRect(0,0,800,560);
  x.strokeStyle="#2D6A4F";x.lineWidth=8;x.strokeRect(20,20,760,520);
  x.strokeStyle="#81c784";x.lineWidth=3;x.strokeRect(30,30,740,500);
  x.fillStyle="#2D6A4F";x.font="bold 36px Georgia,serif";x.textAlign="center";x.fillText("WriteUP UPGC",400,90);
  x.font="17px Georgia,serif";x.fillStyle="#555";x.fillText("Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire",400,120);
  x.fillStyle="#2D6A4F";x.fillRect(100,135,600,3);
  x.font="bold 26px Georgia,serif";x.fillStyle="#1b4332";x.fillText("Certificate of Achievement",400,180);
  x.font="17px Georgia,serif";x.fillStyle="#333";x.fillText("This certifies that",400,225);
  x.font="bold 40px Georgia,serif";x.fillStyle="#2D6A4F";x.fillText(name,400,278);
  const nw=x.measureText(name).width;x.fillStyle="#81c784";x.fillRect(400-nw/2,288,nw,3);
  x.font="17px Georgia,serif";x.fillStyle="#333";
  x.fillText("has successfully completed the WriteUP UPGC Academic English Programme",400,330);
  x.fillText(`reaching ${level} level with ${xp} XP earned`,400,360);
  x.font="bold 15px Georgia,serif";x.fillStyle="#2D6A4F";
  [["Level",level],["XP Earned",String(xp)],["Date",date]].forEach(([l,v],i)=>{
    const px=160+i*220;x.fillText(l,px,415);x.font="13px Georgia,serif";x.fillStyle="#555";x.fillText(v,px,435);x.font="bold 15px Georgia,serif";x.fillStyle="#2D6A4F";
  });
  x.fillStyle="#888";x.font="12px Georgia,serif";x.fillText("writeup-upgc.vercel.app",400,510);
  return c.toDataURL("image/png");
};

/* ══ CONTENT ══ */
const GRAMMAR=[
  {title:"Present Simple",instruction:"Choose the correct form.",question:"She ___ to the library every Tuesday.",opts:["go","goes","is going","has gone"],ans:1,explanation:"Present simple is used for habits and routines. 'Every Tuesday' signals a habit.",tip:"Present simple = habits. Key words: always, every day, usually, never."},
  {title:"Uncountable Nouns",instruction:"Choose the correct sentence.",question:"Which sentence is correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,explanation:"'Advice' is uncountable — no plural, no 'a/an'. Say 'some advice'.",tip:"Uncountable: advice, information, furniture, equipment, news, progress."},
  {title:"Second Conditional",instruction:"Choose the correct form.",question:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,explanation:"Second conditional = If + past simple + would + base verb. Describes hypothetical situations.",tip:"If + past simple → would + base verb. Example: If I had money, I would travel."},
  {title:"Relative Clauses",instruction:"Choose the correct pronoun.",question:"The student ___ scored highest received a prize.",opts:["which","whose","who","whom"],ans:2,explanation:"Use 'who' for people in relative clauses. 'Which' is for things.",tip:"Who = people. Which = things. Whose = possession."},
  {title:"Articles",instruction:"Choose the correct article.",question:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,explanation:"'University' starts with a /j/ sound, so we use 'a', not 'an'. The rule depends on sound.",tip:"Use 'an' before vowel SOUNDS: an hour. Use 'a' before consonant SOUNDS: a university."},
  {title:"Past Perfect",instruction:"Choose the correct tense.",question:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,explanation:"Past perfect (had + past participle) = an action completed BEFORE another past action.",tip:"Past perfect = had + past participle. Signal words: by the time, already, before."},
  {title:"Passive Voice",instruction:"Choose the correct form.",question:"All assignments ___ before the end of the semester.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,explanation:"Passive = modal + be + past participle. 'Must be submitted' is correct.",tip:"Passive: subject + be + past participle. Active → Passive: 'Students submit essays' → 'Essays are submitted'."},
  {title:"Gerund vs Infinitive",instruction:"Choose the correct form.",question:"She avoided ___ the difficult questions.",opts:["to answer","answer","answering","answered"],ans:2,explanation:"'Avoid' must always be followed by a gerund (-ing form).",tip:"Verbs + gerund: avoid, enjoy, finish, suggest. Verbs + infinitive: want, need, decide, hope."},
  {title:"Subject-Verb Agreement",instruction:"Choose the correct verb.",question:"Neither the students nor the teacher ___ aware of the change.",opts:["were","are","was","is"],ans:2,explanation:"With 'neither...nor', the verb agrees with the NEAREST subject. 'Teacher' is singular → 'was'.",tip:"Neither...nor / either...or: verb agrees with the closest subject."},
  {title:"Reported Speech",instruction:"Choose the correct form.",question:"She said: 'I am preparing.' → She said that she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,explanation:"In reported speech, present continuous (am preparing) → past continuous (was preparing).",tip:"Backshift: am/is → was | will → would | can → could | have → had."},
  {title:"Prepositions",instruction:"Choose the correct preposition.",question:"She is very good ___ mathematics.",opts:["in","on","at","for"],ans:2,explanation:"'Good at' a subject or skill is a fixed expression in English.",tip:"Fixed expressions: good at, bad at, interested in, responsible for, afraid of, proud of."},
  {title:"Present Perfect",instruction:"Choose the correct tense.",question:"I ___ my homework, so I can go out now.",opts:["finish","finished","have finished","had finished"],ans:2,explanation:"Present perfect = past action with a result in the present. 'I have finished' explains why I can go out.",tip:"Present perfect = have/has + past participle. Use for recent actions with present results."},
];

const VOCAB=[
  {word:"Analyse",phonetic:"/ˈæn.ə.laɪz/",french:"Analyser",pos:"verb",def:"To examine something carefully in detail to understand it.",ex:"The students must ___ the poem before writing their essay.",blank:"analyse",opts:["analyse","ignore","copy","avoid"],ans:0,tip:"Think 'ana' (apart) + 'lyse' (loosen). To analyse = break apart to understand."},
  {word:"Significant",phonetic:"/sɪɡˈnɪf.ɪ.kənt/",french:"Significatif",pos:"adjective",def:"Important or large enough to have a noticeable effect.",ex:"There has been a ___ improvement in her writing since last semester.",blank:"significant",opts:["significant","small","boring","strange"],ans:0,tip:"'Sign' is inside — something significant gives a sign that it matters."},
  {word:"Coherent",phonetic:"/kəʊˈhɪə.rənt/",french:"Cohérent",pos:"adjective",def:"Logical, well-organised, and easy to understand.",ex:"A well-written essay must present a ___ argument from start to finish.",blank:"coherent",opts:["emotional","coherent","confusing","short"],ans:1,tip:"'Co' (together) + 'here' (stick). Coherent ideas stick together logically."},
  {word:"Evidence",phonetic:"/ˈev.ɪ.dəns/",french:"Preuve",pos:"noun (uncountable)",def:"Facts or information that show whether a claim is true.",ex:"Every argument in an essay must be supported by reliable ___.",blank:"evidence",opts:["opinion","evidence","feeling","title"],ans:1,tip:"'Evident' = easy to see. Evidence makes the truth visible."},
  {word:"Conclude",phonetic:"/kənˈkluːd/",french:"Conclure",pos:"verb",def:"To decide something is true after considering all information.",ex:"Based on the findings, we can ___ that education reduces poverty.",blank:"conclude",opts:["begin","wonder","conclude","forget"],ans:2,tip:"'Con' + 'clude' (close). To conclude = close your thinking with a final decision."},
  {word:"Fundamental",phonetic:"/ˌfʌn.dəˈmen.təl/",french:"Fondamental",pos:"adjective",def:"Forming the necessary base or core of something; essential.",ex:"Critical thinking is a ___ skill for all university students.",blank:"fundamental",opts:["optional","fundamental","difficult","rare"],ans:1,tip:"'Fund' = foundation. Fundamental = what everything is built upon."},
  {word:"Illustrate",phonetic:"/ˈɪl.ə.streɪt/",french:"Illustrer",pos:"verb",def:"To make something clearer by providing examples or evidence.",ex:"This graph will ___ how scores improved over three years.",blank:"illustrate",opts:["hide","illustrate","remove","question"],ans:1,tip:"'Lustre' = light. To illustrate = shed light on an idea with an example."},
  {word:"Consequence",phonetic:"/ˈkɒn.sɪ.kwəns/",french:"Conséquence",pos:"noun",def:"A result or effect of an action or decision.",ex:"Poor time management can have serious academic ___s.",blank:"consequence",opts:["reason","consequence","beginning","title"],ans:1,tip:"'Con' + 'sequence' — consequences follow in sequence after an action."},
  {word:"Emphasise",phonetic:"/ˈem.fə.saɪz/",french:"Souligner",pos:"verb",def:"To show something is especially important or deserves attention.",ex:"The professor always ___ the importance of proofreading.",blank:"emphasise",opts:["ignore","forget","emphasise","remove"],ans:2,tip:"'Em' + 'phase' = to put in sharp focus, like a camera on one subject."},
  {word:"Relevant",phonetic:"/ˈrel.ɪ.vənt/",french:"Pertinent",pos:"adjective",def:"Closely connected or appropriate to the subject being discussed.",ex:"Make sure all evidence in your essay is ___ to your argument.",blank:"relevant",opts:["relevant","old","boring","random"],ans:0,tip:"'Relevant' shares a root with 'relate'. Relevant info relates directly to your topic."},
  {word:"Justify",phonetic:"/ˈdʒʌs.tɪ.faɪ/",french:"Justifier",pos:"verb",def:"To show or prove that a decision or statement is reasonable.",ex:"You must ___ every claim in your essay with reliable evidence.",blank:"justify",opts:["hide","justify","ignore","repeat"],ans:1,tip:"'Just' = fair/right. To justify = show that something is fair and well-reasoned."},
  {word:"Approach",phonetic:"/əˈprəʊtʃ/",french:"Approche",pos:"noun/verb",def:"A way of dealing with a situation or problem.",ex:"The researcher used a qualitative ___ to study writing habits.",blank:"approach",opts:["problem","mistake","approach","question"],ans:2,tip:"Think of stepping closer to a solution — you approach it step by step."},
];

const READING=[
  {title:"Education and Development in Africa",topic:"Education",passage:`Education is widely recognised as one of the most powerful tools for sustainable development in Africa. Countries that invest seriously in schools and universities tend to experience stronger economic growth, lower poverty rates, and more stable governments. In Côte d'Ivoire, the government has significantly increased spending on education over the past decade, resulting in higher enrolment rates at both primary and secondary levels.\n\nHowever, significant challenges remain. A shortage of qualified teachers in rural areas, limited access to technology, and inadequate school infrastructure continue to hinder progress. Many students in remote regions must walk several kilometres each day simply to attend school.\n\nDespite these obstacles, research consistently shows the transformative power of education. Students who complete secondary school are three times more likely to find formal employment than those who drop out.`,glossary:[{w:"sustainable",d:"able to continue long-term without causing damage"},{w:"enrolment",d:"officially registering in a school"},{w:"infrastructure",d:"basic physical structures needed for society"},{w:"transformative",d:"causing a major positive change"}],questions:[{q:"What benefit do countries that invest in education experience?",opts:["More problems","Stronger growth and lower poverty","Fewer teachers","Less healthcare spending"],ans:1},{q:"What teacher-related challenge is mentioned?",opts:["Too many teachers","Shortage in rural areas","Low pay","Refusal to work"],ans:1},{q:"How much more likely are secondary graduates to find work?",opts:["Twice","Four times","Three times","Five times"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy",passage:`Reading is arguably the single most important habit that a university student can cultivate. Research consistently demonstrates that students who read widely perform significantly better in examinations and produce higher quality written work. Reading expands vocabulary, sharpens comprehension skills, and develops the critical thinking that academic success demands.\n\nIn many African universities, access to books and academic journals remains severely limited. Physical libraries are often under-resourced, and the cost of purchasing textbooks places a heavy financial burden on students.\n\nA student who commits to reading for just thirty minutes each day can experience measurable improvement in academic performance within a single semester. The habit of reading is not a luxury — it is a fundamental necessity for anyone who aspires to academic excellence.`,glossary:[{w:"cultivate",d:"develop through regular effort"},{w:"comprehension",d:"ability to understand fully"},{w:"aspires",d:"has a strong desire to achieve something great"},{w:"measurable",d:"large enough to be noticed and evaluated"}],questions:[{q:"What does reading do for students?",opts:["Makes them popular","Improves exam performance and writing","Replaces lectures","Only helps with vocabulary"],ans:1},{q:"What financial challenge is mentioned?",opts:["Libraries cost too much to build","Students cannot afford textbooks","Professors charge for lists","Digital books are costly"],ans:1},{q:"What does reading 30 minutes a day lead to?",opts:["No difference","Measurable academic improvement","Only first-year help","Replaces studying"],ans:1}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature",passage:`Chinua Achebe is widely regarded as the father of modern African literature in English. His landmark novel, Things Fall Apart, published in 1958, tells the story of Okonkwo — a proud Igbo warrior whose life is disrupted by the arrival of European colonisers in Nigeria. The novel was groundbreaking because it presented African culture entirely from an African perspective.\n\nPrior to Achebe's work, Africa had largely been portrayed in European literature as a dark, primitive continent. Achebe set out to challenge this misrepresentation. He wrote in English but filled his prose with Igbo proverbs and oral traditions, creating a unique literary style.\n\nThings Fall Apart has been translated into more than fifty languages and is studied in universities across the world.`,glossary:[{w:"landmark",d:"marking a significant achievement"},{w:"groundbreaking",d:"new and very important; never done before"},{w:"misrepresentation",d:"a false or misleading description"},{w:"prose",d:"ordinary written language, not poetry"}],questions:[{q:"Why is Things Fall Apart groundbreaking?",opts:["First novel in Africa","Presented African culture from an African perspective","Written in Igbo","Longest African novel"],ans:1},{q:"How did Achebe incorporate African culture?",opts:["Refused English grammar","Translated from Igbo","Used Igbo proverbs and oral traditions","Only wrote about ceremonies"],ans:2},{q:"Into how many languages has it been translated?",opts:["Over 20","Over 30","Over 40","More than 50"],ans:3}]},
  {title:"Climate Change and Africa",topic:"Environment",passage:`Climate change poses one of the most serious threats to Africa's development, even though the continent contributes relatively little to global greenhouse gas emissions. Rising temperatures, unpredictable rainfall, and increasingly frequent extreme weather events are already disrupting agriculture and threatening food security.\n\nIn the Sahel region, prolonged droughts have made farming increasingly difficult. Millions who depend on rain-fed agriculture are being forced to migrate to cities, placing enormous pressure on urban infrastructure.\n\nAt the same time, Africa possesses extraordinary natural resources for a green energy transition. The continent receives more solar energy than any other region on Earth. Experts argue that with the right investment, Africa could become a global leader in renewable energy.`,glossary:[{w:"emissions",d:"gases released into the atmosphere"},{w:"livelihoods",d:"ways of earning money and supporting oneself"},{w:"transition",d:"process of changing from one state to another"},{w:"renewable",d:"naturally replenished; not permanently depleted"}],questions:[{q:"What does the passage say about Africa's contribution to climate change?",opts:["Biggest contributor","Very little contribution","No contribution","Not affected"],ans:1},{q:"What is happening in the Sahel?",opts:["Farmers are wealthy","Cities abandoned","Droughts forcing migration","New farms created"],ans:2},{q:"What natural advantage does Africa have for green energy?",opts:["Most wind","Largest coal","More solar than any region","Deepest ocean currents"],ans:2}]},
];

const MISTAKES=[
  {title:"'Make' vs 'Do'",french:"Faire une erreur / Faire ses devoirs",wrong:"I did a mistake and I must do an effort to improve.",correct:"I made a mistake and I must make an effort to improve.",rule:"Use MAKE for: mistakes, decisions, progress, noise, an effort. Use DO for: homework, exercises, work, research, one's best. These are fixed collocations — memorise them.",examples:[{w:"She did a good decision.",r:"She made a good decision."},{w:"He is doing progress.",r:"He is making progress."},{w:"Can you make this exercise?",r:"Can you do this exercise?"}]},
  {title:"'Since' vs 'For'",french:"J'étudie l'anglais depuis 3 ans",wrong:"I study English since 3 years.",correct:"I have been studying English for 3 years.",rule:"'Since' = a specific point in time (since 2021). 'For' = a duration (for 3 years). Both require the present perfect tense — NOT the present simple.",examples:[{w:"She lives here since 5 years.",r:"She has lived here for 5 years."},{w:"I wait since 2 o'clock.",r:"I have been waiting since 2 o'clock."}]},
  {title:"'Actually' ≠ 'Actuellement'",french:"Actuellement, je travaille à l'UPGC",wrong:"Actually, I am a student at UPGC right now.",correct:"Currently, I am a student at UPGC.",rule:"'Actually' means 'in fact' or 'to tell the truth'. For the French 'actuellement', use 'currently', 'at present', or 'at the moment'. This is a very common false friend!",examples:[{w:"Actually, the economy is growing.",r:"Currently, the economy is growing."},{w:"He actually studies medicine.",r:"He is currently studying medicine."}]},
  {title:"Double Negatives",french:"Je n'ai rien dit / Je ne connais personne",wrong:"I didn't say nothing. I don't know nobody.",correct:"I didn't say anything. I don't know anybody.",rule:"English does NOT allow double negatives. Use either 'not...anything' OR 'nothing' alone — never both together.",examples:[{w:"She doesn't know nothing.",r:"She doesn't know anything."},{w:"He never tells nobody.",r:"He never tells anybody."}]},
  {title:"'Assist' vs 'Attend'",french:"J'ai assisté au cours ce matin",wrong:"I assisted the lecture this morning.",correct:"I attended the lecture this morning.",rule:"'Assist' = to help someone. 'Attend' = to be present at an event. This is one of the most common false friends for French speakers in academic contexts.",examples:[{w:"She assisted the wedding.",r:"She attended the wedding."},{w:"All students must assist the orientation.",r:"All students must attend the orientation."}]},
  {title:"Uncountable Nouns",french:"Des informations / Des conseils",wrong:"She gave me some informations and advices.",correct:"She gave me some information and advice.",rule:"These nouns are uncountable in English — no plural -s: information, advice, furniture, equipment, luggage, news, research, knowledge, progress, feedback.",examples:[{w:"The news are bad.",r:"The news is bad."},{w:"Can you give me some advices?",r:"Can you give me some advice?"}]},
  {title:"Future Plans",french:"Je fais ça demain",wrong:"I study tomorrow instead of going out.",correct:"I am going to study tomorrow instead of going out.",rule:"For personal future plans, use 'going to' + base verb. Present simple is only for fixed schedules like timetables ('The train leaves at 9am').",examples:[{w:"She travels to Abidjan next week.",r:"She is going to travel to Abidjan next week."},{w:"I eat with my family tonight.",r:"I am going to eat with my family tonight."}]},
];

const QUIZ_SETS=[
  [{q:"Which sentence is correct?",opts:["She don't study.","She doesn't study.","She not study.","She studies not."],ans:1,exp:"Negative: subject + doesn't/don't + base verb."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts supporting an argument","An essay type"],ans:2,exp:"Evidence = facts or information that prove something true."},{q:"In PEEL, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link."},{q:"'She gave me some ___.' Correct:",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable — no plural, no 'a/an'."},{q:"'Actually' in English means:",opts:["Currently","In fact","Often","Always"],ans:1,exp:"'Actually' = 'in fact', not 'currently'. Use 'currently' for the French 'actuellement'."}],
  [{q:"'I ___ here since 2020.' Correct:",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect."},{q:"'Coherent' means:",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured, easy to understand."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct. Use 'do' for homework."},{q:"'Information' is:",opts:["Countable","Uncountable","Proper","Abstract only"],ans:1,exp:"'Information' is uncountable — say 'some information', never 'informations'."},{q:"Correct passive: 'The essay ___ by Friday.'",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle."}],
  [{q:"'Despite ___ tired, she studied.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing)."},{q:"'Fundamental' means:",opts:["Optional","Very difficult","Forming the essential base","Interesting"],ans:2,exp:"Fundamental = forming the foundation; of central importance."},{q:"'I assisted the conference.' Error:",opts:["'I' → 'We'","'assisted' → 'attended'","'conference' wrong","No error"],ans:1,exp:"'Assist' = help. 'Attend' = be present at an event."},{q:"Reported speech: 'I am preparing.' → She said she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech."},{q:"Academic synonym for 'show':",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' = the academic equivalent of 'show'."}],
  [{q:"Correct future plan:",opts:["I study tonight.","I am going to study tonight.","I will to study.","I studying tonight."],ans:1,exp:"Personal future plans: 'going to' + base verb."},{q:"'Relevant' means:",opts:["Very impressive","Directly connected to the topic","Out of date","Difficult"],ans:1,exp:"Relevant = directly connected and appropriate to the subject."},{q:"Correct use of 'for/since':",opts:["I've studied since two years.","I've studied for 2019.","I've studied for two years.","I study since two years."],ans:2,exp:"'For' + duration. 'Since' + point in time. Both need present perfect."},{q:"Purpose of 'Evidence' in PEEL:",opts:["Restate the point","Provide proof","Conclude the essay","Introduce a new topic"],ans:1,exp:"Evidence provides concrete proof — stats, quotes, real examples."},{q:"'She ___ before the deadline.' Best option:",opts:["submits","submitted","had submitted","submitting"],ans:1,exp:"Past simple for a completed action at a specific past time."}],
];

const PEEL_TOPICS=[
  {title:"Technology in Education",prompt:"Should technology be used more widely in African universities?",guidance:{point:"State your main position clearly in 1-2 sentences.",explanation:"Explain WHY — give at least 2 specific, well-developed reasons.",evidence:"Include a statistic or research finding with a named source.",link:"Connect back to the question about African universities."},example:{point:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",explanation:"With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace, reinforcing difficult content outside the classroom.",evidence:"According to a UNESCO report (2022), students who regularly use digital learning tools score on average 35% higher on standardised assessments.",link:"Given this evidence, increasing technological integration in African universities is an urgent educational priority that would directly improve outcomes and prepare graduates for a digital economy."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",guidance:{point:"State your position clearly — agree or disagree.",explanation:"Give 2-3 well-developed reasons — economic, social, cultural.",evidence:"Include a specific statistic or real-world example.",link:"Connect to national development or global equality."},example:{point:"Boys and girls must have completely equal access to education if African nations are to achieve their full economic and social potential.",explanation:"When girls are denied education, communities lose half their intellectual potential. Educated women invest more in their children's health and schooling, creating a positive generational cycle of development.",evidence:"The World Bank (2021) reported that every additional year a girl spends in education can increase her future earnings by up to 10%.",link:"For these reasons, gender equality in education is not simply a moral question — it is a strategic economic investment whose returns benefit entire communities."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",guidance:{point:"Take a clear position — do not argue both sides equally.",explanation:"Give 2-3 specific, concrete ways social media affects students.",evidence:"Use a specific study or statistic with a named source.",link:"Return directly to the question about university students."},example:{point:"For the majority of university students, social media causes significantly more harm than good.",explanation:"Students who spend excessive time on platforms like TikTok and Instagram report difficulty concentrating, as the constant stimulation undermines the sustained focus that academic reading requires.",evidence:"A study from Harvard University (2020) found that students spending more than 3 hours daily on social media had GPAs 20% lower than those who limited usage to under one hour.",link:"While social media offers some networking benefits, the evidence clearly shows its negative impact on academic performance makes it far more harmful than helpful for university students."}},
  {title:"English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students today.",guidance:{point:"State clearly why English is essential for Ivorian students.",explanation:"Think about careers, research access, global communication.",evidence:"Use a fact or statistic related to English in Africa.",link:"Connect to what Ivorian students should do as a result."},example:{point:"Mastering English has become an essential skill for Ivorian students who wish to compete in today's globalised professional environment.",explanation:"English is the dominant language of international business, scientific research, and global communication. Graduates who lack English proficiency are immediately at a competitive disadvantage when applying for international scholarships or multinational positions.",evidence:"The African Development Bank estimates that English proficiency can increase an African graduate's starting salary by as much as 25% compared to monolingual peers.",link:"For these compelling reasons, Ivorian students should treat English not as an optional requirement, but as one of the most strategic investments in their professional future."}},
];

const PEEL_THEORY={
  what:"PEEL is a method for writing clear, well-structured academic paragraphs. Each letter stands for one essential part.",
  why:"Without a clear structure, even good ideas fail to convince the reader. PEEL ensures every paragraph has a purpose, develops an argument, provides proof, and connects back to the essay question.",
  parts:[
    {letter:"P",name:"Point",color:"#e3f2fd",icon:"📌",role:"Your opening sentence. State your main argument clearly and directly.",do:"Start with a strong, confident statement. Avoid 'I think' in formal writing.",dont:"Do not begin with a question or a quote. Get straight to the point."},
    {letter:"E",name:"Explanation",color:"#e8f5e9",icon:"💬",role:"Develop your point by explaining WHY it is true. Give 2-3 logical reasons.",do:"Use linking words: 'Furthermore', 'In addition', 'This means that'.",dont:"Do not simply repeat your Point. Every sentence must add new reasoning."},
    {letter:"E",name:"Evidence",color:"#fff3e0",icon:"📚",role:"Provide concrete proof — a statistic, a study, a real example, or an expert quote.",do:"Introduce evidence: 'According to...', 'A study by... found that...'. Be specific.",dont:"Never use vague 'studies show' without naming the study."},
    {letter:"L",name:"Link",color:"#fce4ec",icon:"🔗",role:"Close the paragraph by connecting your argument back to the essay question.",do:"Use: 'Therefore...', 'This demonstrates that...', 'It is clear that...'",dont:"Do not introduce new arguments in the Link. Synthesise and reconnect."},
  ],
  bad:{
    topic:"Should technology be used more in African universities?",
    para:"Technology is good for students. Many students use phones. The internet has a lot of information. Students can find things easily. So technology is important.",
    notes:[
      {part:"Point",text:"Technology is good for students.",issue:"❌ Too vague. 'Good' is not academic vocabulary. Good in what way?"},
      {part:"Explanation",text:"Many students use phones. The internet has information.",issue:"❌ Three unconnected observations. No logical development, no linking words."},
      {part:"Evidence",text:"(No evidence provided)",issue:"❌ No evidence at all. This makes the argument unconvincing and unacademic."},
      {part:"Link",text:"So technology is important.",issue:"❌ Too brief. Doesn't connect to African universities. 'So' is too informal."},
    ]
  },
  good:{
    topic:"Should technology be used more in African universities?",
    para:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning. With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace. According to UNESCO (2022), students who regularly use digital learning tools score 35% higher on standardised assessments. Given this compelling evidence, increasing technological integration in African universities is an urgent academic priority that would directly improve educational outcomes.",
    notes:[
      {part:"Point",text:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",issue:"✅ Clear, specific, directly addresses the question. Uses 'because' to signal reasoning."},
      {part:"Explanation",text:"With smartphones and reliable internet, students can access thousands of academic journals. Furthermore, digital tools allow students to learn at their own pace.",issue:"✅ Two well-developed reasons, logically connected with 'Furthermore'."},
      {part:"Evidence",text:"According to UNESCO (2022), students who regularly use digital learning tools score 35% higher on standardised assessments.",issue:"✅ Specific, credible, properly introduced. Names the source and year with a precise statistic."},
      {part:"Link",text:"Given this compelling evidence, increasing technological integration in African universities is an urgent academic priority.",issue:"✅ Directly reconnects to the question. Uses 'Given this compelling evidence' to synthesise."},
    ]
  }
};

const SCORE_CRITERIA=[
  {id:"point",    label:"Clarity & Precision (Point)",       max:4},
  {id:"expl",     label:"Logical Development (Explanation)", max:4},
  {id:"evidence", label:"Quality of Evidence",               max:4},
  {id:"link",     label:"Cohesion & Link",                   max:3},
  {id:"grammar",  label:"Grammar & Vocabulary",              max:3},
  {id:"length",   label:"Length & Development",              max:2},
];

/* ══ PLACEMENT ══ */
const PLACEMENT=[
  {s:"Grammar",   q:"'She ___ to school every day.'",       opts:["go","goes","going","gone"],ans:1},
  {s:"Grammar",   q:"Error: 'The informations are here.'",  opts:["The","informations","are","here"],ans:1},
  {s:"Grammar",   q:"'If I ___ rich, I would travel.'",     opts:["am","was","were","be"],ans:2},
  {s:"Grammar",   q:"Correct sentence:",                    opts:["She don't like coffee.","She doesn't likes it.","She doesn't like coffee.","She not like coffee."],ans:2},
  {s:"Grammar",   q:"'Despite ___ tired, he finished.'",    opts:["be","being","been","to be"],ans:1},
  {s:"Vocabulary",q:"'Analyse' means:",                     opts:["To ignore","To study carefully","To write","To memorise"],ans:1},
  {s:"Vocabulary",q:"'Her essay was very ___.' (organised)", opts:["confusing","coherent","boring","long"],ans:1},
  {s:"Vocabulary",q:"'Evidence' means:",                    opts:["A feeling","A guess","Facts supporting an argument","A question"],ans:2},
  {s:"Vocabulary",q:"FALSE FRIEND for French speakers:",    opts:["Book","Actually","Table","School"],ans:1},
  {s:"Vocabulary",q:"'The study requires ___ data.'",       opts:["emotional","empirical","fictional","random"],ans:1},
  {s:"Reading",   q:"Why did Okonkwo work hard?",           opts:["To be rich","To travel","To overcome his father's failures","To win a prize"],ans:2},
  {s:"Reading",   q:"'Education was the light…' — device?", opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {s:"Reading",   q:"'Jaja's face was expressionless, hand shook.' Suggests:",opts:["Happy","Calm","Hiding emotions","Cold"],ans:2},
  {s:"Reading",   q:"A 'glossary' is:",                     opts:["Questions list","Word definitions","Summary","Bibliography"],ans:1},
  {s:"Reading",   q:"'Concluded' means:",                   opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
];

/* ══ UI ══ */
const Btn=({onClick,children,full,secondary,disabled,style={},color="#2D6A4F"})=>(
  <button onClick={onClick} disabled={disabled} style={{width:full?"100%":"auto",background:secondary?"transparent":color,color:secondary?color:"#fff",border:secondary?`2px solid ${color}`:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,marginTop:8,fontFamily:"inherit",...style}}>{children}</button>
);
const Card=({children,style={}})=>(
  <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px #0001",...style}}>{children}</div>
);
const Spin=({G=G0})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:16}}>
    <div style={{width:40,height:40,border:`4px solid #d8f3dc`,borderTop:`4px solid ${G}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ══ ERROR BOUNDARY ══ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:32,textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
          <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
          <h2 style={{color:"#c62828",marginBottom:8}}>Une erreur s'est produite</h2>
          <p style={{color:"#555",fontSize:14,marginBottom:16}}>{this.state.error?.message}</p>
          <button onClick={()=>window.location.reload()} style={{background:G0,color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Recharger</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ══ PLACEMENT TEST ══ */
function Placement({onDone}){
  const [i,setI]=useState(0);
  const [sel,setSel]=useState(null);
  const [conf,setConf]=useState(false);
  const [scores,setScores]=useState({Grammar:0,Vocabulary:0,Reading:0});
  const q=PLACEMENT[i];
  const secs=["Grammar","Vocabulary","Reading"];
  const icons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const cols={Grammar:"#e3f2fd",Vocabulary:"#fff3e0",Reading:"#f3e5f5"};
  const si=secs.indexOf(q.s);
  const confirm=()=>{if(sel===null)return;if(sel===q.ans)setScores(s=>({...s,[q.s]:s[q.s]+1}));setConf(true);};
  const next=()=>{
    if(i<PLACEMENT.length-1){setI(p=>p+1);setSel(null);setConf(false);}
    else{const fs={...scores};if(sel===q.ans)fs[q.s]++;const tot=fs.Grammar+fs.Vocabulary+fs.Reading;onDone({level:tot>=11?"Advanced":tot>=6?"Intermediate":"Beginner",scores:fs,total:tot});}
  };
  return(
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:20,paddingTop:16}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:DK0,margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Q {i+1}/15</span><span style={{color:G0,fontWeight:700}}>{Math.round((i/15)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}><div style={{background:G0,height:8,borderRadius:99,width:`${(i/15)*100}%`,transition:"width .4s"}}/></div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {secs.map((s,ix)=>(
              <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:ix<si?G0:ix===si?"#81c784":"#e0e0e0"}}/>
                <span style={{fontSize:11,color:ix<=si?G0:"#bbb",fontWeight:ix===si?700:400}}>{icons[s]} {s}</span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{marginBottom:14}}>
          <div style={{background:cols[q.s],borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:DK0}}>{icons[q.s]} {q.s}</span>
          </div>
          <p style={{fontWeight:600,color:DK0,fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p>
        </Card>
        {q.opts.map((o,oi)=>{
          const isC=oi===q.ans,isP=oi===sel;
          let bg="#fff",br="#e0e0e0";
          if(conf){if(isP&&isC){bg="#e8f5e9";br=G0}else if(isP&&!isC){bg="#ffebee";br="#e53935"}}
          else if(isP){bg=LT0;br=G0}
          return <button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
            {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
          </button>;
        })}
        {!conf
          ?<Btn full disabled={sel===null} onClick={confirm} color={G0}>Confirm Answer</Btn>
          :<Btn full onClick={next} color={G0}>{i<14?"Next →":"See My Level 🎯"}</Btn>}
      </div>
    </div>
  );
}

function LevelResult({result,onContinue}){
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Your content will focus on essential grammar, core vocabulary, and accessible reading.",Intermediate:"Your content will challenge you with more complex grammar and academic vocabulary.",Advanced:"Your content will develop your academic writing and critical reading skills."};
  return(
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <Card style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:64,marginBottom:8}}>{icons[result.level]}</div>
          <h2 style={{color:G0,fontSize:24,margin:"0 0 4px"}}>Your Level:</h2>
          <div style={{background:LT0,borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 12px"}}>
            <span style={{fontSize:22,fontWeight:900,color:DK0}}>{result.level}</span>
          </div>
          <p style={{color:"#555",fontSize:14,lineHeight:1.7}}>{descs[result.level]}</p>
        </Card>
        <Card style={{marginBottom:16}}>
          <h4 style={{color:DK0,margin:"0 0 12px"}}>📊 Your Scores</h4>
          {Object.entries(result.scores).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:DK0}}>{k}</span>
                <span style={{color:G0,fontWeight:700}}>{v}/5</span>
              </div>
              <div style={{background:"#e8f5e9",borderRadius:99,height:8}}>
                <div style={{background:G0,height:8,borderRadius:99,width:`${(v/5)*100}%`,transition:"width .6s"}}/>
              </div>
            </div>
          ))}
          <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,color:DK0}}>Total</span>
            <span style={{color:G0,fontWeight:800}}>{result.total}/15</span>
          </div>
        </Card>
        <Btn full onClick={onContinue} color={G0}>Start Learning →</Btn>
      </div>
    </div>
  );
}

/* ══ AUTH ══ */
function Landing({go}){
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1b4332 0%,#2D6A4F 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:60,marginBottom:10}}>✍️</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 6px"}}>WriteUP UPGC</h1>
      <p style={{opacity:.85,fontSize:15,marginBottom:4}}>Academic English for L2 Students</p>
      <p style={{opacity:.6,fontSize:12,marginBottom:36}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:40}}>
        <button onClick={()=>go("login")} style={{background:"#fff",color:G0,border:"none",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Log In</button>
        <button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid #fff",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Sign Up</button>
      </div>
      <div style={{display:"flex",gap:20,opacity:.7,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>
        {["🌐 PWA","🆓 Free","🎯 Level Test","📚 Rich Content","💾 Cloud Save"].map(t=><span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

function AuthForm({mode,onDone,onSwitch}){
  const [f,setF]=useState({name:"",email:"",pw:""});
  const [loading,setL]=useState(false);
  const [err,setErr]=useState("");
  const upd=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{
    if(!f.email||!f.pw)return setErr("Please fill all fields.");
    if(mode==="register"&&!f.name)return setErr("Please enter your name.");
    setL(true);setErr("");
    try{
      if(mode==="register"){
        const res=await authUp(f.email,f.pw);
        if(res.error){setErr(res.error.message||"Registration failed.");setL(false);return;}
        const uid=res.user?.id;
        if(uid){
          await sbPost("users",{id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",placement_done:false,last_login:today()},res.access_token);
          onDone({id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:true,token:res.access_token});
        }
      }else{
        const res=await authIn(f.email,f.pw);
        if(res.error){setErr("Invalid email or password.");setL(false);return;}
        const uid=res.user?.id,token=res.access_token;
        const rows=await sbGet(`users?id=eq.${uid}`,token);
        const p=rows?.[0];
        if(p){
          const diff=Math.floor((new Date()-new Date(p.last_login))/(1000*60*60*24));
          const ns=diff===1?p.streak+1:diff>1?1:p.streak;
          await sbPatch(`users?id=eq.${uid}`,{last_login:today(),streak:ns},token);
          onDone({...p,streak:ns,isNew:!p.placement_done,token});
        }else setErr("Profile not found. Please sign up.");
      }
    }catch{setErr("Connection error. Please try again.");}
    setL(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:G0,margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register"&&<input placeholder="Full name" value={f.name} onChange={upd("name")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>}
        <input placeholder="Email" type="email" value={f.email} onChange={upd("email")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <input placeholder="Password (min. 6 chars)" type="password" value={f.pw} onChange={upd("pw")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        {err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        {loading?<Spin/>:<Btn full onClick={submit} color={G0}>{mode==="login"?"Log In":"Register & Take Placement Test"}</Btn>}
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="login"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:G0,cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span>
        </p>
      </Card>
    </div>
  );
}

/* ══ AI FEEDBACK — appel direct API Anthropic ══ */
const callAI = async (prompt) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "VOTRE_CLE_API_ANTHROPIC_ICI",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-calls": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || "";
};

/* ══ MAIN APP ══ */
const MODS=[
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",    sub:"Random exercise every session",     color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",   sub:"Random word every session",         color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Guided Writing",    sub:"PEEL paragraph + AI feedback",      color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",      sub:"Random passage every session",      color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes",  sub:"Random error lesson every session", color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",        sub:"5 random questions every session",  color:"#fff8e1"},
];
const BADGES=[
  {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
  {icon:"🔥",name:"Streak 7",      desc:"Log in 7 days in a row"},
  {icon:"📐",name:"Grammar Master",desc:"Complete 30 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 30 vocabulary words"},
  {icon:"🍃",name:"PEEL Expert",   desc:"Submit 5 PEEL paragraphs"},
  {icon:"🌍",name:"African Reader",desc:"Complete 10 reading passages"},
];

export default function App(){
  const [screen,setScreen]   =useState("landing");
  const [user,setUser]       =useState(null);
  const [token,setToken]     =useState(null);
  const [placement,setPlace] =useState(null);
  const [tab,setTab]         =useState("home");
  const [activeMod,setMod]   =useState(null);
  const [xp,setXp]           =useState(0);
  const [streak,setStreak]   =useState(1);
  const [done,setDone]       =useState([]);
  const [badges,setBadges]   =useState([]);
  const [enc,setEnc]         =useState(null);
  const [theme,setTheme]     =useState(()=>{
    try {
      return THEMES[lsGet("writeup_theme","default")] || THEMES.default;
    } catch {
      return THEMES.default;
    }
  });
  const G=theme.primary,LT=theme.light,DK=theme.dark;

  useEffect(()=>{
    const handle=()=>{
      if(enc){setEnc(null);window.history.pushState({},"");return;}
      if(activeMod){setMod(null);loadDone(user?.id,token);window.history.pushState({},"");return;}
      if(tab!=="home"){setTab("home");window.history.pushState({},"");return;}
    };
    window.history.pushState({},"");
    window.addEventListener("popstate",handle);
    return()=>window.removeEventListener("popstate",handle);
  },[activeMod,tab,enc,user,token]);

  useEffect(()=>{
    if(!user?.id||!token)return;
    const nl=xp>=1500?"Advanced":xp>=500?"Intermediate":"Beginner";
    if(placement?.level!==nl){setPlace(p=>({...p,level:nl}));sbPatch(`users?id=eq.${user.id}`,{level:nl,current_level:nl},token);}
  },[xp]);

  const loadDone=async(uid,tk)=>{
    try{const d=await sbGet(`daily_progress?user_id=eq.${uid}&date=eq.${today()}&completed=eq.true&select=module`,tk);setDone(Array.isArray(d)?d.map(x=>x.module):[]);}catch{}
  };
  const loadBadges=async(uid,tk)=>{
    try{const d=await sbGet(`user_badges?user_id=eq.${uid}&select=badge_name`,tk);setBadges(Array.isArray(d)?d.map(x=>x.badge_name):[]);}catch{}
  };
  const afterAuth=async u=>{
    setUser(u);setToken(u.token);setXp(u.xp||0);setStreak(u.streak||1);
    if(u.isNew)setScreen("placement");
    else{setPlace({level:u.level||"Beginner"});await loadDone(u.id,u.token);await loadBadges(u.id,u.token);setScreen("app");}
  };
  const afterPlacement=async result=>{
    setPlace(result);
    if(user?.id){await sbPatch(`users?id=eq.${user.id}`,{level:result.level,placement_done:true},token);}
    setScreen("result");
  };
  const awardBadge=async name=>{
    if(badges.includes(name)||!user?.id)return;
    try{await sbPost("user_badges",{user_id:user.id,badge_name:name},token);}catch{}
    setBadges(p=>[...p,name]);
  };
  const addXp=async(n,modId,extra={})=>{
    if(done.includes(modId)){setEnc(rnd(ENCOURAGE));return;}
    const pts=XP_MOD[modId]||n;
    const nx=xp+pts;
    setXp(nx);setDone(p=>[...p,modId]);
    if(user?.id){
      try{
        await sbUpsert("daily_progress",{user_id:user.id,date:today(),module:modId,completed:true,xp_earned:pts},token);
        await sbPatch(`users?id=eq.${user.id}`,{xp:nx},token);
        if(modId==="peel")awardBadge("First Write");
        if(streak>=7)awardBadge("Streak 7");
      }catch(e){console.error(e);}
    }
  };

  if(screen==="landing")   return <Landing go={setScreen}/>;
  if(screen==="login")     return <AuthForm mode="login"    onDone={afterAuth} onSwitch={()=>setScreen("register")}/>;
  if(screen==="register")  return <AuthForm mode="register" onDone={afterAuth} onSwitch={()=>setScreen("login")}/>;
  if(screen==="placement") return <Placement onDone={afterPlacement}/>;
  if(screen==="result")    return <LevelResult result={placement} onContinue={()=>{loadDone(user?.id,token);setScreen("app");}}/>;

  const lvl=getLvl(xp);
  const pct=Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100);
  const level=placement?.level||"Beginner";

  return(
    <ErrorBoundary>
    <div style={{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:"#f0f7f4",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>
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
      <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
        {activeMod
          ?<ModShell mod={activeMod} level={level} addXp={addXp} G={G} LT={LT} DK={DK} onBack={()=>{setMod(null);loadDone(user?.id,token);}}/>
          :tab==="home"   ?<Home setMod={setMod} xp={xp} lvl={lvl} pct={pct} level={level} done={done} G={G} LT={LT} DK={DK}/>
          :tab==="profile"?<Profile user={user} xp={xp} lvl={lvl} level={level} badges={badges} streak={streak} G={G} LT={LT} DK={DK}/>
          :tab==="board"  ?<Board userId={user?.id} myXp={xp} token={token} G={G} LT={LT} DK={DK}/>
          :<Settings user={user} xp={xp} placement={placement} G={G} LT={LT} DK={DK}
              onThemeChange={t=>{setTheme(t);lsSet("writeup_theme",Object.keys(THEMES).find(k=>THEMES[k]===t)||"default");}}
              onLogout={()=>{setScreen("landing");setUser(null);setToken(null);}}/>
        }
      </div>
      {enc&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setEnc(null)}>
          <div style={{background:"#fff",borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:64,marginBottom:12}}>🌟</div>
            <h3 style={{color:G,margin:"0 0 8px"}}>{enc.title}</h3>
            <p style={{color:"#555",fontSize:14,lineHeight:1.7,margin:"0 0 8px"}}>{enc.body}</p>
            <p style={{color:"#888",fontSize:13,fontStyle:"italic",margin:"0 0 20px"}}>{enc.sub}</p>
            <button onClick={()=>setEnc(null)} style={{background:G,color:"#fff",border:"none",borderRadius:12,padding:"12px 32px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Keep Practising! 💪</button>
          </div>
        </div>
      )}
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
    </ErrorBoundary>
  );
}

/* ══ HOME ══ */
function Home({setMod,xp,lvl,pct,level,done,G,LT,DK}){
  const next=UNLOCKS.find(u=>u.xp>xp);
  const prev=[...UNLOCKS].reverse().find(u=>u.xp<=xp);
  return(
    <div style={{padding:18}}>
      <Card style={{marginBottom:14,background:`linear-gradient(135deg,${DK},${G})`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📅 {today()}</div>
        <div style={{fontWeight:800,fontSize:16,marginBottom:2}}>{done.length>=MODS.length?"🎉 All done today!":"Today's Activities"}</div>
        <div style={{fontSize:12,opacity:.75}}>{done.length}/{MODS.length} completed · {level}</div>
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {MODS.map(m=><div key={m.id} style={{width:28,height:28,borderRadius:"50%",background:done.includes(m.id)?"#fff":"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{done.includes(m.id)?m.icon:"·"}</div>)}
        </div>
      </Card>
      <Card style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
          <span style={{fontWeight:700,color:G}}>{lvl.name} · {level}</span>
          <span style={{color:"#888"}}>{xp}/{lvl.next} XP</span>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:99,height:10}}><div style={{background:G,height:10,borderRadius:99,width:`${pct}%`,transition:"width .5s"}}/></div>
        <p style={{color:"#888",fontSize:12,marginTop:6}}>{lvl.next-xp} XP to next level</p>
      </Card>
      {next&&(
        <Card style={{marginBottom:14,background:"#fff8e1",borderLeft:"3px solid #f9a825"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#e65100",fontWeight:700,marginBottom:2}}>🔓 Next — {next.xp} XP</div>
              <div style={{fontWeight:700,color:DK,fontSize:13}}>{next.icon} {next.label}</div>
              <div style={{fontSize:12,color:"#666"}}>{next.desc}</div>
            </div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"#e65100",fontSize:16}}>{next.xp-xp}</div><div style={{fontSize:10,color:"#888"}}>XP away</div></div>
          </div>
          <div style={{background:"#ffe082",borderRadius:99,height:6,marginTop:8}}>
            <div style={{background:"#f9a825",height:6,borderRadius:99,width:`${Math.min(100,Math.round(((xp-(prev?.xp||0))/(next.xp-(prev?.xp||0)))*100))}%`,transition:"width .5s"}}/>
          </div>
        </Card>
      )}
      {MODS.map(m=>(
        <button key={m.id} onClick={()=>setMod(m)} style={{width:"100%",background:"#fff",border:`1.5px solid ${LT}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px #0001",textAlign:"left",marginBottom:10}}>
          <div style={{background:m.color,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:DK,fontSize:14}}>{m.name}</div>
            <div style={{color:"#888",fontSize:12,marginTop:2}}>{m.sub}</div>
          </div>
          {done.includes(m.id)
            ?<span style={{background:"#e8f5e9",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700}}>✅ Done</span>
            :<span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>+{XP_MOD[m.id]} XP</span>}
        </button>
      ))}
    </div>
  );
}

/* ══ MOD SHELL ══ */
function ModShell({mod,level,addXp,onBack,G,LT,DK}){
  return(
    <div style={{padding:18}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div>
        <div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div>
      </div>
      {mod.id==="grammar"    &&<GrammarMod    addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="vocabulary" &&<VocabMod      addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="peel"       &&<PeelMod       addXp={addXp} onBack={onBack} level={level} G={G} LT={LT} DK={DK}/>}
      {mod.id==="reading"    &&<ReadingMod    addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="mistakes"   &&<MistakesMod   addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="quiz"       &&<QuizMod       addXp={addXp} onBack={onBack} G={G} LT={LT} DK={DK}/>}
    </div>
  );
}

function Done({xp,onBack,earn,G}){
  useEffect(()=>{if(earn)earn();},[]);
  return(
    <div style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#666"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p>
      <p style={{color:"#888",fontSize:13}}>Progress saved ✅</p>
      <Btn full onClick={onBack} color={G}>← Back to Modules</Btn>
    </div>
  );
}

/* ══ GRAMMAR ══ */
function GrammarMod({addXp,onBack,G,LT,DK}){
  const [c]=useState(()=>rnd(GRAMMAR));
  const [sel,setSel]=useState(null);
  const [done,setDone]=useState(false);
  const [t0]=useState(()=>Date.now());
  const conf=sel!==null,correct=sel===c.ans;
  if(done)return<Done xp={XP_MOD.grammar} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.grammar,"grammar",{module:"grammar",score:correct?1:0,total:1,passed:correct,timeSec:Math.round((Date.now()-t0)/1000),title:c.title})}/>;
  return(
    <div>
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:12,color:"#888"}}>📚 Topic</div>
        <div style={{fontWeight:800,color:DK,fontSize:16}}>{c.title}</div>
        <div style={{fontSize:13,color:"#555",marginTop:4}}>{c.instruction}</div>
      </Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.question}</p></Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G}else if(isP&&!isC){bg="#ffebee";br="#e53935"}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825"}}
        else if(isP){bg=LT;br=G}
        return<button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.explanation}</p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct
          ?<Btn full onClick={()=>setDone(true)} color={G}>Earn +{XP_MOD.grammar} XP →</Btn>
          :<Btn full secondary onClick={onBack} color={G}>← Try another exercise</Btn>}
      </>}
    </div>
  );
}

/* ══ VOCABULARY ══ */
function VocabMod({addXp,onBack,G,LT,DK}){
  const [c]=useState(()=>rnd(VOCAB));
  const [phase,setPhase]=useState("learn");
  const [sel,setSel]=useState(null);
  const [done,setDone]=useState(false);
  const [t0]=useState(()=>Date.now());
  const conf=sel!==null,correct=sel===c.ans;
  if(done)return<Done xp={XP_MOD.vocabulary} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.vocabulary,"vocabulary",{module:"vocabulary",score:correct?1:0,total:1,passed:correct,timeSec:Math.round((Date.now()-t0)/1000),title:c.word})}/>;
  if(phase==="learn")return(
    <div>
      <Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:6}}>📚 Word to Learn</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><h2 style={{color:G,margin:"0 0 2px",fontSize:26}}>{c.word}</h2><div style={{color:"#999",fontSize:12}}>{c.phonetic} · <em>{c.pos}</em></div></div>
          <span style={{background:"#fff3e0",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.french}</span>
        </div>
        <div style={{background:"#f9fbe7",borderRadius:10,padding:12,marginTop:12}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>📖 Definition</div>
          <p style={{color:"#333",fontSize:14,margin:0,lineHeight:1.7}}>{c.def}</p>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:10,padding:12,marginTop:10}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>🧠 Memory Tip</div>
          <p style={{color:DK,fontSize:13,margin:0,lineHeight:1.6}}>{c.tip}</p>
        </div>
      </Card>
      <Btn full onClick={()=>setPhase("practice")} color={G}>Practice this word →</Btn>
    </div>
  );
  return(
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.ex}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G}else if(isP&&!isC){bg="#ffebee";br="#e53935"}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825"}}
        else if(isP){bg=LT;br=G}
        return<button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}
          </p>
        </Card>
        {correct
          ?<Btn full onClick={()=>setDone(true)} color={G}>Earn +{XP_MOD.vocabulary} XP →</Btn>
          :<Btn full secondary onClick={onBack} color={G}>← Try another word</Btn>}
      </>}
    </div>
  );
}

/* ══ PEEL ══ */
function PeelMod({addXp,onBack,level,G,LT,DK}){
  const [phase,setPhase]=useState("theory");
  const [c]=useState(()=>rnd(PEEL_TOPICS));
  const [tTab,setTTab]=useState(0);
  const [step,setStep]=useState(0);
  const [vals,setVals]=useState({point:"",explanation:"",evidence:"",link:""});
  const [fb,setFb]=useState(null);
  const [aiL,setAiL]=useState(false);
  const [aiErr,setAiErr]=useState("");
  const [attempts,setAtt]=useState(0);
  const [t0]=useState(()=>Date.now());
  const keys=["point","explanation","evidence","link"];
  const labels=["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minW=WORD_MIN[level]||WORD_MIN.Beginner;

  const getAI=async(isRev=false)=>{
    setAiL(true);
    setAiErr("");
    try{
      const prompt=`You are a strict but fair English writing examiner for ${level} university students in Côte d'Ivoire (French speakers). Attempt ${attempts+1}.${isRev?" Student revised based on previous feedback.":""}

TOPIC: "${c.prompt}"
Point: ${vals.point}
Explanation: ${vals.explanation}
Evidence: ${vals.evidence}
Link: ${vals.link}

CRITICAL: Start your response with EXACTLY this block (replace numbers with real scores):

SCORES_START
POINT_SCORE:3
EXPLANATION_SCORE:3
EVIDENCE_SCORE:2
LINK_SCORE:2
GRAMMAR_SCORE:2
LENGTH_SCORE:1
TOTAL_SCORE:13
SCORES_END

Scoring:
- POINT (0-4): Clear, specific, directly answers the question?
- EXPLANATION (0-4): Logical development with linking words?
- EVIDENCE (0-4): Specific, credible, named source + statistic?
- LINK (0-3): Reconnects to question without new ideas?
- GRAMMAR (0-3): Grammar accuracy and academic vocabulary?
- LENGTH (0-2): Meets minimums? P=${minW.point}w E=${minW.explanation}w Ev=${minW.evidence}w L=${minW.link}w

Then write detailed feedback:

## Overall Assessment
[2-3 honest sentences. State the total score and what it reflects.]

## Point — [score]/4
[Feedback]

## Explanation — [score]/4
[Feedback]

## Evidence — [score]/4
[Feedback]

## Link — [score]/3
[Feedback]

## Grammar & Vocabulary — [score]/3
[Feedback]

## Length — [score]/2
[Feedback]

## Priority Actions
1. [Critical action]
2. [Second action]
3. [Third action]

## Encouragement
[1-2 warm sentences]`;

      const text = await callAI(prompt);

      let sc={point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0};
      const block=text.match(/SCORES_START([\s\S]*?)SCORES_END/);
      if(block){
        const s=block[1];
        const ex=k=>{const m=s.match(new RegExp(k+":(\\d+)"));return m?parseInt(m[1]):0;};
        sc.point   =Math.min(4,ex("POINT_SCORE"));
        sc.expl    =Math.min(4,ex("EXPLANATION_SCORE"));
        sc.evidence=Math.min(4,ex("EVIDENCE_SCORE"));
        sc.link    =Math.min(3,ex("LINK_SCORE"));
        sc.grammar =Math.min(3,ex("GRAMMAR_SCORE"));
        sc.length  =Math.min(2,ex("LENGTH_SCORE"));
        sc.total   =sc.point+sc.expl+sc.evidence+sc.link+sc.grammar+sc.length;
      }
      let fbText=text;
      const idx=text.indexOf("SCORES_END");
      if(idx>-1)fbText=text.slice(idx+"SCORES_END".length).trim();
      setFb({text:fbText,sc,passed:sc.total>=10});
      setAtt(a=>a+1);
      setPhase("feedback");
    }catch(e){
      console.error(e);
      setAiErr("Erreur de connexion à l'IA. Vérifiez votre clé API dans le fichier (callAI) et réessayez. Détail : " + e.message);
    }
    setAiL(false);
  };

  const renderFb=text=>{
    if(!text)return null;
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("##"))return<h4 key={i} style={{color:G,margin:"16px 0 8px",fontSize:14,borderBottom:`1px solid ${LT}`,paddingBottom:4}}>{line.replace(/^#+\s*/,"")}</h4>;
      if(!line.trim())return<div key={i} style={{height:4}}/>;
      return<p key={i} style={{margin:"4px 0",fontSize:13,color:"#333",lineHeight:1.7}}>{line}</p>;
    });
  };

  if(phase==="theory")return(
    <div>
      <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
        <div style={{fontSize:11,opacity:.8,marginBottom:4}}>📚 Before you write · Level: {level}</div>
        <h3 style={{margin:"0 0 6px",fontSize:18}}>Understanding PEEL</h3>
        <p style={{margin:0,fontSize:13,opacity:.85,lineHeight:1.6}}>{PEEL_THEORY.what}</p>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {["What & Why","P — Point","E — Explanation","E — Evidence","L — Link"].map((t,ix)=>(
          <button key={ix} onClick={()=>setTTab(ix)} style={{background:tTab===ix?G:"#fff",color:tTab===ix?"#fff":DK,border:`1.5px solid ${tTab===ix?G:"#ddd"}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{t}</button>
        ))}
      </div>
      {tTab===0&&<div>
        <Card style={{marginBottom:12}}><h4 style={{color:G,margin:"0 0 8px"}}>What is PEEL?</h4><p style={{fontSize:14,color:"#333",lineHeight:1.8,margin:0}}>{PEEL_THEORY.what}</p></Card>
        <Card style={{marginBottom:12}}><h4 style={{color:G,margin:"0 0 8px"}}>Why use PEEL?</h4><p style={{fontSize:14,color:"#333",lineHeight:1.8,margin:0}}>{PEEL_THEORY.why}</p></Card>
        <Card style={{background:"#fff8e1",marginBottom:12}}>
          <h4 style={{color:"#e65100",margin:"0 0 10px"}}>The 4 Parts</h4>
          {PEEL_THEORY.parts.map(p=>(
            <div key={p.name} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
              <div style={{background:p.color,borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{p.icon}</div>
              <div><div style={{fontWeight:700,color:DK,fontSize:14}}>{p.letter} — {p.name}</div><div style={{fontSize:12,color:"#666",lineHeight:1.5}}>{p.role}</div></div>
            </div>
          ))}
        </Card>
        <Card style={{background:LT,marginBottom:12}}>
          <h4 style={{color:G,margin:"0 0 8px"}}>Word Minimums · {level}</h4>
          {keys.map(k=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #c8e6c9"}}>
              <span style={{fontWeight:600,color:DK,textTransform:"capitalize"}}>{k}</span>
              <span style={{color:G,fontWeight:700}}>min {minW[k]} words</span>
            </div>
          ))}
        </Card>
      </div>}
      {tTab>0&&tTab<5&&(()=>{
        const p=PEEL_THEORY.parts[tTab-1];
        return<div>
          <Card style={{background:p.color,marginBottom:12,borderLeft:`4px solid ${G}`}}>
            <div style={{fontSize:32,marginBottom:6}}>{p.icon}</div>
            <h3 style={{color:DK,margin:"0 0 6px"}}>{p.letter} — {p.name}</h3>
            <p style={{fontSize:14,color:"#444",lineHeight:1.8,margin:0}}>{p.role}</p>
          </Card>
          <Card style={{background:"#e8f5e9",marginBottom:12}}><div style={{fontWeight:700,color:G,marginBottom:8,fontSize:13}}>DO</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.do}</p></Card>
          <Card style={{background:"#ffebee",marginBottom:12}}><div style={{fontWeight:700,color:"#c62828",marginBottom:8,fontSize:13}}>DON'T</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.dont}</p></Card>
        </div>;
      })()}
      <div style={{display:"flex",gap:10,marginTop:4}}>
        {tTab>0&&<Btn secondary onClick={()=>setTTab(t=>t-1)} color={G}>← Previous</Btn>}
        {tTab<4?<Btn full onClick={()=>setTTab(t=>t+1)} color={G}>Next →</Btn>:<Btn full onClick={()=>setPhase("bad")} color={G}>See Examples →</Btn>}
      </div>
    </div>
  );

  if(phase==="bad")return(
    <div>
      <Card style={{background:"#ffebee",marginBottom:14,borderLeft:"4px solid #e53935"}}>
        <div style={{fontWeight:800,color:"#c62828",fontSize:16,marginBottom:4}}>Weak Paragraph</div>
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>Topic: {PEEL_THEORY.bad.topic}</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.8,fontStyle:"italic",background:"#fff",borderRadius:10,padding:12,margin:0}}>{PEEL_THEORY.bad.para}</p>
      </Card>
      <h4 style={{color:DK,marginBottom:10}}>Why is this weak?</h4>
      {PEEL_THEORY.bad.notes.map((n,i)=>(
        <Card key={i} style={{marginBottom:10,borderLeft:"3px solid #e53935"}}>
          <div style={{fontWeight:700,color:"#c62828",fontSize:12,marginBottom:6}}>{n.part}</div>
          {n.text&&<p style={{fontSize:13,color:"#333",fontStyle:"italic",margin:"0 0 6px",background:"#fff9f9",padding:"6px 10px",borderRadius:8}}>"{n.text}"</p>}
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{n.issue}</p>
        </Card>
      ))}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <Btn secondary onClick={()=>setPhase("theory")} color={G}>← Theory</Btn>
        <Btn full onClick={()=>setPhase("good")} color={G}>See Good Example →</Btn>
      </div>
    </div>
  );

  if(phase==="good")return(
    <div>
      <Card style={{background:"#e8f5e9",marginBottom:14,borderLeft:`4px solid ${G}`}}>
        <div style={{fontWeight:800,color:G,fontSize:16,marginBottom:4}}>Strong Paragraph</div>
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>Topic: {PEEL_THEORY.good.topic}</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.9,background:"#fff",borderRadius:10,padding:12,margin:0}}>{PEEL_THEORY.good.para}</p>
      </Card>
      <h4 style={{color:DK,marginBottom:10}}>Why is this strong?</h4>
      {PEEL_THEORY.good.notes.map((n,i)=>(
        <Card key={i} style={{marginBottom:10,borderLeft:`3px solid ${G}`}}>
          <div style={{fontWeight:700,color:G,fontSize:12,marginBottom:6}}>{n.part}</div>
          <p style={{fontSize:13,color:"#333",fontStyle:"italic",margin:"0 0 6px",background:"#f9fbe7",padding:"6px 10px",borderRadius:8}}>"{n.text}"</p>
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{n.issue}</p>
        </Card>
      ))}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <Btn secondary onClick={()=>setPhase("bad")} color={G}>← Bad Example</Btn>
        <Btn full onClick={()=>setPhase("write")} color={G}>Write My Paragraph →</Btn>
      </div>
    </div>
  );

  if(phase==="write")return(
    <div>
      {attempts>0&&<Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>Revision #{attempts} — Apply the feedback carefully.</p></Card>}
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888"}}>Topic · {level}</div>
        <div style={{fontWeight:800,color:DK,fontSize:15,marginTop:2}}>{c.title}</div>
        <div style={{color:"#555",fontSize:13,marginTop:4,lineHeight:1.6}}>{c.prompt}</div>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {keys.map((k,ix)=>(
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div style={{height:6,borderRadius:99,background:vals[k]&&wc(vals[k])>=minW[k]?G:vals[k]?"#f57c00":ix===step?"#81c784":"#e0e0e0",marginBottom:4,transition:"background .3s"}}/>
            <div style={{fontSize:10,color:ix<=step?G:"#bbb",fontWeight:ix===step?800:400}}>{k.charAt(0).toUpperCase()}</div>
          </div>
        ))}
      </div>
      {(()=>{
        const p=PEEL_THEORY.parts[step];
        return<div>
          <Card style={{background:p.color,marginBottom:10,borderLeft:`4px solid ${G}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div><div style={{fontSize:12,color:"#666",marginTop:4,lineHeight:1.5}}>{p.role}</div></div>
              <div style={{background:G,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0,textAlign:"center"}}>min {minW[keys[step]]}<br/>words</div>
            </div>
            <div style={{marginTop:8,fontSize:12,color:"#555"}}><strong>DO:</strong> {p.do}</div>
          </Card>
          <Card style={{background:"#f0f7f4",marginBottom:10}}>
            <div style={{fontSize:11,color:"#888",marginBottom:4}}>Model:</div>
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
              <div style={{fontSize:11,color:"#888",marginBottom:4}}>Your {keys[step-1]}:</div>
              <p style={{fontSize:12,color:"#555",margin:0,lineHeight:1.6,fontStyle:"italic"}}>"{vals[keys[step-1]]}"</p>
            </Card>
          )}
          {aiErr&&<Card style={{background:"#ffebee",marginBottom:10,borderLeft:"3px solid #e53935"}}><p style={{margin:0,fontSize:13,color:"#c62828"}}>{aiErr}</p></Card>}
          <button onClick={()=>{if(step<3)setStep(s=>s+1);else getAI(attempts>0);}}
            disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiL}
            style={{width:"100%",background:!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiL?"#ccc":G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:aiL||!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]?"not-allowed":"pointer",marginTop:8,fontFamily:"inherit"}}>
            {aiL?"Analysing your paragraph…":step<3?`Next: ${labels[step+1]} →`:"Submit for Assessment"}
          </button>
        </div>;
      })()}
    </div>
  );

  if(phase==="feedback"&&fb)return(
    <div>
      <Card style={{background:`linear-gradient(135deg,${fb.sc.total>=15?DK:fb.sc.total>=10?"#e65100":"#c62828"},${fb.sc.total>=15?G:fb.sc.total>=10?"#ff9800":"#e53935"})`,color:"#fff",marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:13,opacity:.85,marginBottom:4}}>Attempt #{attempts} · {fb.passed?"PASSED":"REVISION REQUIRED"}</div>
        <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{fb.sc.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div>
        <div style={{fontSize:14,fontWeight:700,opacity:.9}}>
          {fb.sc.total>=17?"Excellent":fb.sc.total>=14?"Good":fb.sc.total>=10?"Passed":"Below Average"}
        </div>
        {!fb.passed&&<div style={{fontSize:12,opacity:.85,marginTop:6,background:"rgba(0,0,0,.2)",borderRadius:8,padding:"6px 12px"}}>You need 10/20 to pass. Read the feedback carefully, revise, and resubmit.</div>}
      </Card>
      <Card style={{marginBottom:14}}>
        <h4 style={{color:DK,margin:"0 0 12px"}}>Score Breakdown</h4>
        {SCORE_CRITERIA.map(cr=>{
          const s=fb.sc[cr.id]||0,pct=Math.round((s/cr.max)*100);
          return<div key={cr.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
              <span style={{fontWeight:600,color:DK}}>{cr.label}</span>
              <span style={{color:pct>=75?G:pct>=50?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span>
            </div>
            <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
              <div style={{background:pct>=75?G:pct>=50?"#f57c00":"#e53935",height:8,borderRadius:99,width:`${pct}%`,transition:"width .6s"}}/>
            </div>
          </div>;
        })}
      </Card>
      <Card style={{marginBottom:14}}>
        <h4 style={{color:G,marginBottom:12}}>Detailed Analysis</h4>
        <div>{renderFb(fb.text)}</div>
      </Card>
      <Card style={{background:"#f9fbe7",marginBottom:14}}>
        <h5 style={{color:DK,margin:"0 0 12px"}}>Your Paragraph</h5>
        {keys.map(k=>(
          <div key={k} style={{marginBottom:12,paddingBottom:12,borderBottom:k!=="link"?"1px solid #eee":"none"}}>
            <div style={{fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{k}</div>
            <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.7}}>{vals[k]}</p>
          </div>
        ))}
      </Card>
      {fb.passed
        ?<div>
          <Card style={{background:LT,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:36,marginBottom:4}}>🎉</div>
            <p style={{color:G,fontWeight:700,margin:0}}>Passed with {fb.sc.total}/20!</p>
            <p style={{color:"#555",fontSize:13,margin:"4px 0 0"}}>+{XP_MOD.peel} XP earned!</p>
          </Card>
          <Btn full color={G} onClick={()=>addXp(XP_MOD.peel,"peel",{module:"peel",score:fb.sc.total,total:20,passed:true,timeSec:Math.round((Date.now()-t0)/1000),title:c.title})}>
            Claim +{XP_MOD.peel} XP & Continue →
          </Btn>
        </div>
        :<div>
          <Card style={{background:"#fff3e0",marginBottom:14,borderLeft:"3px solid #f57c00"}}>
            <h5 style={{color:"#e65100",margin:"0 0 8px"}}>What to do:</h5>
            <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.8}}>1. Read every highlighted sentence.<br/>2. Read each Problem and Fix.<br/>3. Rewrite applying all corrections.<br/>4. Resubmit — you need 10/20 to pass.</p>
          </Card>
          <Btn full color={G} onClick={()=>{setPhase("write");setStep(0);}}>Revise My Paragraph →</Btn>
        </div>
      }
    </div>
  );
  return<Spin G={G}/>;
}

/* ══ READING ══ */
function ReadingMod({addXp,onBack,G,LT,DK}){
  const [c]=useState(()=>rnd(READING));
  const [phase,setPhase]=useState("read");
  const [ans,setAns]=useState([null,null,null]);
  const [checked,setChecked]=useState(false);
  const [done,setDone]=useState(false);
  const [t0]=useState(()=>Date.now());
  const score=ans.filter((a,i)=>a===c.questions[i]?.ans).length;
  if(done)return<Done xp={XP_MOD.reading} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.reading,"reading",{module:"reading",score,total:3,passed:score>=2,timeSec:Math.round((Date.now()-t0)/1000),title:c.title})}/>;
  if(phase==="read")return(
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>{c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        {c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <div style={{fontWeight:700,color:"#e65100",marginBottom:10,fontSize:13}}>Glossary</div>
        {c.glossary.map(g=><div key={g.w} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}><strong style={{color:DK,minWidth:110,flexShrink:0}}>{g.w}</strong><span style={{color:"#555",lineHeight:1.5}}>{g.d}</span></div>)}
      </Card>
      <Btn full onClick={()=>setPhase("quiz")} color={G}>Answer Questions →</Btn>
    </div>
  );
  return(
    <div>
      <h4 style={{color:DK,marginBottom:14}}>Comprehension Questions</h4>
      {c.questions.map((q,qi)=>(
        <Card key={qi} style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10,lineHeight:1.6}}>{qi+1}. {q.q}</p>
          {q.opts.map((o,oi)=>{
            const isC=oi===q.ans,isP=oi===ans[qi];
            let bg="#f9f9f9",br="#e0e0e0";
            if(checked){if(isP&&isC){bg="#e8f5e9";br=G}else if(isP&&!isC){bg="#ffebee";br="#e53935"}else if(!isP&&isC){bg="#fff9c4";br="#f9a825"}}
            else if(isP){bg=LT;br=G}
            return<button key={oi} onClick={()=>{if(!checked)setAns(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${br}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":checked&&!isP&&isC?"💡 ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ?<button onClick={()=>setChecked(true)} disabled={ans.includes(null)} style={{width:"100%",background:ans.includes(null)?"#ccc":G,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:14,cursor:ans.includes(null)?"not-allowed":"pointer",marginTop:8,fontFamily:"inherit"}}>Check Answers</button>
        :<div>
          <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
            <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong>
          </Card>
          <Btn full onClick={()=>setDone(true)} color={G}>Earn +{XP_MOD.reading} XP</Btn>
        </div>}
    </div>
  );
}

/* ══ MISTAKES ══ */
function MistakesMod({addXp,onBack,G,LT,DK}){
  const [c]=useState(()=>rnd(MISTAKES));
  const [done,setDone]=useState(false);
  const [t0]=useState(()=>Date.now());
  if(done)return<Done xp={XP_MOD.mistakes} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.mistakes,"mistakes",{module:"mistakes",score:1,total:1,passed:true,timeSec:Math.round((Date.now()-t0)/1000),title:c.title})}/>;
  return(
    <div>
      <Card style={{borderLeft:"4px solid #ff9800",marginBottom:14}}>
        <span style={{background:"#fff3e0",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.title}</span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
          <span style={{fontSize:18}}>🇫🇷</span>
          <span style={{fontSize:13,color:"#666",fontStyle:"italic",lineHeight:1.5}}>French: <strong>{c.french}</strong></span>
        </div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:8}}>Common Error</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong}"</p></Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>Correct English</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.correct}"</p></Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}><div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:8}}>Rule</div><p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p></Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>More Examples</div>
        {c.examples.map((e,i)=>(
          <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<c.examples.length-1?"1px solid #f0f0f0":"none"}}>
            <div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.w}</div>
            <div style={{fontSize:13,color:G}}>✅ {e.r}</div>
          </div>
        ))}
      </Card>
      <Btn full onClick={()=>setDone(true)} color={G}>Got it! Earn +{XP_MOD.mistakes} XP</Btn>
    </div>
  );
}

/* ══ QUIZ ══ */
function QuizMod({addXp,onBack,G,LT,DK}){
  const [qs]=useState(()=>rnd(QUIZ_SETS));
  const [i,setI]=useState(0);
  const [sel,setSel]=useState(null);
  const [score,setScore]=useState(0);
  const [review,setReview]=useState(false);
  const [done,setDone]=useState(false);
  const [t0]=useState(()=>Date.now());
  const q=qs[i],conf=sel!==null,correct=sel===q?.ans;
  if(done)return<Done xp={score*6} onBack={onBack} G={G} earn={()=>addXp(score*6,"quiz",{module:"quiz",score,total:qs.length,passed:score>=3,timeSec:Math.round((Date.now()-t0)/1000),title:"Daily Quiz"})}/>;
  if(review)return(
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#666",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
        <p style={{color:"#888",fontSize:13}}>{score>=4?"Excellent!":score>=2?"Good effort — keep practising!":"Review lessons and try again!"}</p>
      </Card>
      {score>0
        ?<Btn full color={G} onClick={()=>setDone(true)}>Claim +{score*6} XP →</Btn>
        :<Btn full secondary color={G} onClick={onBack}>← No XP earned — Try again tomorrow</Btn>}
    </div>
  );
  const next=()=>{if(i<qs.length-1){setI(p=>p+1);setSel(null);}else setReview(true);};
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}>
        <span>Q {i+1}/{qs.length}</span>
        <span style={{color:G,fontWeight:700}}>Score: {score}/{i+(conf?1:0)}</span>
      </div>
      <div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}>
        <div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const isC=oi===q.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G}else if(isP&&!isC){bg="#ffebee";br="#e53935"}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825"}}
        else if(isP){bg=LT;br=G}
        return<button key={oi} onClick={()=>{if(!conf){setSel(oi);if(oi===q.ans)setScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p>
        </Card>
        <Btn full color={G} onClick={next}>{i<qs.length-1?"Next →":"See Results"}</Btn>
      </>}
    </div>
  );
}

/* ══ PROFILE ══ */
function Profile({user,xp,lvl,level,badges,streak,G,LT,DK}){
  return(
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
      <h3 style={{color:DK,marginBottom:12}}>Badges</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {BADGES.map(b=>{
          const earned=badges.includes(b.name);
          return<div key={b.name} style={{background:earned?"#fff":"#f5f5f5",borderRadius:14,padding:14,opacity:earned?1:.55,boxShadow:earned?"0 2px 8px #0002":"none"}}>
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
function Board({userId,myXp,token,G,LT,DK}){
  const [lb,setLb]=useState([]);
  const [loading,setL]=useState(true);
  const [myRank,setRank]=useState(null);
  const [lastRef,setRef]=useState(null);
  const fetch_=async()=>{
    try{
      const d=await sbGet("public_leaderboard?limit=10",token);
      if(Array.isArray(d)){
        const upd=d.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp);
        setLb(upd);
        const all=await sbGet("public_leaderboard?limit=50",token);
        if(Array.isArray(all)){
          const allU=all.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp);
          const r=allU.findIndex(u=>u.id===userId)+1;
          setRank(r>0?r:null);
        }
      }
    }catch{}
    setL(false);setRef(new Date());
  };
  useEffect(()=>{fetch_();const iv=setInterval(fetch_,30000);return()=>clearInterval(iv);},[myXp]);
  const medals=["🥇","🥈","🥉"];
  const lc={Bronze:"#cd7f32",Silver:"#9e9e9e",Gold:"#ffd700",Platinum:"#4fc3f7",Beginner:"#81c784",Intermediate:"#42a5f5",Advanced:"#ab47bc"};
  return(
    <div style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h3 style={{color:DK,margin:"0 0 4px"}}>Leaderboard</h3>
          <p style={{color:"#888",fontSize:12,margin:0}}>{lastRef?`Updated ${lastRef.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:""}</p>
        </div>
        <button onClick={fetch_} style={{background:LT,border:"none",borderRadius:10,padding:"6px 12px",color:G,fontWeight:700,fontSize:12,cursor:"pointer"}}>Refresh</button>
      </div>
      {myRank&&myRank>10&&(
        <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
          <div style={{fontSize:12,opacity:.8,marginBottom:4}}>Your Rank</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:32,fontWeight:900}}>#{myRank}</div>
            <div><div style={{fontWeight:700}}>Keep going!</div><div style={{fontSize:12,opacity:.8}}>⭐ {myXp} XP</div></div>
          </div>
        </Card>
      )}
      {loading&&<Spin G={G}/>}
      {!loading&&lb.length===0&&<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>🏆</div><p style={{color:"#888"}}>No students yet.</p></Card>}
      {lb.slice(0,10).map((l,ix)=>{
        const isMe=l.id===userId,rank=ix+1;
        return<div key={l.id} style={{background:isMe?LT:"#fff",border:isMe?`2px solid ${G}`:"1px solid #eee",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:10,boxShadow:rank<=3?"0 2px 12px #0002":"none"}}>
          <div style={{width:36,textAlign:"center",flexShrink:0}}>
            {rank<=3?<span style={{fontSize:24}}>{medals[ix]}</span>:<span style={{fontSize:14,fontWeight:800,color:"#bbb"}}>#{rank}</span>}
          </div>
          <div style={{width:36,height:36,borderRadius:"50%",background:isMe?G:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:isMe?"#fff":"#999"}}>{l.name?.charAt(0)?.toUpperCase()||"?"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:isMe?800:600,color:isMe?G:DK,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}{isMe?" (You)":""}</div>
            <div style={{display:"flex",gap:6,marginTop:3}}>
              {l.level&&<span style={{fontSize:10,fontWeight:700,color:lc[l.level]||"#888"}}>{l.level}</span>}
              {l.streak>0&&<span style={{fontSize:11,color:"#888"}}>🔥{l.streak}</span>}
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:800,color:G,fontSize:15}}>⭐{isMe?myXp:l.xp}</div>
            {l.peel_avg_score>0&&<div style={{fontSize:10,color:"#aaa"}}>PEEL:{l.peel_avg_score}/20</div>}
          </div>
        </div>;
      })}
      {!loading&&lb.length>0&&(
        <Card style={{background:"#f9fbe7",marginTop:8}}>
          <div style={{fontSize:12,color:"#888",marginBottom:8}}>Stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Students",lb.length],["Top XP",`${lb[0]?.xp||0} XP`],["Your Rank",myRank?`#${myRank}`:"—"],["Your XP",`${myXp} XP`]].map(([l,v])=>(
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
function Settings({user,xp,placement,onThemeChange,onLogout,G,LT,DK}){
  const [notifPerm,setNP]=useState(typeof Notification!=="undefined"?Notification.permission:"default");
  const [notifTime,setNT]=useState(lsGet("writeup_notif_time","08:00"));
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [offSt,setOff]=useState("checking");
  const [caching,setCaching]=useState(false);
  const [activeTheme,setAT]=useState(lsGet("writeup_theme","default"));
  const [swReg,setSW]=useState(null);

  useEffect(()=>{
    regSW().then(r=>setSW(r));
    isOffline().then(r=>setOff(r?"ready":"not_cached"));
  },[]);

  const enableNotif=async()=>{
    const p=await reqNotif();setNP(p);
    if(p==="granted"){lsSet("writeup_notif_enabled","true");showNotif("Enabled!","Daily reminder set for "+notifTime);}
  };
  const saveNotif=()=>{
    setSaving(true);
    if(Notification?.permission==="granted"){lsSet("writeup_notif_time",notifTime);}
    setTimeout(()=>{setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);},500);
  };
  const doCache=async()=>{
    setCaching(true);
    try{
      for(let i=0;i<GRAMMAR.length;i++)await dbSet(`g${i}`,GRAMMAR[i]);
      for(let i=0;i<VOCAB.length;i++)await dbSet(`v${i}`,VOCAB[i]);
      for(let i=0;i<MISTAKES.length;i++)await dbSet(`m${i}`,MISTAKES[i]);
      await dbSet("ready",true);
      setOff("ready");
      showNotif("Cached!","Grammar, Vocabulary & Mistakes available offline.");
    }catch{alert("Could not cache. Try again.");}
    setCaching(false);
  };
  const doTheme=k=>{setAT(k);lsSet("writeup_theme",k);onThemeChange(THEMES[k]);};
  const doCert=()=>{
    const url=makeCert(user?.name||"Student",placement?.level||"Beginner",xp,new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}));
    const a=document.createElement("a");a.href=url;a.download=`WriteUP_Certificate_${(user?.name||"Student").replace(/\s+/g,"_")}.png`;a.click();
  };
  const lvl=getLvl(xp);
  const canForest=xp>=200,canOcean=xp>=1000,canCert=xp>=2000;

  return(
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>Settings</h3>
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
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>Visual Themes</div>
        {[{k:"default",name:"Default Green",locked:false,req:0},{k:"forest",name:"Dark Forest",locked:!canForest,req:200},{k:"ocean",name:"Ocean Blue",locked:!canOcean,req:1000}].map(t=>(
          <div key={t.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"10px 12px",borderRadius:12,background:activeTheme===t.k?"#e8f5e9":t.locked?"#f5f5f5":"#fff",border:activeTheme===t.k?`2px solid ${G}`:"1.5px solid #eee",opacity:t.locked?.6:1}}>
            <div>
              <div style={{fontWeight:700,color:DK,fontSize:13}}>{t.name}</div>
              {t.locked&&<div style={{fontSize:11,color:"#f57c00"}}>Unlock at {t.req} XP ({t.req-xp} more)</div>}
            </div>
            {!t.locked&&<button onClick={()=>doTheme(t.k)} style={{background:activeTheme===t.k?G:"#e0e0e0",color:activeTheme===t.k?"#fff":"#555",border:"none",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{activeTheme===t.k?"Active":"Apply"}</button>}
          </div>
        ))}
      </Card>
      <Card style={{marginBottom:14,background:canCert?"#f9fbe7":"#f5f5f5",opacity:canCert?1:.7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,color:DK,fontSize:15}}>Certificate</div>
            <div style={{fontSize:12,color:"#888",marginTop:3}}>{canCert?"Download your official certificate":"Unlock at 2000 XP — "+String(2000-xp)+" more needed"}</div>
          </div>
          {canCert&&<button onClick={doCert} style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Download</button>}
        </div>
        {!canCert&&<div style={{background:"#ffe082",borderRadius:99,height:6,marginTop:10}}><div style={{background:"#f9a825",height:6,borderRadius:99,width:`${Math.min(100,Math.round((xp/2000)*100))}%`,transition:"width .5s"}}/></div>}
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:6}}>Offline Mode</div>
        <div style={{fontSize:12,color:"#888",marginBottom:12}}>Cache Grammar, Vocabulary & Mistakes for use without internet.</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:offSt==="ready"?"#4caf50":offSt==="checking"?"#ff9800":"#bbb"}}/>
          <span style={{fontSize:13,color:"#555",fontWeight:600}}>{offSt==="ready"?"Cached & Ready":offSt==="checking"?"Checking…":"Not cached yet"}</span>
        </div>
        <button onClick={doCache} disabled={caching||offSt==="ready"}
          style={{width:"100%",background:offSt==="ready"?"#e8f5e9":G,color:offSt==="ready"?G:"#fff",border:offSt==="ready"?`1.5px solid ${G}`:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:14,cursor:caching||offSt==="ready"?"default":"pointer",fontFamily:"inherit",opacity:caching?.7:1}}>
          {caching?"Caching…":offSt==="ready"?"Already cached":"Cache for Offline Use"}
        </button>
        {offSt==="ready"&&<button onClick={async()=>{await dbSet("ready",false);setOff("not_cached");}} style={{width:"100%",background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",marginTop:6,fontFamily:"inherit"}}>Clear cache</button>}
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontWeight:700,color:DK,fontSize:15}}>Notifications</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{notifPerm==="granted"?"Enabled":notifPerm==="denied"?"Blocked":"Not yet enabled"}</div>
          </div>
          {notifPerm!=="granted"&&notifPerm!=="denied"&&<button onClick={enableNotif} style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Enable</button>}
        </div>
        {notifPerm==="granted"&&<>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:DK,marginBottom:6}}>Daily reminder time</div>
            <input type="time" value={notifTime} onChange={e=>setNT(e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${G}`,borderRadius:10,padding:"10px 14px",fontSize:15,outline:"none",fontFamily:"inherit",color:DK}}/>
          </div>
          <button onClick={saveNotif} style={{width:"100%",background:saved?"#e8f5e9":G,color:saved?G:"#fff",border:saved?`1.5px solid ${G}`:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}>
            {saving?"Saving…":saved?"Saved!":"Save Settings"}
          </button>
        </>}
      </Card>
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14}}>Privacy</div>
        <div style={{fontSize:12,color:"#888",marginTop:4}}>ARTCI compliance n°2013-450 · Secured by Supabase</div>
      </Card>
      <button onClick={onLogout} style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log Out</button>
    </div>
  );
}
