import { useState, useEffect } from "react";

const THEMES = {
  default: { G:"#2D6A4F", LT:"#d8f3dc", DK:"#1b4332" },
  forest:  { G:"#1a3a2a", LT:"#c8e6c9", DK:"#0d1f17" },
  ocean:   { G:"#1565c0", LT:"#bbdefb", DK:"#0d47a1" },
};
const SB  = "https://qnxeyoxashvbljjmqkrp.supabase.co";
const KEY = "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";
const h = t=>({ "Content-Type":"application/json","apikey":KEY,"Authorization":`Bearer ${t||KEY}`,"Prefer":"return=representation" });
const get    = (p,t)   => fetch(`${SB}/rest/v1/${p}`,{headers:h(t)}).then(r=>r.json()).catch(()=>[]);
const post   = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:h(t),body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const patch  = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"PATCH",headers:{...h(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const upsert = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:{...h(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const signUp = (e,p) => fetch(`${SB}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const signIn = (e,p) => fetch(`${SB}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

const dateStr = () => new Date().toISOString().slice(0,10);
const rnd     = a  => a[Math.floor(Math.random()*a.length)];
const wc      = s  => (s||"").trim().split(/\s+/).filter(Boolean).length;
const getLvl  = xp => {
  if(xp<500)  return {name:"Bronze",  color:"#cd7f32",min:0,   next:500};
  if(xp<1500) return {name:"Silver",  color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",    color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const genCode = () => `UPGC-${new Date().getFullYear()}-${String(Math.floor(1000+Math.random()*9000))}`;
const XP_MAP  = {grammar:5,vocabulary:5,reading:20,mistakes:10,quiz:10,peel:50};
const WMIN    = {
  Beginner:     {point:10,explanation:20,evidence:10,link:10},
  Intermediate: {point:15,explanation:40,evidence:20,link:15},
  Advanced:     {point:25,explanation:60,evidence:25,link:20},
};
const UNLOCKS = [
  {xp:100, icon:"📝",label:"Advanced PEEL Topics",     desc:"4 challenging writing topics"},
  {xp:200, icon:"🌲",label:"Dark Forest Theme",         desc:"Deep green visual theme"},
  {xp:500, icon:"🌿",label:"Intermediate Level",        desc:"Auto-promotion"},
  {xp:1000,icon:"🌊",label:"Ocean Blue Theme",          desc:"Blue ocean visual theme"},
  {xp:1500,icon:"🌳",label:"Advanced Level",            desc:"Auto-promotion"},
  {xp:2000,icon:"🏆",label:"Certificate of Achievement",desc:"Download official PDF"},
];
const ENC = [
  {title:"🔥 Already done today!", body:"XP already earned for this module. Come back tomorrow!", sub:"Extra practice = extra mastery."},
  {title:"💪 Great dedication!",   body:"No XP today — you already earned it! Every session builds skills.", sub:"Consistency is the key."},
];
const ADMIN_PIN = "UPGC2025";
const ADMIN_EMAIL = "admin@upgc.ci";

/* ─── GITHUB CONTENT LOADER ──────────────────────────── */
const GH_BASE = "https://raw.githubusercontent.com/Amoskouassi/writeup-upgc/main/src/content";
const contentCache = {};

const parseJSExports = (code) => {
  const result = {};
  // Match: export const NAME = [...]  or  export const NAME = {...}
  const re = /export\s+const\s+(\w+)\s*=\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*;/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    try {
      // eslint-disable-next-line no-new-func
      result[m[1]] = new Function(`return ${m[2]}`)();
    } catch(e) { console.warn("Parse error for", m[1], e); }
  }
  return result;
};

const loadLevelContent = async (level) => {
  const key = level.toLowerCase();
  if (contentCache[key]) return contentCache[key];
  try {
    const res = await fetch(`${GH_BASE}/${key}.js`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const code = await res.text();
    const parsed = parseJSExports(code);
    contentCache[key] = parsed;
    return parsed;
  } catch(e) {
    console.warn(`Failed to load ${level} content from GitHub:`, e);
    return null;
  }
};
const PRETEST_SUBJECT = {
  prompt:"Describe a challenge you have faced as a student and explain how you overcame it.",
  instructions:"Write a well-organised paragraph of at least 80 words. Use clear and precise English. Your response will be reviewed and corrected by a teacher.",
  minWords:80,
};

/* ─── PEEL SCORING (sans longueur) ──────────────────── */
// POINT(5) + EXPLANATION(5) + EVIDENCE(5) + LINK(3) + GRAMMAR(2) = 20
const PEEL_SCORE_PROMPT = `Scoring criteria (Total = 20 points, NO length criterion):
- POINT: 0-5 (clarity and strength of the argument)
- EXPLANATION: 0-5 (logical development, reasoning depth)
- EVIDENCE: 0-5 (quality, specificity, source citation)
- LINK: 0-3 (connection back to the question)
- GRAMMAR: 0-2 (accuracy, vocabulary range)
Do NOT score or mention length or word count. Focus only on quality.`;

/* ─── EXPORT WORD ────────────────────────────────────── */
const escRTF = s => (s||"").replace(/\\/g,"\\\\").replace(/\{/g,"\\{").replace(/\}/g,"\\}").replace(/\n/g,"\\par ");
const toRTF = rows => {
  let b = `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n{\\colortbl;\\red43\\green106\\blue79;\\red27\\green67\\blue50;}\n\\f0\\fs24\n`;
  b += `{\\pard\\qc\\b\\fs32 WriteUP UPGC — Writing Pretest\\b0\\par}\\par\n`;
  b += `{\\pard\\qc\\fs20 Exported: ${new Date().toLocaleDateString("fr-FR")}\\par}\\par\\par\n`;
  rows.forEach((r,i) => {
    b += `{\\pard\\b\\cf1\\fs26 ${i+1}. ${escRTF(r.student_code)}\\b0\\cf0\\par}\n`;
    b += `{\\pard\\fs20 Level: {\\b ${escRTF(r.level)}} | Date: {\\b ${escRTF((r.submitted_at||"").slice(0,10))}} | Status: {\\b ${r.status==="corrected"?"Corrected":"Pending"}}\\par}\\par\n`;
    b += `{\\pard\\b\\fs22 Subject:\\b0\\par}{\\pard\\fs20\\i ${escRTF(PRETEST_SUBJECT.prompt)}\\i0\\par}\\par\n`;
    b += `{\\pard\\b\\fs22 Student Answer:\\b0\\par}{\\pard\\fs20 ${escRTF(r.writing_text)}\\par}\\par\n`;
    if(r.correction) b += `{\\pard\\b\\cf2\\fs22 Teacher Correction:\\b0\\cf0\\par}{\\pard\\fs20 ${escRTF(r.correction)}\\par}\\par\n`;
    b += `{\\pard\\brdrb\\brdrs\\brdrw10 \\par}\\par\n`;
  });
  return b + "}";
};
const exportWord = (rows, fname="pretest_submissions.doc") => {
  const blob = new Blob([toRTF(rows)], {type:"application/msword"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=fname; a.click(); URL.revokeObjectURL(url);
};

/* ─── CONTENT BANKS ──────────────────────────────────── */
const GRAMMAR_BANK = [
  {title:"Present Simple",q:"She ___ to the library every Tuesday.",opts:["go","goes","is going","has gone"],ans:1,exp:"Present simple for habits. 'Every Tuesday' signals a routine.",tip:"Use present simple for habits: always, every day, usually, never."},
  {title:"Uncountable Nouns",q:"Which sentence is correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,exp:"'Advice' is uncountable — no plural, no 'a/an'.",tip:"Uncountable: advice, information, furniture, equipment, news, progress."},
  {title:"Second Conditional",q:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,exp:"Second conditional = If + past simple + would + base verb.",tip:"If + past simple → would + base verb."},
  {title:"Relative Clauses",q:"The student ___ scored highest received a prize.",opts:["which","whose","who","whom"],ans:2,exp:"Use 'who' for people in relative clauses.",tip:"Who = people. Which = things. Whose = possession."},
  {title:"Articles A/An",q:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,exp:"'University' starts with a /j/ sound, so we use 'a', not 'an'.",tip:"Use 'an' before vowel SOUNDS: an hour. 'a' before consonant SOUNDS: a university."},
  {title:"Past Perfect",q:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,exp:"Past perfect = action completed BEFORE another past action.",tip:"Past perfect = had + past participle."},
  {title:"Passive Voice",q:"All assignments ___ before the end of the semester.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle.",tip:"Passive: subject + be + past participle."},
  {title:"Gerund vs Infinitive",q:"She avoided ___ the difficult questions.",opts:["to answer","answer","answering","answered"],ans:2,exp:"'Avoid' must always be followed by a gerund (-ing form).",tip:"+ gerund: avoid, enjoy, finish, suggest. + infinitive: want, need, decide, hope."},
  {title:"Subject-Verb Agreement",q:"Neither the students nor the teacher ___ aware of the change.",opts:["were","are","was","is"],ans:2,exp:"With 'neither...nor', the verb agrees with the NEAREST subject.",tip:"Neither...nor: verb agrees with the closest subject."},
  {title:"Reported Speech",q:"She said: 'I am preparing.' → She said that she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"In reported speech, present continuous → past continuous.",tip:"Backshift: am/is → was | will → would | can → could."},
  {title:"Prepositions",q:"She is very good ___ mathematics.",opts:["in","on","at","for"],ans:2,exp:"'Good at' a subject is a fixed expression.",tip:"Fixed: good at, bad at, interested in, responsible for, afraid of."},
  {title:"Present Perfect",q:"I ___ my homework, so I can go out now.",opts:["finish","finished","have finished","had finished"],ans:2,exp:"Present perfect = past action with a result in the present.",tip:"Present perfect = have/has + past participle."},
];

const VOCAB_BANK = [
  {word:"Analyse",ph:"/ˈæn.ə.laɪz/",fr:"Analyser",pos:"verb",def:"To examine something carefully in detail to understand it.",ex:"The students must ___ the poem before writing.",opts:["analyse","ignore","copy","avoid"],ans:0,tip:"Think 'ana' (apart) + 'lyse' (loosen). To analyse = break apart to understand."},
  {word:"Significant",ph:"/sɪɡˈnɪf.ɪ.kənt/",fr:"Significatif",pos:"adjective",def:"Important or large enough to have a noticeable effect.",ex:"There has been a ___ improvement in her writing.",opts:["significant","small","boring","strange"],ans:0,tip:"'Sign' is inside — something significant gives a sign that it matters."},
  {word:"Coherent",ph:"/kəʊˈhɪə.rənt/",fr:"Cohérent",pos:"adjective",def:"Logical, well-organised, and easy to understand.",ex:"A well-written essay must present a ___ argument.",opts:["emotional","coherent","confusing","short"],ans:1,tip:"'Co' (together) + 'here' (stick). Coherent ideas stick together logically."},
  {word:"Evidence",ph:"/ˈev.ɪ.dəns/",fr:"Preuve",pos:"noun",def:"Facts or information that show whether a claim is true.",ex:"Every argument must be supported by reliable ___.",opts:["opinion","evidence","feeling","title"],ans:1,tip:"'Evident' = easy to see. Evidence makes the truth visible."},
  {word:"Conclude",ph:"/kənˈkluːd/",fr:"Conclure",pos:"verb",def:"To decide something is true after considering all information.",ex:"Based on the findings, we can ___ that education reduces poverty.",opts:["begin","wonder","conclude","forget"],ans:2,tip:"'Con' + 'clude' (close). To conclude = close your thinking with a final decision."},
  {word:"Fundamental",ph:"/ˌfʌn.dəˈmen.təl/",fr:"Fondamental",pos:"adjective",def:"Forming the necessary base or core; essential.",ex:"Critical thinking is a ___ skill for all university students.",opts:["optional","fundamental","difficult","rare"],ans:1,tip:"'Fund' = foundation. Fundamental = what everything is built upon."},
  {word:"Illustrate",ph:"/ˈɪl.ə.streɪt/",fr:"Illustrer",pos:"verb",def:"To make something clearer by providing examples or evidence.",ex:"This graph will ___ how scores improved over three years.",opts:["hide","illustrate","remove","question"],ans:1,tip:"'Lustre' = light. To illustrate = shed light on an idea with an example."},
  {word:"Consequence",ph:"/ˈkɒn.sɪ.kwəns/",fr:"Conséquence",pos:"noun",def:"A result or effect of an action or decision.",ex:"Poor time management can have serious academic ___s.",opts:["reason","consequence","beginning","title"],ans:1,tip:"'Con' + 'sequence' — consequences follow in sequence after an action."},
  {word:"Emphasise",ph:"/ˈem.fə.saɪz/",fr:"Souligner",pos:"verb",def:"To show something is especially important or deserves attention.",ex:"The professor always ___ the importance of proofreading.",opts:["ignore","forget","emphasise","remove"],ans:2,tip:"'Em' + 'phase' = put in sharp focus."},
  {word:"Relevant",ph:"/ˈrel.ɪ.vənt/",fr:"Pertinent",pos:"adjective",def:"Closely connected or appropriate to the subject being discussed.",ex:"Make sure all evidence in your essay is ___ to your argument.",opts:["relevant","old","boring","random"],ans:0,tip:"'Relevant' shares a root with 'relate'. Relevant info relates to your topic."},
  {word:"Justify",ph:"/ˈdʒʌs.tɪ.faɪ/",fr:"Justifier",pos:"verb",def:"To show or prove that a statement or decision is reasonable.",ex:"You must ___ every claim in your essay with reliable evidence.",opts:["hide","justify","ignore","repeat"],ans:1,tip:"'Just' = fair/right. To justify = show that something is well-reasoned."},
  {word:"Approach",ph:"/əˈprəʊtʃ/",fr:"Approche",pos:"noun/verb",def:"A way of dealing with a situation or problem.",ex:"The researcher used a qualitative ___ to study writing habits.",opts:["problem","mistake","approach","question"],ans:2,tip:"Think of stepping closer to a solution — you approach it step by step."},
];

const READING_BANK = [
  {title:"Education and Development in Africa",topic:"Education",passage:"Education is widely recognised as one of the most powerful tools for sustainable development in Africa. Countries that invest seriously in schools and universities tend to experience stronger economic growth, lower poverty rates, and more stable governments. In Côte d'Ivoire, the government has significantly increased spending on education over the past decade, resulting in higher enrolment rates at both primary and secondary levels.\n\nHowever, significant challenges remain. A shortage of qualified teachers in rural areas, limited access to technology, and inadequate school infrastructure continue to hinder progress. Many students in remote regions must walk several kilometres each day simply to attend school.\n\nDespite these obstacles, research consistently shows the transformative power of education. Students who complete secondary school are three times more likely to find formal employment than those who drop out.",gloss:[{w:"sustainable",d:"able to continue long-term"},{w:"enrolment",d:"officially registering in a school"},{w:"infrastructure",d:"basic physical structures for society"},{w:"transformative",d:"causing a major positive change"}],qs:[{q:"What do countries investing in education experience?",opts:["More problems","Stronger growth and lower poverty","Fewer teachers","Less spending"],ans:1},{q:"What teacher challenge is mentioned?",opts:["Too many teachers","Shortage in rural areas","Low pay","Teachers refusing to work"],ans:1},{q:"How more likely are secondary graduates to find work?",opts:["Twice","Four times","Three times","Five times"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy",passage:"Reading is arguably the single most important habit that a university student can cultivate. Research consistently demonstrates that students who read widely perform significantly better in examinations and produce higher quality written work. Reading expands vocabulary, sharpens comprehension skills, and develops the critical thinking that academic success demands.\n\nIn many African universities, access to books and academic journals remains severely limited. Physical libraries are often under-resourced, and the cost of purchasing textbooks places a heavy financial burden on students.\n\nA student who commits to reading for just thirty minutes each day can experience measurable improvement in academic performance within a single semester. The habit of reading is not a luxury — it is a fundamental necessity for anyone who aspires to academic excellence.",gloss:[{w:"cultivate",d:"develop through regular effort"},{w:"comprehension",d:"ability to understand fully"},{w:"aspires",d:"has a strong desire to achieve"},{w:"measurable",d:"large enough to be noticed"}],qs:[{q:"What does reading do for students?",opts:["Makes them popular","Improves exam performance and writing","Replaces lectures","Only helps vocabulary"],ans:1},{q:"What financial challenge is mentioned?",opts:["Libraries cost too much","Students cannot afford textbooks","Professors charge for lists","Digital books are costly"],ans:1},{q:"What does 30 minutes of reading daily lead to?",opts:["No difference","Measurable academic improvement","Only first-year help","Replaces studying"],ans:1}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature",passage:"Chinua Achebe is widely regarded as the father of modern African literature in English. His landmark novel, Things Fall Apart, published in 1958, tells the story of Okonkwo — a proud Igbo warrior whose life is disrupted by the arrival of European colonisers in Nigeria. The novel was groundbreaking because it presented African culture entirely from an African perspective.\n\nPrior to Achebe's work, Africa had largely been portrayed in European literature as a dark, primitive continent. Achebe set out to challenge this misrepresentation. He wrote in English but filled his prose with Igbo proverbs and oral traditions, creating a unique literary style.\n\nThings Fall Apart has been translated into more than fifty languages and is studied in universities across the world.",gloss:[{w:"landmark",d:"marking a significant achievement"},{w:"groundbreaking",d:"new and very important"},{w:"misrepresentation",d:"a false or misleading description"},{w:"prose",d:"ordinary written language, not poetry"}],qs:[{q:"Why is Things Fall Apart groundbreaking?",opts:["First novel in Africa","Presented African culture from an African perspective","Written in Igbo","Longest African novel"],ans:1},{q:"How did Achebe incorporate African culture?",opts:["Refused English grammar","Translated from Igbo","Used Igbo proverbs and oral traditions","Only wrote about ceremonies"],ans:2},{q:"Into how many languages has it been translated?",opts:["Over 20","Over 30","Over 40","More than 50"],ans:3}]},
  {title:"Climate Change and Africa",topic:"Environment",passage:"Climate change poses one of the most serious threats to Africa's development, even though the continent contributes relatively little to global greenhouse gas emissions. Rising temperatures, unpredictable rainfall, and increasingly frequent extreme weather events are already disrupting agriculture and threatening food security.\n\nIn the Sahel region, prolonged droughts have made farming increasingly difficult. Millions who depend on rain-fed agriculture are being forced to migrate to cities, placing enormous pressure on urban infrastructure.\n\nAt the same time, Africa possesses extraordinary natural resources for a green energy transition. The continent receives more solar energy than any other region on Earth. Experts argue that with the right investment, Africa could become a global leader in renewable energy.",gloss:[{w:"emissions",d:"gases released into the atmosphere"},{w:"livelihoods",d:"ways of earning money and supporting oneself"},{w:"transition",d:"process of changing from one state to another"},{w:"renewable",d:"naturally replenished; not permanently depleted"}],qs:[{q:"What does the passage say about Africa's contribution to climate change?",opts:["Biggest contributor","Very little contribution","No contribution","Not affected"],ans:1},{q:"What is happening in the Sahel?",opts:["Farmers are wealthy","Cities abandoned","Droughts forcing migration","New farms created"],ans:2},{q:"What natural advantage does Africa have for green energy?",opts:["Most wind","Largest coal","More solar than any region","Deepest ocean currents"],ans:2}]},
];

const MISTAKES_BANK = [
  {title:"'Make' vs 'Do'",fr:"Faire une erreur / Faire ses devoirs",wrong:"I did a mistake and I must do an effort to improve.",right:"I made a mistake and I must make an effort to improve.",rule:"Use MAKE for: mistakes, decisions, progress, noise, an effort. Use DO for: homework, exercises, work, research.",ex:[{w:"She did a good decision.",r:"She made a good decision."},{w:"He is doing progress.",r:"He is making progress."}]},
  {title:"'Since' vs 'For'",fr:"J'étudie l'anglais depuis 3 ans",wrong:"I study English since 3 years.",right:"I have been studying English for 3 years.",rule:"'Since' = a specific point in time. 'For' = a duration. Both require present perfect.",ex:[{w:"She lives here since 5 years.",r:"She has lived here for 5 years."},{w:"I wait since 2 o'clock.",r:"I have been waiting since 2 o'clock."}]},
  {title:"'Actually' ≠ 'Actuellement'",fr:"Actuellement, je travaille à l'UPGC",wrong:"Actually, I am a student at UPGC right now.",right:"Currently, I am a student at UPGC.",rule:"'Actually' means 'in fact'. For 'actuellement', use 'currently', 'at present', or 'at the moment'.",ex:[{w:"Actually, the economy is growing.",r:"Currently, the economy is growing."},{w:"He actually studies medicine.",r:"He is currently studying medicine."}]},
  {title:"Double Negatives",fr:"Je n'ai rien dit",wrong:"I didn't say nothing.",right:"I didn't say anything.",rule:"English does NOT allow double negatives. Use either 'not...anything' OR 'nothing' alone — never both together.",ex:[{w:"She doesn't know nothing.",r:"She doesn't know anything."},{w:"He never tells nobody.",r:"He never tells anybody."}]},
  {title:"'Assist' vs 'Attend'",fr:"J'ai assisté au cours ce matin",wrong:"I assisted the lecture this morning.",right:"I attended the lecture this morning.",rule:"'Assist' = to help someone. 'Attend' = to be present at an event. Common false friend for French speakers.",ex:[{w:"She assisted the wedding.",r:"She attended the wedding."},{w:"All students must assist the orientation.",r:"All students must attend the orientation."}]},
  {title:"Uncountable Nouns",fr:"Des informations / Des conseils",wrong:"She gave me some informations and advices.",right:"She gave me some information and advice.",rule:"These are uncountable in English: information, advice, furniture, equipment, luggage, news, research, knowledge, progress.",ex:[{w:"The news are bad.",r:"The news is bad."},{w:"Can you give me some advices?",r:"Can you give me some advice?"}]},
  {title:"Future Plans",fr:"Je fais ça demain",wrong:"I study tomorrow instead of going out.",right:"I am going to study tomorrow instead of going out.",rule:"For personal future plans, use 'going to' + base verb.",ex:[{w:"She travels to Abidjan next week.",r:"She is going to travel to Abidjan next week."},{w:"I eat with my family tonight.",r:"I am going to eat with my family tonight."}]},
];

const QUIZ_SETS = [
  [{q:"Which sentence is correct?",opts:["She don't study.","She doesn't study.","She not study.","She studies not."],ans:1,exp:"Negative: subject + doesn't/don't + base verb."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts supporting an argument","An essay type"],ans:2,exp:"Evidence = facts or information that prove something true."},{q:"In PEEL, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link."},{q:"'She gave me some ___.' Correct:",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable."},{q:"'Actually' in English means:",opts:["Currently","In fact","Often","Always"],ans:1,exp:"'Actually' = 'in fact', not 'currently'."}],
  [{q:"'I ___ here since 2020.' Correct:",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect."},{q:"'Coherent' means:",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct."},{q:"'Information' is:",opts:["Countable","Uncountable","Proper","Abstract only"],ans:1,exp:"'Information' is uncountable."},{q:"Correct passive: 'The essay ___ by Friday.'",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle."}],
  [{q:"'Despite ___ tired, she studied.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing)."},{q:"'Fundamental' means:",opts:["Optional","Very difficult","Forming the essential base","Interesting"],ans:2,exp:"Fundamental = forming the foundation."},{q:"'I assisted the conference.' Error:",opts:["'I' → 'We'","'assisted' → 'attended'","'conference' wrong","No error"],ans:1,exp:"'Assist' = help. 'Attend' = be present at."},{q:"Reported speech: 'I am preparing.' → She said she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech."},{q:"Academic synonym for 'show':",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' = the academic equivalent of 'show'."}],
];

 its negative impact makes it far more harmful than helpful."}},
  {title:"English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students today.",example:{point:"Mastering English has become an essential skill for Ivorian students who wish to compete in today's globalised professional environment.",explanation:"English is the dominant language of international business, scientific research, and global communication. Graduates who lack English proficiency are immediately at a competitive disadvantage.",evidence:"The African Development Bank estimates that English proficiency can increase an African graduate's starting salary by as much as 25%.",link:"For these compelling reasons, Ivorian students should treat English not as an optional requirement, but as one of the most strategic investments in their professional future."}},
];

const PL_QUESTIONS = [
  {s:"Grammar",   q:"'She ___ to school every day.'",        opts:["go","goes","going","gone"],ans:1},
  {s:"Grammar",   q:"Error: 'The informations are here.'",    opts:["The","informations","are","here"],ans:1},
  {s:"Grammar",   q:"'If I ___ rich, I would travel.'",       opts:["am","was","were","be"],ans:2},
  {s:"Grammar",   q:"Correct sentence:",                      opts:["She don't like coffee.","She doesn't likes it.","She doesn't like coffee.","She not like coffee."],ans:2},
  {s:"Grammar",   q:"'Despite ___ tired, he finished.'",      opts:["be","being","been","to be"],ans:1},
  {s:"Vocabulary",q:"'Analyse' means:",                       opts:["To ignore","To study carefully","To write","To memorise"],ans:1},
  {s:"Vocabulary",q:"'Her essay was very ___.' (well-organised)",opts:["confusing","coherent","boring","long"],ans:1},
  {s:"Vocabulary",q:"'Evidence' means:",                      opts:["A feeling","A guess","Facts supporting an argument","A question"],ans:2},
  {s:"Vocabulary",q:"FALSE FRIEND for French speakers:",      opts:["Book","Actually","Table","School"],ans:1},
  {s:"Vocabulary",q:"'The study requires ___ data.'",         opts:["emotional","empirical","fictional","random"],ans:1},
  {s:"Reading",   q:"Why did Okonkwo work hard?",             opts:["To be rich","To travel","To overcome his father's failures","To win a prize"],ans:2},
  {s:"Reading",   q:"'Education was the light…' — device?",  opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {s:"Reading",   q:"'Jaja's face was expressionless.' Suggests:",opts:["Happy","Calm","Hiding emotions","Cold"],ans:2},
  {s:"Reading",   q:"A 'glossary' is:",                       opts:["Questions list","Word definitions","Summary","Bibliography"],ans:1},
  {s:"Reading",   q:"'Concluded' means:",                     opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
];

const MODS = [
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",   sub:"Random exercise every session",   color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",  sub:"Random word every session",       color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Writing Lab",      sub:"PEEL paragraph + AI assessment",  color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",     sub:"Random passage every session",    color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes", sub:"French-speaker errors explained", color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",       sub:"5 random questions every session",color:"#fff8e1"},
];

const BADGES_DEF = {
  Beginner:[
    {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
    {icon:"📖",name:"First Reader",  desc:"Complete 1 reading passage"},
    {icon:"🔥",name:"Streak 3",      desc:"Log in 3 days in a row"},
    {icon:"✏️",name:"Grammar Start", desc:"Complete 5 grammar exercises"},
    {icon:"🔤",name:"Word Learner",  desc:"Learn 5 vocabulary words"},
    {icon:"🧪",name:"Quiz Taker",    desc:"Complete your first quiz"},
  ],
  Intermediate:[
    {icon:"📝",name:"PEEL Improver",   desc:"Submit 3 PEEL with score ≥10/20"},
    {icon:"🔥",name:"Streak 7",        desc:"Log in 7 days in a row"},
    {icon:"📚",name:"Avid Reader",     desc:"Complete 5 reading passages"},
    {icon:"✏️",name:"Grammar Pro",     desc:"Complete 15 grammar exercises"},
    {icon:"🎯",name:"Quiz Champion",   desc:"Score 5/5 on a quiz"},
    {icon:"🇫🇷",name:"Mistake Hunter", desc:"Complete 5 Common Mistakes"},
  ],
  Advanced:[
    {icon:"🏆",name:"PEEL Master",       desc:"Submit 5 PEEL with score ≥15/20"},
    {icon:"🔥",name:"Streak 14",         desc:"Log in 14 days in a row"},
    {icon:"🌍",name:"African Reader",    desc:"Complete 10 reading passages"},
    {icon:"💎",name:"Perfect Quiz",      desc:"Get 3 perfect quizzes"},
    {icon:"🎓",name:"Academic Writer",   desc:"Earn 500 XP through PEEL"},
    {icon:"👑",name:"UPGC Champion",     desc:"Reach 1500 XP"},
  ],
};

/* ─── UI COMPONENTS ──────────────────────────────────── */
function Spinner(){return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}><div style={{width:36,height:36,border:"4px solid #e0e0e0",borderTop:"4px solid #2D6A4F",borderRadius:"50%",animation:"__spin 1s linear infinite"}}/><style>{`@keyframes __spin{to{transform:rotate(360deg)}}`}</style></div>);}
function Confetti({active}){if(!active)return null;const pieces=Array.from({length:40},(_,i)=>i);const colors=["#2D6A4F","#81c784","#ffd700","#ff9800","#e91e63","#2196f3","#9c27b0","#00bcd4"];return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}><style>{`@keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>{pieces.map(i=>{const color=colors[i%colors.length],left=Math.random()*100,delay=Math.random()*.8,dur=1.2+Math.random(),size=8+Math.random()*8;return<div key={i} style={{position:"absolute",left:`${left}%`,top:"-20px",width:`${size}px`,height:`${size}px`,background:color,borderRadius:i%3===0?"50%":"0%",animation:`confetti-fall ${dur}s ${delay}s ease-in forwards`}}/>;})}</div>);}
function Card({children,style}){return<div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",...style}}>{children}</div>;}
function PBtn({onClick,children,disabled,style}){return<button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",padding:"13px",borderRadius:12,border:"none",background:disabled?"#ccc":"#2D6A4F",color:"#fff",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;}
function SBtn({onClick,children,style}){return<button onClick={onClick} style={{display:"block",width:"100%",padding:"12px",borderRadius:12,border:"2px solid #2D6A4F",background:"transparent",color:"#2D6A4F",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;}

/* ═══════════════ PLACEMENT TEST ═══════════════════════ */
function PlacementTest({onDone}){
  const [i,sI]=useState(0);const [sel,sSel]=useState(null);const [conf,sConf]=useState(false);const [sc,sSc]=useState({Grammar:0,Vocabulary:0,Reading:0});
  const q=PL_QUESTIONS[i];const secs=["Grammar","Vocabulary","Reading"];const icons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};const si=secs.indexOf(q.s);
  const next=()=>{const nsc={...sc};if(sel===q.ans)nsc[q.s]=sc[q.s]+1;if(i<14){sSc(nsc);sI(x=>x+1);sSel(null);sConf(false);}else{const tot=nsc.Grammar+nsc.Vocabulary+nsc.Reading;onDone({level:tot>=11?"Advanced":tot>=6?"Intermediate":"Beginner",scores:nsc,total:tot});}};
  return(<div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}><div style={{width:"100%",maxWidth:440,paddingTop:16}}><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:36}}>🎯</div><h2 style={{color:"#1b4332",margin:"6px 0 2px"}}>Placement Test</h2><p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p></div><div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}><span>Q {i+1}/15</span><span style={{color:"#2D6A4F",fontWeight:700}}>{Math.round((i/15)*100)}%</span></div><div style={{background:"#e0e0e0",borderRadius:99,height:8}}><div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(i/15)*100}%`,transition:"width .4s"}}/></div><div style={{display:"flex",gap:4,marginTop:8}}>{secs.map((s,ix)=>(<div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:ix<si?"#2D6A4F":ix===si?"#81c784":"#e0e0e0"}}/><span style={{fontSize:11,color:ix<=si?"#2D6A4F":"#bbb",fontWeight:ix===si?700:400}}>{icons[s]} {s}</span></div>))}</div></div><Card style={{marginBottom:14}}><div style={{background:{"Grammar":"#e3f2fd","Vocabulary":"#fff3e0","Reading":"#f3e5f5"}[q.s],borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:10}}><span style={{fontSize:12,fontWeight:700,color:"#1b4332"}}>{icons[q.s]} {q.s}</span></div><p style={{fontWeight:600,color:"#1b4332",fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p></Card>{q.opts.map((o,oi)=>{const isC=oi===q.ans,isP=oi===sel;let bg="#fff",br="#e0e0e0";if(conf){if(isP&&isC){bg="#e8f5e9";br="#2D6A4F";}else if(isP&&!isC){bg="#ffebee";br="#e53935";}}else if(isP){bg="#d8f3dc";br="#2D6A4F";}return<button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>{conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}</button>;})} {!conf?<PBtn onClick={()=>{if(sel!==null)sConf(true);}} disabled={sel===null}>Confirm Answer</PBtn>:<PBtn onClick={next}>{i<14?"Next →":"See My Level 🎯"}</PBtn>}</div></div>);
}

function LevelResult({result,onContinue}){
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Your content will focus on essential grammar, core vocabulary, and accessible reading.",Intermediate:"Your content will challenge you with more complex grammar and academic vocabulary.",Advanced:"Your content will develop your academic writing and critical reading skills."};
  return(<div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}><div style={{width:"100%",maxWidth:440}}><Card style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:64,marginBottom:8}}>{icons[result.level]}</div><h2 style={{color:"#2D6A4F",fontSize:24,margin:"0 0 4px"}}>Your Level:</h2><div style={{background:"#d8f3dc",borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 12px"}}><span style={{fontSize:22,fontWeight:900,color:"#1b4332"}}>{result.level}</span></div><p style={{color:"#555",fontSize:14,lineHeight:1.7}}>{descs[result.level]}</p></Card><Card style={{marginBottom:16}}><h4 style={{color:"#1b4332",margin:"0 0 12px"}}>📊 Your Scores</h4>{Object.entries(result.scores).map(([k,v])=>(<div key={k} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:600,color:"#1b4332"}}>{k}</span><span style={{color:"#2D6A4F",fontWeight:700}}>{v}/5</span></div><div style={{background:"#e8f5e9",borderRadius:99,height:8}}><div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(v/5)*100}%`,transition:"width .6s"}}/></div></div>))}<div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,color:"#1b4332"}}>Total</span><span style={{color:"#2D6A4F",fontWeight:800}}>{result.total}/15</span></div></Card><PBtn onClick={onContinue}>Continue to Writing Test ✍️</PBtn></div></div>);
}

/* ═══════════════ WRITING PRETEST ═══════════════════════ */
function WritingPretest({user,tok,level,onDone}){
  const [text,setText]=useState("");const [loading,setLoading]=useState(false);const [submitted,setSubmitted]=useState(false);
  const words=wc(text),enough=words>=PRETEST_SUBJECT.minWords;
  const submit=async()=>{
    if(!enough||!user?.id)return;
    setLoading(true);
    try{await post("writing_pretests",{user_id:user.id,student_code:user.student_code,level,writing_text:text,submitted_at:new Date().toISOString(),status:"pending",correction:null},tok);setSubmitted(true);}catch(e){console.error(e);}
    setLoading(false);
  };
  if(submitted)return(<div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}><div style={{width:"100%",maxWidth:440,textAlign:"center"}}><Card><div style={{fontSize:64,marginBottom:12}}>📬</div><h2 style={{color:"#2D6A4F",margin:"0 0 8px"}}>Submission Received!</h2><p style={{color:"#555",fontSize:14,lineHeight:1.8}}>Your writing has been sent for teacher review. You will receive feedback soon.</p><div style={{background:"#d8f3dc",borderRadius:12,padding:"10px 20px",display:"inline-block",margin:"12px 0"}}><span style={{fontWeight:800,color:"#1b4332",fontSize:15}}>Code: {user?.student_code}</span></div><PBtn onClick={onDone} style={{background:"#2D6A4F"}}>Start Learning →</PBtn></Card></div></div>);
  return(<div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}><div style={{width:"100%",maxWidth:440,paddingTop:16}}><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:36}}>✍️</div><h2 style={{color:"#1b4332",margin:"6px 0 2px"}}>Writing Pretest</h2><p style={{color:"#888",fontSize:13}}>Your answer will be reviewed by a teacher</p></div><Card style={{background:"#e8f5e9",borderLeft:"4px solid #2D6A4F",marginBottom:14}}><div style={{fontSize:12,color:"#555",fontWeight:700,marginBottom:6}}>📝 Subject</div><p style={{fontWeight:600,color:"#1b4332",fontSize:15,lineHeight:1.7,margin:"0 0 8px"}}>{PRETEST_SUBJECT.prompt}</p><p style={{fontSize:12,color:"#666",margin:0,lineHeight:1.6,fontStyle:"italic"}}>{PRETEST_SUBJECT.instructions}</p></Card><Card style={{marginBottom:14}}><div style={{fontSize:12,color:"#888",marginBottom:8}}>Your answer (min. {PRETEST_SUBJECT.minWords} words)</div><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your paragraph here…" rows={8} style={{width:"100%",boxSizing:"border-box",border:`2px solid ${enough?"#2D6A4F":words>0?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:6}}><span style={{color:enough?"#2D6A4F":words>0?"#f57c00":"#aaa",fontWeight:600}}>{words} / {PRETEST_SUBJECT.minWords} words {enough?"✅":words>0?"⚠️ Keep writing…":""}</span>{enough&&<span style={{color:"#2D6A4F"}}>Ready!</span>}</div></Card>{loading?<Spinner/>:<PBtn onClick={submit} disabled={!enough} style={{background:enough?"#2D6A4F":"#ccc"}}>Submit Writing ✍️</PBtn>}</div></div>);
}

/* ═══════════════ ADMIN PANEL ════════════════════════════ */
function AdminPanel({tok,G,LT,DK,onClose}){
  const [subs,setSubs]=useState([]);const [loading,setLoading]=useState(true);const [sel,setSel]=useState(null);const [corr,setCorr]=useState("");const [saving,setSaving]=useState(false);const [filter,setFilter]=useState("all");
  useEffect(()=>{(async()=>{try{const d=await get("writing_pretests?select=*&order=submitted_at.desc",tok);if(Array.isArray(d))setSubs(d);}catch(e){console.error(e);}setLoading(false);})();},[]);
  const saveCorr=async()=>{if(!sel||!corr.trim())return;setSaving(true);try{await patch(`writing_pretests?id=eq.${sel.id}`,{correction:corr,status:"corrected"},tok);setSubs(s=>s.map(x=>x.id===sel.id?{...x,correction:corr,status:"corrected"}:x));setSel(s=>({...s,correction:corr,status:"corrected"}));}catch(e){console.error(e);}setSaving(false);};
  const filtered=subs.filter(s=>filter==="all"||s.status===filter);
  if(sel)return(<div style={{padding:18}}><button onClick={()=>{setSel(null);setCorr("");}} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back to list</button><Card style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}><div><div style={{fontWeight:800,color:DK,fontSize:16}}>{sel.student_code}</div><div style={{fontSize:12,color:"#888"}}>Level: {sel.level} · {sel.submitted_at?.slice(0,10)}</div></div><span style={{background:sel.status==="corrected"?"#e8f5e9":"#fff3e0",color:sel.status==="corrected"?G:"#e65100",borderRadius:8,padding:"3px 12px",fontSize:12,fontWeight:700}}>{sel.status==="corrected"?"✅ Corrected":"⏳ Pending"}</span></div></Card><Card style={{background:"#f9fbe7",marginBottom:12}}><div style={{fontSize:12,color:"#888",fontWeight:700,marginBottom:6}}>📝 Subject</div><p style={{fontSize:13,color:"#444",margin:0,fontStyle:"italic",lineHeight:1.7}}>{PRETEST_SUBJECT.prompt}</p></Card><Card style={{marginBottom:12}}><div style={{fontSize:12,color:"#888",fontWeight:700,marginBottom:6}}>🧑‍🎓 Student Answer</div><p style={{fontSize:14,color:"#333",margin:0,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{sel.writing_text}</p><div style={{fontSize:12,color:"#aaa",marginTop:8}}>{wc(sel.writing_text)} words</div></Card><Card style={{marginBottom:12}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>✏️ Teacher Correction</div><textarea value={corr||sel.correction||""} onChange={e=>setCorr(e.target.value)} placeholder="Write your correction and feedback here…" rows={6} style={{width:"100%",boxSizing:"border-box",border:`2px solid ${G}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit"}}/></Card><div style={{display:"flex",gap:10}}>{saving?<Spinner/>:<PBtn onClick={saveCorr} style={{background:G,flex:1}}>💾 Save Correction</PBtn>}<button onClick={()=>exportWord([{...sel,correction:corr||sel.correction}],`pretest_${sel.student_code}.doc`)} style={{flex:1,background:"#1565c0",color:"#fff",border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>📄 Export Word</button></div></div>);
  return(<div style={{padding:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{color:DK,margin:0}}>🗂 Writing Pretests</h3><button onClick={onClose} style={{background:"none",border:"none",color:"#888",fontSize:20,cursor:"pointer"}}>✕</button></div><div style={{display:"flex",gap:8,marginBottom:14}}>{["all","pending","corrected"].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{flex:1,background:filter===f?G:"#fff",color:filter===f?"#fff":DK,border:`1.5px solid ${filter===f?G:"#ddd"}`,borderRadius:20,padding:"7px 0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{f==="all"?"All":f==="pending"?"⏳ Pending":"✅ Corrected"}</button>))}</div>{filtered.length>0&&<button onClick={()=>exportWord(filtered,`pretest_all_${dateStr()}.doc`)} style={{width:"100%",background:"#1565c0",color:"#fff",border:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:14}}>📄 Export All ({filtered.length}) → Word</button>}{loading&&<Spinner/>}{!loading&&filtered.length===0&&<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>📭</div><p style={{color:"#888"}}>No submissions yet.</p></Card>}{filtered.map(s=>(<div key={s.id} onClick={()=>{setSel(s);setCorr(s.correction||"");}} style={{background:"#fff",border:`1.5px solid ${s.status==="corrected"?"#a5d6a7":"#ffe082"}`,borderRadius:14,padding:"14px 16px",marginBottom:10,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:800,color:DK,fontSize:14}}>{s.student_code}</div><div style={{fontSize:12,color:"#888",marginTop:2}}>Level: {s.level} · {s.submitted_at?.slice(0,10)}</div><div style={{fontSize:12,color:"#aaa",marginTop:2}}>{wc(s.writing_text)} words</div></div><span style={{background:s.status==="corrected"?"#e8f5e9":"#fff3e0",color:s.status==="corrected"?G:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0}}>{s.status==="corrected"?"✅":"⏳"}</span></div><p style={{fontSize:13,color:"#666",margin:"8px 0 0",lineHeight:1.5,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{s.writing_text}</p></div>))}</div>);
}

/* ═══════════════ AUTH ═══════════════════════════════════ */
function Landing({go}){return(<div style={{minHeight:"100vh",background:"linear-gradient(160deg,#1b4332 0%,#2D6A4F 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"80px 28px 40px",color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}><div style={{fontSize:72,marginBottom:16}}>✍️</div><h1 style={{fontSize:36,fontWeight:900,margin:"0 0 10px",color:"#fff",letterSpacing:1}}>WriteUP UPGC</h1><p style={{opacity:.9,fontSize:17,marginBottom:6,color:"#fff"}}>Academic English for L2 Students</p><p style={{opacity:.65,fontSize:13,marginBottom:56,color:"#fff"}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p><div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:320,marginBottom:48}}><button onClick={()=>go("login")} style={{background:"#fff",color:"#2D6A4F",border:"none",borderRadius:14,padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer",width:"100%"}}>Log In</button><button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.7)",borderRadius:14,padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer",width:"100%"}}>Sign Up</button></div><div style={{display:"flex",gap:18,opacity:.6,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>{["🌐 PWA","🆓 Free","🎯 Level Test","📚 Rich Content","💾 Cloud Save"].map(t=><span key={t}>{t}</span>)}</div></div>);}

function AuthForm({mode,onDone,onSwitch}){
  const [f,sF]=useState({name:"",email:"",pw:""});const [load,sL]=useState(false);const [err,sErr]=useState("");
  const upd=k=>e=>sF(p=>({...p,[k]:e.target.value}));
  const submit=async()=>{
    if(!f.email||!f.pw)return sErr("Please fill all fields.");
    if(mode==="register"&&!f.name)return sErr("Please enter your name.");
    sL(true);sErr("");
    try{
      if(mode==="register"){
        const res=await signUp(f.email,f.pw);
        if(res.error){sErr(res.error.message||"Registration failed.");sL(false);return;}
        const uid=res.user?.id,code=genCode();
        if(uid){await post("users",{id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",placement_done:false,last_login:dateStr(),student_code:code,anonymous_leaderboard:false},res.access_token);onDone({id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:true,token:res.access_token,student_code:code,anonymous_leaderboard:false});}
      }else{
        const res=await signIn(f.email,f.pw);
        if(res.error){sErr("Invalid email or password.");sL(false);return;}
        const uid=res.user?.id,tok=res.access_token;
        const rows=await get(`users?id=eq.${uid}`,tok);const p=rows?.[0];
        if(p){const diff=Math.floor((new Date()-new Date(p.last_login))/(86400000));const ns=diff===1?p.streak+1:diff>1?1:p.streak;await patch(`users?id=eq.${uid}`,{last_login:dateStr(),streak:ns},tok);onDone({...p,streak:ns,isNew:!p.placement_done,token:tok});}
        else sErr("Profile not found. Please sign up.");
      }
    }catch{sErr("Connection error. Please try again.");}
    sL(false);
  };
  const inp=(ph,k,type="text")=>(<input placeholder={ph} type={type} value={f[k]} onChange={upd(k)} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>);
  return(<div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}><Card style={{width:"100%",maxWidth:400}}><div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:40}}>✍️</div><h2 style={{color:"#2D6A4F",margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2><p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p></div>{mode==="register"&&inp("Full name","name")}{inp("Email","email","email")}{inp("Password (min. 6 chars)","pw","password")}{err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}{load?<Spinner/>:<PBtn onClick={submit}>{mode==="login"?"Log In":"Register & Take Placement Test"}</PBtn>}<p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>{mode==="login"?"No account? ":"Already registered? "}<span onClick={onSwitch} style={{color:"#2D6A4F",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span></p></Card></div>);
}

/* ═══════════════ MODULE HELPERS ════════════════════════ */
function DoneScreen({xp,onBack,earn,G}){
  const [conf,setConf]=useState(true);
  useEffect(()=>{earn&&earn();const t=setTimeout(()=>setConf(false),2500);return()=>clearTimeout(t);},[]);
  return(<><Confetti active={conf}/><div style={{textAlign:"center",padding:48}}><div style={{fontSize:64,marginBottom:12}}>🎉</div><h2 style={{color:G}}>Well done!</h2><p style={{color:"#555"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p><p style={{color:"#aaa",fontSize:13}}>Progress saved ✅</p><PBtn onClick={onBack} style={{background:G}}>← Back to Modules</PBtn></div></>);
}

function GrammarMod({addXp,onBack,G,LT,DK,ghContent,ghLoading}){
  const bank = ghContent?.GRAMMAR_ADVANCED || ghContent?.GRAMMAR_INTERMEDIATE || ghContent?.GRAMMAR_BEGINNER || GRAMMAR_BANK;
  const [c]=useState(()=>rnd(bank));const [sel,sSel]=useState(null);const [done,sDone]=useState(false);
  if(ghLoading) return <Spinner/>;
  const conf=sel!==null,correct=sel===c.ans; onBack={onBack} G={G} earn={()=>addXp(XP_MAP.grammar,"grammar")}/>;
  return(<div><Card style={{background:LT,marginBottom:14}}><div style={{fontSize:12,color:"#555"}}>📚 Topic: <strong>{c.title}</strong></div></Card><Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.q}</p></Card>{c.opts.map((o,oi)=>{const isC=oi===c.ans,isP=oi===sel;let bg="#fff",br="#e0e0e0";if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}else if(isP){bg=LT;br=G;}return<button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>{conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}</button>;})} {conf&&<><Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}><p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.exp}</p></Card><Card style={{background:"#e3f2fd",marginBottom:14}}><p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p></Card>{correct?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Earn +{XP_MAP.grammar} XP →</PBtn>:<SBtn onClick={onBack}>← Try another exercise</SBtn>}</>}</div>);
}

function VocabMod({addXp,onBack,G,LT,DK,ghContent,ghLoading}){
  const bank = ghContent?.VOCAB_ADVANCED || ghContent?.VOCAB_INTERMEDIATE || ghContent?.VOCAB_BEGINNER || VOCAB_BANK;
  const [c]=useState(()=>rnd(bank));
  const [phase,sPhase]=useState("learn");const [sel,sSel]=useState(null);const [done,sDone]=useState(false);
  if(ghLoading) return <Spinner/>;
  const conf=sel!==null,correct=sel===c.ans;
  if(done)return<DoneScreen xp={XP_MAP.vocabulary} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.vocabulary,"vocabulary")}/>;
  if(phase==="learn")return(<div><Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div><h2 style={{color:G,margin:"0 0 2px",fontSize:26}}>{c.word}</h2><div style={{color:"#999",fontSize:12}}>{c.ph} · <em>{c.pos}</em></div></div><span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.fr}</span></div><div style={{background:"#f9fbe7",borderRadius:10,padding:12,marginBottom:10}}><div style={{fontSize:12,color:"#888",marginBottom:4}}>📖 Definition</div><p style={{color:"#333",fontSize:14,margin:0,lineHeight:1.7}}>{c.def}</p></div><div style={{background:"#e8f5e9",borderRadius:10,padding:12}}><div style={{fontSize:12,color:"#888",marginBottom:4}}>🧠 Memory Tip</div><p style={{color:DK,fontSize:13,margin:0,lineHeight:1.6}}>{c.tip}</p></div></Card><PBtn onClick={()=>sPhase("practice")} style={{background:G}}>Practice this word →</PBtn></div>);
  return(<div><Card style={{marginBottom:14}}><div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.ex}</p></Card>{c.opts.map((o,oi)=>{const isC=oi===c.ans,isP=oi===sel;let bg="#fff",br="#e0e0e0";if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}else if(isP){bg=LT;br=G;}return<button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>{conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}</button>;})} {conf&&<><Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}><p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}</p></Card>{correct?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Earn +{XP_MAP.vocabulary} XP →</PBtn>:<SBtn onClick={onBack}>← Try another word</SBtn>}</>}</div>);
}

function ReadingMod({addXp,onBack,G,LT,DK,ghContent,ghLoading}){
  const bank = ghContent?.READING_ADVANCED || ghContent?.READING_INTERMEDIATE || ghContent?.READING_BEGINNER || READING_BANK;
  const [c]=useState(()=>rnd(bank));
  const [phase,sP]=useState("read");const [ans,sA]=useState([null,null,null]);const [checked,sC]=useState(false);const [done,sD]=useState(false);
  if(ghLoading) return <Spinner/>;
  const score=ans.filter((a,i)=>a===c.qs[i]?.ans).length;
  if(done)return<DoneScreen xp={XP_MAP.reading} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.reading,"reading")}/>;
  if(phase==="read")return(<div><Card style={{marginBottom:14}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div><h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>{c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}</Card><Card style={{background:"#fff8e1",marginBottom:14}}><div style={{fontWeight:700,color:"#e65100",marginBottom:10,fontSize:13}}>📖 Glossary</div>{c.gloss.map(g=><div key={g.w} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}><strong style={{color:DK,minWidth:110,flexShrink:0}}>{g.w}</strong><span style={{color:"#555",lineHeight:1.5}}>{g.d}</span></div>)}</Card><PBtn onClick={()=>sP("quiz")} style={{background:G}}>Answer Questions →</PBtn></div>);
  return(<div><h4 style={{color:DK,marginBottom:14}}>📝 Comprehension Questions</h4>{c.qs.map((q,qi)=>(<Card key={qi} style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10,lineHeight:1.6}}>{qi+1}. {q.q}</p>{q.opts.map((o,oi)=>{const isC=oi===q.ans,isP=oi===ans[qi];let bg="#f9f9f9",br="#e0e0e0";if(checked){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC){bg="#fff9c4";br="#f9a825";}}else if(isP){bg=LT;br=G;}return<button key={oi} onClick={()=>{if(!checked)sA(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${br}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>{checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":checked&&!isP&&isC?"💡 ":""}{o}</button>;})} </Card>))}{!checked?<PBtn onClick={()=>sC(true)} disabled={ans.includes(null)} style={{background:ans.includes(null)?"#ccc":G}}>Check Answers</PBtn>:<div><Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}><strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong></Card><PBtn onClick={()=>sD(true)} style={{background:G}}>Earn +{XP_MAP.reading} XP</PBtn></div>}</div>);
}

function MistakesMod({addXp,onBack,G,LT,DK,ghContent,ghLoading}){
  const bank = ghContent?.MISTAKES_ADVANCED || ghContent?.MISTAKES_INTERMEDIATE || ghContent?.MISTAKES_BEGINNER || MISTAKES_BANK;
  const [c]=useState(()=>rnd(bank));
  const [done,sD]=useState(false);
  if(ghLoading) return <Spinner/>;
  if(done)return<DoneScreen xp={XP_MAP.mistakes} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.mistakes,"mistakes")}/>;
  return(<div><Card style={{borderLeft:"4px solid #ff9800",marginBottom:14}}><span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.title}</span><div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}><span style={{fontSize:18}}>🇫🇷</span><span style={{fontSize:13,color:"#666",fontStyle:"italic"}}>French pattern: <strong>{c.fr}</strong></span></div></Card><Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:8}}>❌ Common Error</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong}"</p></Card><Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>✅ Correct English</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.right}"</p></Card><Card style={{background:"#e3f2fd",marginBottom:14}}><div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:8}}>📐 Rule</div><p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p></Card><Card style={{marginBottom:14}}><div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>📝 More Examples</div>{c.ex.map((e,i)=><div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<c.ex.length-1?"1px solid #f0f0f0":"none"}}><div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.w}</div><div style={{fontSize:13,color:G}}>✅ {e.r}</div></div>)}</Card><PBtn onClick={()=>sD(true)} style={{background:G}}>Got it! Earn +{XP_MAP.mistakes} XP</PBtn></div>);
}

function QuizMod({addXp,onBack,G,LT,DK,ghContent,ghLoading}){
  const bank = ghContent?.QUIZ_ADVANCED || ghContent?.QUIZ_INTERMEDIATE || ghContent?.QUIZ_BEGINNER || QUIZ_SETS;
  const [qs]=useState(()=>rnd(Array.isArray(bank[0])?bank:[bank]));
  const [i,sI]=useState(0);const [sel,sSel]=useState(null);const [score,sScore]=useState(0);const [review,sReview]=useState(false);const [done,sDone]=useState(false);
  if(ghLoading) return <Spinner/>;
  const q=qs[i],conf=sel!==null,correct=sel===q?.ans;
  if(done)return<DoneScreen xp={score*6} onBack={onBack} G={G} earn={()=>addXp(score*6,"quiz")}/>;
  if(review)return(<div><Card style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div><h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3><p style={{color:"#555",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p></Card>{score>0?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Claim +{score*6} XP →</PBtn>:<SBtn onClick={onBack}>← No XP — Try again tomorrow</SBtn>}</div>);
  const next=()=>{if(i<qs.length-1){sI(x=>x+1);sSel(null);}else sReview(true);};
  return(<div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}><span>Q {i+1}/{qs.length}</span><span style={{color:G,fontWeight:700}}>Score: {score}/{i+(conf?1:0)}</span></div><div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}><div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/></div><Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>{q.opts.map((o,oi)=>{const isC=oi===q.ans,isP=oi===sel;let bg="#fff",br="#e0e0e0";if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}else if(isP){bg=LT;br=G;}return<button key={oi} onClick={()=>{if(!conf){sSel(oi);if(oi===q.ans)sScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>{conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}</button>;})} {conf&&<><Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}><p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p></Card><PBtn onClick={next} style={{background:G}}>{i<qs.length-1?"Next →":"See Results"}</PBtn></>}</div>);
}

function PeelMod({addXp,onBack,level,G,LT,DK,ghContent,ghLoading}){
  const bank = ghContent?.PEEL_ADVANCED || ghContent?.PEEL_INTERMEDIATE || ghContent?.PEEL_BEGINNER || PEEL_TOPICS;
  const [phase,sPhase]=useState("intro");const [tTab,sTTab]=useState(0);const [c]=useState(()=>rnd(bank));const [step,sStep]=useState(0);const [vals,sVals]=useState({point:"",explanation:"",evidence:"",link:""});const [fb,sFb]=useState(null);const [aiLoad,sAiLoad]=useState(false);const [attempts,sAtt]=useState(0);
  const keys=["point","explanation","evidence","link"];const labels=["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];const minW=WMIN[level]||WMIN.Beginner;
  const PARTS=[
    {letter:"P",name:"Point",color:"#e3f2fd",icon:"📌",role:"Your opening sentence — state your main argument clearly.",dos:"Start with a strong, confident statement. Be specific.",donts:"Do not begin with a question. Do not be vague."},
    {letter:"E",name:"Explanation",color:"#e8f5e9",icon:"💬",role:"Explain WHY your point is true. Give 2-3 logical reasons.",dos:"Use linking words: 'Furthermore', 'In addition', 'This means that'.",donts:"Do not simply repeat your Point. Every sentence must add new reasoning."},
    {letter:"E",name:"Evidence",color:"#fff3e0",icon:"📚",role:"Provide concrete proof — a statistic, study, or expert quote.",dos:"Introduce: 'According to...', 'A study by... found that...'. Name your source.",donts:"Never use vague 'studies show' without naming the study."},
    {letter:"L",name:"Link",color:"#fce4ec",icon:"🔗",role:"Close the paragraph by connecting back to the essay question.",dos:"Use: 'Therefore...', 'This demonstrates that...', 'It is clear that...'",donts:"Do not introduce new arguments. Do not simply copy your Point."},
  ];
  const TABS=["About PEEL","P — Point","E — Explanation","E — Evidence","L — Link","❌ Weak","✅ Strong"];

  const callAI=async(isRevision)=>{
    sAiLoad(true);sFb(null);
    const prompt=`You are a supportive but rigorous English writing examiner evaluating a PEEL paragraph from a ${level} university student in Côte d'Ivoire (French speaker). Attempt: ${attempts+1}.${isRevision?" Student revised based on previous feedback.":""}

TOPIC: "${c.prompt}"
POINT: ${vals.point}
EXPLANATION: ${vals.explanation}
EVIDENCE: ${vals.evidence}
LINK: ${vals.link}

${PEEL_SCORE_PROMPT}

Start your response with exactly this block (replace X with numbers only):
##SCORES##
POINT:X
EXPLANATION:X
EVIDENCE:X
LINK:X
GRAMMAR:X
##END##

Then write detailed, beginner-friendly feedback with these sections. Explain every comment as if to someone who has never studied academic writing — be specific, encouraging, and give concrete examples of improvement:
## Overall Assessment
## Point Analysis (Is the argument clear? Is it a full sentence with a clear position? What could be stronger?)
## Explanation Analysis (Does it explain WHY? Are there enough reasons? Are linking words used well?)
## Evidence Analysis (Is a real source named? Is the statistic specific? How to improve?)
## Link Analysis (Does it close the paragraph? Does it connect back to the question?)
## Grammar & Vocabulary (show ❌ exact wrong sentence then ✅ corrected version with brief explanation of why)
## Priority Actions (exactly 3 numbered, specific, actionable steps)
## Encouragement`;
    try{
      const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,maxTokens:1200})});
      if(!response.ok){const ed=await response.json().catch(()=>({}));throw new Error(ed.error||`HTTP ${response.status}`);}
      const data=await response.json();const text=data.text||"";
      let sc={point:0,expl:0,evidence:0,link:0,grammar:0,total:0};
      const block=text.match(/##SCORES##([\s\S]*?)##END##/);
      if(block){const s=block[1];const ex=k=>{const m=s.match(new RegExp("^"+k+":(\\d+)","im"));return m?Math.max(0,parseInt(m[1])):0;};sc.point=Math.min(5,ex("POINT"));sc.expl=Math.min(5,ex("EXPLANATION"));sc.evidence=Math.min(5,ex("EVIDENCE"));sc.link=Math.min(3,ex("LINK"));sc.grammar=Math.min(2,ex("GRAMMAR"));sc.total=sc.point+sc.expl+sc.evidence+sc.link+sc.grammar;}
      let fbText=text;const endIdx=text.indexOf("##END##");if(endIdx>-1)fbText=text.slice(endIdx+7).trim();
      sFb({text:fbText,sc,passed:sc.total>=10});sAtt(a=>a+1);sPhase("feedback");
    }catch(e){console.error("PEEL AI error:",e);sFb({text:`## Connection Error\n\n⚠️ Could not reach the AI feedback server.\n\n**Reason:** ${e.message||"Unknown error"}\n\nPlease check your internet connection and try again.`,sc:{point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0},passed:false});sPhase("feedback");}
    sAiLoad(false);
  };

  const renderFb=text=>{
    if(!text)return null;
    return text.split("\n").map((line,i)=>{
      if(!line.trim())return<div key={i} style={{height:4}}/>;
      if(line.startsWith("##"))return<h4 key={i} style={{color:G,margin:"16px 0 8px",fontSize:14,borderBottom:`1px solid ${LT}`,paddingBottom:4}}>{line.replace(/^#+\s*/,"")}</h4>;
      if(line.startsWith("❌"))return<div key={i} style={{background:"#ffebee",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:"#c62828"}}>{line}</div>;
      if(line.startsWith("✅"))return<div key={i} style={{background:"#e8f5e9",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:DK}}>{line}</div>;
      if(line.startsWith("⚠️"))return<div key={i} style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:8,padding:"8px 12px",margin:"6px 0",fontSize:13,color:"#856404"}}>{line}</div>;
      if(/^\d+\./.test(line))return<div key={i} style={{background:"#f3e5f5",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:"#4a148c"}}>{line}</div>;
      return<p key={i} style={{margin:"3px 0",fontSize:13,color:"#333",lineHeight:1.7}}>{line}</p>;
    });
  };

  if(phase==="intro")return(<div>
    <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}><div style={{fontSize:11,opacity:.8,marginBottom:4}}>✍️ Writing Lab · Level: {level}</div><h3 style={{margin:"0 0 6px",fontSize:18}}>The PEEL Method</h3><p style={{margin:0,fontSize:13,opacity:.85,lineHeight:1.6}}>Learn to write structured academic paragraphs step by step.</p></Card>
    <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{TABS.map((t,ix)=>(<button key={ix} onClick={()=>sTTab(ix)} style={{background:tTab===ix?G:"#fff",color:tTab===ix?"#fff":DK,border:`1.5px solid ${tTab===ix?G:"#ddd"}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{t}</button>))}</div>
    {tTab===0&&<div><Card style={{background:LT,marginBottom:12,borderLeft:`4px solid ${G}`}}><h4 style={{color:G,margin:"0 0 8px"}}>❓ What is PEEL?</h4><p style={{fontSize:14,color:"#333",lineHeight:1.8,margin:0}}>PEEL is a method for writing clear, well-structured academic paragraphs. Each letter represents one essential part: <strong>P</strong>oint, <strong>E</strong>xplanation, <strong>E</strong>vidence, <strong>L</strong>ink.</p></Card><Card style={{background:"#fff8e1",marginBottom:12}}><h4 style={{color:"#e65100",margin:"0 0 10px"}}>📏 Your Word Minimums ({level})</h4>{keys.map(k=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #ffe082"}}><span style={{fontWeight:600,color:DK,textTransform:"capitalize"}}>{k}</span><span style={{color:"#e65100",fontWeight:700}}>min {minW[k]} words</span></div>)}</Card></div>}
    {tTab>=1&&tTab<=4&&(()=>{const p=PARTS[tTab-1];return<div><Card style={{background:p.color,marginBottom:12,borderLeft:`4px solid ${G}`}}><div style={{fontSize:32,marginBottom:6}}>{p.icon}</div><h3 style={{color:DK,margin:"0 0 6px"}}>{p.letter} — {p.name}</h3><p style={{fontSize:14,color:"#444",lineHeight:1.8,margin:0}}>{p.role}</p></Card><Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontWeight:700,color:G,marginBottom:6,fontSize:13}}>✅ DO</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.dos}</p></Card><Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontWeight:700,color:"#c62828",marginBottom:6,fontSize:13}}>❌ DON'T</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.donts}</p></Card></div>;})()} 
    {tTab===5&&<Card style={{background:"#ffebee",marginBottom:14,borderLeft:"4px solid #e53935"}}><div style={{fontWeight:800,color:"#c62828",fontSize:15,marginBottom:10}}>❌ Weak Paragraph — What NOT to do</div><p style={{fontSize:14,color:"#333",lineHeight:1.8,fontStyle:"italic",background:"#fff",borderRadius:10,padding:12,margin:0}}>Technology is good for students. Many students use phones. The internet has a lot of information. Students can find things easily. So technology is important.</p><div style={{marginTop:12,fontSize:13,color:"#c62828",lineHeight:1.8}}><strong>Problems:</strong> No specific argument. No reasoning. No evidence. Link is too short and informal.</div></Card>}
    {tTab===6&&<Card style={{background:"#e8f5e9",marginBottom:14,borderLeft:`4px solid ${G}`}}><div style={{fontWeight:800,color:G,fontSize:15,marginBottom:10}}>✅ Strong Paragraph — A model</div><p style={{fontSize:14,color:"#333",lineHeight:1.9,background:"#fff",borderRadius:10,padding:12,margin:0}}>{c.example.point} {c.example.explanation} {c.example.evidence} {c.example.link}</p></Card>}
    <div style={{display:"flex",gap:10,marginTop:8}}>{tTab>0&&<SBtn onClick={()=>sTTab(t=>t-1)} style={{flex:"none",width:"auto",padding:"12px 20px"}}>← Prev</SBtn>}{tTab<TABS.length-1?<PBtn style={{flex:1,background:G}} onClick={()=>sTTab(t=>t+1)}>Next →</PBtn>:<PBtn style={{flex:1,background:G}} onClick={()=>sPhase("write")}>✍️ Start Writing</PBtn>}</div>
  </div>);

  if(phase==="write")return(<div>
    {attempts>0&&<Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision #{attempts} — Apply all feedback carefully.</p></Card>}
    <Card style={{background:LT,marginBottom:14}}><div style={{fontSize:11,color:"#555"}}>📝 Topic · {level}</div><div style={{fontWeight:800,color:DK,fontSize:15,marginTop:2}}>{c.title}</div><div style={{color:"#555",fontSize:13,marginTop:4,lineHeight:1.6}}>{c.prompt}</div></Card>
    <div style={{display:"flex",gap:6,marginBottom:16}}>{keys.map((k,ix)=>(<div key={k} style={{flex:1,textAlign:"center"}}><div style={{height:6,borderRadius:99,background:vals[k]&&wc(vals[k])>=minW[k]?G:vals[k]?"#f57c00":ix===step?"#81c784":"#e0e0e0",marginBottom:4,transition:"background .3s"}}/><div style={{fontSize:10,color:ix<=step?G:"#bbb",fontWeight:ix===step?800:400}}>{k.charAt(0).toUpperCase()}</div></div>))}</div>
    {(()=>{const p=PARTS[step];return<div><Card style={{background:p.color,marginBottom:10,borderLeft:`4px solid ${G}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div><div style={{fontSize:12,color:"#555",marginTop:4,lineHeight:1.5}}>{p.role}</div></div><div style={{background:G,color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,textAlign:"center",flexShrink:0}}>min {minW[keys[step]]}<br/>words</div></div></Card><Card style={{background:"#f0f7f4",marginBottom:10}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>📋 Model:</div><p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.8,fontStyle:"italic"}}>"{c.example[keys[step]]}"</p></Card><textarea value={vals[keys[step]]} onChange={e=>sVals(p=>({...p,[keys[step]]:e.target.value}))} placeholder={`Write your ${keys[step]} here… (min ${minW[keys[step]]} words)`} rows={5} style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wc(vals[keys[step]])>=minW[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4,marginBottom:10}}><span style={{color:wc(vals[keys[step]])>=minW[keys[step]]?G:wc(vals[keys[step]])>0?"#f57c00":"#aaa",fontWeight:600}}>{wc(vals[keys[step]])} / {minW[keys[step]]} words {wc(vals[keys[step]])>=minW[keys[step]]?"✅":wc(vals[keys[step]])>0?"⚠️":""}</span></div><PBtn onClick={()=>{if(step<3)sStep(s=>s+1);else callAI(attempts>0);}} disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoad} style={{background:aiLoad?"#ccc":G}}>{aiLoad?"⏳ Analysing your paragraph…":step<3?`Next: ${labels[step+1]} →`:"🤖 Submit for AI Assessment"}</PBtn></div>;})()} 
  </div>);

  if(phase==="feedback"&&fb){
    const CRIT=[{id:"point",label:"Point (Clarity & Argument)",max:5},{id:"expl",label:"Explanation (Logic & Reasoning)",max:5},{id:"evidence",label:"Evidence (Quality & Sources)",max:5},{id:"link",label:"Link (Cohesion)",max:3},{id:"grammar",label:"Grammar & Vocabulary",max:2}];
    const headerBg=fb.sc.total>=15?`linear-gradient(135deg,${DK},${G})`:fb.sc.total>=10?"linear-gradient(135deg,#e65100,#ff9800)":"linear-gradient(135deg,#c62828,#e53935)";
    return(<div><Card style={{background:headerBg,color:"#fff",marginBottom:16,textAlign:"center"}}><div style={{fontSize:13,opacity:.85,marginBottom:4}}>Attempt #{attempts} · {fb.passed?"✅ PASSED":"❌ REVISION REQUIRED"}</div><div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{fb.sc.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div><div style={{fontSize:14,fontWeight:700,opacity:.9}}>{fb.sc.total>=17?"🏆 Excellent":fb.sc.total>=14?"👏 Good":fb.sc.total>=10?"📈 Passed":"💪 Below Average"}</div></Card><Card style={{marginBottom:14}}><h4 style={{color:DK,margin:"0 0 12px"}}>📋 Score Breakdown</h4>{CRIT.map(cr=>{const s=fb.sc[cr.id]||0,pct=Math.round((s/cr.max)*100);return(<div key={cr.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{fontWeight:600,color:DK}}>{cr.label}</span><span style={{color:pct>=75?G:pct>=50?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span></div><div style={{background:"#e0e0e0",borderRadius:99,height:8}}><div style={{background:pct>=75?G:pct>=50?"#f57c00":"#e53935",height:8,borderRadius:99,width:`${pct}%`,transition:"width .6s"}}/></div></div>);})}</Card><Card style={{marginBottom:14}}><h4 style={{color:G,marginBottom:12}}>🔍 Detailed Feedback</h4>{renderFb(fb.text)}</Card>{fb.passed?<PBtn onClick={()=>addXp(XP_MAP.peel,"peel")} style={{background:G}}>Claim +{XP_MAP.peel} XP & Continue →</PBtn>:<div><Card style={{background:"#fff3e0",marginBottom:14,borderLeft:"3px solid #f57c00"}}><p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.8}}>🔄 Read every ⚠️ carefully, apply all fixes, then resubmit. You need 10/20 to pass.</p></Card><PBtn onClick={()=>{sPhase("write");sStep(0);}} style={{background:G}}>🔄 Revise My Paragraph →</PBtn></div>}</div>);
  }
  return<Spinner/>;
}

/* ═══════════════ HOME ═══════════════════════════════════ */
function HomeScreen({setMod,xp,lvl,pct,level,done,G,LT,DK}){
  const next=UNLOCKS.find(u=>u.xp>xp);const prev=[...UNLOCKS].reverse().find(u=>u.xp<=xp);
  return(<div style={{padding:18}}><Card style={{marginBottom:14,background:`linear-gradient(135deg,${DK},${G})`,color:"#fff"}}><div style={{fontSize:12,opacity:.8,marginBottom:4}}>📅 {dateStr()}</div><div style={{fontWeight:800,fontSize:16,marginBottom:2}}>{done.length>=MODS.length?"🎉 All done today!":"Today's Activities"}</div><div style={{fontSize:12,opacity:.75}}>{done.length}/{MODS.length} completed · {level}</div><div style={{display:"flex",gap:6,marginTop:10}}>{MODS.map(m=><div key={m.id} style={{width:28,height:28,borderRadius:"50%",background:done.includes(m.id)?"#fff":"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{done.includes(m.id)?m.icon:"·"}</div>)}</div></Card><Card style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{fontWeight:700,color:G}}>{lvl.name} · {level}</span><span style={{color:"#888"}}>{xp}/{lvl.next} XP</span></div><div style={{background:"#e8f5e9",borderRadius:99,height:10}}><div style={{background:G,height:10,borderRadius:99,width:`${pct}%`,transition:"width .5s"}}/></div><p style={{color:"#888",fontSize:12,marginTop:6}}>{lvl.next-xp} XP to next level</p></Card>{next&&<Card style={{marginBottom:14,background:"#fff8e1",borderLeft:"3px solid #f9a825"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:12,color:"#e65100",fontWeight:700,marginBottom:2}}>🔓 Next Unlock — {next.xp} XP</div><div style={{fontWeight:700,color:DK,fontSize:13}}>{next.icon} {next.label}</div><div style={{fontSize:12,color:"#666"}}>{next.desc}</div></div><div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"#e65100",fontSize:16}}>{next.xp-xp}</div><div style={{fontSize:10,color:"#888"}}>XP away</div></div></div><div style={{background:"#ffe082",borderRadius:99,height:6,marginTop:8}}><div style={{background:"#f9a825",height:6,borderRadius:99,width:`${Math.min(100,Math.round(((xp-(prev?.xp||0))/(next.xp-(prev?.xp||0)))*100))}%`,transition:"width .5s"}}/></div></Card>}{MODS.map(m=>(<button key={m.id} onClick={()=>setMod(m)} style={{width:"100%",background:"#fff",border:`1.5px solid ${LT}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",textAlign:"left",marginBottom:10}}><div style={{background:m.color,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div><div style={{flex:1}}><div style={{fontWeight:700,color:DK,fontSize:14}}>{m.name}</div><div style={{color:"#888",fontSize:12,marginTop:2}}>{m.sub}</div></div>{done.includes(m.id)?<span style={{background:"#e8f5e9",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700}}>✅ Done</span>:<span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>+{XP_MAP[m.id]} XP</span>}</button>))}</div>);
}

/* ═══════════════ PROFILE ════════════════════════════════ */
function ProfileScreen({user,xp,lvl,level,badges,streak,anonymousLB,onToggleAnon,G,LT,DK}){
  const acadLevel=xp>=1500?"Advanced":xp>=500?"Intermediate":"Beginner";
  const levels=["Beginner","Intermediate","Advanced"];
  const levelColors={Beginner:"#2D6A4F",Intermediate:"#1565c0",Advanced:"#6a1b9a"};
  const levelIcons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  return(<div style={{padding:18}}>
    <div style={{background:`linear-gradient(135deg,${DK},${G})`,borderRadius:20,padding:24,color:"#fff",textAlign:"center",marginBottom:18}}>
      <div style={{fontSize:52,marginBottom:8}}>👤</div>
      <div style={{fontWeight:900,fontSize:20}}>{user?.name}</div>
      <div style={{opacity:.75,fontSize:13,marginBottom:4}}>{user?.email}</div>
      <div style={{background:"rgba(255,255,255,0.2)",borderRadius:10,padding:"4px 16px",display:"inline-block",marginBottom:8}}><span style={{fontWeight:800,fontSize:14}}>🎓 {user?.student_code}</span></div>
      <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:8}}>{[["⭐",xp,"XP"],["🔥",streak,"Streak"],["🏅",lvl.name,"Level"]].map(([ic,v,lb])=>(<div key={lb}><div style={{fontWeight:800,fontSize:17}}>{v}</div><div style={{fontSize:11,opacity:.75}}>{lb}</div></div>))}</div>
    </div>
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,color:DK,fontSize:14}}>👁 Leaderboard Display</div><div style={{fontSize:12,color:"#888",marginTop:2}}>{anonymousLB?"Showing your code":"Showing your name"}</div></div>
        <button onClick={onToggleAnon} style={{background:anonymousLB?G:"#e0e0e0",color:anonymousLB?"#fff":"#555",border:"none",borderRadius:20,padding:"8px 16px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{anonymousLB?"🔒 Code":"👤 Name"}</button>
      </div>
    </Card>
    <h3 style={{color:DK,marginBottom:12}}>🏅 Badges</h3>
    {levels.map(lv=>{
      const locked=levels.indexOf(lv)>levels.indexOf(acadLevel);
      const bdgs=BADGES_DEF[lv];
      return(<div key={lv} style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"8px 14px",borderRadius:12,background:locked?"#f5f5f5":LT,border:`1.5px solid ${locked?"#e0e0e0":levelColors[lv]}`}}>
          <span style={{fontSize:20}}>{levelIcons[lv]}</span>
          <span style={{fontWeight:800,color:locked?"#bbb":levelColors[lv],fontSize:15}}>{lv}</span>
          {locked&&<span style={{fontSize:12,color:"#bbb",marginLeft:"auto"}}>🔒 {lv==="Intermediate"?"Unlock at 500 XP":"Unlock at 1500 XP"}</span>}
          {!locked&&<span style={{fontSize:12,color:levelColors[lv],marginLeft:"auto",fontWeight:600}}>{bdgs.filter(b=>badges.includes(b.name)).length}/{bdgs.length} earned</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,opacity:locked?.4:1}}>
          {bdgs.map(b=>{const earned=badges.includes(b.name);return<div key={b.name} style={{background:earned?"#fff":"#f5f5f5",borderRadius:14,padding:14,boxShadow:earned?"0 2px 8px rgba(0,0,0,0.08)":"none",border:earned?`1.5px solid ${levelColors[lv]}`:"none"}}><div style={{fontSize:28}}>{b.icon}</div><div style={{fontWeight:700,fontSize:13,color:DK,marginTop:4}}>{b.name}</div><div style={{fontSize:11,color:"#777",lineHeight:1.4}}>{b.desc}</div>{!earned&&!locked&&<div style={{fontSize:10,color:"#bbb",marginTop:4}}>🔒 Not yet earned</div>}{earned&&<div style={{fontSize:10,color:levelColors[lv],marginTop:4,fontWeight:700}}>✅ Earned</div>}</div>;})}
        </div>
      </div>);
    })}
  </div>);
}

/* ═══════════════ LEADERBOARD ════════════════════════════ */
function BoardScreen({userId,myXp,tok,anonymousLB,G,LT,DK}){
  const [lb,sLb]=useState([]);const [load,sLoad]=useState(true);
  useEffect(()=>{(async()=>{try{const d=await get("users?select=id,name,xp,level,streak,student_code,anonymous_leaderboard&order=xp.desc&limit=10",tok);if(Array.isArray(d))sLb(d.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp));}catch{}sLoad(false);})();},[myXp]);
  const medals=["🥇","🥈","🥉"];
  const displayName=l=>{
    if(l.id===userId)return anonymousLB?l.student_code:(l.name||l.student_code);
    return l.anonymous_leaderboard?l.student_code:(l.name||l.student_code);
  };
  return(<div style={{padding:18}}><h3 style={{color:DK,marginBottom:16}}>🏆 Leaderboard</h3>{load&&<Spinner/>}{!load&&lb.length===0&&<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>🏆</div><p style={{color:"#888"}}>No students yet. Be the first!</p></Card>}{lb.map((l,ix)=>{const isMe=l.id===userId,r=ix+1;return<div key={l.id} style={{background:isMe?LT:"#fff",border:isMe?`2px solid ${G}`:"1px solid #eee",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:10,boxShadow:r<=3?"0 2px 12px rgba(0,0,0,0.08)":"none"}}><div style={{width:36,textAlign:"center",flexShrink:0}}>{r<=3?<span style={{fontSize:24}}>{medals[ix]}</span>:<span style={{fontSize:14,fontWeight:800,color:"#bbb"}}>#{r}</span>}</div><div style={{width:36,height:36,borderRadius:"50%",background:isMe?G:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:isMe?"#fff":"#999"}}>{displayName(l)?.charAt(0)?.toUpperCase()||"?"}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:isMe?800:600,color:isMe?G:DK,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{displayName(l)}{isMe?" (You)":""}</div>{l.streak>0&&<span style={{fontSize:11,color:"#888"}}>🔥{l.streak}</span>}</div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontWeight:800,color:G,fontSize:15}}>⭐{isMe?myXp:l.xp}</div></div></div>;})} </div>);
}

/* ═══════════════ SETTINGS ═══════════════════════════════ */
function SettingsScreen({user,onTheme,onLogout,onAdmin,G,LT,DK}){
  const [activeT,sAT]=useState("default");const [pin,setPin]=useState("");const [showPin,setShowPin]=useState(false);const [pinErr,setPinErr]=useState(false);
  const doTheme=k=>{sAT(k);onTheme(THEMES[k]);};
  const checkPin=()=>{if(pin===ADMIN_PIN){onAdmin();}else{setPinErr(true);setTimeout(()=>setPinErr(false),2000);}};
  return(<div style={{padding:18}}><h3 style={{color:DK,marginBottom:16}}>⚙️ Settings</h3>
    <Card style={{marginBottom:14}}><div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>🎨 Visual Themes</div>{[{k:"default",name:"🌿 Default Green"},{k:"forest",name:"🌲 Dark Forest"},{k:"ocean",name:"🌊 Ocean Blue"}].map(t=>(<div key={t.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"10px 12px",borderRadius:12,background:activeT===t.k?"#e8f5e9":"#fff",border:activeT===t.k?`2px solid ${G}`:"1.5px solid #eee"}}><div style={{fontWeight:700,color:DK,fontSize:13}}>{t.name}</div><button onClick={()=>doTheme(t.k)} style={{background:activeT===t.k?G:"#e0e0e0",color:activeT===t.k?"#fff":"#555",border:"none",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{activeT===t.k?"Active":"Apply"}</button></div>))}</Card>
    <Card style={{marginBottom:14}}><div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>🔐 Admin Access</div>{!showPin?<SBtn onClick={()=>setShowPin(true)}>Enter Admin Panel</SBtn>:<div><input value={pin} onChange={e=>setPin(e.target.value)} type="password" placeholder="Enter PIN" style={{display:"block",width:"100%",boxSizing:"border-box",border:`1.5px solid ${pinErr?"#e53935":"#e0e0e0"}`,borderRadius:10,padding:"12px 14px",marginBottom:8,fontSize:14,outline:"none",fontFamily:"inherit"}}/>{pinErr&&<p style={{color:"#e53935",fontSize:12,margin:"0 0 8px"}}>❌ Incorrect PIN</p>}<PBtn onClick={checkPin} style={{background:G}}>🗂 Access Admin Panel</PBtn></div>}</Card>
    <Card style={{marginBottom:14,padding:"14px 16px"}}><div style={{fontWeight:600,color:DK,fontSize:14}}>👤 Account</div><div style={{fontSize:13,color:"#888",marginTop:4}}>{user?.name} · {user?.email}</div><div style={{fontSize:13,color:G,fontWeight:700,marginTop:2}}>🎓 {user?.student_code}</div></Card>
    <Card style={{marginBottom:14,padding:"14px 16px"}}><div style={{fontWeight:600,color:DK,fontSize:14}}>🔒 Privacy</div><div style={{fontSize:12,color:"#888",marginTop:4}}>ARTCI compliance · Secured by Supabase</div></Card>
    <button onClick={onLogout} style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log Out</button>
  </div>);
}

/* ═══════════════ MAIN APP ═══════════════════════════════ */
export default function App(){
  const [screen,sScreen]=useState("landing");
  const [user,sUser]=useState(null);const [tok,sTok]=useState(null);const [place,sPlace]=useState(null);
  const [tab,sTab]=useState("home");const [mod,sMod]=useState(null);
  const [xp,sXp]=useState(0);const [streak,sStreak]=useState(1);const [done,sDone]=useState([]);const [badges,sBadges]=useState([]);
  const [enc,sEnc]=useState(null);const [theme,sTheme]=useState(THEMES.default);const [levelUp,sLevelUp]=useState(null);
  const [showAdmin,setShowAdmin]=useState(false);const [anonymousLB,setAnonymousLB]=useState(false);
  const [ghContent,setGhContent]=useState(null);const [ghLoading,setGhLoading]=useState(false);
  const [adminLevel,setAdminLevel]=useState("Beginner");
  const G=theme.G,LT=theme.LT,DK=theme.DK;
  const isAdmin = user?.email===ADMIN_EMAIL;
  const effectiveLevel = isAdmin ? adminLevel : (place?.level||"Beginner");

  // Load GitHub content when level changes
  useEffect(()=>{
    if(screen!=="app") return;
    setGhLoading(true);
    loadLevelContent(effectiveLevel).then(c=>{setGhContent(c);setGhLoading(false);});
  },[effectiveLevel, screen]);

  const loadDone=async(uid,tk)=>{
    if(isAdmin){sDone([]);return;} // admin: no restrictions
    try{const d=await get(`daily_progress?user_id=eq.${uid}&date=eq.${dateStr()}&completed=eq.true&select=module`,tk);sDone(Array.isArray(d)?d.map(x=>x.module):[]);}catch{}
  };
  const afterAuth=async u=>{sUser(u);sTok(u.token);sXp(u.xp||0);sStreak(u.streak||1);setAnonymousLB(u.anonymous_leaderboard||false);if(u.isNew)sScreen("placement");else{sPlace({level:u.level||"Beginner"});await loadDone(u.id,u.token);sScreen("app");}};
  const afterPlace=async r=>{sPlace(r);if(user?.id)await patch(`users?id=eq.${user.id}`,{level:r.level,placement_done:true},tok);sScreen("result");};
  const afterWritingPretest=async()=>{await loadDone(user?.id,tok);sScreen("app");};
  const getAcademicLevel=x=>x>=1500?"Advanced":x>=500?"Intermediate":"Beginner";
  const awardBadge=async name=>{if(badges.includes(name)||!user?.id)return;try{await post("user_badges",{user_id:user.id,badge_name:name},tok);}catch{}sBadges(p=>[...p,name]);};
  const addXp=async(n,modId)=>{
    if(!isAdmin && done.includes(modId)){sEnc(rnd(ENC));return;}
    if(isAdmin){sDone(p=>[...p,modId]);return;} // admin: no XP saved, no restrictions
    const pts=XP_MAP[modId]||n,nx=xp+pts;
    const oldLv=getAcademicLevel(xp),newLv=getAcademicLevel(nx);
    sXp(nx);sDone(p=>[...p,modId]);
    if(oldLv!==newLv){sPlace(p=>({...p,level:newLv}));sLevelUp(newLv);if(user?.id)await patch(`users?id=eq.${user.id}`,{level:newLv},tok);}
    if(user?.id){try{await upsert("daily_progress",{user_id:user.id,date:dateStr(),module:modId,completed:true,xp_earned:pts},tok);await patch(`users?id=eq.${user.id}`,{xp:nx},tok);if(modId==="peel")awardBadge("First Write");if(modId==="reading")awardBadge("First Reader");if(modId==="quiz")awardBadge("Quiz Taker");if(streak>=3)awardBadge("Streak 3");if(streak>=7)awardBadge("Streak 7");if(streak>=14)awardBadge("Streak 14");if(nx>=1500)awardBadge("UPGC Champion");}catch(e){console.error(e);}}
  };
  const toggleAnon=async()=>{const nv=!anonymousLB;setAnonymousLB(nv);if(user?.id)await patch(`users?id=eq.${user.id}`,{anonymous_leaderboard:nv},tok);sUser(u=>({...u,anonymous_leaderboard:nv}));};

  if(screen==="landing")  return<Landing go={sScreen}/>;
  if(screen==="login")    return<AuthForm mode="login"    onDone={afterAuth} onSwitch={()=>sScreen("register")}/>;
  if(screen==="register") return<AuthForm mode="register" onDone={afterAuth} onSwitch={()=>sScreen("login")}/>;
  if(screen==="placement")return<PlacementTest onDone={afterPlace}/>;
  if(screen==="result")   return<LevelResult result={place} onContinue={()=>sScreen("writing_pretest")}/>;
  if(screen==="writing_pretest")return<WritingPretest user={user} tok={tok} level={place?.level||"Beginner"} onDone={afterWritingPretest}/>;

  const lvl=getLvl(xp),pct=Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100),level=place?.level||"Beginner";

  if(showAdmin)return(<div style={{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:"#f0f7f4",fontFamily:"'Segoe UI',sans-serif"}}><div style={{background:"#1565c0",color:"#fff",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:900,fontSize:16}}>🗂 Admin Panel</div><button onClick={()=>setShowAdmin(false)} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"6px 14px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Exit</button></div><AdminPanel tok={tok} G={G} LT={LT} DK={DK} onClose={()=>setShowAdmin(false)}/></div>);

  return(<div style={{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:"#f0f7f4",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>
    <div style={{background:G,color:"#fff",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
      <div><div style={{fontWeight:900,fontSize:16}}>✍️ WriteUP UPGC</div><div style={{fontSize:11,opacity:.75}}>{user?.name} · {effectiveLevel}{isAdmin?" 👑":""}</div></div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>🔥{streak}</div><div style={{fontSize:10,opacity:.7}}>streak</div></div>
        <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>⭐{xp}</div><div style={{fontSize:10,opacity:.7}}>XP</div></div>
        <div style={{background:lvl.color,color:"#000",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:800}}>{lvl.name}</div>
      </div>
    </div>
    {isAdmin&&<div style={{background:"#1b4332",padding:"8px 18px",display:"flex",alignItems:"center",gap:8,overflowX:"auto"}}>
      <span style={{color:"#81c784",fontSize:11,fontWeight:700,flexShrink:0}}>👑 Admin — Test Level:</span>
      {["Beginner","Intermediate","Advanced"].map(lv=>(
        <button key={lv} onClick={()=>{setAdminLevel(lv);sDone([]);}} style={{background:adminLevel===lv?"#2D6A4F":"rgba(255,255,255,0.1)",color:"#fff",border:`1px solid ${adminLevel===lv?"#81c784":"rgba(255,255,255,0.3)"}`,borderRadius:16,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}>
          {lv==="Beginner"?"🌱":lv==="Intermediate"?"🌿":"🌳"} {lv}
        </button>
      ))}
      <span style={{color:"#81c784",fontSize:10,marginLeft:"auto",flexShrink:0}}>No XP saved</span>
    </div>}
    <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
      {mod?<div style={{padding:18}}>
        <button onClick={()=>{sMod(null);loadDone(user?.id,tok);}} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}><div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div><div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div></div>
        {mod.id==="grammar"    &&<GrammarMod    addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK} ghContent={ghContent} ghLoading={ghLoading}/>}
        {mod.id==="vocabulary" &&<VocabMod      addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK} ghContent={ghContent} ghLoading={ghLoading}/>}
        {mod.id==="peel"       &&<PeelMod       addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} level={effectiveLevel} G={G} LT={LT} DK={DK} ghContent={ghContent} ghLoading={ghLoading}/>}
        {mod.id==="reading"    &&<ReadingMod    addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK} ghContent={ghContent} ghLoading={ghLoading}/>}
        {mod.id==="mistakes"   &&<MistakesMod   addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK} ghContent={ghContent} ghLoading={ghLoading}/>}
        {mod.id==="quiz"       &&<QuizMod       addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK} ghContent={ghContent} ghLoading={ghLoading}/>}
      </div>
      :tab==="home"    ?<HomeScreen setMod={sMod} xp={xp} lvl={lvl} pct={pct} level={effectiveLevel} done={done} G={G} LT={LT} DK={DK}/>
      :tab==="profile" ?<ProfileScreen user={user} xp={xp} lvl={lvl} level={effectiveLevel} badges={badges} streak={streak} anonymousLB={anonymousLB} onToggleAnon={toggleAnon} G={G} LT={LT} DK={DK}/>
      :tab==="board"   ?<BoardScreen userId={user?.id} myXp={xp} tok={tok} anonymousLB={anonymousLB} G={G} LT={LT} DK={DK}/>
      :<SettingsScreen user={user} onTheme={sTheme} onLogout={()=>{sScreen("landing");sUser(null);sTok(null);}} onAdmin={()=>setShowAdmin(true)} G={G} LT={LT} DK={DK}/>}
    </div>
    {levelUp&&(<div onClick={()=>sLevelUp(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}}><div style={{fontSize:64,marginBottom:12}}>{levelUp==="Intermediate"?"🌿":"🌳"}</div><h2 style={{color:G,margin:"0 0 8px"}}>Level Up! 🎉</h2><div style={{background:LT,borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 16px"}}><span style={{fontSize:20,fontWeight:900,color:DK}}>{levelUp}</span></div><PBtn onClick={()=>sLevelUp(null)} style={{background:G}}>Continue 🚀</PBtn></div></div>)}
    {enc&&(<div onClick={()=>sEnc(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}}><div style={{fontSize:60,marginBottom:12}}>🌟</div><h3 style={{color:G,margin:"0 0 8px"}}>{enc.title}</h3><p style={{color:"#555",fontSize:14,lineHeight:1.7,margin:"0 0 6px"}}>{enc.body}</p><p style={{color:"#888",fontSize:13,fontStyle:"italic",margin:"0 0 20px"}}>{enc.sub}</p><PBtn onClick={()=>sEnc(null)} style={{background:G}}>Keep Practising! 💪</PBtn></div></div>)}
    {!mod&&(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:"#fff",borderTop:"1px solid #e8f5e9",display:"flex"}}>
      {[["home","🏠","Home"],["profile","👤","Profile"],["board","🏆","Ranks"],["settings","⚙️","More"]].map(([t,ic,lb])=>(<button key={t} onClick={()=>sTab(t)} style={{flex:1,background:"none",border:"none",padding:"10px 0",cursor:"pointer",color:tab===t?G:"#aaa",fontWeight:tab===t?800:400,fontSize:11}}><div style={{fontSize:22}}>{ic}</div>{lb}</button>))}
    </div>)}
  </div>);
}
