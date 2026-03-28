import { useState, useEffect } from "react";

/* ─── THEME ─────────────────────────────────────────── */
const THEMES = {
  default: { G:"#2D6A4F", LT:"#d8f3dc", DK:"#1b4332" },
  forest:  { G:"#1a3a2a", LT:"#c8e6c9", DK:"#0d1f17" },
  ocean:   { G:"#1565c0", LT:"#bbdefb", DK:"#0d47a1" },
};


/* ─── SUPABASE ───────────────────────────────────────── */
const SB  = "https://qnxeyoxashvbljjmqkrp.supabase.co";
const KEY = "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";
const h = t => ({ "Content-Type":"application/json","apikey":KEY,"Authorization":`Bearer ${t||KEY}`,"Prefer":"return=representation" });
const get    = (p,t)   => fetch(`${SB}/rest/v1/${p}`,{headers:h(t)}).then(r=>r.json()).catch(()=>[]);
const post   = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:h(t),body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const patch  = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"PATCH",headers:{...h(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const upsert = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:{...h(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const signUp = (e,p) => fetch(`${SB}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const signIn = (e,p) => fetch(`${SB}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

/* ─── HELPERS ────────────────────────────────────────── */
const dateStr = () => new Date().toISOString().slice(0,10);
const rnd     = a  => a[Math.floor(Math.random()*a.length)];
const wc      = s  => (s||"").trim().split(/\s+/).filter(Boolean).length;
const getLvl  = xp => {
  if(xp<500)  return {name:"Bronze",  color:"#cd7f32",min:0,   next:500};
  if(xp<1500) return {name:"Silver",  color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",    color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const XP_MAP = {grammar:5,vocabulary:5,reading:20,mistakes:10,quiz:10,peel:50};
const WMIN = {
  Beginner:     {point:10,explanation:20,evidence:10,link:10},
  Intermediate: {point:15,explanation:40,evidence:20,link:15},
  Advanced:     {point:25,explanation:60,evidence:25,link:20},
};
const UNLOCKS = [
  {xp:100, icon:"📝",label:"Advanced PEEL Topics",    desc:"4 challenging writing topics"},
  {xp:200, icon:"🌲",label:"Dark Forest Theme",        desc:"Deep green visual theme"},
  {xp:500, icon:"🌿",label:"Intermediate Level",       desc:"Auto-promotion"},
  {xp:1000,icon:"🌊",label:"Ocean Blue Theme",         desc:"Blue ocean visual theme"},
  {xp:1500,icon:"🌳",label:"Advanced Level",           desc:"Auto-promotion"},
  {xp:2000,icon:"🏆",label:"Certificate of Achievement",desc:"Download official PDF"},
];
const ENC = [
  {title:"🔥 Already done today!", body:"XP already earned for this module. Come back tomorrow!", sub:"Extra practice = extra mastery."},
  {title:"💪 Great dedication!",   body:"No XP today — you already earned it! Every session builds skills.", sub:"Consistency is the key."},
];

/* ─── UI ──────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
      <div style={{width:36,height:36,border:"4px solid #e0e0e0",borderTop:"4px solid #2D6A4F",borderRadius:"50%",animation:"__spin 1s linear infinite"}}/>
      <style>{`@keyframes __spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Card({children,style}){return <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",...style}}>{children}</div>;}
function PBtn({onClick,children,disabled,style}){
  return <button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",padding:"13px",borderRadius:12,border:"none",background:disabled?"#ccc":"#2D6A4F",color:"#fff",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;
}
function SBtn({onClick,children,style}){
  return <button onClick={onClick} style={{display:"block",width:"100%",padding:"12px",borderRadius:12,border:"2px solid #2D6A4F",background:"transparent",color:"#2D6A4F",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;
}

/* ─── CONTENT ─────────────────────────────────────────── */
const GRAMMAR_BANK = [
  {title:"Present Simple",q:"She ___ to the library every Tuesday.",opts:["go","goes","is going","has gone"],ans:1,exp:"Present simple is used for habits. 'Every Tuesday' signals a routine.",tip:"Use present simple for habits: always, every day, usually, never."},
  {title:"Uncountable Nouns",q:"Which sentence is correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,exp:"'Advice' is uncountable — no plural, no 'a/an'.",tip:"Uncountable: advice, information, furniture, equipment, news, progress."},
  {title:"Second Conditional",q:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,exp:"Second conditional = If + past simple + would + base verb.",tip:"If + past simple → would + base verb."},
  {title:"Relative Clauses",q:"The student ___ scored highest received a prize.",opts:["which","whose","who","whom"],ans:2,exp:"Use 'who' for people in relative clauses.",tip:"Who = people. Which = things. Whose = possession."},
  {title:"Articles A/An",q:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,exp:"'University' starts with a /j/ sound, so we use 'a', not 'an'.",tip:"Use 'an' before vowel SOUNDS: an hour. 'a' before consonant SOUNDS: a university."},
  {title:"Past Perfect",q:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,exp:"Past perfect = action completed BEFORE another past action.",tip:"Past perfect = had + past participle. Signal words: by the time, already, before."},
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
  {title:"'Assist' vs 'Attend'",fr:"J'ai assisté au cours ce matin",wrong:"I assisted the lecture this morning.",right:"I attended the lecture this morning.",rule:"'Assist' = to help someone. 'Attend' = to be present at an event.",ex:[{w:"She assisted the wedding.",r:"She attended the wedding."},{w:"All students must assist the orientation.",r:"All students must attend the orientation."}]},
  {title:"Uncountable Nouns",fr:"Des informations / Des conseils",wrong:"She gave me some informations and advices.",right:"She gave me some information and advice.",rule:"These are uncountable in English: information, advice, furniture, equipment, luggage, news, research, knowledge, progress.",ex:[{w:"The news are bad.",r:"The news is bad."},{w:"Can you give me some advices?",r:"Can you give me some advice?"}]},
  {title:"Future Plans",fr:"Je fais ça demain",wrong:"I study tomorrow instead of going out.",right:"I am going to study tomorrow instead of going out.",rule:"For personal future plans, use 'going to' + base verb.",ex:[{w:"She travels to Abidjan next week.",r:"She is going to travel to Abidjan next week."},{w:"I eat with my family tonight.",r:"I am going to eat with my family tonight."}]},
];

const QUIZ_SETS = [
  [{q:"Which sentence is correct?",opts:["She don't study.","She doesn't study.","She not study.","She studies not."],ans:1,exp:"Negative: subject + doesn't/don't + base verb."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts supporting an argument","An essay type"],ans:2,exp:"Evidence = facts or information that prove something true."},{q:"In PEEL, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link."},{q:"'She gave me some ___.' Correct:",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable."},{q:"'Actually' in English means:",opts:["Currently","In fact","Often","Always"],ans:1,exp:"'Actually' = 'in fact', not 'currently'."}],
  [{q:"'I ___ here since 2020.' Correct:",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect."},{q:"'Coherent' means:",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct."},{q:"'Information' is:",opts:["Countable","Uncountable","Proper","Abstract only"],ans:1,exp:"'Information' is uncountable."},{q:"Correct passive: 'The essay ___ by Friday.'",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle."}],
  [{q:"'Despite ___ tired, she studied.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing)."},{q:"'Fundamental' means:",opts:["Optional","Very difficult","Forming the essential base","Interesting"],ans:2,exp:"Fundamental = forming the foundation."},{q:"'I assisted the conference.' Error:",opts:["'I' → 'We'","'assisted' → 'attended'","'conference' wrong","No error"],ans:1,exp:"'Assist' = help. 'Attend' = be present at."},{q:"Reported speech: 'I am preparing.' → She said she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech."},{q:"Academic synonym for 'show':",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' = the academic equivalent of 'show'."}],
];

const PEEL_TOPICS = [
  {title:"Technology in Education",prompt:"Should technology be used more widely in African universities?",example:{point:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",explanation:"With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace.",evidence:"According to a UNESCO report (2022), students who regularly use digital learning tools score on average 35% higher on standardised assessments.",link:"Given this evidence, increasing technological integration in African universities is an urgent educational priority."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",example:{point:"Boys and girls must have completely equal access to education if African nations are to achieve their full economic and social potential.",explanation:"When girls are denied education, communities lose half their intellectual potential. Educated women invest more in their children's health and schooling, creating a positive generational cycle.",evidence:"The World Bank (2021) reported that every additional year a girl spends in education can increase her future earnings by up to 10%.",link:"For these reasons, gender equality in education is not simply a moral question — it is a strategic economic investment."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",example:{point:"For the majority of university students, social media causes significantly more harm than good.",explanation:"Students who spend excessive time on platforms like TikTok and Instagram report difficulty concentrating, as the constant stimulation undermines sustained focus.",evidence:"A study from Harvard University (2020) found that students spending more than 3 hours daily on social media had GPAs 20% lower than those limiting usage.",link:"While social media offers some networking benefits, the evidence shows its negative impact makes it far more harmful than helpful."}},
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

const MODS=[
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",   sub:"Random exercise every session",    color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",  sub:"Random word every session",        color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Writing Lab",      sub:"PEEL paragraph + AI assessment",   color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",     sub:"Random passage every session",     color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes", sub:"French-speaker errors explained",  color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",       sub:"5 random questions every session", color:"#fff8e1"},
];
const BADGES_DEF=[
  {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
  {icon:"🔥",name:"Streak 7",      desc:"Log in 7 days in a row"},
  {icon:"📐",name:"Grammar Master",desc:"Complete 30 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 30 vocabulary words"},
  {icon:"🍃",name:"PEEL Expert",   desc:"Submit 5 PEEL paragraphs"},
  {icon:"🌍",name:"African Reader",desc:"Complete 10 reading passages"},
];

/* ═══════════════════════════════════════════════════════
   PLACEMENT TEST
═══════════════════════════════════════════════════════ */
function PlacementTest({onDone}) {
  const [i,sI]=useState(0);
  const [sel,sSel]=useState(null);
  const [conf,sConf]=useState(false);
  const [sc,sSc]=useState({Grammar:0,Vocabulary:0,Reading:0});
  const q=PL_QUESTIONS[i];
  const secs=["Grammar","Vocabulary","Reading"];
  const icons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const si=secs.indexOf(q.s);

  const next=()=>{
    const newSc={...sc};
    if(sel===q.ans) newSc[q.s]=sc[q.s]+1;
    if(i<14){sSc(newSc);sI(x=>x+1);sSel(null);sConf(false);}
    else{
      const tot=newSc.Grammar+newSc.Vocabulary+newSc.Reading;
      onDone({level:tot>=11?"Advanced":tot>=6?"Intermediate":"Beginner",scores:newSc,total:tot});
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440,paddingTop:16}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:"#1b4332",margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Q {i+1}/15</span><span style={{color:"#2D6A4F",fontWeight:700}}>{Math.round((i/15)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
            <div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(i/15)*100}%`,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {secs.map((s,ix)=>(
              <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:ix<si?"#2D6A4F":ix===si?"#81c784":"#e0e0e0"}}/>
                <span style={{fontSize:11,color:ix<=si?"#2D6A4F":"#bbb",fontWeight:ix===si?700:400}}>{icons[s]} {s}</span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{marginBottom:14}}>
          <div style={{background:{"Grammar":"#e3f2fd","Vocabulary":"#fff3e0","Reading":"#f3e5f5"}[q.s],borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#1b4332"}}>{icons[q.s]} {q.s}</span>
          </div>
          <p style={{fontWeight:600,color:"#1b4332",fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p>
        </Card>
        {q.opts.map((o,oi)=>{
          const isC=oi===q.ans,isP=oi===sel;
          let bg="#fff",br="#e0e0e0";
          if(conf){if(isP&&isC){bg="#e8f5e9";br="#2D6A4F";}else if(isP&&!isC){bg="#ffebee";br="#e53935";}}
          else if(isP){bg="#d8f3dc";br="#2D6A4F";}
          return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
            {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
          </button>;
        })}
        {!conf
          ?<PBtn onClick={()=>{if(sel!==null)sConf(true);}} disabled={sel===null}>Confirm Answer</PBtn>
          :<PBtn onClick={next}>{i<14?"Next →":"See My Level 🎯"}</PBtn>
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
        <PBtn onClick={onContinue}>Start Learning →</PBtn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CORRECTION 3 — LANDING : logo et titre bien séparés
═══════════════════════════════════════════════════════ */
function Landing({go}) {
  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#1b4332 0%,#2D6A4F 100%)",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      padding:"40px 28px",
      color:"#fff",
      textAlign:"center",
      fontFamily:"'Segoe UI',sans-serif"
    }}>
      {/* Logo seul, bien séparé du titre */}
      <div style={{fontSize:80,lineHeight:1,marginBottom:20}}>✍️</div>

      {/* Titre et sous-titre */}
      <h1 style={{
        fontSize:34,
        fontWeight:900,
        margin:"0 0 10px",
        color:"#ffffff",
        letterSpacing:0.5,
        lineHeight:1.2
      }}>WriteUP UPGC</h1>
      <p style={{opacity:.9,fontSize:16,marginBottom:6,color:"#fff",margin:"0 0 8px"}}>
        Academic English for L2 Students
      </p>
      <p style={{opacity:.6,fontSize:13,marginBottom:48,color:"#fff"}}>
        Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire
      </p>

      {/* Boutons */}
      <div style={{display:"flex",flexDirection:"column",gap:14,width:"100%",maxWidth:320,marginBottom:48}}>
        <button onClick={()=>go("login")} style={{
          background:"#fff",color:"#2D6A4F",border:"none",borderRadius:14,
          padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer",width:"100%",
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)"
        }}>Log In</button>
        <button onClick={()=>go("register")} style={{
          background:"transparent",color:"#fff",border:"2px solid rgba(255,255,255,0.7)",
          borderRadius:14,padding:"16px",fontWeight:800,fontSize:16,cursor:"pointer",width:"100%"
        }}>Sign Up</button>
      </div>

      <div style={{display:"flex",gap:18,opacity:.6,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>
        {["🌐 PWA","🆓 Free","🎯 Level Test","📚 Rich Content","💾 Cloud Save"].map(t=><span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */
function AuthForm({mode,onDone,onSwitch}) {
  const [f,sF]=useState({name:"",email:"",pw:""});
  const [load,sL]=useState(false);
  const [err,sErr]=useState("");
  const upd=k=>e=>sF(p=>({...p,[k]:e.target.value}));

  const submit=async()=>{
    if(!f.email||!f.pw) return sErr("Please fill all fields.");
    if(mode==="register"&&!f.name) return sErr("Please enter your name.");
    sL(true);sErr("");
    try{
      if(mode==="register"){
        const res=await signUp(f.email,f.pw);
        if(res.error){sErr(res.error.message||"Registration failed.");sL(false);return;}
        const uid=res.user?.id;
        if(uid){
          await post("users",{id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",placement_done:false,last_login:dateStr()},res.access_token);
          onDone({id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:true,token:res.access_token});
        }
      }else{
        const res=await signIn(f.email,f.pw);
        if(res.error){sErr("Invalid email or password.");sL(false);return;}
        const uid=res.user?.id,tok=res.access_token;
        const rows=await get(`users?id=eq.${uid}`,tok);
        const p=rows?.[0];
        if(p){
          const diff=Math.floor((new Date()-new Date(p.last_login))/(86400000));
          const ns=diff===1?p.streak+1:diff>1?1:p.streak;
          await patch(`users?id=eq.${uid}`,{last_login:dateStr(),streak:ns},tok);
          onDone({...p,streak:ns,isNew:!p.placement_done,token:tok});
        }else sErr("Profile not found. Please sign up.");
      }
    }catch{sErr("Connection error. Please try again.");}
    sL(false);
  };

  const inp=(ph,k,type="text")=>(
    <input placeholder={ph} type={type} value={f[k]} onChange={upd(k)}
      style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:"#2D6A4F",margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register"&&inp("Full name","name")}
        {inp("Email","email","email")}
        {inp("Password (min. 6 chars)","pw","password")}
        {err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        {load?<Spinner/>:<PBtn onClick={submit}>{mode==="login"?"Log In":"Register & Take Placement Test"}</PBtn>}
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="login"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:"#2D6A4F",cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span>
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MODULE HELPERS
═══════════════════════════════════════════════════════ */
function DoneScreen({xp,onBack,earn,G}) {
  useEffect(()=>{earn&&earn();},[]);
  return (
    <div style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#555"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p>
      <p style={{color:"#aaa",fontSize:13}}>Progress saved ✅</p>
      <PBtn onClick={onBack} style={{background:G}}>← Back to Modules</PBtn>
    </div>
  );
}

function GrammarMod({addXp,onBack,G,LT,DK}) {
  const [c]=useState(()=>rnd(GRAMMAR_BANK));
  const [sel,sSel]=useState(null);
  const [done,sDone]=useState(false);
  const conf=sel!==null,correct=sel===c.ans;
  if(done) return <DoneScreen xp={XP_MAP.grammar} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.grammar,"grammar")}/>;
  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}><div style={{fontSize:12,color:"#555"}}>📚 Topic: <strong>{c.title}</strong></div></Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.q}</p></Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.exp}</p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Earn +{XP_MAP.grammar} XP →</PBtn>:<SBtn onClick={onBack}>← Try another exercise</SBtn>}
      </>}
    </div>
  );
}

function VocabMod({addXp,onBack,G,LT,DK}) {
  const [c]=useState(()=>rnd(VOCAB_BANK));
  const [phase,sPhase]=useState("learn");
  const [sel,sSel]=useState(null);
  const [done,sDone]=useState(false);
  const conf=sel!==null,correct=sel===c.ans;
  if(done) return <DoneScreen xp={XP_MAP.vocabulary} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.vocabulary,"vocabulary")}/>;
  if(phase==="learn") return (
    <div>
      <Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><h2 style={{color:G,margin:"0 0 2px",fontSize:26}}>{c.word}</h2><div style={{color:"#999",fontSize:12}}>{c.ph} · <em>{c.pos}</em></div></div>
          <span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.fr}</span>
        </div>
        <div style={{background:"#f9fbe7",borderRadius:10,padding:12,marginBottom:10}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>📖 Definition</div>
          <p style={{color:"#333",fontSize:14,margin:0,lineHeight:1.7}}>{c.def}</p>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:10,padding:12}}>
          <div style={{fontSize:12,color:"#888",marginBottom:4}}>🧠 Memory Tip</div>
          <p style={{color:DK,fontSize:13,margin:0,lineHeight:1.6}}>{c.tip}</p>
        </div>
      </Card>
      <PBtn onClick={()=>sPhase("practice")} style={{background:G}}>Practice this word →</PBtn>
    </div>
  );
  return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.ex}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}
          </p>
        </Card>
        {correct?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Earn +{XP_MAP.vocabulary} XP →</PBtn>:<SBtn onClick={onBack}>← Try another word</SBtn>}
      </>}
    </div>
  );
}

function ReadingMod({addXp,onBack,G,LT,DK}) {
  const [c]=useState(()=>rnd(READING_BANK));
  const [phase,sP]=useState("read");
  const [ans,sA]=useState([null,null,null]);
  const [checked,sC]=useState(false);
  const [done,sD]=useState(false);
  const score=ans.filter((a,i)=>a===c.qs[i]?.ans).length;
  if(done) return <DoneScreen xp={XP_MAP.reading} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.reading,"reading")}/>;
  if(phase==="read") return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        {c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <div style={{fontWeight:700,color:"#e65100",marginBottom:10,fontSize:13}}>📖 Glossary</div>
        {c.gloss.map(g=><div key={g.w} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}><strong style={{color:DK,minWidth:110,flexShrink:0}}>{g.w}</strong><span style={{color:"#555",lineHeight:1.5}}>{g.d}</span></div>)}
      </Card>
      <PBtn onClick={()=>sP("quiz")} style={{background:G}}>Answer Questions →</PBtn>
    </div>
  );
  return (
    <div>
      <h4 style={{color:DK,marginBottom:14}}>📝 Comprehension Questions</h4>
      {c.qs.map((q,qi)=>(
        <Card key={qi} style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10,lineHeight:1.6}}>{qi+1}. {q.q}</p>
          {q.opts.map((o,oi)=>{
            const isC=oi===q.ans,isP=oi===ans[qi];
            let bg="#f9f9f9",br="#e0e0e0";
            if(checked){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC){bg="#fff9c4";br="#f9a825";}}
            else if(isP){bg=LT;br=G;}
            return <button key={oi} onClick={()=>{if(!checked)sA(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${br}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":checked&&!isP&&isC?"💡 ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ?<PBtn onClick={()=>sC(true)} disabled={ans.includes(null)} style={{background:ans.includes(null)?"#ccc":G}}>Check Answers</PBtn>
        :<div>
          <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
            <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong>
          </Card>
          <PBtn onClick={()=>sD(true)} style={{background:G}}>Earn +{XP_MAP.reading} XP</PBtn>
        </div>}
    </div>
  );
}

function MistakesMod({addXp,onBack,G,LT,DK}) {
  const [c]=useState(()=>rnd(MISTAKES_BANK));
  const [done,sD]=useState(false);
  if(done) return <DoneScreen xp={XP_MAP.mistakes} onBack={onBack} G={G} earn={()=>addXp(XP_MAP.mistakes,"mistakes")}/>;
  return (
    <div>
      <Card style={{borderLeft:"4px solid #ff9800",marginBottom:14}}>
        <span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.title}</span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
          <span style={{fontSize:18}}>🇫🇷</span>
          <span style={{fontSize:13,color:"#666",fontStyle:"italic"}}>French pattern: <strong>{c.fr}</strong></span>
        </div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:8}}>❌ Common Error</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong}"</p></Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>✅ Correct English</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.right}"</p></Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}><div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:8}}>📐 Rule</div><p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p></Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>📝 More Examples</div>
        {c.ex.map((e,i)=><div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<c.ex.length-1?"1px solid #f0f0f0":"none"}}>
          <div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.w}</div>
          <div style={{fontSize:13,color:G}}>✅ {e.r}</div>
        </div>)}
      </Card>
      <PBtn onClick={()=>sD(true)} style={{background:G}}>Got it! Earn +{XP_MAP.mistakes} XP</PBtn>
    </div>
  );
}

function QuizMod({addXp,onBack,G,LT,DK}) {
  const [qs]=useState(()=>rnd(QUIZ_SETS));
  const [i,sI]=useState(0);
  const [sel,sSel]=useState(null);
  const [score,sScore]=useState(0);
  const [review,sReview]=useState(false);
  const [done,sDone]=useState(false);
  const q=qs[i],conf=sel!==null,correct=sel===q?.ans;
  if(done) return <DoneScreen xp={score*6} onBack={onBack} G={G} earn={()=>addXp(score*6,"quiz")}/>;
  if(review) return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#555",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
      </Card>
      {score>0?<PBtn onClick={()=>sDone(true)} style={{background:G}}>Claim +{score*6} XP →</PBtn>:<SBtn onClick={onBack}>← No XP — Try again tomorrow</SBtn>}
    </div>
  );
  const next=()=>{if(i<qs.length-1){sI(x=>x+1);sSel(null);}else sReview(true);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}>
        <span>Q {i+1}/{qs.length}</span><span style={{color:G,fontWeight:700}}>Score: {score}/{i+(conf?1:0)}</span>
      </div>
      <div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}>
        <div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const isC=oi===q.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg:"#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>{if(!conf){sSel(oi);if(oi===q.ans)sScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p>
        </Card>
        <PBtn onClick={next} style={{background:G}}>{i<qs.length-1?"Next →":"See Results"}</PBtn>
      </>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CORRECTION 1 — PEEL : appel via /api/generate (Vercel)
   avec fallback direct Anthropic si /api/generate échoue
═══════════════════════════════════════════════════════ */
function PeelMod({addXp,onBack,level,G,LT,DK}) {
  const [phase,sPhase]=useState("intro");
  const [tTab,sTTab]=useState(0);
  const [c]=useState(()=>rnd(PEEL_TOPICS));
  const [step,sStep]=useState(0);
  const [vals,sVals]=useState({point:"",explanation:"",evidence:"",link:""});
  const [fb,sFb]=useState(null);
  const [aiLoad,sAiLoad]=useState(false);
  const [attempts,sAtt]=useState(0);
  const keys=["point","explanation","evidence","link"];
  const labels=["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minW=WMIN[level]||WMIN.Beginner;

  const PARTS=[
    {letter:"P",name:"Point",color:"#e3f2fd",icon:"📌",role:"Your opening sentence — state your main argument clearly.",dos:"Start with a strong, confident statement. Be specific.",donts:"Do not begin with a question. Do not be vague."},
    {letter:"E",name:"Explanation",color:"#e8f5e9",icon:"💬",role:"Explain WHY your point is true. Give 2-3 logical reasons.",dos:"Use: 'Furthermore', 'In addition', 'This means that'.",donts:"Do not simply repeat your Point."},
    {letter:"E",name:"Evidence",color:"#fff3e0",icon:"📚",role:"Provide concrete proof — a statistic, study, or expert quote.",dos:"Introduce: 'According to...'. Name your source.",donts:"Never use vague 'studies show' without naming the study."},
    {letter:"L",name:"Link",color:"#fce4ec",icon:"🔗",role:"Close the paragraph by connecting back to the essay question.",dos:"Use: 'Therefore...', 'This demonstrates that...'",donts:"Do not introduce new arguments."},
  ];

  /* ── Appel IA robuste : /api/generate en priorité, fallback direct ── */
  const callAI=async(isRevision)=>{
    sAiLoad(true);sFb(null);

    const systemPrompt=`You are a strict English writing examiner for a ${level} university student in Côte d'Ivoire. You MUST respond ONLY with a valid JSON object. Start with { and end with }. Absolutely no text before or after the JSON.`;

    const userPrompt=`Score this PEEL paragraph. Topic: "${c.prompt}"
POINT: ${vals.point}
EXPLANATION: ${vals.explanation}
EVIDENCE: ${vals.evidence}
LINK: ${vals.link}
Word minimums (${level}): Point=${minW.point}w, Explanation=${minW.explanation}w, Evidence=${minW.evidence}w, Link=${minW.link}w

Return ONLY this JSON (replace values with your assessment):
{
  "point_score": 3,
  "explanation_score": 3,
  "evidence_score": 2,
  "link_score": 2,
  "grammar_score": 2,
  "length_score": 1,
  "point_feedback": "Your detailed feedback on the Point here.",
  "explanation_feedback": "Your detailed feedback on the Explanation here.",
  "evidence_feedback": "Your detailed feedback on the Evidence here.",
  "link_feedback": "Your detailed feedback on the Link here.",
  "grammar_note": "Note one grammar strength and one weakness.",
  "priority_action": "The single most important thing to improve."
}
Scoring rules: point_score 0-4, explanation_score 0-4, evidence_score 0-4, link_score 0-3, grammar_score 0-3, length_score 0-2. Total=/20. Pass=10/20.`;

    /* ── Fonction commune de parsing de la réponse ── */
    const parseResponse=(text)=>{
      const match=text.match(/\{[\s\S]*\}/);
      if(!match) throw new Error("No JSON found");
      const p=JSON.parse(match[0]);
      const safe=(v,max)=>Math.min(max,Math.max(0,isNaN(Number(v))?0:Number(v)));
      const sc={
        point:   safe(p.point_score,4),
        expl:    safe(p.explanation_score,4),
        evidence:safe(p.evidence_score,4),
        link:    safe(p.link_score,3),
        grammar: safe(p.grammar_score,3),
        length:  safe(p.length_score,2),
      };
      sc.total=sc.point+sc.expl+sc.evidence+sc.link+sc.grammar+sc.length;
      return {
        sc,
        passed:sc.total>=10,
        feedbacks:{
          point:    String(p.point_feedback||""),
          expl:     String(p.explanation_feedback||""),
          evidence: String(p.evidence_feedback||""),
          link:     String(p.link_feedback||""),
          grammar:  String(p.grammar_note||""),
          action:   String(p.priority_action||""),
        }
      };
    };

    try{
      let result=null;

      /* ── Tentative 1 : /api/generate (backend Vercel avec ANTHROPIC_KEY) ── */
      try{
        const res=await fetch("/api/generate",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            prompt:`${systemPrompt}\n\n${userPrompt}`,
            maxTokens:800
          })
        });
        if(res.ok){
          const data=await res.json();
          if(data.text) result=parseResponse(data.text);
        }
      }catch(e1){
        console.warn("Backend /api/generate failed, trying direct API:",e1.message);
      }

      /* ── Tentative 2 : appel direct Anthropic (développement local) ── */
      if(!result){
        const res2=await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514",
            max_tokens:800,
            system:systemPrompt,
            messages:[{role:"user",content:userPrompt}]
          })
        });
        const data2=await res2.json();
        const raw=data2.content?.find(b=>b.type==="text")?.text||"";
        result=parseResponse(raw);
      }

      sFb(result);
      sAtt(a=>a+1);
      sPhase("feedback");

    }catch(e){
      console.error("PEEL AI error:",e);
      sFb({
        sc:{point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0},
        passed:false,
        feedbacks:{
          point:"AI feedback unavailable.",
          expl:"",evidence:"",link:"",
          grammar:"",
          action:`Error: ${e.message}. Please check that ANTHROPIC_KEY is set in Vercel environment variables.`
        }
      });
      sPhase("feedback");
    }
    sAiLoad(false);
  };

  const TABS=["About PEEL","P — Point","E — Explanation","E — Evidence","L — Link","❌ Weak","✅ Strong"];

  if(phase==="intro") return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
        <div style={{fontSize:11,opacity:.8,marginBottom:4}}>✍️ Writing Lab · Level: {level}</div>
        <h3 style={{margin:"0 0 6px",fontSize:18}}>The PEEL Method</h3>
        <p style={{margin:0,fontSize:13,opacity:.85,lineHeight:1.6}}>Learn to write structured academic paragraphs step by step.</p>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {TABS.map((t,ix)=>(
          <button key={ix} onClick={()=>sTTab(ix)} style={{background:tTab===ix?G:"#fff",color:tTab===ix?"#fff":DK,border:`1.5px solid ${tTab===ix?G:"#ddd"}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>{t}</button>
        ))}
      </div>
      {tTab===0&&<div>
        <Card style={{background:LT,marginBottom:12,borderLeft:`4px solid ${G}`}}>
          <h4 style={{color:G,margin:"0 0 8px"}}>❓ What is PEEL?</h4>
          <p style={{fontSize:14,color:"#333",lineHeight:1.8,margin:0}}>PEEL is a method for writing clear academic paragraphs: <strong>P</strong>oint, <strong>E</strong>xplanation, <strong>E</strong>vidence, <strong>L</strong>ink.</p>
        </Card>
        <Card style={{background:"#fff8e1",marginBottom:12}}>
          <h4 style={{color:"#e65100",margin:"0 0 10px"}}>📏 Your Word Minimums ({level})</h4>
          {keys.map(k=><div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #ffe082"}}>
            <span style={{fontWeight:600,color:DK,textTransform:"capitalize"}}>{k}</span>
            <span style={{color:"#e65100",fontWeight:700}}>min {minW[k]} words</span>
          </div>)}
        </Card>
      </div>}
      {tTab>=1&&tTab<=4&&(()=>{const p=PARTS[tTab-1];return <div>
        <Card style={{background:p.color,marginBottom:12,borderLeft:`4px solid ${G}`}}>
          <div style={{fontSize:32,marginBottom:6}}>{p.icon}</div>
          <h3 style={{color:DK,margin:"0 0 6px"}}>{p.letter} — {p.name}</h3>
          <p style={{fontSize:14,color:"#444",lineHeight:1.8,margin:0}}>{p.role}</p>
        </Card>
        <Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontWeight:700,color:G,marginBottom:6,fontSize:13}}>✅ DO</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.dos}</p></Card>
        <Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontWeight:700,color:"#c62828",marginBottom:6,fontSize:13}}>❌ DON'T</div><p style={{fontSize:13,color:"#333",lineHeight:1.8,margin:0}}>{p.donts}</p></Card>
      </div>;})()} 
      {tTab===5&&<Card style={{background:"#ffebee",marginBottom:14,borderLeft:"4px solid #e53935"}}>
        <div style={{fontWeight:800,color:"#c62828",fontSize:15,marginBottom:10}}>❌ Weak Paragraph</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.8,fontStyle:"italic",background:"#fff",borderRadius:10,padding:12,margin:0}}>Technology is good for students. Many students use phones. The internet has a lot of information. So technology is important.</p>
        <div style={{marginTop:12,fontSize:13,color:"#c62828",lineHeight:1.8}}><strong>Problems:</strong> No specific argument. No reasoning. No evidence. Link too short.</div>
      </Card>}
      {tTab===6&&<Card style={{background:"#e8f5e9",marginBottom:14,borderLeft:`4px solid ${G}`}}>
        <div style={{fontWeight:800,color:G,fontSize:15,marginBottom:10}}>✅ Strong Paragraph</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.9,background:"#fff",borderRadius:10,padding:12,margin:0}}>{c.example.point} {c.example.explanation} {c.example.evidence} {c.example.link}</p>
      </Card>}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        {tTab>0&&<SBtn onClick={()=>sTTab(t=>t-1)} style={{flex:"none",width:"auto",padding:"12px 20px"}}>← Prev</SBtn>}
        {tTab<TABS.length-1
          ?<PBtn style={{flex:1,background:G}} onClick={()=>sTTab(t=>t+1)}>Next →</PBtn>
          :<PBtn style={{flex:1,background:G}} onClick={()=>sPhase("write")}>✍️ Start Writing</PBtn>}
      </div>
    </div>
  );

  if(phase==="write") return (
    <div>
      {attempts>0&&<Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision #{attempts} — Apply all feedback carefully.</p></Card>}
      <Card style={{background:LT,marginBottom:14}}>
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
      {(()=>{const p=PARTS[step];return <div>
        <Card style={{background:p.color,marginBottom:10,borderLeft:`4px solid ${G}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div><div style={{fontSize:12,color:"#555",marginTop:4,lineHeight:1.5}}>{p.role}</div></div>
            <div style={{background:G,color:"#fff",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,textAlign:"center",flexShrink:0}}>min {minW[keys[step]]}<br/>words</div>
          </div>
        </Card>
        <Card style={{background:"#f0f7f4",marginBottom:10}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>📋 Model:</div>
          <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.8,fontStyle:"italic"}}>"{c.example[keys[step]]}"</p>
        </Card>
        <textarea value={vals[keys[step]]} onChange={e=>sVals(p=>({...p,[keys[step]]:e.target.value}))}
          placeholder={`Write your ${keys[step]} here… (min ${minW[keys[step]]} words)`} rows={5}
          style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wc(vals[keys[step]])>=minW[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4,marginBottom:10}}>
          <span style={{color:wc(vals[keys[step]])>=minW[keys[step]]?G:wc(vals[keys[step]])>0?"#f57c00":"#aaa",fontWeight:600}}>
            {wc(vals[keys[step]])} / {minW[keys[step]]} words {wc(vals[keys[step]])>=minW[keys[step]]?"✅":wc(vals[keys[step]])>0?"⚠️":""}
          </span>
        </div>
        <PBtn onClick={()=>{if(step<3)sStep(s=>s+1);else callAI(attempts>0);}}
          disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoad}
          style={{background:aiLoad?"#ccc":G}}>
          {aiLoad?"⏳ Analysing your paragraph…":step<3?`Next: ${labels[step+1]} →`:"🤖 Submit for AI Assessment"}
        </PBtn>
      </div>;})()} 
    </div>
  );

  if(phase==="feedback"&&fb){
    const CRIT=[
      {id:"point",  label:"Point (Clarity)",    max:4},
      {id:"expl",   label:"Explanation (Logic)", max:4},
      {id:"evidence",label:"Evidence (Quality)", max:4},
      {id:"link",   label:"Link (Cohesion)",     max:3},
      {id:"grammar",label:"Grammar & Vocab",     max:3},
      {id:"length", label:"Length",              max:2},
    ];
    const fbLabels={point:fb.feedbacks.point,expl:fb.feedbacks.expl,evidence:fb.feedbacks.evidence,link:fb.feedbacks.link};
    const headerBg=fb.sc.total>=15?`linear-gradient(135deg,${DK},${G})`:fb.sc.total>=10?"linear-gradient(135deg,#e65100,#ff9800)":"linear-gradient(135deg,#c62828,#e53935)";
    return (
      <div>
        <Card style={{background:headerBg,color:"#fff",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:13,opacity:.85,marginBottom:4}}>Attempt #{attempts} · {fb.passed?"✅ PASSED":"❌ REVISION REQUIRED"}</div>
          <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{fb.sc.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div>
          <div style={{fontSize:14,fontWeight:700,opacity:.9}}>
            {fb.sc.total>=17?"🏆 Excellent":fb.sc.total>=14?"👏 Good":fb.sc.total>=10?"📈 Passed":"💪 Below Average"}
          </div>
        </Card>
        <Card style={{marginBottom:14}}>
          <h4 style={{color:DK,margin:"0 0 12px"}}>📋 Score Breakdown</h4>
          {CRIT.map(cr=>{
            const s=fb.sc[cr.id]||0;
            const pct=Math.round((s/cr.max)*100);
            return <div key={cr.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:600,color:DK}}>{cr.label}</span>
                <span style={{color:pct>=75?G:pct>=50?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span>
              </div>
              <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
                <div style={{background:pct>=75?G:pct>=50?"#f57c00":"#e53935",height:8,borderRadius:99,width:`${pct}%`,transition:"width .6s"}}/>
              </div>
              {fbLabels[cr.id]&&<p style={{fontSize:12,color:"#555",margin:"6px 0 0",lineHeight:1.6}}>{fbLabels[cr.id]}</p>}
            </div>;
          })}
        </Card>
        {fb.feedbacks.grammar&&<Card style={{background:"#e3f2fd",marginBottom:14}}>
          <div style={{fontWeight:700,color:"#1565c0",marginBottom:6,fontSize:13}}>✏️ Grammar & Vocabulary</div>
          <p style={{fontSize:13,color:"#333",margin:0,lineHeight:1.7}}>{fb.feedbacks.grammar}</p>
        </Card>}
        {fb.feedbacks.action&&<Card style={{background:"#fff8e1",marginBottom:14}}>
          <div style={{fontWeight:700,color:"#e65100",marginBottom:6,fontSize:13}}>🎯 Priority Action</div>
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{fb.feedbacks.action}</p>
        </Card>}
        {fb.passed
          ?<PBtn onClick={()=>addXp(XP_MAP.peel,"peel")} style={{background:G}}>Claim +{XP_MAP.peel} XP & Continue →</PBtn>
          :<div>
            <Card style={{background:"#fff3e0",marginBottom:14,borderLeft:"3px solid #f57c00"}}>
              <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.8}}>🔄 Read the feedback above carefully, apply all fixes, then resubmit. You need 10/20 to pass.</p>
            </Card>
            <PBtn onClick={()=>{sPhase("write");sStep(0);}} style={{background:G}}>🔄 Revise My Paragraph →</PBtn>
          </div>
        }
      </div>
    );
  }
  return <Spinner/>;
}

/* ─── HOME ─────────────────────────────────────────── */
function HomeScreen({setMod,xp,lvl,pct,level,done,G,LT,DK}) {
  const next=UNLOCKS.find(u=>u.xp>xp);
  const prev=[...UNLOCKS].reverse().find(u=>u.xp<=xp);
  return (
    <div style={{padding:18}}>
      <Card style={{marginBottom:14,background:`linear-gradient(135deg,${DK},${G})`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📅 {dateStr()}</div>
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
        <div style={{background:"#e8f5e9",borderRadius:99,height:10}}>
          <div style={{background:G,height:10,borderRadius:99,width:`${pct}%`,transition:"width .5s"}}/>
        </div>
        <p style={{color:"#888",fontSize:12,marginTop:6}}>{lvl.next-xp} XP to next level</p>
      </Card>
      {next&&(
        <Card style={{marginBottom:14,background:"#fff8e1",borderLeft:"3px solid #f9a825"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#e65100",fontWeight:700,marginBottom:2}}>🔓 Next Unlock — {next.xp} XP</div>
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
        <button key={m.id} onClick={()=>setMod(m)} style={{width:"100%",background:"#fff",border:`1.5px solid ${LT}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",textAlign:"left",marginBottom:10,fontFamily:"inherit"}}>
          <div style={{background:m.color,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:DK,fontSize:14}}>{m.name}</div>
            <div style={{color:"#888",fontSize:12,marginTop:2}}>{m.sub}</div>
          </div>
          {done.includes(m.id)
            ?<span style={{background:"#e8f5e9",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700}}>✅ Done</span>
            :<span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>+{XP_MAP[m.id]} XP</span>}
        </button>
      ))}
    </div>
  );
}

function ProfileScreen({user,xp,lvl,level,badges,streak,G,LT,DK}) {
  return (
    <div style={{padding:18}}>
      <div style={{background:`linear-gradient(135deg,${DK},${G})`,borderRadius:20,padding:24,color:"#fff",textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:52,marginBottom:8}}>👤</div>
        <div style={{fontWeight:900,fontSize:20}}>{user?.name}</div>
        <div style={{opacity:.75,fontSize:13,marginBottom:6}}>{user?.email}</div>
        <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:8}}>
          {[["⭐",xp,"XP"],["🔥",streak,"Streak"],["🏅",lvl.name,"Level"]].map(([ic,v,lb])=>(
            <div key={lb}><div style={{fontWeight:800,fontSize:17}}>{v}</div><div style={{fontSize:11,opacity:.75}}>{lb}</div></div>
          ))}
        </div>
      </div>
      <h3 style={{color:DK,marginBottom:12}}>🏅 Badges</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {BADGES_DEF.map(b=>{
          const earned=badges.includes(b.name);
          return <div key={b.name} style={{background:earned?"#fff":"#f5f5f5",borderRadius:14,padding:14,opacity:earned?1:.55,boxShadow:earned?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>
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

function BoardScreen({userId,myXp,tok,G,LT,DK}) {
  const [lb,sLb]=useState([]);
  const [load,sLoad]=useState(true);
  useEffect(()=>{
    (async()=>{
      try{
        const d=await get("users?select=id,name,xp,level,streak&order=xp.desc&limit=10",tok);
        if(Array.isArray(d)) sLb(d.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp));
      }catch{}
      sLoad(false);
    })();
  },[myXp]);
  const medals=["🥇","🥈","🥉"];
  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>🏆 Leaderboard</h3>
      {load&&<Spinner/>}
      {!load&&lb.length===0&&<Card style={{textAlign:"center",padding:32}}><div style={{fontSize:40,marginBottom:8}}>🏆</div><p style={{color:"#888"}}>No students yet. Be the first!</p></Card>}
      {lb.map((l,ix)=>{
        const isMe=l.id===userId,r=ix+1;
        return <div key={l.id} style={{background:isMe?LT:"#fff",border:isMe?`2px solid ${G}`:"1px solid #eee",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:10,boxShadow:r<=3?"0 2px 12px rgba(0,0,0,0.08)":"none"}}>
          <div style={{width:36,textAlign:"center",flexShrink:0}}>{r<=3?<span style={{fontSize:24}}>{medals[ix]}</span>:<span style={{fontSize:14,fontWeight:800,color:"#bbb"}}>#{r}</span>}</div>
          <div style={{width:36,height:36,borderRadius:"50%",background:isMe?G:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:isMe?"#fff":"#999"}}>{l.name?.charAt(0)?.toUpperCase()||"?"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:isMe?800:600,color:isMe?G:DK,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}{isMe?" (You)":""}</div>
            {l.streak>0&&<span style={{fontSize:11,color:"#888"}}>🔥{l.streak}</span>}
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontWeight:800,color:G,fontSize:15}}>⭐{isMe?myXp:l.xp}</div>
          </div>
        </div>;
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CORRECTION 5 — SETTINGS : thèmes verrouillés + popup de déblocage
═══════════════════════════════════════════════════════ */
function SettingsScreen({user,onTheme,onLogout,G,LT,DK,xp}) {
  const [activeT,sAT]=useState("default");
  const [popup,sPopup]=useState(null); // theme key à confirmer

  const THEME_LIST=[
    {k:"default",name:"🌿 Default Green",req:0,   desc:"The original UPGC green theme."},
    {k:"forest", name:"🌲 Dark Forest",   req:200, desc:"Deep forest green — darker and more focused."},
    {k:"ocean",  name:"🌊 Ocean Blue",    req:1000,desc:"Calm ocean blue for a fresh look."},
  ];

  const applyTheme=(k)=>{
    sAT(k);
    onTheme(THEMES[k]);
    sPopup(null);
  };

  const handleClick=(t)=>{
    if(xp<t.req) return; // bouton désactivé, rien
    if(t.k===activeT) return; // déjà actif
    sPopup(t); // ouvre le popup de confirmation
  };

  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>⚙️ Settings</h3>

      {/* ── Thèmes ── */}
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>🎨 Visual Themes</div>
        {THEME_LIST.map(t=>{
          const locked=xp<t.req;
          const isActive=activeT===t.k;
          return (
            <div key={t.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"12px 14px",borderRadius:12,background:isActive?LT:locked?"#f5f5f5":"#fff",border:isActive?`2px solid ${G}`:"1.5px solid #eee",opacity:locked?.5:1}}>
              <div>
                <div style={{fontWeight:700,color:DK,fontSize:13}}>{t.name}</div>
                {locked
                  ? <div style={{fontSize:11,color:"#e65100",marginTop:2}}>🔒 Unlocks at {t.req} XP — {t.req-xp} XP to go</div>
                  : <div style={{fontSize:11,color:"#888",marginTop:2}}>{t.desc}</div>}
              </div>
              {!locked&&(
                <button
                  onClick={()=>handleClick(t)}
                  style={{background:isActive?G:"#e0e0e0",color:isActive?"#fff":"#555",border:"none",borderRadius:10,padding:"7px 16px",fontWeight:700,fontSize:12,cursor:isActive?"default":"pointer",fontFamily:"inherit",flexShrink:0}}>
                  {isActive?"Active ✓":"Apply"}
                </button>
              )}
            </div>
          );
        })}
      </Card>

      {/* ── Compte ── */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14}}>👤 Account</div>
        <div style={{fontSize:13,color:"#888",marginTop:4}}>{user?.name} · {user?.email}</div>
      </Card>

      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14}}>🔒 Privacy</div>
        <div style={{fontSize:12,color:"#888",marginTop:4}}>ARTCI compliance · Secured by Supabase</div>
      </Card>

      <button onClick={onLogout} style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log Out</button>

      {/* ── Popup de confirmation de thème ── */}
      {popup&&(
        <div onClick={()=>sPopup(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:48,marginBottom:12}}>{popup.name.split(" ")[0]}</div>
            <h3 style={{color:DK,margin:"0 0 8px"}}>{popup.name}</h3>
            <p style={{color:"#555",fontSize:14,lineHeight:1.7,margin:"0 0 20px"}}>{popup.desc}<br/>Would you like to switch to this theme?</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>sPopup(null)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid #e0e0e0",background:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",color:"#555"}}>Cancel</button>
              <button onClick={()=>applyTheme(popup.k)} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:G,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Apply ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [screen,sScreen]=useState("landing");
  const [user,sUser]=useState(null);
  const [tok,sTok]=useState(null);
  const [place,sPlace]=useState(null);
  const [tab,sTab]=useState("home");
  const [mod,sMod]=useState(null);
  const [xp,sXp]=useState(0);
  const [streak,sStreak]=useState(1);
  const [done,sDone]=useState([]);
  const [badges,sBadges]=useState([]);
  const [enc,sEnc]=useState(null);
  const [theme,sTheme]=useState(THEMES.default);

  const G=theme.G,LT=theme.LT,DK=theme.DK;

  const loadDone=async(uid,tk)=>{
    try{const d=await get(`daily_progress?user_id=eq.${uid}&date=eq.${dateStr()}&completed=eq.true&select=module`,tk);sDone(Array.isArray(d)?d.map(x=>x.module):[]);}catch{}
  };

  const afterAuth=async u=>{
    sUser(u);sTok(u.token);sXp(u.xp||0);sStreak(u.streak||1);
    if(u.isNew) sScreen("placement");
    else{sPlace({level:u.level||"Beginner"});await loadDone(u.id,u.token);sScreen("app");}
  };

  const afterPlace=async r=>{
    sPlace(r);
    if(user?.id) await patch(`users?id=eq.${user.id}`,{level:r.level,placement_done:true},tok);
    sScreen("result");
  };

  const addXp=async(n,modId)=>{
    if(done.includes(modId)){sEnc(rnd(ENC));return;}
    const pts=XP_MAP[modId]||n;
    const nx=xp+pts;
    sXp(nx);sDone(p=>[...p,modId]);
    if(user?.id){
      try{
        await upsert("daily_progress",{user_id:user.id,date:dateStr(),module:modId,completed:true,xp_earned:pts},tok);
        await patch(`users?id=eq.${user.id}`,{xp:nx},tok);
        if(modId==="peel"&&!badges.includes("First Write")){
          await post("user_badges",{user_id:user.id,badge_name:"First Write"},tok);
          sBadges(p=>[...p,"First Write"]);
        }
      }catch(e){console.error(e);}
    }
  };

  if(screen==="landing")   return <Landing go={sScreen}/>;
  if(screen==="login")     return <AuthForm mode="login"    onDone={afterAuth} onSwitch={()=>sScreen("register")}/>;
  if(screen==="register")  return <AuthForm mode="register" onDone={afterAuth} onSwitch={()=>sScreen("login")}/>;
  if(screen==="placement") return <PlacementTest onDone={afterPlace}/>;
  if(screen==="result")    return <LevelResult result={place} onContinue={()=>{loadDone(user?.id,tok);sScreen("app");}}/>;

  const lvl=getLvl(xp);
  const pct=Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100);
  const level=place?.level||"Beginner";

  return (
    <div style={{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:"#f0f7f4",fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column"}}>

      {/* ═══ CORRECTION 2 — Header NON épinglé (sticky supprimé) ═══ */}
      {!mod&&(
        <div style={{background:G,color:"#fff",padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
      )}

      <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
        {mod
          ?<div style={{padding:18}}>
            <button onClick={()=>{sMod(null);loadDone(user?.id,tok);}} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div>
              <div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div>
            </div>
            {mod.id==="grammar"    &&<GrammarMod    addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK}/>}
            {mod.id==="vocabulary" &&<VocabMod      addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK}/>}
            {mod.id==="peel"       &&<PeelMod       addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} level={level} G={G} LT={LT} DK={DK}/>}
            {mod.id==="reading"    &&<ReadingMod    addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK}/>}
            {mod.id==="mistakes"   &&<MistakesMod   addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK}/>}
            {mod.id==="quiz"       &&<QuizMod       addXp={addXp} onBack={()=>{sMod(null);loadDone(user?.id,tok);}} G={G} LT={LT} DK={DK}/>}
          </div>
          :tab==="home"   ?<HomeScreen setMod={sMod} xp={xp} lvl={lvl} pct={pct} level={level} done={done} G={G} LT={LT} DK={DK}/>
          :tab==="profile"?<ProfileScreen user={user} xp={xp} lvl={lvl} level={level} badges={badges} streak={streak} G={G} LT={LT} DK={DK}/>
          :tab==="board"  ?<BoardScreen userId={user?.id} myXp={xp} tok={tok} G={G} LT={LT} DK={DK}/>
          :<SettingsScreen user={user} onTheme={sTheme} onLogout={()=>{sScreen("landing");sUser(null);sTok(null);}} G={G} LT={LT} DK={DK} xp={xp}/>
        }
      </div>

      {enc&&(
        <div onClick={()=>sEnc(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:60,marginBottom:12}}>🌟</div>
            <h3 style={{color:G,margin:"0 0 8px"}}>{enc.title}</h3>
            <p style={{color:"#555",fontSize:14,lineHeight:1.7,margin:"0 0 6px"}}>{enc.body}</p>
            <p style={{color:"#888",fontSize:13,fontStyle:"italic",margin:"0 0 20px"}}>{enc.sub}</p>
            <PBtn onClick={()=>sEnc(null)} style={{background:G}}>Keep Practising! 💪</PBtn>
          </div>
        </div>
      )}

      {!mod&&(
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:"#fff",borderTop:"1px solid #e8f5e9",display:"flex"}}>
          {[["home","🏠","Home"],["profile","👤","Profile"],["board","🏆","Ranks"],["settings","⚙️","More"]].map(([t,ic,lb])=>(
            <button key={t} onClick={()=>sTab(t)} style={{flex:1,background:"none",border:"none",padding:"10px 0",cursor:"pointer",color:tab===t?G:"#aaa",fontWeight:tab===t?800:400,fontSize:11,fontFamily:"inherit"}}>
              <div style={{fontSize:22}}>{ic}</div>{lb}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
