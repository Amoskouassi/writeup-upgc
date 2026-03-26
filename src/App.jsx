import { useState, useEffect } from "react";

const THEMES = {
  default: { G:"#2D6A4F", LT:"#d8f3dc", DK:"#1b4332" },
  forest:  { G:"#1a3a2a", LT:"#c8e6c9", DK:"#0d1f17" },
  ocean:   { G:"#1565c0", LT:"#bbdefb", DK:"#0d47a1" },
};

const SB  = "https://qnxeyoxashvbljjmqkrp.supabase.co";
const KEY = "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";
const hdr = t => ({ "Content-Type":"application/json","apikey":KEY,"Authorization":`Bearer ${t||KEY}`,"Prefer":"return=representation" });
const sbGet    = (p,t)   => fetch(`${SB}/rest/v1/${p}`,{headers:hdr(t)}).then(r=>r.json()).catch(()=>[]);
const sbPost   = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:hdr(t),body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const sbPatch  = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"PATCH",headers:{...hdr(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const sbUpsert = (p,b,t) => fetch(`${SB}/rest/v1/${p}`,{method:"POST",headers:{...hdr(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json()).catch(()=>{});
const sbSignUp = (e,p) => fetch(`${SB}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const sbSignIn = (e,p) => fetch(`${SB}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

const dateStr = () => new Date().toISOString().slice(0,10);
const rnd = a => a[Math.floor(Math.random()*a.length)];
const wc  = s => (s||"").trim().split(/\s+/).filter(Boolean).length;
const getLvl = xp => {
  if(xp<500)  return {name:"Bronze",  color:"#cd7f32",min:0,   next:500};
  if(xp<1500) return {name:"Silver",  color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",    color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const XP_MOD = {grammar:5,vocabulary:5,reading:20,mistakes:10,quiz:10,peel:50};
const WMIN = {
  Beginner:     {point:10,explanation:20,evidence:10,link:10},
  Intermediate: {point:15,explanation:40,evidence:20,link:15},
  Advanced:     {point:25,explanation:60,evidence:25,link:20},
};

// ─── UI ─────────────────────────────────────────────
function Spinner({G="#2D6A4F"}) {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}>
    <div style={{width:36,height:36,border:"4px solid #e0e0e0",borderTop:`4px solid ${G}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
const Card = ({children,style={}}) => <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.06)",...style}}>{children}</div>;
const PBtn = ({onClick,children,disabled,style={}}) =>
  <button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",padding:"13px",borderRadius:12,border:"none",background:disabled?"#ccc":"#2D6A4F",color:"#fff",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;
const SBtn = ({onClick,children,style={}}) =>
  <button onClick={onClick} style={{display:"block",width:"100%",padding:"12px",borderRadius:12,border:"2px solid #2D6A4F",background:"transparent",color:"#2D6A4F",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>;

// ─── CONTENT ────────────────────────────────────────
const GRAMMAR_BANK = [
  {title:"Present Simple",q:"She ___ to the library every Tuesday.",opts:["go","goes","is going","has gone"],ans:1,exp:"Present simple is used for habits. 'Every Tuesday' signals a routine.",tip:"Use present simple for habits: always, every day, usually, never."},
  {title:"Uncountable Nouns",q:"Which sentence is correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,exp:"'Advice' is uncountable — no plural, no 'a/an'.",tip:"Uncountable: advice, information, furniture, equipment, news, progress."},
  {title:"Second Conditional",q:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,exp:"Second conditional = If + past simple + would + base verb.",tip:"If + past simple → would + base verb."},
  {title:"Relative Clauses",q:"The student ___ scored highest received a prize.",opts:["which","whose","who","whom"],ans:2,exp:"Use 'who' for people in relative clauses.",tip:"Who = people. Which = things. Whose = possession."},
  {title:"Articles A/An",q:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,exp:"'University' starts with a /j/ sound (consonant sound), so we use 'a'.",tip:"Use 'an' before vowel SOUNDS, 'a' before consonant SOUNDS."},
  {title:"Past Perfect",q:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,exp:"Past perfect = action completed BEFORE another past action.",tip:"Past perfect = had + past participle."},
  {title:"Passive Voice",q:"All assignments ___ before the end of semester.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle.",tip:"Active → Passive: 'Students submit' → 'Essays are submitted'."},
  {title:"Gerund vs Infinitive",q:"She avoided ___ the difficult questions.",opts:["to answer","answer","answering","answered"],ans:2,exp:"'Avoid' must always be followed by a gerund (-ing form).",tip:"+ gerund: avoid, enjoy, finish, suggest. + infinitive: want, need, decide."},
  {title:"Subject-Verb Agreement",q:"Neither the students nor the teacher ___ aware of the change.",opts:["were","are","was","is"],ans:2,exp:"With 'neither...nor', the verb agrees with the NEAREST subject.",tip:"Neither...nor: verb agrees with the closest subject."},
  {title:"Reported Speech",q:"She said: 'I am preparing.' → She said that she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech.",tip:"Backshift: am/is → was | will → would | can → could."},
  {title:"Prepositions",q:"She is very good ___ mathematics.",opts:["in","on","at","for"],ans:2,exp:"'Good at' is a fixed expression.",tip:"Fixed: good at, bad at, interested in, responsible for."},
  {title:"Present Perfect",q:"I ___ my homework, so I can go out now.",opts:["finish","finished","have finished","had finished"],ans:2,exp:"Present perfect = past action with a result in the present.",tip:"Present perfect = have/has + past participle."},
];

const VOCAB_BANK = [
  {word:"Analyse",ph:"/ˈæn.ə.laɪz/",fr:"Analyser",pos:"verb",def:"To examine something carefully in detail to understand it.",ex:"The students must ___ the poem before writing their essay.",opts:["analyse","ignore","copy","avoid"],ans:0,tip:"Think 'ana' (apart) + 'lyse' (loosen). To analyse = break apart to understand."},
  {word:"Significant",ph:"/sɪɡˈnɪf.ɪ.kənt/",fr:"Significatif",pos:"adjective",def:"Important or large enough to have a noticeable effect.",ex:"There has been a ___ improvement in her writing this semester.",opts:["significant","small","boring","strange"],ans:0,tip:"'Sign' is inside — something significant gives a sign that it matters."},
  {word:"Coherent",ph:"/kəʊˈhɪər.ənt/",fr:"Cohérent",pos:"adjective",def:"Logical, well-organised, and easy to understand.",ex:"A well-written essay must present a ___ argument from start to finish.",opts:["emotional","coherent","confusing","short"],ans:1,tip:"'Co' (together) + 'here' (stick). Coherent ideas stick together logically."},
  {word:"Evidence",ph:"/ˈev.ɪ.dəns/",fr:"Preuve",pos:"noun",def:"Facts or information that show whether a claim is true.",ex:"Every argument in an essay must be supported by reliable ___.",opts:["opinion","evidence","feeling","title"],ans:1,tip:"'Evident' = easy to see. Evidence makes the truth visible."},
  {word:"Conclude",ph:"/kənˈkluːd/",fr:"Conclure",pos:"verb",def:"To decide something is true after considering all information.",ex:"Based on the findings, we can ___ that education reduces poverty.",opts:["begin","wonder","conclude","forget"],ans:2,tip:"'Con' + 'clude' (close). To conclude = close your thinking with a final decision."},
  {word:"Fundamental",ph:"/ˌfʌn.dəˈmen.təl/",fr:"Fondamental",pos:"adjective",def:"Forming the necessary base or core; essential.",ex:"Critical thinking is a ___ skill for all university students.",opts:["optional","fundamental","difficult","rare"],ans:1,tip:"'Fund' = foundation. Fundamental = what everything is built upon."},
  {word:"Illustrate",ph:"/ˈɪl.ə.streɪt/",fr:"Illustrer",pos:"verb",def:"To make something clearer by providing examples.",ex:"This graph will ___ how scores improved over three years.",opts:["hide","illustrate","remove","question"],ans:1,tip:"'Lustre' = light. To illustrate = shed light on an idea with an example."},
  {word:"Consequence",ph:"/ˈkɒn.sɪ.kwəns/",fr:"Conséquence",pos:"noun",def:"A result or effect of an action or decision.",ex:"Poor time management can have serious academic ___s.",opts:["reason","consequence","beginning","title"],ans:1,tip:"'Con' + 'sequence' — consequences follow in sequence after an action."},
  {word:"Emphasise",ph:"/ˈem.fə.saɪz/",fr:"Souligner",pos:"verb",def:"To show something is especially important.",ex:"The professor always ___ the importance of proofreading.",opts:["ignore","forget","emphasise","remove"],ans:2,tip:"'Em' + 'phase' = put in sharp focus."},
  {word:"Relevant",ph:"/ˈrel.ɪ.vənt/",fr:"Pertinent",pos:"adjective",def:"Closely connected or appropriate to the subject being discussed.",ex:"Make sure all evidence in your essay is ___ to your argument.",opts:["relevant","old","boring","random"],ans:0,tip:"'Relevant' shares a root with 'relate'. Relevant info relates to your topic."},
  {word:"Justify",ph:"/ˈdʒʌs.tɪ.faɪ/",fr:"Justifier",pos:"verb",def:"To show or prove that a statement or decision is reasonable.",ex:"You must ___ every claim in your essay with reliable evidence.",opts:["hide","justify","ignore","repeat"],ans:1,tip:"'Just' = fair/right. To justify = show that something is well-reasoned."},
  {word:"Approach",ph:"/əˈprəʊtʃ/",fr:"Approche",pos:"noun/verb",def:"A way of dealing with a situation or problem.",ex:"The researcher used a qualitative ___ to study writing habits.",opts:["problem","mistake","approach","question"],ans:2,tip:"Think of stepping closer to a solution — you approach it step by step."},
];

const READING_BANK = [
  {title:"Education and Development in Africa",topic:"Education",passage:"Education is widely recognised as one of the most powerful tools for sustainable development in Africa. Countries that invest seriously in schools and universities tend to experience stronger economic growth, lower poverty rates, and more stable governments. In Côte d'Ivoire, the government has significantly increased spending on education over the past decade, resulting in higher enrolment rates at both primary and secondary levels.\n\nHowever, significant challenges remain. A shortage of qualified teachers in rural areas, limited access to technology, and inadequate school infrastructure continue to hinder progress. Many students in remote regions must walk several kilometres each day simply to attend school.\n\nDespite these obstacles, research consistently shows the transformative power of education. Students who complete secondary school are three times more likely to find formal employment than those who drop out.",gloss:[{w:"sustainable",d:"able to continue long-term"},{w:"enrolment",d:"officially registering in a school"},{w:"infrastructure",d:"basic physical structures for society"},{w:"transformative",d:"causing a major positive change"}],qs:[{q:"What do countries investing in education experience?",opts:["More problems","Stronger growth and lower poverty","Fewer teachers","Less spending"],ans:1},{q:"What teacher challenge is mentioned?",opts:["Too many teachers","Shortage in rural areas","Low pay","Teachers refusing to work"],ans:1},{q:"How much more likely are secondary graduates to find work?",opts:["Twice","Four times","Three times","Five times"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy",passage:"Reading is arguably the single most important habit that a university student can cultivate. Research consistently demonstrates that students who read widely perform significantly better in examinations and produce higher quality written work. Reading expands vocabulary, sharpens comprehension skills, and develops the critical thinking that academic success demands.\n\nIn many African universities, access to books and academic journals remains severely limited. Physical libraries are often under-resourced, and the cost of purchasing textbooks places a heavy financial burden on students.\n\nA student who commits to reading for just thirty minutes each day can experience measurable improvement in academic performance within a single semester.",gloss:[{w:"cultivate",d:"develop through regular effort"},{w:"comprehension",d:"ability to understand fully"},{w:"aspires",d:"has a strong desire to achieve"},{w:"measurable",d:"large enough to be noticed"}],qs:[{q:"What does reading do for students?",opts:["Makes them popular","Improves exam performance and writing","Replaces lectures","Only helps vocabulary"],ans:1},{q:"What financial challenge is mentioned?",opts:["Libraries cost too much","Students cannot afford textbooks","Professors charge fees","Digital books are costly"],ans:1},{q:"What does 30 minutes of daily reading lead to?",opts:["No difference","Measurable academic improvement","Only first-year help","Replaces studying"],ans:1}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature",passage:"Chinua Achebe is widely regarded as the father of modern African literature in English. His landmark novel, Things Fall Apart, published in 1958, tells the story of Okonkwo — a proud Igbo warrior whose life is disrupted by the arrival of European colonisers in Nigeria. The novel was groundbreaking because it presented African culture entirely from an African perspective.\n\nPrior to Achebe's work, Africa had largely been portrayed in European literature as a dark, primitive continent. Achebe set out to challenge this misrepresentation. He wrote in English but filled his prose with Igbo proverbs and oral traditions, creating a unique literary style.\n\nThings Fall Apart has been translated into more than fifty languages and is studied in universities across the world.",gloss:[{w:"landmark",d:"marking a significant achievement"},{w:"groundbreaking",d:"new and very important; never done before"},{w:"misrepresentation",d:"a false or misleading description"},{w:"prose",d:"ordinary written language, not poetry"}],qs:[{q:"Why is Things Fall Apart groundbreaking?",opts:["First novel in Africa","Presented African culture from an African perspective","Written in Igbo","Longest African novel"],ans:1},{q:"How did Achebe incorporate African culture?",opts:["Refused English grammar","Translated from Igbo","Used Igbo proverbs and oral traditions","Only wrote about ceremonies"],ans:2},{q:"Into how many languages has it been translated?",opts:["Over 20","Over 30","Over 40","More than 50"],ans:3}]},
  {title:"Climate Change and Africa",topic:"Environment",passage:"Climate change poses one of the most serious threats to Africa's development, even though the continent contributes relatively little to global greenhouse gas emissions. Rising temperatures, unpredictable rainfall, and increasingly frequent extreme weather events are already disrupting agriculture and threatening food security.\n\nIn the Sahel region, prolonged droughts have made farming increasingly difficult. Millions who depend on rain-fed agriculture are being forced to migrate to cities, placing enormous pressure on urban infrastructure.\n\nAt the same time, Africa possesses extraordinary natural resources for a green energy transition. The continent receives more solar energy than any other region on Earth. Experts argue that with the right investment, Africa could become a global leader in renewable energy.",gloss:[{w:"emissions",d:"gases released into the atmosphere"},{w:"livelihoods",d:"ways of earning money and supporting oneself"},{w:"transition",d:"process of changing from one state to another"},{w:"renewable",d:"naturally replenished; not depleted"}],qs:[{q:"Why is it ironic that Africa is most affected by climate change?",opts:["Biggest contributor","Very little contribution","No contribution","Not affected"],ans:1},{q:"What is happening in the Sahel?",opts:["Farmers are wealthy","Cities abandoned","Droughts forcing migration","New farms created"],ans:2},{q:"What natural advantage does Africa have for green energy?",opts:["Most wind","Largest coal","More solar than any region","Deepest ocean currents"],ans:2}]},
];

const MISTAKES_BANK = [
  {title:"'Make' vs 'Do'",fr:"Faire une erreur / Faire ses devoirs",wrong:"I did a mistake and I must do an effort to improve.",right:"I made a mistake and I must make an effort to improve.",rule:"Use MAKE for: mistakes, decisions, progress, noise, an effort. Use DO for: homework, exercises, work, research, one's best.",ex:[{w:"She did a good decision.",r:"She made a good decision."},{w:"He is doing progress.",r:"He is making progress."}]},
  {title:"'Since' vs 'For'",fr:"J'étudie l'anglais depuis 3 ans",wrong:"I study English since 3 years.",right:"I have been studying English for 3 years.",rule:"'Since' = a specific point in time (since 2021). 'For' = a duration (for 3 years). Both require present perfect.",ex:[{w:"She lives here since 5 years.",r:"She has lived here for 5 years."},{w:"I wait since 2 o'clock.",r:"I have been waiting since 2 o'clock."}]},
  {title:"'Actually' ≠ 'Actuellement'",fr:"Actuellement, je travaille à l'UPGC",wrong:"Actually, I am a student at UPGC right now.",right:"Currently, I am a student at UPGC.",rule:"'Actually' means 'in fact' or 'to tell the truth'. For the French 'actuellement', use 'currently', 'at present', or 'at the moment'.",ex:[{w:"Actually, the economy is growing.",r:"Currently, the economy is growing."},{w:"He actually studies medicine.",r:"He is currently studying medicine."}]},
  {title:"Double Negatives",fr:"Je n'ai rien dit / Je ne connais personne",wrong:"I didn't say nothing. I don't know nobody.",right:"I didn't say anything. I don't know anybody.",rule:"English does NOT allow double negatives. Use either 'not...anything' OR 'nothing' alone — never both together.",ex:[{w:"She doesn't know nothing.",r:"She doesn't know anything."},{w:"He never tells nobody.",r:"He never tells anybody."}]},
  {title:"'Assist' vs 'Attend'",fr:"J'ai assisté au cours ce matin",wrong:"I assisted the lecture this morning.",right:"I attended the lecture this morning.",rule:"'Assist' = to help someone. 'Attend' = to be present at an event. This is one of the most common false friends for French speakers.",ex:[{w:"She assisted the wedding.",r:"She attended the wedding."},{w:"All students must assist the orientation.",r:"All students must attend the orientation."}]},
  {title:"Uncountable Nouns",fr:"Des informations / Des conseils",wrong:"She gave me some informations and advices.",right:"She gave me some information and advice.",rule:"These nouns are uncountable in English — no plural -s: information, advice, furniture, equipment, luggage, news, research, knowledge, progress, feedback.",ex:[{w:"The news are bad.",r:"The news is bad."},{w:"Can you give me some advices?",r:"Can you give me some advice?"}]},
  {title:"Future Plans",fr:"Je fais ça demain",wrong:"I study tomorrow instead of going out.",right:"I am going to study tomorrow instead of going out.",rule:"For personal future plans, use 'going to' + base verb. Present simple is only for fixed timetables.",ex:[{w:"She travels to Abidjan next week.",r:"She is going to travel to Abidjan next week."},{w:"I eat with my family tonight.",r:"I am going to eat with my family tonight."}]},
];

const QUIZ_SETS = [
  [{q:"Which sentence is correct?",opts:["She don't study.","She doesn't study.","She not study.","She studies not."],ans:1,exp:"Negative: subject + doesn't/don't + base verb."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts supporting an argument","An essay type"],ans:2,exp:"Evidence = facts or information that prove something true."},{q:"In PEEL, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link."},{q:"'She gave me some ___.' Correct:",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable."},{q:"'Actually' in English means:",opts:["Currently","In fact","Often","Always"],ans:1,exp:"'Actually' = 'in fact', not 'currently'."}],
  [{q:"'I ___ here since 2020.' Correct:",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect."},{q:"'Coherent' means:",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured, easy to understand."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct. Use 'do' for homework."},{q:"'Information' is:",opts:["Countable","Uncountable","Proper","Abstract only"],ans:1,exp:"'Information' is uncountable."},{q:"Correct passive: 'The essay ___ by Friday.'",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle."}],
  [{q:"'Despite ___ tired, she studied.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing)."},{q:"'Fundamental' means:",opts:["Optional","Very difficult","Forming the essential base","Interesting"],ans:2,exp:"Fundamental = forming the foundation; of central importance."},{q:"'I assisted the conference.' Error:",opts:["'I' → 'We'","'assisted' → 'attended'","'conference' wrong","No error"],ans:1,exp:"'Assist' = help. 'Attend' = be present at an event."},{q:"Reported speech: 'I am preparing.' → She said she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech."},{q:"Academic synonym for 'show':",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' = the academic equivalent of 'show'."}],
  [{q:"Correct future plan:",opts:["I study tonight.","I am going to study tonight.","I will to study.","I studying tonight."],ans:1,exp:"Personal future plans: 'going to' + base verb."},{q:"'Relevant' means:",opts:["Very impressive","Directly connected to the topic","Out of date","Difficult"],ans:1,exp:"Relevant = directly connected and appropriate to the subject."},{q:"Correct 'for/since':",opts:["I've studied since two years.","I've studied for 2019.","I've studied for two years.","I study since two years."],ans:2,exp:"'For' + duration. 'Since' + point in time."},{q:"Purpose of 'Evidence' in PEEL:",opts:["Restate the point","Provide proof","Conclude the essay","Introduce a new topic"],ans:1,exp:"Evidence provides concrete proof — stats, quotes, real examples."},{q:"'She ___ before the deadline.' Best:",opts:["submits","submitted","had submitted","submitting"],ans:1,exp:"Past simple for a completed action at a specific past time."}],
];

const PEEL_TOPICS = [
  {title:"Technology in Education",prompt:"Should technology be used more widely in African universities?",guidance:{point:"State your main position clearly in 1-2 sentences.",explanation:"Explain WHY — give at least 2 specific, well-developed reasons.",evidence:"Include a statistic or research finding with a named source.",link:"Connect back to the question about African universities."},example:{point:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",explanation:"With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace, reinforcing difficult content outside the classroom.",evidence:"According to a UNESCO report (2022), students who regularly use digital learning tools score on average 35% higher on standardised assessments.",link:"Given this evidence, increasing technological integration in African universities is an urgent educational priority that would directly improve outcomes and prepare graduates for a digital economy."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",guidance:{point:"State your position clearly.",explanation:"Give 2-3 well-developed reasons — economic, social, cultural.",evidence:"Include a specific statistic or real-world example.",link:"Connect to national development or global equality."},example:{point:"Boys and girls must have completely equal access to education if African nations are to achieve their full economic and social potential.",explanation:"When girls are denied education, communities lose half their intellectual potential. Educated women invest more in their children's health and schooling, creating a positive generational cycle of development.",evidence:"The World Bank (2021) reported that every additional year a girl spends in education can increase her future earnings by up to 10%.",link:"For these reasons, gender equality in education is not simply a moral question — it is a strategic economic investment whose returns benefit entire communities."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",guidance:{point:"Take a clear position — do not argue both sides equally.",explanation:"Give 2-3 specific, concrete ways social media affects students.",evidence:"Use a specific study or statistic with a named source.",link:"Return directly to the question about university students."},example:{point:"For the majority of university students, social media causes significantly more harm than good.",explanation:"Students who spend excessive time on platforms like TikTok and Instagram report difficulty concentrating, as constant stimulation undermines the sustained focus that academic reading requires.",evidence:"A study from Harvard University (2020) found that students spending more than 3 hours daily on social media had GPAs 20% lower than those who limited usage.",link:"While social media offers some networking benefits, the evidence shows its negative impact on academic performance makes it far more harmful than helpful."}},
  {title:"English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students today.",guidance:{point:"State clearly why English is essential for Ivorian students.",explanation:"Think about careers, research access, global communication.",evidence:"Use a fact or statistic related to English in Africa.",link:"Connect to what Ivorian students should do as a result."},example:{point:"Mastering English has become an essential skill for Ivorian students who wish to compete in today's globalised professional environment.",explanation:"English is the dominant language of international business, scientific research, and global communication. Graduates who lack English proficiency are immediately at a competitive disadvantage when applying for international scholarships.",evidence:"The African Development Bank estimates that English proficiency can increase an African graduate's starting salary by as much as 25%.",link:"For these compelling reasons, Ivorian students should treat English not as an optional requirement, but as one of the most strategic investments in their professional future."}},
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
  {s:"Reading",   q:"In PEEL, what comes after Evidence?",    opts:["Proof","Link","Language","Layout"],ans:1},
  {s:"Reading",   q:"'Education was the light…' — device?",  opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {s:"Reading",   q:"Which is an uncountable noun?",          opts:["Chair","Book","Knowledge","Student"],ans:2},
  {s:"Reading",   q:"A 'glossary' is:",                       opts:["Questions list","Word definitions","Summary","Bibliography"],ans:1},
  {s:"Reading",   q:"'Concluded' means:",                     opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
];

const MODS = [
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",   sub:"Random exercise every session",    color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",  sub:"Random word every session",        color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Writing Lab",      sub:"PEEL paragraph + AI assessment",   color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",     sub:"Random passage every session",     color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes", sub:"French-speaker errors explained",  color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",       sub:"5 random questions every session", color:"#fff8e1"},
];

const BADGES_DEF = [
  {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
  {icon:"🔥",name:"Streak 7",      desc:"Log in 7 days in a row"},
  {icon:"📐",name:"Grammar Master",desc:"Complete 30 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 30 vocabulary words"},
  {icon:"🍃",name:"PEEL Expert",   desc:"Submit 5 PEEL paragraphs"},
  {icon:"🌍",name:"African Reader",desc:"Complete 10 reading passages"},
];

const UNLOCKS = [
  {xp:100,icon:"📝",label:"Advanced PEEL Topics",     desc:"4 challenging writing topics"},
  {xp:200,icon:"🌲",label:"Dark Forest Theme",         desc:"Deep green visual theme"},
  {xp:500,icon:"🌿",label:"Intermediate Level",        desc:"Auto-promotion"},
  {xp:1000,icon:"🌊",label:"Ocean Blue Theme",          desc:"Blue ocean visual theme"},
  {xp:1500,icon:"🌳",label:"Advanced Level",            desc:"Auto-promotion"},
  {xp:2000,icon:"🏆",label:"Certificate of Achievement",desc:"Download official PDF"},
];

// ─── MAIN APP ────────────────────────────────────────
export default function App() {
  const [screen, sScreen] = useState("landing");
  const [theme,  sTheme]  = useState(THEMES.default);
  const [user,   sUser]   = useState(null);
  const [tok,    sTok]    = useState(null);
  const [place,  sPlace]  = useState(null);
  const [tab,    sTab]    = useState("home");
  const [mod,    sMod]    = useState(null);
  const [xp,     sXp]     = useState(0);
  const [streak, sStreak] = useState(1);
  const [done,   sDone]   = useState([]);
  const [badges, sBadges] = useState([]);
  const [enc,    sEnc]    = useState(null);

  const G=theme.G, LT=theme.LT, DK=theme.DK;

  const loadDone = async(uid,tk) => {
    try { const d=await sbGet(`daily_progress?user_id=eq.${uid}&date=eq.${dateStr()}&completed=eq.true&select=module`,tk); sDone(Array.isArray(d)?d.map(x=>x.module):[]); } catch {}
  };
  const loadBadges = async(uid,tk) => {
    try { const d=await sbGet(`user_badges?user_id=eq.${uid}&select=badge_name`,tk); sBadges(Array.isArray(d)?d.map(x=>x.badge_name):[]); } catch {}
  };
  const afterAuth = async u => {
    sUser(u); sTok(u.token); sXp(u.xp||0); sStreak(u.streak||1);
    if(u.isNew) sScreen("placement");
    else { sPlace({level:u.level||"Beginner"}); await loadDone(u.id,u.token); await loadBadges(u.id,u.token); sScreen("app"); }
  };
  const afterPlace = async r => {
    sPlace(r);
    if(user?.id) { try { await sbPatch(`users?id=eq.${user.id}`,{level:r.level,placement_done:true},tok); } catch {} }
    sScreen("result");
  };
  const awardBadge = async name => {
    if(badges.includes(name)||!user?.id) return;
    try { await sbPost("user_badges",{user_id:user.id,badge_name:name},tok); } catch {}
    sBadges(p=>[...p,name]);
  };
  const addXp = async(n,modId) => {
    if(done.includes(modId)) { sEnc({title:"🌟 Already done today!",body:"XP already earned for this module. Come back tomorrow!",sub:"Extra practice = extra mastery."}); return; }
    const pts=XP_MOD[modId]||n, nx=xp+pts;
    sXp(nx); sDone(p=>[...p,modId]);
    if(user?.id) {
      try {
        await sbUpsert("daily_progress",{user_id:user.id,date:dateStr(),module:modId,completed:true,xp_earned:pts},tok);
        await sbPatch(`users?id=eq.${user.id}`,{xp:nx},tok);
        if(modId==="peel") awardBadge("First Write");
        if(streak>=7) awardBadge("Streak 7");
      } catch {}
    }
  };

  if(screen==="landing")   return <Landing go={sScreen} G={G} LT={LT} DK={DK}/>;
  if(screen==="login")     return <AuthForm mode="login"    onDone={afterAuth} onSwitch={()=>sScreen("register")} G={G} LT={LT} DK={DK}/>;
  if(screen==="register")  return <AuthForm mode="register" onDone={afterAuth} onSwitch={()=>sScreen("login")}    G={G} LT={LT} DK={DK}/>;
  if(screen==="placement") return <PlacementTest onDone={afterPlace} G={G} LT={LT} DK={DK}/>;
  if(screen==="result")    return <LevelResult result={place} onContinue={()=>{loadDone(user?.id,tok);sScreen("app");}} G={G} LT={LT} DK={DK}/>;

  const lvl=getLvl(xp), pct=Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100), level=place?.level||"Beginner";

  return (
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
        {mod
          ? <ModShell mod={mod} level={level} addXp={addXp} G={G} LT={LT} DK={DK} onBack={()=>{sMod(null);loadDone(user?.id,tok);}}/>
          : tab==="home"    ? <HomeScreen setMod={sMod} xp={xp} lvl={lvl} pct={pct} level={level} done={done} G={G} LT={LT} DK={DK}/>
          : tab==="profile" ? <ProfileScreen user={user} xp={xp} lvl={lvl} level={level} badges={badges} streak={streak} G={G} LT={LT} DK={DK}/>
          : tab==="board"   ? <BoardScreen userId={user?.id} myXp={xp} tok={tok} G={G} LT={LT} DK={DK}/>
          : <SettingsScreen user={user} xp={xp} place={place} G={G} LT={LT} DK={DK}
              onTheme={t=>{sTheme(t);}} onLogout={()=>{sScreen("landing");sUser(null);sTok(null);}}/>
        }
      </div>

      {enc && (
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

      {!mod && (
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

// ─── LANDING ────────────────────────────────────────
function Landing({go,G,LT,DK}) {
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${DK} 0%,${G} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:64,marginBottom:10}}>✍️</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 6px"}}>WriteUP UPGC</h1>
      <p style={{opacity:.85,fontSize:15,marginBottom:4}}>Academic English for L2 Students</p>
      <p style={{opacity:.6,fontSize:12,marginBottom:36}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:40}}>
        <button onClick={()=>go("login")} style={{background:"#fff",color:G,border:"none",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Log In</button>
        <button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid #fff",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Sign Up</button>
      </div>
      <p style={{opacity:.5,fontSize:11}}>Demo: enter any email + password to continue</p>
    </div>
  );
}

// ─── AUTH ────────────────────────────────────────────
function AuthForm({mode,onDone,onSwitch,G,LT,DK}) {
  const [f,sF]   = useState({name:"",email:"",pw:""});
  const [load,sL]= useState(false);
  const [err,sE] = useState("");
  const upd = k => e => sF(p=>({...p,[k]:e.target.value}));
  const inp = (ph,k,type="text") => <input placeholder={ph} type={type} value={f[k]} onChange={upd(k)} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>;

  const submit = async () => {
    if(!f.email||!f.pw) return sE("Please fill all fields.");
    if(mode==="register"&&!f.name) return sE("Please enter your name.");
    sL(true); sE("");
    // Demo mode — skip real auth
    const uid = "demo-"+f.email.replace(/[^a-z0-9]/gi,"");
    const name = f.name||f.email.split("@")[0];
    onDone({id:uid,name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:mode==="register",token:KEY});
    sL(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:G,margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register"&&inp("Full name","name")}
        {inp("Email","email","email")}
        {inp("Password","pw","password")}
        {err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        {load?<Spinner G={G}/>:<PBtn onClick={submit} style={{background:G}}>{mode==="login"?"Log In →":"Register & Take Placement Test →"}</PBtn>}
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="login"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:G,cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span>
        </p>
      </Card>
    </div>
  );
}

// ─── PLACEMENT TEST ──────────────────────────────────
function PlacementTest({onDone,G,LT,DK}) {
  const [i,sI]    = useState(0);
  const [sel,sSel]= useState(null);
  const [conf,sConf]=useState(false);
  const [sc,sSc]  = useState({Grammar:0,Vocabulary:0,Reading:0});
  const q=PL_QUESTIONS[i];
  const secs=["Grammar","Vocabulary","Reading"];
  const icons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const si=secs.indexOf(q.s);

  const confirm=()=>{ if(sel===null)return; if(sel===q.ans)sSc(s=>({...s,[q.s]:s[q.s]+1})); sConf(true); };
  const next=()=>{
    if(i<14){sI(x=>x+1);sSel(null);sConf(false);}
    else{
      const fs={...sc}; if(sel===q.ans)fs[q.s]++;
      const tot=fs.Grammar+fs.Vocabulary+fs.Reading;
      onDone({level:tot>=11?"Advanced":tot>=6?"Intermediate":"Beginner",scores:fs,total:tot});
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440,paddingTop:16}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:DK,margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Q {i+1}/15</span><span style={{color:G,fontWeight:700}}>{Math.round((i/15)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
            <div style={{background:G,height:8,borderRadius:99,width:`${(i/15)*100}%`,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {secs.map((s,ix)=>(
              <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:ix<si?G:ix===si?"#81c784":"#e0e0e0"}}/>
                <span style={{fontSize:11,color:ix<=si?G:"#bbb",fontWeight:ix===si?700:400}}>{icons[s]} {s}</span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p>
        </Card>
        {q.opts.map((o,oi)=>{
          const isC=oi===q.ans,isP=oi===sel;
          let bg="#fff",br="#e0e0e0";
          if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}}
          else if(isP){bg:LT;br=G;}
          return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
            {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
          </button>;
        })}
        {!conf
          ?<PBtn onClick={confirm} disabled={sel===null} style={{background:G}}>Confirm Answer</PBtn>
          :<PBtn onClick={next} style={{background:G}}>{i<14?"Next →":"See My Level 🎯"}</PBtn>
        }
      </div>
    </div>
  );
}

// ─── LEVEL RESULT ────────────────────────────────────
function LevelResult({result,onContinue,G,LT,DK}) {
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Your content will focus on essential grammar, core vocabulary, and accessible reading.",Intermediate:"Your content will challenge you with more complex grammar and academic vocabulary.",Advanced:"Your content will develop your academic writing and critical reading skills."};
  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <Card style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:64,marginBottom:8}}>{icons[result.level]}</div>
          <h2 style={{color:G,fontSize:24,margin:"0 0 4px"}}>Your Level:</h2>
          <div style={{background:LT,borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 12px"}}>
            <span style={{fontSize:22,fontWeight:900,color:DK}}>{result.level}</span>
          </div>
          <p style={{color:"#555",fontSize:14,lineHeight:1.7}}>{descs[result.level]}</p>
        </Card>
        <Card style={{marginBottom:16}}>
          <h4 style={{color:DK,margin:"0 0 12px"}}>📊 Your Scores</h4>
          {Object.entries(result.scores).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                <span style={{fontWeight:600,color:DK}}>{k}</span>
                <span style={{color:G,fontWeight:700}}>{v}/5</span>
              </div>
              <div style={{background:"#e8f5e9",borderRadius:99,height:8}}>
                <div style={{background:G,height:8,borderRadius:99,width:`${(v/5)*100}%`,transition:"width .6s"}}/>
              </div>
            </div>
          ))}
          <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,color:DK}}>Total</span>
            <span style={{color:G,fontWeight:800}}>{result.total}/15</span>
          </div>
        </Card>
        <PBtn onClick={onContinue} style={{background:G}}>Start Learning →</PBtn>
      </div>
    </div>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────
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
          <span style={{fontWeight:700,color:G}}>{lvl.name}</span>
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
        <button key={m.id} onClick={()=>setMod(m)} style={{width:"100%",background:"#fff",border:`1.5px solid ${LT}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.04)",textAlign:"left",marginBottom:10,fontFamily:"inherit"}}>
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

// ─── MOD SHELL ───────────────────────────────────────
function ModShell({mod,level,addXp,onBack,G,LT,DK}) {
  return (
    <div style={{padding:18}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16,fontFamily:"inherit"}}>← Back</button>
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

function DoneScreen({xpEarned,onBack,earn,G}) {
  useEffect(()=>{earn&&earn();},[]);
  return (
    <div style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#555"}}>You earned <strong style={{color:G,fontSize:20}}>+{xpEarned} XP</strong></p>
      <PBtn onClick={onBack} style={{background:G}}>← Back to Modules</PBtn>
    </div>
  );
}

// ─── GRAMMAR ─────────────────────────────────────────
function GrammarMod({addXp,onBack,G,LT,DK}) {
  const [c]        = useState(()=>rnd(GRAMMAR_BANK));
  const [sel,sSel] = useState(null);
  const [fin,sFin] = useState(false);
  if(fin) return <DoneScreen xpEarned={XP_MOD.grammar} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.grammar,"grammar")}/>;
  const conf=sel!==null, correct=sel===c.ans;
  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}><div style={{fontSize:12,color:"#555"}}>📚 Topic: <strong>{c.title}</strong></div></Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.q}</p></Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans, isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg:"#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.exp}</p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct?<PBtn onClick={()=>sFin(true)} style={{background:G}}>Earn +{XP_MOD.grammar} XP →</PBtn>:<SBtn onClick={onBack}>← Try another exercise</SBtn>}
      </>}
    </div>
  );
}

// ─── VOCABULARY ──────────────────────────────────────
function VocabMod({addXp,onBack,G,LT,DK}) {
  const [c]          = useState(()=>rnd(VOCAB_BANK));
  const [phase,sP]   = useState("learn");
  const [sel,sSel]   = useState(null);
  const [fin,sFin]   = useState(false);
  if(fin) return <DoneScreen xpEarned={XP_MOD.vocabulary} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.vocabulary,"vocabulary")}/>;
  const conf=sel!==null, correct=sel===c.ans;
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
      <PBtn onClick={()=>sP("practice")} style={{background:G}}>Practice this word →</PBtn>
    </div>
  );
  return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.ex}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans, isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg:"#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&sSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,lineHeight:1.7}}>{correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}</p>
        </Card>
        {correct?<PBtn onClick={()=>sFin(true)} style={{background:G}}>Earn +{XP_MOD.vocabulary} XP →</PBtn>:<SBtn onClick={onBack}>← Try another word</SBtn>}
      </>}
    </div>
  );
}

// ─── PEEL ────────────────────────────────────────────
function PeelMod({addXp,onBack,level,G,LT,DK}) {
  const [phase,sPhase]   = useState("write");
  const [c]              = useState(()=>rnd(PEEL_TOPICS));
  const [step,sStep]     = useState(0);
  const [vals,sVals]     = useState({point:"",explanation:"",evidence:"",link:""});
  const [fb,sFb]         = useState(null);
  const [aiLoad,sAiLoad] = useState(false);
  const [attempts,sAtt]  = useState(0);
  const keys   = ["point","explanation","evidence","link"];
  const labels = ["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minW   = WMIN[level]||WMIN.Beginner;
  const PARTS  = [
    {letter:"P",name:"Point",color:"#e3f2fd",icon:"📌",role:"State your main argument clearly and directly.",dos:"Start with a strong, confident statement. Be specific.",donts:"Do not begin with a question or be vague."},
    {letter:"E",name:"Explanation",color:"#e8f5e9",icon:"💬",role:"Develop your point by explaining WHY it is true.",dos:"Use linking words: 'Furthermore', 'In addition'. Each sentence should add new information.",donts:"Do not simply repeat your Point. Every sentence must add new reasoning."},
    {letter:"E",name:"Evidence",color:"#fff3e0",icon:"📚",role:"Provide concrete proof — a statistic, a study, or an expert quote.",dos:"Introduce: 'According to...', 'A study by... found that...'. Name your source.",donts:"Never use vague 'studies show' without naming the study."},
    {letter:"L",name:"Link",color:"#fce4ec",icon:"🔗",role:"Close the paragraph by connecting your argument back to the essay question.",dos:"Use: 'Therefore...', 'This demonstrates that...'",donts:"Do not introduce new arguments. Synthesise and reconnect."},
  ];

  const callAI = async(isRevision) => {
    sAiLoad(true); sFb(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1200,
          system:`You are a strict and fair English writing examiner for ${level} university students in Côte d'Ivoire. Evaluate PEEL paragraphs carefully. Respond ONLY with valid JSON, no markdown.`,
          messages:[{role:"user",content:`Score this PEEL paragraph (attempt ${attempts+1}) on: "${c.prompt}"
POINT: ${vals.point}
EXPLANATION: ${vals.explanation}
EVIDENCE: ${vals.evidence}
LINK: ${vals.link}

Word minimums for ${level}: point=${minW.point}, explanation=${minW.explanation}, evidence=${minW.evidence}, link=${minW.link}

Return JSON: {point_score(0-4), explanation_score(0-4), evidence_score(0-4), link_score(0-3), grammar_score(0-3), length_score(0-2), total(sum), passed(bool,total>=10), point_feedback, explanation_feedback, evidence_feedback, link_feedback, grammar_feedback, priority_actions(array of 3 strings), encouragement(string)}`}]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      sFb(parsed); sAtt(a=>a+1); sPhase("feedback");
    } catch(e) {
      sFb({total:0,passed:false,point_score:0,explanation_score:0,evidence_score:0,link_score:0,grammar_score:0,length_score:0,point_feedback:"AI unavailable.",explanation_feedback:"",evidence_feedback:"",link_feedback:"",grammar_feedback:"",priority_actions:["Try again","Check your internet connection","Resubmit your paragraph"],encouragement:"Please try submitting again."});
      sPhase("feedback");
    }
    sAiLoad(false);
  };

  if(phase==="write") return (
    <div>
      {attempts>0&&<Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision #{attempts} — Apply all feedback carefully before resubmitting.</p></Card>}
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:11,color:"#555"}}>📝 Topic · {level}</div>
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
        const p=PARTS[step];
        return <div>
          <Card style={{background:p.color,marginBottom:10,borderLeft:`4px solid ${G}`}}>
            <div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div>
            <div style={{fontSize:12,color:"#555",marginTop:4,lineHeight:1.5}}>{p.role}</div>
            <div style={{marginTop:8,fontSize:12,color:"#555"}}><strong>DO:</strong> {p.dos}</div>
          </Card>
          <Card style={{background:"#f0f7f4",marginBottom:10}}>
            <div style={{fontSize:11,color:"#888",marginBottom:4}}>📋 Model:</div>
            <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.8,fontStyle:"italic"}}>"{c.example[keys[step]]}"</p>
          </Card>
          <textarea value={vals[keys[step]]} onChange={e=>sVals(p=>({...p,[keys[step]]:e.target.value}))}
            placeholder={`Write your ${keys[step]} here… (min ${minW[keys[step]]} words)`} rows={4}
            style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wc(vals[keys[step]])>=minW[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4,marginBottom:10}}>
            <span style={{color:wc(vals[keys[step]])>=minW[keys[step]]?G:wc(vals[keys[step]])>0?"#f57c00":"#aaa",fontWeight:600}}>
              {wc(vals[keys[step]])} / {minW[keys[step]]} words {wc(vals[keys[step]])>=minW[keys[step]]?"✅":wc(vals[keys[step]])>0?"⚠️":""}
            </span>
          </div>
          <PBtn onClick={()=>{if(step<3)sStep(s=>s+1);else callAI(attempts>0);}}
            disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]||aiLoad} style={{background:G}}>
            {aiLoad?"⏳ AI is analysing your paragraph…":step<3?`Next: ${labels[step+1]} →`:"🤖 Submit for AI Assessment"}
          </PBtn>
        </div>;
      })()}
    </div>
  );

  if(phase==="feedback"&&fb) {
    const CRIT=[{id:"point_score",label:"Point",max:4},{id:"explanation_score",label:"Explanation",max:4},{id:"evidence_score",label:"Evidence",max:4},{id:"link_score",label:"Link",max:3},{id:"grammar_score",label:"Grammar & Vocabulary",max:3},{id:"length_score",label:"Length",max:2}];
    const hdrBg=fb.total>=15?`linear-gradient(135deg,${DK},${G})`:fb.total>=10?"linear-gradient(135deg,#e65100,#ff9800)":"linear-gradient(135deg,#c62828,#e53935)";
    return (
      <div>
        <Card style={{background:hdrBg,color:"#fff",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:12,opacity:.85,marginBottom:4}}>Attempt #{attempts} · {fb.passed?"✅ PASSED":"❌ REVISION REQUIRED"}</div>
          <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{fb.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div>
          <div style={{fontSize:14,fontWeight:700,opacity:.9}}>{fb.total>=17?"🏆 Excellent":fb.total>=14?"👏 Good":fb.total>=10?"📈 Passed":"💪 Below Average"}</div>
        </Card>
        <Card style={{marginBottom:14}}>
          <h4 style={{color:DK,margin:"0 0 12px"}}>📋 Score Breakdown</h4>
          {CRIT.map(cr=>{const s=fb[cr.id]||0,pct=Math.round((s/cr.max)*100);return(
            <div key={cr.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{fontWeight:600,color:DK}}>{cr.label}</span>
                <span style={{color:pct>=75?G:pct>=50?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span>
              </div>
              <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
                <div style={{background:pct>=75?G:pct>=50?"#f57c00":"#e53935",height:8,borderRadius:99,width:`${pct}%`,transition:"width .6s"}}/>
              </div>
            </div>
          );})}
        </Card>
        <Card style={{marginBottom:14}}>
          <h4 style={{color:G,margin:"0 0 12px"}}>🔍 Detailed Feedback</h4>
          {[["📌 Point",fb.point_feedback],["💬 Explanation",fb.explanation_feedback],["📚 Evidence",fb.evidence_feedback],["🔗 Link",fb.link_feedback],["✏️ Grammar",fb.grammar_feedback]].map(([lbl,txt])=>txt&&(
            <div key={lbl} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #f0f0f0"}}>
              <div style={{fontWeight:700,color:G,fontSize:12,marginBottom:4}}>{lbl}</div>
              <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.7}}>{txt}</p>
            </div>
          ))}
        </Card>
        {fb.priority_actions?.length>0&&<Card style={{background:"#fff8e1",marginBottom:14}}>
          <h5 style={{color:"#e65100",margin:"0 0 10px"}}>🎯 Priority Actions</h5>
          {fb.priority_actions.map((a,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8,fontSize:13,color:"#555"}}><span style={{fontWeight:800,color:"#e65100"}}>{i+1}.</span>{a}</div>)}
        </Card>}
        {fb.encouragement&&<Card style={{background:LT,marginBottom:14}}><p style={{margin:0,fontSize:13,color:DK,lineHeight:1.7}}>💪 {fb.encouragement}</p></Card>}
        {fb.passed
          ?<PBtn onClick={()=>addXp(XP_MOD.peel,"peel")} style={{background:G}}>Claim +{XP_MOD.peel} XP & Continue →</PBtn>
          :<PBtn onClick={()=>{sPhase("write");sStep(0);}} style={{background:G}}>🔄 Revise My Paragraph →</PBtn>
        }
      </div>
    );
  }
  return <Spinner G={G}/>;
}

// ─── READING ─────────────────────────────────────────
function ReadingMod({addXp,onBack,G,LT,DK}) {
  const [c]       = useState(()=>rnd(READING_BANK));
  const [phase,sP]= useState("read");
  const [ans,sA]  = useState([null,null,null]);
  const [checked,sC]=useState(false);
  const [fin,sF]  = useState(false);
  const score=ans.filter((a,i)=>a===c.qs[i]?.ans).length;
  if(fin) return <DoneScreen xpEarned={XP_MOD.reading} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.reading,"reading")}/>;
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
            if(checked){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg:"#ffebee";br="#e53935";}else if(!isP&&isC){bg:"#fff9c4";br="#f9a825";}}
            else if(isP){bg=LT;br=G;}
            return <button key={oi} onClick={()=>{if(!checked)sA(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${br}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ?<PBtn onClick={()=>sC(true)} disabled={ans.includes(null)} style={{background:G}}>Check Answers</PBtn>
        :<div>
          <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
            <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong>
          </Card>
          <PBtn onClick={()=>sF(true)} style={{background:G}}>Earn +{XP_MOD.reading} XP</PBtn>
        </div>}
    </div>
  );
}

// ─── MISTAKES ────────────────────────────────────────
function MistakesMod({addXp,onBack,G,LT,DK}) {
  const [c]      = useState(()=>rnd(MISTAKES_BANK));
  const [fin,sF] = useState(false);
  if(fin) return <DoneScreen xpEarned={XP_MOD.mistakes} onBack={onBack} G={G} earn={()=>addXp(XP_MOD.mistakes,"mistakes")}/>;
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
      <PBtn onClick={()=>sF(true)} style={{background:G}}>Got it! Earn +{XP_MOD.mistakes} XP</PBtn>
    </div>
  );
}

// ─── QUIZ ────────────────────────────────────────────
function QuizMod({addXp,onBack,G,LT,DK}) {
  const [qs]       = useState(()=>rnd(QUIZ_SETS));
  const [i,sI]     = useState(0);
  const [sel,sSel] = useState(null);
  const [score,sScore]=useState(0);
  const [review,sR]= useState(false);
  const [fin,sF]   = useState(false);
  const q=qs[i],conf=sel!==null,correct=sel===q?.ans;
  if(fin) return <DoneScreen xpEarned={score*6} onBack={onBack} G={G} earn={()=>addXp(score*6,"quiz")}/>;
  if(review) return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#555",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
      </Card>
      {score>0?<PBtn onClick={()=>sF(true)} style={{background:G}}>Claim +{score*6} XP →</PBtn>:<SBtn onClick={onBack}>← Try again tomorrow</SBtn>}
    </div>
  );
  const next=()=>{if(i<qs.length-1){sI(x=>x+1);sSel(null);}else sR(true);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}>
        <span>Q {i+1}/{qs.length}</span><span style={{color:G,fontWeight:700}}>Score: {score}</span>
      </div>
      <div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}>
        <div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const isC=oi===q.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg:"#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg:"#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>{if(!conf){sSel(oi);if(oi===q.ans)sScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":""}{o}
        </button>;
      })}
      {conf&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p>
        </Card>
        <PBtn onClick={next} style={{background:G}}>{i<qs.length-1?"Next →":"See Results"}</PBtn>
      </>}
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────
function ProfileScreen({user,xp,lvl,level,badges,streak,G,LT,DK}) {
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
          return <div key={b.name} style={{background:earned?"#fff":"#f5f5f5",borderRadius:14,padding:14,opacity:earned?1:.55,boxShadow:earned?"0 2px 8px rgba(0,0,0,.08)":"none"}}>
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

// ─── LEADERBOARD ─────────────────────────────────────
function BoardScreen({userId,myXp,tok,G,LT,DK}) {
  const [lb,sLb]   = useState([]);
  const [load,sLoad]=useState(true);
  const [rank,sRank]=useState(null);

  const fetchLb = async () => {
    try {
      const d=await sbGet("users?select=id,name,xp,level,streak&order=xp.desc&limit=10",tok);
      if(Array.isArray(d)){
        const upd=d.map(u=>u.id===userId?{...u,xp:myXp}:u).sort((a,b)=>b.xp-a.xp);
        sLb(upd); const r=upd.findIndex(u=>u.id===userId)+1; sRank(r>0?r:null);
      }
    } catch {}
    sLoad(false);
  };
  useEffect(()=>{fetchLb();},[myXp]);
  const medals=["🥇","🥈","🥉"];
  const lc={Bronze:"#cd7f32",Silver:"#9e9e9e",Gold:"#ffd700",Platinum:"#4fc3f7",Beginner:"#81c784",Intermediate:"#42a5f5",Advanced:"#ab47bc"};

  return (
    <div style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{color:DK,margin:0}}>🏆 Leaderboard</h3>
        <button onClick={fetchLb} style={{background:LT,border:"none",borderRadius:10,padding:"6px 12px",color:G,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔄 Refresh</button>
      </div>
      {load&&<Spinner G={G}/>}
      {!load&&lb.length===0&&(
        <Card style={{textAlign:"center",padding:32}}>
          <div style={{fontSize:40,marginBottom:8}}>🏆</div>
          <p style={{color:"#888"}}>No students on the board yet.</p>
          <p style={{color:"#aaa",fontSize:13}}>Complete modules to appear here!</p>
        </Card>
      )}
      {lb.map((l,ix)=>{
        const isMe=l.id===userId,r=ix+1;
        return <div key={l.id} style={{background:isMe?LT:"#fff",border:isMe?`2px solid ${G}`:"1px solid #eee",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <div style={{width:36,textAlign:"center",flexShrink:0}}>{r<=3?<span style={{fontSize:24}}>{medals[ix]}</span>:<span style={{fontSize:14,fontWeight:800,color:"#bbb"}}>#{r}</span>}</div>
          <div style={{width:36,height:36,borderRadius:"50%",background:isMe?G:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:isMe?"#fff":"#999"}}>{l.name?.charAt(0)?.toUpperCase()||"?"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:isMe?800:600,color:isMe?G:DK,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.name}{isMe?" (You)":""}</div>
            <div style={{display:"flex",gap:6,marginTop:3}}>
              {l.level&&<span style={{fontSize:10,fontWeight:700,color:lc[l.level]||"#888"}}>{l.level}</span>}
              {l.streak>0&&<span style={{fontSize:11,color:"#888"}}>🔥{l.streak}</span>}
            </div>
          </div>
          <div style={{fontWeight:800,color:G,fontSize:15}}>⭐{isMe?myXp:l.xp}</div>
        </div>;
      })}
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────
function SettingsScreen({user,xp,place,onTheme,onLogout,G,LT,DK}) {
  const [activeT,sAT]=useState("default");
  const canF=xp>=200, canO=xp>=1000, canC=xp>=2000;
  const lvl=getLvl(xp);

  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>⚙️ Settings</h3>
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#888",marginBottom:2}}>Logged in as</div>
        <div style={{fontWeight:700,color:DK,fontSize:15}}>{user?.name}</div>
        <div style={{fontSize:13,color:"#888",marginBottom:8}}>{user?.email}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{place?.level||"Beginner"}</span>
          <span style={{background:"#e3f2fd",color:"#1565c0",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>⭐ {xp} XP</span>
          <span style={{background:"#fff8e1",color:"#f57c00",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{lvl.name}</span>
        </div>
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>🎨 Visual Themes</div>
        {[{k:"default",name:"🌿 Default Green",locked:false},{k:"forest",name:"🌲 Dark Forest",locked:!canF,req:200},{k:"ocean",name:"🌊 Ocean Blue",locked:!canO,req:1000}].map(t=>(
          <div key={t.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"10px 12px",borderRadius:12,background:activeT===t.k?"#e8f5e9":t.locked?"#f5f5f5":"#fff",border:activeT===t.k?`2px solid ${G}`:"1.5px solid #eee",opacity:t.locked?.6:1}}>
            <div>
              <div style={{fontWeight:700,color:DK,fontSize:13}}>{t.name}</div>
              {t.locked&&<div style={{fontSize:11,color:"#f57c00"}}>🔒 Unlock at {t.req} XP</div>}
            </div>
            {!t.locked&&<button onClick={()=>{sAT(t.k);onTheme(THEMES[t.k]);}} style={{background:activeT===t.k?G:"#e0e0e0",color:activeT===t.k?"#fff":"#555",border:"none",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{activeT===t.k?"Active":"Apply"}</button>}
          </div>
        ))}
      </Card>
      <Card style={{marginBottom:14,background:canC?"#f9fbe7":"#f5f5f5",opacity:canC?1:.7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,color:DK,fontSize:15}}>🏆 Certificate</div>
            <div style={{fontSize:12,color:"#888",marginTop:3}}>{canC?"Download your official certificate":"🔒 Unlock at 2000 XP ("+String(2000-xp)+" more)"}</div>
          </div>
        </div>
        {!canC&&<div style={{background:"#ffe082",borderRadius:99,height:6,marginTop:10}}><div style={{background:"#f9a825",height:6,borderRadius:99,width:`${Math.min(100,Math.round((xp/2000)*100))}%`,transition:"width .5s"}}/></div>}
      </Card>
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14}}>🔒 Privacy</div>
        <div style={{fontSize:12,color:"#888",marginTop:4}}>ARTCI compliance n°2013-450 · Powered by Supabase</div>
      </Card>
      <button onClick={onLogout} style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log Out</button>
    </div>
  );
}
