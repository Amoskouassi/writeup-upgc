import { useState, useEffect, useRef } from "react";

/* ── THEME ── */
const THEMES = {
  default: { G:"#2D6A4F", LT:"#d8f3dc", DK:"#1b4332", BG:"#f0f7f4" },
  forest:  { G:"#1a6b3a", LT:"#c8e6c9", DK:"#0d2b1a", BG:"#e8f5e9" },
  ocean:   { G:"#1565c0", LT:"#bbdefb", DK:"#0d47a1", BG:"#e3f2fd" },
};

/* ── HELPERS ── */
const rnd  = a => a[Math.floor(Math.random()*a.length)];
const shuf = a => [...a].sort(()=>Math.random()-.5);
const wc   = s => (s||"").trim().split(/\s+/).filter(Boolean).length;
const dateStr = () => new Date().toISOString().slice(0,10);
const getLvl  = xp => {
  if(xp<500)  return {name:"Bronze",  color:"#cd7f32",min:0,   next:500};
  if(xp<1500) return {name:"Silver",  color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",    color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const getAcadLvl = xp => xp>=1500?"Advanced":xp>=400?"Intermediate":"Beginner";
const WMIN = {
  Beginner:     {point:10,explanation:20,evidence:10,link:10},
  Intermediate: {point:15,explanation:40,evidence:20,link:15},
  Advanced:     {point:25,explanation:60,evidence:25,link:20},
};
const XP_EARN = {grammar:5,vocabulary:5,reading:20,mistakes:10,quiz:10,peel:50};

/* ── UI ── */
const Spinner = ({G="#2D6A4F"}) => (
  <div style={{display:"flex",justifyContent:"center",padding:40}}>
    <div style={{width:34,height:34,border:"4px solid #e0e0e0",borderTop:`4px solid ${G}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
const Card = ({children,style={}}) => <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,0.06)",...style}}>{children}</div>;
const PBtn = ({onClick,children,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{display:"block",width:"100%",padding:13,borderRadius:12,border:"none",background:disabled?"#ccc":"#2D6A4F",color:"#fff",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>
);
const SBtn = ({onClick,children,style={}}) => (
  <button onClick={onClick} style={{display:"block",width:"100%",padding:12,borderRadius:12,border:"2px solid #2D6A4F",background:"transparent",color:"#2D6A4F",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8,...style}}>{children}</button>
);
const Bar = ({val,max,color="#2D6A4F"}) => (
  <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
    <div style={{width:`${Math.min(100,Math.round((val/max)*100))}%`,height:8,borderRadius:99,background:color,transition:"width .5s"}}/>
  </div>
);

/* ════════ CONTENT ════════ */
const GRAMMAR_BANK = [
  {title:"Present Simple",q:"She ___ to the library every Tuesday.",opts:["go","goes","is going","has gone"],ans:1,exp:"'Every Tuesday' signals a routine habit — use present simple third person: goes.",tip:"He/She/It + verb+s for habits: always, every day, usually."},
  {title:"Uncountable Nouns",q:"Which sentence is correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,exp:"'Advice' is uncountable — no plural, no 'a/an'. Use 'some advice'.",tip:"Uncountable: advice, information, furniture, equipment, news, progress."},
  {title:"Second Conditional",q:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,exp:"Second conditional = If + past simple + would + base verb — for hypothetical situations.",tip:"If + past simple → would + base verb. Example: If I had money, I would travel."},
  {title:"Relative Clauses",q:"The student ___ scored highest received a prize.",opts:["which","whose","who","whom"],ans:2,exp:"Use 'who' for people. 'Which' is for things.",tip:"Who = people. Which = things. Whose = possession."},
  {title:"Articles",q:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,exp:"'University' starts with a /j/ consonant sound → 'a', not 'an'. The rule depends on SOUND.",tip:"'an' before vowel SOUNDS: an hour. 'a' before consonant SOUNDS: a university."},
  {title:"Past Perfect",q:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,exp:"Past perfect = action completed BEFORE another past action.",tip:"Past perfect = had + past participle. Signal: by the time, already, before."},
  {title:"Passive Voice",q:"All assignments ___ before the end of the semester.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle.",tip:"Passive: subject + be + past participle."},
  {title:"Gerund vs Infinitive",q:"She avoided ___ the difficult questions.",opts:["to answer","answer","answering","answered"],ans:2,exp:"'Avoid' must always be followed by a gerund (-ing form).",tip:"+ gerund: avoid, enjoy, finish, suggest. + infinitive: want, need, decide, hope."},
  {title:"Subject-Verb Agreement",q:"Neither the students nor the teacher ___ aware of the change.",opts:["were","are","was","is"],ans:2,exp:"With 'neither...nor', verb agrees with the NEAREST subject. 'Teacher' is singular → 'was'.",tip:"Neither...nor: verb agrees with the closest subject."},
  {title:"Reported Speech",q:"She said: 'I am preparing.' → She said that she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech.",tip:"Backshift: am/is → was | will → would | can → could."},
  {title:"Prepositions",q:"She is very good ___ mathematics.",opts:["in","on","at","for"],ans:2,exp:"'Good at' a subject is a fixed expression.",tip:"Fixed: good at, bad at, interested in, responsible for, afraid of."},
  {title:"Present Perfect",q:"I ___ my homework, so I can go out now.",opts:["finish","finished","have finished","had finished"],ans:2,exp:"Present perfect = past action with a present result.",tip:"Present perfect = have/has + past participle."},
];

const VOCAB_BANK = [
  {word:"Analyse",ph:"/ˈæn.ə.laɪz/",fr:"Analyser",pos:"verb",def:"To examine something carefully in detail to understand it.",ex:"The students must ___ the poem before writing.",opts:["analyse","ignore","copy","avoid"],ans:0,tip:"'Ana' (apart) + 'lyse' (loosen). To analyse = break apart to understand."},
  {word:"Significant",ph:"/sɪɡˈnɪf.ɪ.kənt/",fr:"Significatif",pos:"adjective",def:"Important enough to have a noticeable effect.",ex:"There has been a ___ improvement in her writing.",opts:["significant","small","boring","strange"],ans:0,tip:"'Sign' is inside — something significant gives a sign that it matters."},
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
  {title:"Education and Development in Africa",topic:"Education",
   passage:"Education is widely recognised as one of the most powerful tools for sustainable development in Africa. Countries that invest seriously in schools and universities tend to experience stronger economic growth, lower poverty rates, and more stable governments. In Côte d'Ivoire, the government has significantly increased spending on education over the past decade, resulting in higher enrolment rates at both primary and secondary levels.\n\nHowever, significant challenges remain. A shortage of qualified teachers in rural areas, limited access to technology, and inadequate school infrastructure continue to hinder progress. Many students in remote regions must walk several kilometres each day simply to attend school.\n\nDespite these obstacles, research consistently shows the transformative power of education. Students who complete secondary school are three times more likely to find formal employment than those who drop out.",
   gloss:[{w:"sustainable",d:"able to continue long-term"},{w:"enrolment",d:"officially registering in a school"},{w:"infrastructure",d:"basic physical structures for society"},{w:"transformative",d:"causing a major positive change"}],
   qs:[{q:"What do countries investing in education tend to experience?",opts:["More problems","Stronger growth and lower poverty","Fewer teachers","Less spending"],ans:1},{q:"What teacher challenge is mentioned?",opts:["Too many teachers","Shortage in rural areas","Low pay","Teachers refusing to work"],ans:1},{q:"How much more likely are secondary graduates to find work?",opts:["Twice","Four times","Three times","Five times"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy",
   passage:"Reading is arguably the single most important habit that a university student can cultivate. Research consistently demonstrates that students who read widely perform significantly better in examinations and produce higher quality written work. Reading expands vocabulary, sharpens comprehension skills, and develops the critical thinking that academic success demands.\n\nIn many African universities, access to books and academic journals remains severely limited. Physical libraries are often under-resourced, and the cost of purchasing textbooks places a heavy financial burden on students.\n\nA student who commits to reading for just thirty minutes each day can experience measurable improvement in academic performance within a single semester. The habit of reading is not a luxury — it is a fundamental necessity for anyone who aspires to academic excellence.",
   gloss:[{w:"cultivate",d:"develop through regular effort"},{w:"comprehension",d:"ability to understand fully"},{w:"aspires",d:"has a strong desire to achieve"},{w:"measurable",d:"large enough to be noticed"}],
   qs:[{q:"What does regular reading do for students?",opts:["Makes them popular","Improves exam performance and writing","Replaces lectures","Only helps vocabulary"],ans:1},{q:"What financial challenge is mentioned?",opts:["Libraries cost too much","Students cannot afford textbooks","Professors charge for books","Digital books are costly"],ans:1},{q:"What does 30 minutes of daily reading lead to?",opts:["No difference","Measurable academic improvement","Only helps first-year students","Replaces studying"],ans:1}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature",
   passage:"Chinua Achebe is widely regarded as the father of modern African literature in English. His landmark novel, Things Fall Apart, published in 1958, tells the story of Okonkwo — a proud Igbo warrior whose life is disrupted by the arrival of European colonisers in Nigeria. The novel was groundbreaking because it presented African culture entirely from an African perspective.\n\nPrior to Achebe's work, Africa had largely been portrayed in European literature as a dark, primitive continent. Achebe set out to challenge this misrepresentation. He wrote in English but filled his prose with Igbo proverbs and oral traditions, creating a unique literary style.\n\nThings Fall Apart has been translated into more than fifty languages and is studied in universities across the world.",
   gloss:[{w:"landmark",d:"marking a significant achievement"},{w:"groundbreaking",d:"new and very important; never done before"},{w:"misrepresentation",d:"a false or misleading description"},{w:"prose",d:"ordinary written language, not poetry"}],
   qs:[{q:"Why is Things Fall Apart considered groundbreaking?",opts:["First novel in Africa","Presented African culture from an African perspective","Written entirely in Igbo","Longest African novel"],ans:1},{q:"How did Achebe incorporate African culture?",opts:["Refused English grammar","Translated from Igbo","Used Igbo proverbs and oral traditions","Only wrote about ceremonies"],ans:2},{q:"Into how many languages has it been translated?",opts:["Over 20","Over 30","Over 40","More than 50"],ans:3}]},
  {title:"Climate Change and Africa",topic:"Environment",
   passage:"Climate change poses one of the most serious threats to Africa's development, even though the continent contributes relatively little to global greenhouse gas emissions. Rising temperatures, unpredictable rainfall, and increasingly frequent extreme weather events are already disrupting agriculture and threatening food security.\n\nIn the Sahel region, prolonged droughts have made farming increasingly difficult. Millions who depend on rain-fed agriculture are being forced to migrate to cities, placing enormous pressure on urban infrastructure.\n\nAt the same time, Africa possesses extraordinary natural resources for a green energy transition. The continent receives more solar energy than any other region on Earth. Experts argue that with the right investment, Africa could become a global leader in renewable energy.",
   gloss:[{w:"emissions",d:"gases released into the atmosphere"},{w:"livelihoods",d:"ways of earning money and supporting oneself"},{w:"transition",d:"process of changing from one state to another"},{w:"renewable",d:"naturally replenished; not permanently depleted"}],
   qs:[{q:"What is ironic about Africa's situation with climate change?",opts:["Africa pollutes the most","Africa contributes little yet suffers greatly","Africa has the most scientists","Africa ignores climate change"],ans:1},{q:"What is happening in the Sahel?",opts:["Farmers are wealthy","Cities are expanding normally","Droughts are forcing migration","New farms are being created"],ans:2},{q:"What natural advantage does Africa have for green energy?",opts:["Most wind power","Largest coal reserves","More solar energy than any region","Deepest ocean currents"],ans:2}]},
];

const MISTAKES_BANK = [
  {title:"'Make' vs 'Do'",fr:"Faire une erreur / Faire ses devoirs",wrong:"I did a mistake and I must do an effort to improve.",right:"I made a mistake and I must make an effort to improve.",rule:"Use MAKE for: mistakes, decisions, progress, noise, effort. Use DO for: homework, exercises, work, research, one's best.",ex:[{w:"She did a good decision.",r:"She made a good decision."},{w:"He is doing progress.",r:"He is making progress."},{w:"Can you make this exercise?",r:"Can you do this exercise?"}]},
  {title:"'Since' vs 'For'",fr:"J'étudie l'anglais depuis 3 ans",wrong:"I study English since 3 years.",right:"I have been studying English for 3 years.",rule:"'Since' = a specific point in time (since 2021). 'For' = a duration (for 3 years). Both require present perfect — NOT present simple.",ex:[{w:"She lives here since 5 years.",r:"She has lived here for 5 years."},{w:"I wait since 2 o'clock.",r:"I have been waiting since 2 o'clock."}]},
  {title:"'Actually' ≠ 'Actuellement'",fr:"Actuellement, je travaille à l'UPGC",wrong:"Actually, I am a student at UPGC right now.",right:"Currently, I am a student at UPGC.",rule:"'Actually' means 'in fact' or 'to tell the truth'. For 'actuellement', use 'currently', 'at present', or 'at the moment'.",ex:[{w:"Actually, the economy is growing. (meaning: currently)",r:"Currently, the economy is growing."},{w:"He actually studies medicine. (meaning: now)",r:"He is currently studying medicine."}]},
  {title:"Double Negatives",fr:"Je n'ai rien dit / Je ne connais personne",wrong:"I didn't say nothing. I don't know nobody.",right:"I didn't say anything. I don't know anybody.",rule:"English does NOT allow double negatives. Use either 'not...anything' OR 'nothing' alone — never both together.",ex:[{w:"She doesn't know nothing.",r:"She doesn't know anything."},{w:"He never tells nobody.",r:"He never tells anybody."}]},
  {title:"'Assist' vs 'Attend'",fr:"J'ai assisté au cours ce matin",wrong:"I assisted the lecture this morning.",right:"I attended the lecture this morning.",rule:"'Assist' = to help someone. 'Attend' = to be present at an event. Classic false friend for French speakers.",ex:[{w:"She assisted the wedding.",r:"She attended the wedding."},{w:"All students must assist the orientation.",r:"All students must attend the orientation."}]},
  {title:"Uncountable Nouns",fr:"Des informations / Des conseils",wrong:"She gave me some informations and advices.",right:"She gave me some information and advice.",rule:"These nouns are uncountable — no plural -s: information, advice, furniture, equipment, luggage, news, research, knowledge, progress, feedback.",ex:[{w:"The news are bad.",r:"The news is bad."},{w:"Can you give me some advices?",r:"Can you give me some advice?"}]},
  {title:"Future Plans",fr:"Je fais ça demain",wrong:"I study tomorrow instead of going out.",right:"I am going to study tomorrow instead of going out.",rule:"For personal future plans use 'going to' + base verb. Present simple is only for fixed timetables ('The train leaves at 9am').",ex:[{w:"She travels to Abidjan next week.",r:"She is going to travel to Abidjan next week."},{w:"I eat with my family tonight.",r:"I am going to eat with my family tonight."}]},
];

const PEEL_TOPICS = [
  {title:"Technology in Education",prompt:"Should technology be used more widely in African universities?",
   example:{point:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",explanation:"With smartphones and reliable internet, students can access thousands of academic journals unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace.",evidence:"According to UNESCO (2022), students who regularly use digital learning tools score on average 35% higher on standardised assessments.",link:"Given this evidence, increasing technological integration in African universities is an urgent educational priority that would directly improve outcomes and prepare graduates for a digital economy."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",
   example:{point:"Boys and girls must have completely equal access to education if African nations are to achieve their full economic and social potential.",explanation:"When girls are denied education, communities lose half their intellectual potential. Educated women invest more in their children's health and schooling, creating a positive generational cycle of development.",evidence:"The World Bank (2021) reported that every additional year a girl spends in education can increase her future earnings by up to 10%.",link:"For these reasons, gender equality in education is not simply a moral question — it is a strategic economic investment whose returns benefit entire communities."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",
   example:{point:"For the majority of university students, social media causes significantly more harm than good.",explanation:"Students who spend excessive time on platforms like TikTok and Instagram report difficulty concentrating, as constant stimulation undermines the sustained focus that academic reading requires.",evidence:"A study from Harvard University (2020) found that students spending more than 3 hours daily on social media had GPAs 20% lower than those who limited usage to under one hour.",link:"While social media offers some networking benefits, the evidence shows its negative impact on academic performance makes it far more harmful than helpful for university students."}},
  {title:"English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students today.",
   example:{point:"Mastering English has become an essential skill for Ivorian students who wish to compete in today's globalised professional environment.",explanation:"English is the dominant language of international business, scientific research, and global communication. Graduates who lack English proficiency are at a competitive disadvantage when applying for international scholarships or multinational positions.",evidence:"The African Development Bank estimates that English proficiency can increase an African graduate's starting salary by as much as 25% compared to monolingual peers.",link:"For these compelling reasons, Ivorian students should treat English not as an optional requirement, but as one of the most strategic investments in their professional future."}},
];

const QUIZ_SETS = [
  [{q:"Which sentence is correct?",opts:["She don't study.","She doesn't study.","She not study.","She studies not."],ans:1,exp:"Negative: subject + doesn't/don't + base verb."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts supporting an argument","An essay type"],ans:2,exp:"Evidence = facts or information that prove something true."},{q:"In PEEL, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link."},{q:"'She gave me some ___.' Correct:",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable — no plural, no 'a/an'."},{q:"'Actually' in English means:",opts:["Currently","In fact","Often","Always"],ans:1,exp:"'Actually' = 'in fact', not 'currently'."}],
  [{q:"'I ___ here since 2020.' Correct:",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect."},{q:"'Coherent' means:",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct."},{q:"'Information' is:",opts:["Countable","Uncountable","Proper","Abstract only"],ans:1,exp:"'Information' is uncountable — no plural."},{q:"Correct passive: 'The essay ___ by Friday.'",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,exp:"Passive = modal + be + past participle."}],
  [{q:"'Despite ___ tired, she studied.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing)."},{q:"'Fundamental' means:",opts:["Optional","Very difficult","Forming the essential base","Interesting"],ans:2,exp:"Fundamental = forming the foundation."},{q:"'I assisted the conference.' Error:",opts:["'I' → 'We'","'assisted' → 'attended'","'conference' wrong","No error"],ans:1,exp:"'Assist' = help. 'Attend' = be present at an event."},{q:"Reported speech: 'I am preparing.' → She said she ___ .",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Present continuous → past continuous in reported speech."},{q:"Academic synonym for 'show':",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' = the academic equivalent of 'show'."}],
  [{q:"Correct future plan:",opts:["I study tonight.","I am going to study tonight.","I will to study.","I studying tonight."],ans:1,exp:"Personal future plans: 'going to' + base verb."},{q:"'Relevant' means:",opts:["Very impressive","Directly connected to the topic","Out of date","Difficult"],ans:1,exp:"Relevant = directly connected to the subject."},{q:"Correct 'for/since':",opts:["I've studied since two years.","I've studied for 2019.","I've studied for two years.","I study since two years."],ans:2,exp:"'For' + duration. 'Since' + point in time."},{q:"Purpose of 'Evidence' in PEEL:",opts:["Restate the point","Provide concrete proof","Conclude the essay","Introduce a new topic"],ans:1,exp:"Evidence provides concrete proof — stats, quotes, real examples."},{q:"'She ___ before the deadline.' Best:",opts:["submits","submitted","had submitted","submitting"],ans:1,exp:"Past simple for a completed action at a specific past time."}],
];

const PLACEMENT_Q = [
  {s:"Grammar",q:"'She ___ to school every day.'",opts:["go","goes","going","gone"],ans:1},
  {s:"Grammar",q:"Error: 'The informations are here.'",opts:["The","informations","are","here"],ans:1},
  {s:"Grammar",q:"'If I ___ rich, I would travel.'",opts:["am","was","were","be"],ans:2},
  {s:"Grammar",q:"Correct sentence:",opts:["She don't like coffee.","She doesn't likes it.","She doesn't like coffee.","She not like coffee."],ans:2},
  {s:"Grammar",q:"'Despite ___ tired, he finished.'",opts:["be","being","been","to be"],ans:1},
  {s:"Vocabulary",q:"'Analyse' means:",opts:["To ignore","To study carefully","To write","To memorise"],ans:1},
  {s:"Vocabulary",q:"'Her essay was very ___.' (well-organised)",opts:["confusing","coherent","boring","long"],ans:1},
  {s:"Vocabulary",q:"'Evidence' means:",opts:["A feeling","A guess","Facts supporting an argument","A question"],ans:2},
  {s:"Vocabulary",q:"FALSE FRIEND for French speakers:",opts:["Book","Actually","Table","School"],ans:1},
  {s:"Vocabulary",q:"'The study requires ___ data.'",opts:["emotional","empirical","fictional","random"],ans:1},
  {s:"Reading",q:"Which sentence is in the passive voice?",opts:["The student wrote the essay.","The essay was written by the student.","She writes every day.","They are studying now."],ans:1},
  {s:"Reading",q:"A 'PEEL paragraph' stands for:",opts:["Point, Example, Explain, Link","Point, Explanation, Evidence, Link","Plan, Execute, Edit, Launch","Paragraph, Essay, Edit, List"],ans:1},
  {s:"Reading",q:"'Concluded' means:",opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
  {s:"Reading",q:"A 'glossary' is:",opts:["Questions list","Word definitions","Summary","Bibliography"],ans:1},
  {s:"Reading",q:"Chinua Achebe is known for:",opts:["French literature","African literature in English","Scientific research","Political speeches"],ans:1},
];

const BADGES_DEF = [
  {icon:"✍️",name:"First Write",   desc:"Submit your first PEEL paragraph"},
  {icon:"🔥",name:"Streak 3",      desc:"Log in 3 days in a row"},
  {icon:"📐",name:"Grammar Pro",   desc:"Complete 5 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 5 vocabulary words"},
  {icon:"🌍",name:"World Reader",  desc:"Complete 3 reading passages"},
  {icon:"🧪",name:"Quiz Master",   desc:"Complete 5 quizzes"},
];

const MODS = [
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",   sub:"Grammar rules & practice",    color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",  sub:"Academic vocabulary",          color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Writing Lab",      sub:"PEEL paragraph + AI feedback", color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",     sub:"Passages + comprehension",     color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes", sub:"French-English errors",        color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",       sub:"5 random questions",           color:"#fff8e1"},
];

/* ════════ MAIN APP ════════ */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user,   setUser]   = useState(null);
  const [theme,  setTheme]  = useState(THEMES.default);
  const [xp,     setXp]     = useState(0);
  const [streak, setStreak] = useState(1);
  const [done,   setDone]   = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats,  setStats]  = useState({grammar:0,vocab:0,quiz:0,reading:0,peel:0});
  const [tab,    setTab]    = useState("home");
  const [mod,    setMod]    = useState(null);
  const [placementDone, setPlacementDone] = useState(false);
  const [placementResult, setPlacementResult] = useState(null);
  const [toast,  setToast]  = useState(null);

  const G = theme.G, LT = theme.LT, DK = theme.DK, BG = theme.BG;
  const acadLvl = getAcadLvl(xp);
  const lvl = getLvl(xp);

  const showToast = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 2500);
  };

  const earnXP = (modId) => {
    if(done.includes(modId)) { showToast("XP already earned today for this module! 🌟", "info"); return false; }
    const pts = XP_EARN[modId] || 10;
    const nx = xp + pts;
    setXp(nx);
    setDone(d => [...d, modId]);
    showToast(`+${pts} XP earned! 🎉`);
    // Badges
    const newBadges = [];
    if(modId==="peel" && !badges.includes("First Write")) newBadges.push("First Write");
    if(modId==="grammar") { const c = (stats.grammar||0)+1; setStats(s=>({...s,grammar:c})); if(c>=5&&!badges.includes("Grammar Pro")) newBadges.push("Grammar Pro"); }
    if(modId==="vocabulary") { const c=(stats.vocab||0)+1; setStats(s=>({...s,vocab:c})); if(c>=5&&!badges.includes("Vocab Champion")) newBadges.push("Vocab Champion"); }
    if(modId==="reading") { const c=(stats.reading||0)+1; setStats(s=>({...s,reading:c})); if(c>=3&&!badges.includes("World Reader")) newBadges.push("World Reader"); }
    if(modId==="quiz") { const c=(stats.quiz||0)+1; setStats(s=>({...s,quiz:c})); if(c>=5&&!badges.includes("Quiz Master")) newBadges.push("Quiz Master"); }
    if(streak>=3&&!badges.includes("Streak 3")) newBadges.push("Streak 3");
    if(newBadges.length) { setBadges(b=>[...b,...newBadges]); showToast(`🏅 Badge earned: ${newBadges[0]}!`); }
    return true;
  };

  if(screen==="landing")   return <Landing go={setScreen} G={G} DK={DK}/>;
  if(screen==="auth")      return <AuthScreen mode="login"    onDone={u=>{setUser(u);setScreen("app");}} onSwitch={()=>setScreen("register")} G={G} DK={DK}/>;
  if(screen==="register")  return <AuthScreen mode="register" onDone={u=>{setUser(u);setScreen("placement");}} onSwitch={()=>setScreen("auth")} G={G} DK={DK}/>;
  if(screen==="placement") return <PlacementScreen onDone={r=>{setPlacementDone(true);setPlacementResult(r);setScreen("result");}}/>;
  if(screen==="result")    return <LevelResult result={placementResult} onContinue={()=>setScreen("app")} G={G} LT={LT} DK={DK}/>;

  return (
    <div style={{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:BG,fontFamily:"'Segoe UI',sans-serif",display:"flex",flexDirection:"column",position:"relative"}}>
      {/* Header */}
      <div style={{background:G,color:"#fff",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontWeight:900,fontSize:15}}>✍️ WriteUP UPGC</div>
          <div style={{fontSize:11,opacity:.75}}>{user?.name} · {acadLvl}</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>🔥{streak}</div><div style={{fontSize:10,opacity:.7}}>streak</div></div>
          <div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13}}>⭐{xp}</div><div style={{fontSize:10,opacity:.7}}>XP</div></div>
          <div style={{background:lvl.color,color:"#000",borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:800}}>{lvl.name}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:68}}>
        {mod
          ? <ModShell mod={mod} acadLvl={acadLvl} earnXP={earnXP} onBack={()=>setMod(null)} G={G} LT={LT} DK={DK}/>
          : tab==="home"    ? <HomeScreen setMod={setMod} xp={xp} lvl={lvl} acadLvl={acadLvl} done={done} placementDone={placementDone} onPlacement={()=>setScreen("placement")} G={G} LT={LT} DK={DK}/>
          : tab==="profile" ? <ProfileScreen user={user} xp={xp} lvl={lvl} acadLvl={acadLvl} badges={badges} streak={streak} stats={stats} G={G} LT={LT} DK={DK}/>
          :                   <SettingsScreen user={user} xp={xp} acadLvl={acadLvl} theme={theme} onTheme={t=>{setTheme(t);}} onLogout={()=>{setUser(null);setScreen("landing");}} G={G} LT={LT} DK={DK}/>
        }
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",background:toast.type==="info"?"#1565c0":G,color:"#fff",padding:"10px 20px",borderRadius:20,fontSize:13,fontWeight:700,zIndex:100,boxShadow:"0 4px 16px rgba(0,0,0,.2)",whiteSpace:"nowrap"}}>{toast.msg}</div>
      )}

      {/* Bottom Nav */}
      {!mod && (
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:"#fff",borderTop:"1px solid #e8f5e9",display:"flex"}}>
          {[["home","🏠","Home"],["profile","👤","Profile"],["settings","⚙️","More"]].map(([t,ic,lb])=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,background:"none",border:"none",padding:"10px 0",cursor:"pointer",color:tab===t?G:"#aaa",fontWeight:tab===t?800:400,fontSize:11,fontFamily:"inherit"}}>
              <div style={{fontSize:22}}>{ic}</div>{lb}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── LANDING ── */
function Landing({go,G,DK}) {
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${DK} 0%,${G} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:60,marginBottom:10}}>✍️</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 6px"}}>WriteUP UPGC</h1>
      <p style={{opacity:.85,fontSize:15,marginBottom:4}}>Academic English for L2 Students</p>
      <p style={{opacity:.6,fontSize:12,marginBottom:36}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:40}}>
        <button onClick={()=>go("auth")} style={{background:"#fff",color:G,border:"none",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Log In</button>
        <button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid #fff",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Sign Up</button>
      </div>
      <div style={{display:"flex",gap:16,opacity:.7,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>
        {["🎯 Level Test","📚 Rich Content","🤖 AI Writing","🏅 Badges","⭐ XP System"].map(t=><span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

/* ── AUTH ── */
function AuthScreen({mode,onDone,onSwitch,G,DK}) {
  const [name, setName] = useState("");
  const [email,setEmail]= useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");

  const submit = () => {
    if(!email||!pass) return setErr("Please fill all fields.");
    if(mode==="register"&&!name) return setErr("Please enter your name.");
    if(pass.length<6) return setErr("Password must be at least 6 characters.");
    onDone({name: name||email.split("@")[0], email});
  };

  const inp = (ph,val,set,type="text") => (
    <input placeholder={ph} type={type} value={val} onChange={e=>set(e.target.value)}
      style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:G,margin:"8px 0 4px"}}>{mode==="auth"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register" && inp("Full name",name,setName)}
        {inp("Email",email,setEmail,"email")}
        {inp("Password",pass,setPass,"password")}
        {err && <p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        <PBtn onClick={submit} style={{background:G}}>{mode==="auth"?"Log In":"Register & Take Placement Test"}</PBtn>
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="auth"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:G,cursor:"pointer",fontWeight:700}}>{mode==="auth"?"Sign up":"Log in"}</span>
        </p>
        <p style={{textAlign:"center",color:"#bbb",fontSize:11,marginTop:8}}>Demo mode — no real data stored</p>
      </Card>
    </div>
  );
}

/* ── PLACEMENT ── */
function PlacementScreen({onDone}) {
  const [idx, setIdx]   = useState(0);
  const [sel, setSel]   = useState(null);
  const [conf,setConf]  = useState(false);
  const [sc,  setSc]    = useState({Grammar:0,Vocabulary:0,Reading:0});
  const q = PLACEMENT_Q[idx];

  const confirm = () => {
    if(sel===null) return;
    if(sel===q.ans) setSc(s=>({...s,[q.s]:s[q.s]+1}));
    setConf(true);
  };
  const next = () => {
    if(idx<14){ setIdx(i=>i+1); setSel(null); setConf(false); }
    else {
      const fs={...sc}; if(sel===q.ans) fs[q.s]++;
      const tot=fs.Grammar+fs.Vocabulary+fs.Reading;
      onDone({level:tot>=11?"Advanced":tot>=6?"Intermediate":"Beginner",scores:fs,total:tot});
    }
  };

  const secs=["Grammar","Vocabulary","Reading"];
  const icons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const si=secs.indexOf(q.s);

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:20,paddingTop:16}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:"#1b4332",margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions · Find your starting level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Q {idx+1}/15</span><span style={{color:"#2D6A4F",fontWeight:700}}>{Math.round((idx/15)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}><div style={{background:"#2D6A4F",height:8,borderRadius:99,width:`${(idx/15)*100}%`,transition:"width .4s"}}/></div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {secs.map((s,ix)=><div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:ix<si?"#2D6A4F":ix===si?"#81c784":"#e0e0e0"}}/><span style={{fontSize:11,color:ix<=si?"#2D6A4F":"#bbb",fontWeight:ix===si?700:400}}>{icons[s]} {s}</span></div>)}
          </div>
        </div>
        <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:"#1b4332",fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p></Card>
        {q.opts.map((o,oi)=>{
          const isC=oi===q.ans,isP=oi===sel;
          let bg="#fff",br="#e0e0e0";
          if(conf){if(isP&&isC){bg="#e8f5e9";br="#2D6A4F";}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC){bg="#fff9c4";br="#f9a825";}}
          else if(isP){bg="#d8f3dc";br="#2D6A4F";}
          return <button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
            {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC?"💡 ":""}{o}
          </button>;
        })}
        {!conf?<PBtn onClick={confirm} disabled={sel===null}>Confirm Answer</PBtn>
               :<PBtn onClick={next}>{idx<14?"Next →":"See My Level 🎯"}</PBtn>}
      </div>
    </div>
  );
}

/* ── LEVEL RESULT ── */
function LevelResult({result,onContinue,G,LT,DK}) {
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Content focuses on essential grammar, core vocabulary, and accessible reading passages.",Intermediate:"Content challenges you with more complex grammar and academic vocabulary.",Advanced:"Content develops your academic writing and critical reading at a high level."};
  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <Card style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:64,marginBottom:8}}>{icons[result.level]}</div>
          <h2 style={{color:G,fontSize:24,margin:"0 0 4px"}}>Your Level:</h2>
          <div style={{background:LT,borderRadius:12,padding:"10px 24px",display:"inline-block",margin:"8px 0 12px"}}><span style={{fontSize:22,fontWeight:900,color:DK}}>{result.level}</span></div>
          <p style={{color:"#555",fontSize:14,lineHeight:1.7}}>{descs[result.level]}</p>
        </Card>
        <Card style={{marginBottom:16}}>
          <h4 style={{color:DK,margin:"0 0 12px"}}>📊 Your Scores</h4>
          {Object.entries(result.scores).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:600,color:DK}}>{k}</span><span style={{color:G,fontWeight:700}}>{v}/5</span></div>
              <Bar val={v} max={5} color={G}/>
            </div>
          ))}
          <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,color:DK}}>Total</span><span style={{color:G,fontWeight:800}}>{result.total}/15</span></div>
        </Card>
        <PBtn onClick={onContinue} style={{background:G}}>Start Learning →</PBtn>
      </div>
    </div>
  );
}

/* ── HOME ── */
function HomeScreen({setMod,xp,lvl,acadLvl,done,placementDone,onPlacement,G,LT,DK}) {
  const pct = Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100);
  return (
    <div style={{padding:16}}>
      {!placementDone && (
        <Card style={{marginBottom:14,background:`linear-gradient(135deg,${LT},#b7e4c7)`,border:`2px solid ${G}`}}>
          <p style={{fontWeight:700,color:DK,margin:"0 0 4px"}}>🎯 Take your Placement Test!</p>
          <p style={{color:"#555",fontSize:13,margin:"0 0 10px"}}>Find your starting level before exploring the modules.</p>
          <PBtn onClick={onPlacement} style={{background:G}}>Start Placement Test →</PBtn>
        </Card>
      )}
      <Card style={{marginBottom:12,background:`linear-gradient(135deg,${DK},${G})`,color:"#fff"}}>
        <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📅 {dateStr()}</div>
        <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>{done.length>=MODS.length?"🎉 All done today!":"Today's Progress"}</div>
        <div style={{fontSize:12,opacity:.75,marginBottom:10}}>{done.length}/{MODS.length} completed · {acadLvl}</div>
        <div style={{display:"flex",gap:6}}>{MODS.map(m=><div key={m.id} style={{width:28,height:28,borderRadius:"50%",background:done.includes(m.id)?"#fff":"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{done.includes(m.id)?m.icon:"·"}</div>)}</div>
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{fontWeight:700,color:G}}>{lvl.name}</span><span style={{color:"#888"}}>{xp}/{lvl.next} XP</span></div>
        <Bar val={xp-lvl.min} max={lvl.next-lvl.min} color={G}/>
        <p style={{color:"#888",fontSize:12,marginTop:6}}>{lvl.next-xp} XP to next level</p>
      </Card>
      <h3 style={{color:DK,margin:"0 0 12px"}}>Modules</h3>
      {MODS.map(m=>(
        <button key={m.id} onClick={()=>setMod(m)} style={{width:"100%",background:"#fff",border:`1.5px solid ${LT}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.04)",textAlign:"left",marginBottom:10,fontFamily:"inherit"}}>
          <div style={{background:m.color,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:DK,fontSize:14}}>{m.name}</div>
            <div style={{color:"#888",fontSize:12,marginTop:2}}>{m.sub}</div>
          </div>
          {done.includes(m.id)
            ?<span style={{background:"#e8f5e9",color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700}}>✅ Done</span>
            :<span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>+{XP_EARN[m.id]} XP</span>}
        </button>
      ))}
    </div>
  );
}

/* ── MOD SHELL ── */
function ModShell({mod,acadLvl,earnXP,onBack,G,LT,DK}) {
  return (
    <div style={{padding:16}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:14}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div>
        <div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div>
      </div>
      {mod.id==="grammar"    && <GrammarMod    earnXP={earnXP} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="vocabulary" && <VocabMod      earnXP={earnXP} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="peel"       && <PeelMod       earnXP={earnXP} onBack={onBack} acadLvl={acadLvl} G={G} LT={LT} DK={DK}/>}
      {mod.id==="reading"    && <ReadingMod    earnXP={earnXP} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="mistakes"   && <MistakesMod   earnXP={earnXP} onBack={onBack} G={G} LT={LT} DK={DK}/>}
      {mod.id==="quiz"       && <QuizMod       earnXP={earnXP} onBack={onBack} G={G} LT={LT} DK={DK}/>}
    </div>
  );
}

function DoneScreen({xp,modId,earnXP,onBack,G,LT}) {
  const claimed = useRef(false);
  useEffect(()=>{ if(!claimed.current){claimed.current=true; earnXP(modId);} },[]);
  return (
    <div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#555"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p>
      <PBtn onClick={onBack} style={{background:G}}>← Back to Modules</PBtn>
    </div>
  );
}

/* ── GRAMMAR ── */
function GrammarMod({earnXP,onBack,G,LT,DK}) {
  const [c]    = useState(()=>rnd(GRAMMAR_BANK));
  const [sel,  setSel]  = useState(null);
  const [done, setDone] = useState(false);
  const conf=sel!==null, correct=sel===c.ans;
  if(done) return <DoneScreen xp={XP_EARN.grammar} modId="grammar" earnXP={earnXP} onBack={onBack} G={G}/>;
  return (
    <div>
      <Card style={{background:LT,marginBottom:12}}><div style={{fontSize:12,color:"#555"}}>📚 Topic: <strong>{c.title}</strong></div></Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.q}</p></Card>
      {c.opts.map((o,oi)=>{
        const isC=oi===c.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg:LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf && <>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{c.exp}</p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct?<PBtn onClick={()=>setDone(true)} style={{background:G}}>Earn +{XP_EARN.grammar} XP →</PBtn>:<SBtn onClick={onBack}>← Try another exercise</SBtn>}
      </>}
    </div>
  );
}

/* ── VOCAB ── */
function VocabMod({earnXP,onBack,G,LT,DK}) {
  const [c]     = useState(()=>rnd(VOCAB_BANK));
  const [phase, setPhase] = useState("learn");
  const [sel,   setSel]   = useState(null);
  const [done,  setDone]  = useState(false);
  const conf=sel!==null, correct=sel===c.ans;
  if(done) return <DoneScreen xp={XP_EARN.vocabulary} modId="vocabulary" earnXP={earnXP} onBack={onBack} G={G}/>;
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
      <PBtn onClick={()=>setPhase("practice")} style={{background:G}}>Practice this word →</PBtn>
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
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg:"#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg:"#fff9c4";br="#f9a825";}}
        else if(isP){bg:LT;br=G;}
        return <button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf && <>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?`✅ Correct! "${c.word}" fits perfectly.`:`⚠️ The correct word is "${c.opts[c.ans]}". Review the definition!`}
          </p>
        </Card>
        {correct?<PBtn onClick={()=>setDone(true)} style={{background:G}}>Earn +{XP_EARN.vocabulary} XP →</PBtn>:<SBtn onClick={onBack}>← Try another word</SBtn>}
      </>}
    </div>
  );
}

/* ── READING ── */
function ReadingMod({earnXP,onBack,G,LT,DK}) {
  const [c]      = useState(()=>rnd(READING_BANK));
  const [phase,  setPhase]   = useState("read");
  const [ans,    setAns]     = useState([null,null,null]);
  const [checked,setChecked] = useState(false);
  const [done,   setDone]    = useState(false);
  const [showG,  setShowG]   = useState(false);
  const score = ans.filter((a,i)=>a===c.qs[i]?.ans).length;
  if(done) return <DoneScreen xp={XP_EARN.reading} modId="reading" earnXP={earnXP} onBack={onBack} G={G}/>;
  if(phase==="read") return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        {c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <button onClick={()=>setShowG(!showG)} style={{background:"none",border:"none",fontWeight:700,color:"#e65100",fontSize:13,cursor:"pointer",padding:0,width:"100%",textAlign:"left"}}>📖 Glossary {showG?"▲":"▼"}</button>
        {showG && c.gloss.map(g=><div key={g.w} style={{display:"flex",gap:8,marginTop:8,fontSize:13}}><strong style={{color:DK,minWidth:100,flexShrink:0}}>{g.w}</strong><span style={{color:"#555",lineHeight:1.5}}>{g.d}</span></div>)}
      </Card>
      <PBtn onClick={()=>setPhase("quiz")} style={{background:G}}>Answer Questions →</PBtn>
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
            return <button key={oi} onClick={()=>{if(!checked)setAns(a=>{const n=[...a];n[qi]=oi;return n;});}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${br}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isP&&isC?"✅ ":checked&&isP&&!isC?"❌ ":checked&&!isP&&isC?"💡 ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ?<PBtn onClick={()=>setChecked(true)} disabled={ans.includes(null)} style={{background:ans.includes(null)?"#ccc":G}}>Check Answers</PBtn>
        :<div>
          <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
            <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading!"}</strong>
          </Card>
          <PBtn onClick={()=>setDone(true)} style={{background:G}}>Earn +{XP_EARN.reading} XP</PBtn>
        </div>}
    </div>
  );
}

/* ── PEEL ── */
function PeelMod({earnXP,onBack,acadLvl,G,LT,DK}) {
  const [c]      = useState(()=>rnd(PEEL_TOPICS));
  const [phase,  setPhase]  = useState("intro");
  const [step,   setStep]   = useState(0);
  const [vals,   setVals]   = useState({point:"",explanation:"",evidence:"",link:""});
  const [fb,     setFb]     = useState(null);
  const [loading,setLoading]= useState(false);
  const [attempts,setAttempts]=useState(0);
  const [showEx, setShowEx] = useState(false);
  const [done,   setDone]   = useState(false);

  const keys   = ["point","explanation","evidence","link"];
  const labels = ["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minW   = WMIN[acadLvl] || WMIN.Beginner;

  if(done) return <DoneScreen xp={XP_EARN.peel} modId="peel" earnXP={earnXP} onBack={onBack} G={G}/>;

  const callAI = async () => {
    setLoading(true); setFb(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`You are a strict, helpful English writing examiner for ${acadLvl} university students in Côte d'Ivoire. Evaluate PEEL paragraphs fairly. You MUST respond ONLY with a valid JSON object. No markdown, no code blocks, no explanation before or after. Start directly with { and end with }.`,
          messages:[{role:"user",content:`Score this PEEL paragraph on the topic: "${c.prompt}"

POINT: ${vals.point}
EXPLANATION: ${vals.explanation}
EVIDENCE: ${vals.evidence}
LINK: ${vals.link}

Return ONLY this JSON structure (replace numbers with your scores):
{
  "point_score": 0,
  "explanation_score": 0,
  "evidence_score": 0,
  "link_score": 0,
  "total": 0,
  "passed": false,
  "point_feedback": "Your feedback here",
  "explanation_feedback": "Your feedback here",
  "evidence_feedback": "Your feedback here",
  "link_feedback": "Your feedback here",
  "top_tip": "Your top tip here"
}

Scoring rules:
- point_score: 0-25 (Is the argument clear and specific?)
- explanation_score: 0-25 (Is the reasoning logical and developed?)
- evidence_score: 0-25 (Is a specific source named with a statistic?)
- link_score: 0-25 (Does it reconnect to the question?)
- total: sum of all four scores (0-100)
- passed: true if total >= 60`}]
        })
      });

      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";

      // Nettoyage robuste : extraire le JSON même si Claude ajoute du texte autour
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      const parsed = JSON.parse(jsonMatch[0]);

      // Validation : s'assurer que les scores sont bien des nombres
      const safe = (v, max) => Math.min(max, Math.max(0, Number(v) || 0));
      const fb = {
        point_score:       safe(parsed.point_score, 25),
        explanation_score: safe(parsed.explanation_score, 25),
        evidence_score:    safe(parsed.evidence_score, 25),
        link_score:        safe(parsed.link_score, 25),
        total:             safe(parsed.total, 100),
        passed:            Boolean(parsed.passed),
        point_feedback:       parsed.point_feedback       || "",
        explanation_feedback: parsed.explanation_feedback || "",
        evidence_feedback:    parsed.evidence_feedback    || "",
        link_feedback:        parsed.link_feedback        || "",
        top_tip:              parsed.top_tip              || "",
      };

      // Recalcul du total au cas où Claude se trompe dans la somme
      const recalcTotal = fb.point_score + fb.explanation_score + fb.evidence_score + fb.link_score;
      fb.total  = recalcTotal;
      fb.passed = recalcTotal >= 60;

      setFb(fb);
      setAttempts(a => a + 1);
      setPhase("feedback");

    } catch(err) {
      console.error("PEEL AI error:", err);
      setFb({
        point_score:0, explanation_score:0, evidence_score:0, link_score:0,
        total:0, passed:false,
        point_feedback:"AI feedback unavailable.",
        explanation_feedback:"", evidence_feedback:"", link_feedback:"",
        top_tip:"Please check your internet connection and try again."
      });
      setPhase("feedback");
    }
    setLoading(false);
  };

  if(phase==="intro") return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:14}}>
        <h3 style={{margin:"0 0 6px",fontSize:18}}>The PEEL Method</h3>
        <p style={{margin:0,fontSize:13,opacity:.85,lineHeight:1.6}}>Write structured academic paragraphs step by step with AI feedback.</p>
      </Card>
      {[{l:"P",name:"Point",color:"#e3f2fd",desc:"State your main argument clearly in 1–2 sentences.",do:"Start confidently. Avoid 'I think'. Be specific.",dont:"Don't begin with a question or be vague."},
        {l:"E",name:"Explanation",color:"#e8f5e9",desc:"Develop your point by explaining WHY it is true.",do:"Use: 'Furthermore', 'In addition'. Add 2–3 reasons.",dont:"Don't just repeat the Point in other words."},
        {l:"E",name:"Evidence",color:"#fff3e0",desc:"Provide concrete proof — a statistic, study, or real example.",do:"Introduce: 'According to...', name your source.",dont:"Never use vague 'studies show' without naming the source."},
        {l:"L",name:"Link",color:"#fce4ec",desc:"Connect your argument back to the essay question.",do:"Use: 'Therefore...', 'This demonstrates that...'",dont:"Don't introduce new arguments. Don't copy your Point."},
      ].map(p=>(
        <Card key={p.l} style={{marginBottom:10,borderLeft:`4px solid ${G}`}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{background:p.color,borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:20,color:G,flexShrink:0}}>{p.l}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,color:DK,fontSize:15,marginBottom:3}}>{p.name}</div>
              <div style={{fontSize:13,color:"#555",lineHeight:1.6,marginBottom:6}}>{p.desc}</div>
              <div style={{fontSize:12,color:G,marginBottom:2}}>✅ {p.do}</div>
              <div style={{fontSize:12,color:"#c62828"}}>❌ {p.dont}</div>
            </div>
          </div>
        </Card>
      ))}
      <Card style={{background:"#f9fbe7",marginBottom:14}}>
        <button onClick={()=>setShowEx(!showEx)} style={{background:"none",border:"none",fontWeight:700,color:"#e65100",cursor:"pointer",padding:0,fontSize:13,width:"100%",textAlign:"left"}}>💡 See a Strong Example {showEx?"▲":"▼"}</button>
        {showEx && (
          <div style={{marginTop:10}}>
            <p style={{fontSize:12,color:"#888",marginBottom:6}}>Topic: Technology in Education</p>
            {keys.map(k=>(
              <div key={k} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:800,color:G,textTransform:"uppercase",marginBottom:2}}>{k}</div>
                <p style={{fontSize:13,color:"#444",fontStyle:"italic",margin:0,background:"#fff",borderRadius:8,padding:"6px 10px",lineHeight:1.7}}>{c.example[k]}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      <PBtn onClick={()=>{setPhase("write");setStep(0);}} style={{background:G}}>✍️ Start Writing</PBtn>
    </div>
  );

  if(phase==="write") return (
    <div>
      {attempts>0 && <Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}><p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision #{attempts} — Apply feedback carefully.</p></Card>}
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontWeight:800,color:DK,fontSize:15}}>{c.title}</div>
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
      <Card style={{marginBottom:12,borderLeft:`4px solid ${G}`}}>
        <div style={{fontWeight:800,color:DK,fontSize:15,marginBottom:4}}>{labels[step]}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"#888"}}>Minimum: {minW[keys[step]]} words</span>
          <span style={{fontSize:12,fontWeight:700,color:wc(vals[keys[step]])>=minW[keys[step]]?G:wc(vals[keys[step]])>0?"#f57c00":"#aaa"}}>{wc(vals[keys[step]])} words {wc(vals[keys[step]])>=minW[keys[step]]?"✅":""}</span>
        </div>
      </Card>
      <textarea value={vals[keys[step]]} onChange={e=>setVals(p=>({...p,[keys[step]]:e.target.value}))}
        placeholder={`Write your ${keys[step]} here… (min ${minW[keys[step]]} words)`} rows={5}
        style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wc(vals[keys[step]])>=minW[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",marginBottom:8}}/>
      {loading
        ? <div style={{textAlign:"center",padding:20}}><Spinner G={G}/><p style={{color:G,fontWeight:600}}>AI is reviewing your paragraph…</p></div>
        : <PBtn onClick={()=>{if(step<3)setStep(s=>s+1);else callAI();}} disabled={!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]} style={{background:!vals[keys[step]]||wc(vals[keys[step]])<minW[keys[step]]?"#ccc":G}}>
            {step<3?`Next: ${labels[step+1]} →`:"🤖 Get AI Feedback"}
          </PBtn>}
      {step>0 && <SBtn onClick={()=>setStep(s=>s-1)} style={{marginTop:8}}>← Previous section</SBtn>}
    </div>
  );

  if(phase==="feedback"&&fb) {
    const crit=[{id:"point_score",label:"Point",max:25},{id:"explanation_score",label:"Explanation",max:25},{id:"evidence_score",label:"Evidence",max:25},{id:"link_score",label:"Link",max:25}];
    const fbMap={point_score:fb.point_feedback,explanation_score:fb.explanation_feedback,evidence_score:fb.evidence_feedback,link_score:fb.link_feedback};
    return (
      <div>
        <Card style={{background:fb.passed?`linear-gradient(135deg,${DK},${G})`:"linear-gradient(135deg,#c62828,#e53935)",color:"#fff",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:13,opacity:.85,marginBottom:4}}>📊 Attempt #{attempts} · {fb.passed?"✅ PASSED":"❌ REVISION REQUIRED"}</div>
          <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{fb.total}<span style={{fontSize:24,fontWeight:400}}>/100</span></div>
          <div style={{fontSize:14,fontWeight:700,opacity:.9}}>
            {fb.total>=80?"🏆 Excellent":fb.total>=70?"👏 Passed":fb.total>=50?"📈 Good effort":"💪 Revision needed"}
          </div>
        </Card>
        <Card style={{marginBottom:14}}>
          {crit.map(cr=>{
            const s=fb[cr.id]||0;
            return <div key={cr.id} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
                <span style={{fontWeight:700,color:DK}}>{cr.label}</span>
                <span style={{color:s/cr.max>=.75?G:s/cr.max>=.5?"#f57c00":"#e53935",fontWeight:700}}>{s}/{cr.max}</span>
              </div>
              <Bar val={s} max={cr.max} color={s/cr.max>=.75?G:s/cr.max>=.5?"#f57c00":"#e53935"}/>
              {fbMap[cr.id]&&<p style={{color:"#555",fontSize:12,marginTop:6,lineHeight:1.6}}>{fbMap[cr.id]}</p>}
            </div>;
          })}
        </Card>
        {fb.top_tip && <Card style={{background:"#fff8e1",marginBottom:14}}><p style={{fontWeight:700,color:"#e65100",margin:"0 0 4px"}}>💡 Top Tip</p><p style={{color:"#555",fontSize:13,margin:0,lineHeight:1.6}}>{fb.top_tip}</p></Card>}
        {fb.passed
          ?<PBtn onClick={()=>setDone(true)} style={{background:G}}>Claim +{XP_EARN.peel} XP 🎉</PBtn>
          :<PBtn onClick={()=>{setPhase("write");setStep(0);}} style={{background:"#e65100"}}>🔄 Revise My Paragraph →</PBtn>}
        <SBtn onClick={onBack} style={{marginTop:8}}>← Back without earning XP</SBtn>
      </div>
    );
  }
  return <Spinner G={G}/>;
}

/* ── MISTAKES ── */
function MistakesMod({earnXP,onBack,G,LT,DK}) {
  const [c]    = useState(()=>rnd(MISTAKES_BANK));
  const [done, setDone] = useState(false);
  if(done) return <DoneScreen xp={XP_EARN.mistakes} modId="mistakes" earnXP={earnXP} onBack={onBack} G={G}/>;
  return (
    <div>
      <Card style={{borderLeft:"4px solid #ff9800",marginBottom:14}}>
        <span style={{background:"#fff3e0",color:"#e65100",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{c.title}</span>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}><span style={{fontSize:18}}>🇫🇷</span><span style={{fontSize:13,color:"#666",fontStyle:"italic"}}>French pattern: <strong>{c.fr}</strong></span></div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}><div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:6}}>❌ Common Error</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong}"</p></Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}><div style={{fontSize:12,color:G,fontWeight:700,marginBottom:6}}>✅ Correct English</div><p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.right}"</p></Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}><div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:6}}>📐 Rule</div><p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p></Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>📝 More Examples</div>
        {c.ex.map((e,i)=><div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:i<c.ex.length-1?"1px solid #f0f0f0":"none"}}>
          <div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.w}</div>
          <div style={{fontSize:13,color:G,fontWeight:600}}>✅ {e.r}</div>
        </div>)}
      </Card>
      <PBtn onClick={()=>setDone(true)} style={{background:G}}>Got it! Earn +{XP_EARN.mistakes} XP</PBtn>
    </div>
  );
}

/* ── QUIZ ── */
function QuizMod({earnXP,onBack,G,LT,DK}) {
  const [qs]     = useState(()=>rnd(QUIZ_SETS));
  const [idx,    setIdx]    = useState(0);
  const [sel,    setSel]    = useState(null);
  const [score,  setScore]  = useState(0);
  const [review, setReview] = useState(false);
  const q = qs[idx];
  const conf=sel!==null, correct=sel===q?.ans;

  if(review) return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#555",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
      </Card>
      {score>0?<PBtn onClick={()=>earnXP("quiz")&&onBack()} style={{background:G}}>Claim +{score*2} XP →</PBtn>:<SBtn onClick={onBack}>← Try again tomorrow</SBtn>}
    </div>
  );

  const next = () => { if(idx<qs.length-1){setIdx(i=>i+1);setSel(null);}else setReview(true); };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}><span>Q {idx+1}/{qs.length}</span><span style={{color:G,fontWeight:700}}>Score: {score}</span></div>
      <Bar val={idx} max={qs.length} color={G}/>
      <div style={{height:12}}/>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const isC=oi===q.ans,isP=oi===sel;
        let bg="#fff",br="#e0e0e0";
        if(conf){if(isP&&isC){bg="#e8f5e9";br=G;}else if(isP&&!isC){bg="#ffebee";br="#e53935";}else if(!isP&&isC&&!correct){bg="#fff9c4";br="#f9a825";}}
        else if(isP){bg=LT;br=G;}
        return <button key={oi} onClick={()=>{if(!conf){setSel(oi);if(oi===q.ans)setScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${br}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {conf&&isP&&isC?"✅ ":conf&&isP&&!isC?"❌ ":conf&&!isP&&isC&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {conf && <>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>{correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}</p>
        </Card>
        <PBtn onClick={next} style={{background:G}}>{idx<qs.length-1?"Next →":"See Results"}</PBtn>
      </>}
    </div>
  );
}

/* ── PROFILE ── */
function ProfileScreen({user,xp,lvl,acadLvl,badges,streak,stats,G,LT,DK}) {
  const pct = Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100);
  return (
    <div style={{padding:16}}>
      <div style={{background:`linear-gradient(135deg,${DK},${G})`,borderRadius:20,padding:24,color:"#fff",textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:52,marginBottom:8}}>👤</div>
        <div style={{fontWeight:900,fontSize:20}}>{user?.name}</div>
        <div style={{opacity:.75,fontSize:13,marginBottom:8}}>{user?.email}</div>
        <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"6px 16px",display:"inline-block",fontSize:14,fontWeight:700,marginBottom:14}}>{acadLvl}</div>
        <div style={{marginBottom:8}}>
          <Bar val={xp-lvl.min} max={lvl.next-lvl.min} color={lvl.color}/>
          <div style={{fontSize:12,opacity:.75,marginTop:4}}>{xp} / {lvl.next} XP · {lvl.name}</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:8}}>
          {[["⭐",xp,"XP"],["🔥",streak,"Streak"],["🏅",lvl.name,"Level"]].map(([ic,v,lb])=>(
            <div key={lb}><div style={{fontWeight:800,fontSize:17}}>{v}</div><div style={{fontSize:11,opacity:.75}}>{lb}</div></div>
          ))}
        </div>
      </div>
      <Card style={{marginBottom:16}}>
        <h4 style={{color:DK,margin:"0 0 12px"}}>📊 Module Stats</h4>
        {[["✏️ Grammar exercises",stats.grammar||0],["🔤 Vocab words",stats.vocab||0],["📖 Readings",stats.reading||0],["🧪 Quizzes",stats.quiz||0],["📝 PEEL submits",stats.peel||0]].map(([lb,v])=>(
          <div key={lb} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f5f5f5",fontSize:13}}><span style={{color:"#555"}}>{lb}</span><strong style={{color:G}}>{v}</strong></div>
        ))}
      </Card>
      <h3 style={{color:DK,marginBottom:12}}>🏅 Badges</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {BADGES_DEF.map(b=>{
          const earned=badges.includes(b.name);
          return <div key={b.name} style={{background:earned?"#fff":"#f5f5f5",borderRadius:14,padding:14,opacity:earned?1:.5,boxShadow:earned?"0 2px 8px rgba(0,0,0,.08)":"none"}}>
            <div style={{fontSize:28}}>{b.icon}</div>
            <div style={{fontWeight:700,fontSize:13,color:DK,marginTop:4}}>{b.name}</div>
            <div style={{fontSize:11,color:"#777",lineHeight:1.4,marginTop:2}}>{b.desc}</div>
            {!earned&&<div style={{fontSize:10,color:"#bbb",marginTop:4}}>🔒 Locked</div>}
          </div>;
        })}
      </div>
    </div>
  );
}

/* ── SETTINGS ── */
function SettingsScreen({user,xp,acadLvl,theme,onTheme,onLogout,G,LT,DK}) {
  const [activeT, setActiveT] = useState("default");
  const lvl = getLvl(xp);
  const canForest = xp>=200, canOcean = xp>=1000;

  const applyTheme = (k) => { setActiveT(k); onTheme(THEMES[k]); };

  return (
    <div style={{padding:16}}>
      <h3 style={{color:DK,marginBottom:16}}>⚙️ Settings & Profile</h3>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:2}}>Logged in as</div>
        <div style={{fontWeight:700,color:DK,fontSize:15}}>{user?.name}</div>
        <div style={{fontSize:13,color:"#888",marginBottom:8}}>{user?.email}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{background:LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{acadLvl}</span>
          <span style={{background:"#e3f2fd",color:"#1565c0",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>⭐ {xp} XP</span>
          <span style={{background:"#fff8e1",color:"#f57c00",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{lvl.name}</span>
        </div>
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,color:DK,fontSize:15,marginBottom:12}}>🎨 Visual Themes</div>
        {[{k:"default",name:"🌿 Default Green",locked:false,req:0},{k:"forest",name:"🌲 Dark Forest",locked:!canForest,req:200},{k:"ocean",name:"🌊 Ocean Blue",locked:!canOcean,req:1000}].map(t=>(
          <div key={t.k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"10px 12px",borderRadius:12,background:activeT===t.k?LT:t.locked?"#f5f5f5":"#fff",border:activeT===t.k?`2px solid ${G}`:"1.5px solid #eee",opacity:t.locked?.6:1}}>
            <div><div style={{fontWeight:700,color:DK,fontSize:13}}>{t.name}</div>{t.locked&&<div style={{fontSize:11,color:"#f57c00"}}>🔒 Unlock at {t.req} XP</div>}</div>
            {!t.locked&&<button onClick={()=>applyTheme(t.k)} style={{background:activeT===t.k?G:"#e0e0e0",color:activeT===t.k?"#fff":"#555",border:"none",borderRadius:10,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{activeT===t.k?"Active":"Apply"}</button>}
          </div>
        ))}
      </Card>
      <Card style={{marginBottom:14,background:"#f9fbe7"}}>
        <div style={{fontWeight:700,color:DK,fontSize:14}}>📱 About WriteUP UPGC</div>
        <p style={{color:"#555",fontSize:13,margin:"6px 0 0",lineHeight:1.6}}>Academic English learning app for students of the Université Peleforo Gon Coulibaly, Korhogo, Côte d'Ivoire. Built with ❤️ for L2 learners.</p>
      </Card>
      <button onClick={onLogout} style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log Out</button>
    </div>
  );
}
