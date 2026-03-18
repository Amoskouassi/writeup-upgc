import { useState, useEffect } from "react";

const G = "#2D6A4F", LT = "#d8f3dc", DK = "#1b4332";
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "https://qnxeyoxashvbljjmqkrp.supabase.co";
const SB_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";

/* ── Supabase ── */
const sbH = t => ({ "Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${t||SB_KEY}`,"Prefer":"return=representation" });
const sbGet = (p,t) => fetch(`${SB_URL}/rest/v1/${p}`,{headers:sbH(t)}).then(r=>r.json());
const sbPost = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",headers:sbH(t),body:JSON.stringify(b)}).then(r=>r.json());
const sbPatch = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`,{method:"PATCH",headers:{...sbH(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json());
const sbUpsert = (p,b,t) => fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json());
const authSignUp = (e,p) => fetch(`${SB_URL}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const authSignIn = (e,p) => fetch(`${SB_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

const todayStr = () => new Date().toISOString().slice(0,10);
const getLvl = xp => {
  if(xp<500)  return {name:"Bronze", color:"#cd7f32",min:0,   next:500 };
  if(xp<1500) return {name:"Silver", color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return {name:"Gold",   color:"#ffd700",min:1500,next:3000};
  return              {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const rnd = arr => arr[Math.floor(Math.random()*arr.length)];

/* ── UI ── */
const Btn = ({onClick,children,full,secondary,disabled,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{width:full?"100%":"auto",background:secondary?"transparent":G,color:secondary?G:"#fff",border:secondary?`2px solid ${G}`:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,marginTop:8,fontFamily:"inherit",...style}}>{children}</button>
);
const Card = ({children,style={}})=>(
  <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px #0001",...style}}>{children}</div>
);
const Tag = ({children,color})=>(
  <span style={{background:color||LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{children}</span>
);
const Loader = ({text="Chargement…"})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:16}}>
    <div style={{width:40,height:40,border:`4px solid ${LT}`,borderTop:`4px solid ${G}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <p style={{color:G,fontWeight:600,fontSize:14,textAlign:"center"}}>{text}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ════════════════════════════════════════
   CONTENT BANKS
════════════════════════════════════════ */
const GRAMMAR_BANK = [
  {title:"Present Simple vs Continuous",instruction:"Choose the correct verb form.",question:"She ___ to the library every Tuesday morning.",opts:["go","goes","is going","has gone"],ans:1,explanation:"With 'every Tuesday', we use present simple for habits. 'She goes' is correct.",tip:"Use present simple for habits and routines. Use present continuous for actions happening right now."},
  {title:"Countable vs Uncountable Nouns",instruction:"Identify the correct sentence.",question:"Which sentence is correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,explanation:"'Advice' is uncountable — it has no plural form. Never say 'advices' or 'an advice'.",tip:"Uncountable nouns: advice, information, furniture, equipment, news. No -s, no 'a/an'."},
  {title:"Second Conditional",instruction:"Choose the correct form.",question:"If I ___ more time, I would study harder.",opts:["have","had","has","will have"],ans:1,explanation:"Second conditional = If + past simple + would + base verb. Used for hypothetical situations.",tip:"Second conditional: 'If + past simple, would + verb'. It describes unreal or unlikely situations."},
  {title:"Relative Clauses",instruction:"Choose the correct relative pronoun.",question:"The student ___ scored highest received a prize.",opts:["which","whose","who","whom"],ans:2,explanation:"Use 'who' for people in relative clauses. 'Which' is for things.",tip:"Who = people. Which = things/animals. Whose = possession. That = people or things (informal)."},
  {title:"Articles: A, An, The",instruction:"Choose the correct article.",question:"She is studying at ___ university in Abidjan.",opts:["a","an","the","no article"],ans:0,explanation:"'University' starts with a /j/ sound (consonant sound), so we use 'a', not 'an'.",tip:"Use 'an' before vowel sounds (an hour, an umbrella), 'a' before consonant sounds (a university, a European)."},
  {title:"Past Perfect",instruction:"Choose the correct tense.",question:"By the time the teacher arrived, the students ___ their work.",opts:["finish","finished","had finished","have finished"],ans:2,explanation:"Past perfect (had + past participle) is used for an action completed BEFORE another past action.",tip:"Past perfect = had + past participle. Use it when one past action happened before another."},
  {title:"Passive Voice",instruction:"Choose the correct passive form.",question:"The essay ___ by all students before Friday.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,explanation:"Passive voice = must + be + past participle. The subject receives the action.",tip:"Active: 'Students must submit essays.' Passive: 'Essays must be submitted by students.'"},
  {title:"Gerund vs Infinitive",instruction:"Choose the correct form.",question:"She avoided ___ the difficult questions in the exam.",opts:["to answer","answer","answering","answered"],ans:2,explanation:"'Avoid' is always followed by a gerund (-ing form), not an infinitive.",tip:"Verbs followed by gerund: avoid, enjoy, finish, consider, suggest. Verbs + infinitive: want, need, decide, hope."},
  {title:"Reported Speech",instruction:"Choose the correct reported speech.",question:"He said: 'I am studying.' → He said that he ___ studying.",opts:["is","was","were","has been"],ans:1,explanation:"In reported speech, present continuous (am studying) shifts to past continuous (was studying).",tip:"Reported speech tense shifts: am/is → was, have → had, will → would, can → could."},
  {title:"Subject-Verb Agreement",instruction:"Choose the correct verb form.",question:"Neither the students nor the teacher ___ aware of the change.",opts:["were","are","was","is"],ans:2,explanation:"With 'neither...nor', the verb agrees with the nearest subject. 'Teacher' is singular → 'was'.",tip:"Neither...nor / either...or: the verb agrees with the subject closest to it."},
];

const VOCAB_BANK = [
  {word:"Analyse",phonetic:"/ˈæn.ə.laɪz/",french:"Analyser",partOfSpeech:"verb",definition:"To examine something carefully and in detail in order to understand it.",example:"The students must ___ the poem before writing their essay.",blank:"analyse",opts:["analyse","ignore","copy","avoid"],ans:0,memory_tip:"Think of 'ana' + 'lyse' — to loosen apart (Greek). You break something into pieces to understand it."},
  {word:"Significant",phonetic:"/sɪɡˈnɪf.ɪ.kənt/",french:"Important / Significatif",partOfSpeech:"adjective",definition:"Important or large enough to have a noticeable effect or to be worth attention.",example:"There has been a ___ improvement in her writing since last semester.",blank:"significant",opts:["significant","small","boring","strange"],ans:0,memory_tip:"'Sign' is inside — something significant gives a sign that it matters."},
  {word:"Coherent",phonetic:"/kəʊˈhɪə.rənt/",french:"Cohérent / Logique",partOfSpeech:"adjective",definition:"Logical, well-organised, and easy to understand.",example:"A good essay must present a ___ argument from beginning to end.",blank:"coherent",opts:["emotional","coherent","confusing","short"],ans:1,memory_tip:"'Co' = together, 'here' = stick. Coherent ideas stick together logically."},
  {word:"Evidence",phonetic:"/ˈev.ɪ.dəns/",french:"Preuve / Élément de preuve",partOfSpeech:"noun",definition:"Facts, information, or signs that show whether something is true.",example:"You must provide ___ to support every argument in your essay.",blank:"evidence",opts:["opinion","evidence","feeling","title"],ans:1,memory_tip:"'Evident' comes from the same root — something evident is easy to see, like evidence."},
  {word:"Conclude",phonetic:"/kənˈkluːd/",french:"Conclure",partOfSpeech:"verb",definition:"To decide that something is true after considering all the information.",example:"Based on the data, we can ___ that education reduces poverty.",blank:"conclude",opts:["begin","wonder","conclude","forget"],ans:2,memory_tip:"'Con' + 'clude' (close). To conclude is to close your thinking with a final decision."},
  {word:"Approach",phonetic:"/əˈprəʊtʃ/",french:"Approche / Méthode",partOfSpeech:"noun/verb",definition:"A way of dealing with a situation or problem; to come near to something.",example:"The teacher used a creative ___ to explain the grammar rule.",blank:"approach",opts:["problem","mistake","approach","question"],ans:2,memory_tip:"Think of 'approach' as getting closer to solving a problem — step by step."},
  {word:"Fundamental",phonetic:"/ˌfʌn.dəˈmen.təl/",french:"Fondamental / Essentiel",partOfSpeech:"adjective",definition:"Forming the base or foundation; of central importance.",example:"Reading is a ___ skill for all university students.",blank:"fundamental",opts:["optional","fundamental","difficult","rare"],ans:1,memory_tip:"'Fund' = foundation (like a building's base). Fundamental = forming the base of everything."},
  {word:"Illustrate",phonetic:"/ˈɪl.ə.streɪt/",french:"Illustrer / Démontrer",partOfSpeech:"verb",definition:"To make the meaning of something clearer by using examples or pictures.",example:"This graph will ___ how students' scores improved over time.",blank:"illustrate",opts:["hide","illustrate","remove","question"],ans:1,memory_tip:"'Illustrate' contains 'lustre' (light) — you shed light on an idea with an example."},
  {word:"Consequence",phonetic:"/ˈkɒn.sɪ.kwəns/",french:"Conséquence",partOfSpeech:"noun",definition:"A result or effect of an action or condition.",example:"Failing to revise regularly is a major ___ of poor time management.",blank:"consequence",opts:["reason","consequence","beginning","title"],ans:1,memory_tip:"'Con' + 'sequence' — things that follow in sequence after an action."},
  {word:"Emphasise",phonetic:"/ˈem.fə.saɪz/",french:"Souligner / Insister sur",partOfSpeech:"verb",definition:"To show that something is especially important or deserves special attention.",example:"The professor always ___ the importance of proofreading essays.",blank:"emphasise",opts:["ignore","forget","emphasise","remove"],ans:2,memory_tip:"'Em' + 'phase' — to put something in focus, like a camera emphasising one object."},
];

const READING_BANK = [
  {title:"Education and Development in Africa",topic:"Education · Development",passage:"Education is widely recognised as one of the most powerful tools for development in Africa. Countries that invest in schools and universities tend to experience stronger economic growth and lower poverty rates. In Côte d'Ivoire, the government has increased spending on education significantly over the past decade. However, challenges remain, including a lack of qualified teachers in rural areas and limited access to technology. Students who complete secondary education are three times more likely to find formal employment than those who drop out. Experts argue that improving the quality of education, not just access to it, must be the priority for the next generation of African leaders.",glossary:[{word:"recognised",definition:"accepted or acknowledged by people generally"},{word:"investment",definition:"spending money or time to get a future benefit"},{word:"challenges",definition:"difficult problems that require effort to solve"}],questions:[{q:"What does the passage say about countries that invest in education?",opts:["They face more problems","They experience stronger economic growth","They have fewer schools","They spend less on health"],ans:1},{q:"What challenge is mentioned regarding teachers?",opts:["Too many teachers","Lack of qualified teachers in rural areas","Teachers earn too much","Teachers don't speak English"],ans:1},{q:"How much more likely are secondary school graduates to find work?",opts:["Twice as likely","Four times as likely","Three times as likely","Five times as likely"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy · Academic Skills",passage:"Reading is one of the most important habits a university student can develop. Research consistently shows that students who read widely outside of their coursework perform better in examinations and produce higher quality essays. Reading expands vocabulary, improves comprehension, and sharpens critical thinking skills. In many African universities, however, access to books remains limited. Digital libraries and mobile reading applications are beginning to change this situation. A student who reads for just thirty minutes each day can improve their academic performance significantly within a single semester. The habit of reading is not a luxury — it is a necessity for academic success.",glossary:[{word:"consistently",definition:"always happening in the same way"},{word:"comprehension",definition:"the ability to understand something"},{word:"luxury",definition:"something pleasant but not absolutely necessary"}],questions:[{q:"What benefit of reading is NOT mentioned in the passage?",opts:["Expanding vocabulary","Improving comprehension","Learning to speak faster","Sharpening critical thinking"],ans:2},{q:"How long should a student read each day according to the passage?",opts:["One hour","Thirty minutes","Two hours","Fifteen minutes"],ans:1},{q:"What does the author say about reading?",opts:["It is a luxury","It is not important","It is a necessity for academic success","It is only for weak students"],ans:2}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature · Culture",passage:"Chinua Achebe is considered one of the greatest African writers of the twentieth century. His novel Things Fall Apart, published in 1958, tells the story of Okonkwo, a proud Igbo warrior whose life is torn apart by the arrival of European colonisers. The novel was groundbreaking because it presented African culture from an African perspective, challenging the negative portrayals found in European literature of the time. Achebe wrote in English but incorporated Igbo proverbs and storytelling traditions, creating a unique literary style. The novel has been translated into over fifty languages and is studied in schools and universities around the world. Achebe believed that literature had the power to change how people see themselves and others.",glossary:[{word:"groundbreaking",definition:"new and very important; doing something that has never been done before"},{word:"perspective",definition:"a particular way of thinking about something"},{word:"incorporated",definition:"included something as part of a larger whole"}],questions:[{q:"When was Things Fall Apart published?",opts:["1945","1958","1962","1970"],ans:1},{q:"Why was the novel considered groundbreaking?",opts:["It was the first African novel","It presented African culture from an African perspective","It was written in Igbo","It was very long"],ans:1},{q:"Into how many languages has the novel been translated?",opts:["Over 20","Over 30","Over 40","Over 50"],ans:3}]},
];

const MISTAKES_BANK = [
  {title:"'Make' vs 'Do'",french_pattern:"Faire une erreur / Faire un devoir",wrong_english:"I did a mistake in my essay.",correct_english:"I made a mistake in my essay.",rule:"Use 'make' for mistakes, decisions, progress, and noise. Use 'do' for homework, exercises, work, and tasks. This is one of the most common errors for French speakers.",extra_examples:[{wrong:"She did a good decision.",right:"She made a good decision."},{wrong:"He is doing progress in English.",right:"He is making progress in English."}]},
  {title:"'Since' vs 'For'",french_pattern:"J'étudie l'anglais depuis 3 ans.",wrong_english:"I study English since 3 years.",correct_english:"I have been studying English for 3 years.",rule:"'Since' refers to a specific point in time (since 2020, since Monday). 'For' refers to a duration (for 3 years, for two hours). Both require the present perfect tense in English.",extra_examples:[{wrong:"She lives here since 5 years.",right:"She has lived here for 5 years."},{wrong:"I wait for you since 2 hours.",right:"I have been waiting for you for 2 hours."}]},
  {title:"'Actually' ≠ 'Actuellement'",french_pattern:"Actuellement, je travaille à l'UPGC.",wrong_english:"Actually, I work at UPGC.",correct_english:"Currently, I work at UPGC.",rule:"'Actually' is a false friend! In English, 'actually' means 'in fact' or 'to tell the truth'. For the French 'actuellement' (meaning 'right now' or 'at present'), use 'currently' or 'at the moment'.",extra_examples:[{wrong:"Actually, the situation is difficult.",right:"Currently, the situation is difficult. (if meaning 'at present')"},{wrong:"He is actually studying medicine.",right:"He is currently studying medicine. (if meaning 'at present')"}]},
  {title:"Double Negatives",french_pattern:"Je n'ai rien dit. / Je ne vais nulle part.",wrong_english:"I didn't say nothing.",correct_english:"I didn't say anything. / I said nothing.",rule:"English does not allow double negatives. You must choose ONE negative form: either use 'not...anything' or use 'nothing' alone. Using both is grammatically incorrect in standard English.",extra_examples:[{wrong:"She doesn't know nobody here.",right:"She doesn't know anybody here."},{wrong:"He never says nothing in class.",right:"He never says anything in class."}]},
  {title:"'Assist' vs 'Attend'",french_pattern:"J'ai assisté au cours ce matin.",wrong_english:"I assisted the lecture this morning.",correct_english:"I attended the lecture this morning.",rule:"'Assist' means to help someone (assister quelqu'un). 'Attend' means to be present at an event (assister à un événement). This is a classic false friend that confuses French speakers.",extra_examples:[{wrong:"She assisted the wedding last Sunday.",right:"She attended the wedding last Sunday."},{wrong:"Did you assist the meeting?",right:"Did you attend the meeting?"}]},
  {title:"Overusing 'Very'",french_pattern:"Très important / Très bien / Très grand",wrong_english:"This essay is very very important for our life.",correct_english:"This essay is crucial for our lives.",rule:"In academic writing, avoid repeating 'very'. Instead, use stronger, more precise vocabulary. This makes your writing sound more professional and sophisticated.",extra_examples:[{wrong:"The results were very bad.",right:"The results were terrible / poor / disappointing."},{wrong:"She is very good at writing.",right:"She is excellent at writing."}]},
  {title:"Plural of Uncountable Nouns",french_pattern:"Des informations / Des conseils / Des bagages",wrong_english:"She gave me some informations and advices.",correct_english:"She gave me some information and advice.",rule:"'Information', 'advice', 'furniture', 'equipment', 'baggage', and 'news' are uncountable in English. They never take a plural -s and cannot be used with 'a/an'.",extra_examples:[{wrong:"I need some furnitures for my room.",right:"I need some furniture for my room."},{wrong:"The news are very bad today.",right:"The news is very bad today."}]},
];

const QUIZ_BANK = [
  [{q:"Which sentence is correct?",opts:["She don't study hard.","She doesn't study hard.","She not study hard.","She studies not hard."],ans:1,exp:"Negative sentences: Subject + doesn't/don't + base verb. 'She doesn't study' is correct."},{q:"What does 'evidence' mean?",opts:["An opinion","A question","Facts that support an argument","A type of essay"],ans:2,exp:"Evidence = facts or information that prove something is true."},{q:"In PEEL writing, 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link. The Link connects back to the main argument."},{q:"'She gave me some ___.' Which is correct?",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable — no plural, no article 'a/an'. Say 'some advice'."},{q:"'Actually' in English means:",opts:["Currently / At the moment","In fact / To be honest","Actually (same as French)","Often"],ans:1,exp:"'Actually' is a false friend! It means 'in fact', not 'currently'. Use 'currently' for 'actuellement'."}],
  [{q:"Choose the correct form: 'I ___ here since 2020.'",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + a point in time requires present perfect: 'I have lived here since 2020'."},{q:"What does 'coherent' mean?",opts:["Confusing","Logical and well-organised","Emotional","Very long"],ans:1,exp:"Coherent = logical, well-structured, easy to understand. Essential for academic writing."},{q:"Which is correct?",opts:["He made a homework.","He did a mistake.","He made a mistake.","He did a progress."],ans:2,exp:"'Make a mistake' is correct. Use 'make' for mistakes, decisions, noise. Use 'do' for homework, work."},{q:"'The ___ showed that education reduces poverty.' Best word:",opts:["evidence","advices","informations","furniture"],ans:0,exp:"'Evidence' = facts that support a claim. It is uncountable (no plural -s)."},{q:"What is a PEEL paragraph used for?",opts:["Writing a story","Organising an academic argument","Taking notes","Reading a text"],ans:1,exp:"PEEL (Point, Explanation, Evidence, Link) is a structure for writing clear academic paragraphs."}],
  [{q:"'Despite ___ tired, she continued studying.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing form): 'Despite being tired'."},{q:"What does 'fundamental' mean?",opts:["Optional","Very difficult","Forming the base; essential","Interesting"],ans:2,exp:"Fundamental = forming the foundation; of central importance. 'Reading is a fundamental skill.'"},{q:"Which sentence uses passive voice correctly?",opts:["The essay must submit by Friday.","The essay must be submitted by Friday.","The essay must submitted by Friday.","The essay must be submit by Friday."],ans:1,exp:"Passive voice = must + be + past participle. 'The essay must be submitted'."},{q:"'I assisted the conference yesterday.' What is wrong?",opts:["'I' should be 'We'","'assisted' should be 'attended'","'conference' is wrong","Nothing is wrong"],ans:1,exp:"'Assist' means to help. 'Attend' means to be present at an event. Use 'attended the conference'."},{q:"In reported speech: 'I am studying.' → He said that he ___.",opts:["is studying","was studying","has studied","will study"],ans:1,exp:"Reported speech: present continuous (am studying) → past continuous (was studying)."}],
];

const PEEL_TOPICS = [
  {title:"Technology in Education",prompt:"Should technology be used more in African universities?",guidance:{point:"State your position clearly in 1-2 sentences.",explanation:"Explain WHY technology would help (or not) — give 2 reasons.",evidence:"Include a statistic, fact, or reference to support your point.",link:"Connect back to the main question about African universities."},example:{point:"Technology should be integrated more widely into African universities because it improves access to quality education.",explanation:"With smartphones and the internet, students can access academic resources, research papers, and online courses that are unavailable in local libraries. This levels the playing field between students in urban and rural areas.",evidence:"According to UNESCO (2022), students who use digital learning tools score 35% higher on average in standardised assessments.",link:"Therefore, increasing the use of technology in African universities would directly improve educational outcomes and prepare students for a globalised workforce."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",guidance:{point:"State whether you agree or disagree with this statement.",explanation:"Give 2-3 reasons to support your position.",evidence:"Use a statistic or real-world example as proof.",link:"Connect your argument back to national or African development."},example:{point:"Boys and girls must have equal access to education to ensure the full development of African societies.",explanation:"When girls are denied education, communities lose half of their potential talent and productivity. Educated women contribute to healthier families, stronger economies, and more stable communities.",evidence:"The World Bank (2021) reports that every additional year a girl spends in school can increase her future earnings by up to 10%.",link:"For these reasons, gender equality in education is not just a moral obligation — it is an economic necessity for Africa's future."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",guidance:{point:"State your view on social media's impact on students.",explanation:"Explain the main ways social media affects student life — positive or negative.",evidence:"Support your argument with data or a specific example.",link:"Return to the question: does the harm outweigh the benefit?"},example:{point:"Social media causes more harm than good for the majority of university students.",explanation:"Students spend an average of three to four hours daily on platforms like TikTok and Instagram, significantly reducing time available for studying, reading, and sleeping. This distraction directly affects academic performance and mental health.",evidence:"A Harvard University study (2020) found that students who spent more than three hours daily on social media had a 20% lower GPA than those who limited their usage.",link:"While social media has some benefits, its negative impact on focus and academic performance means that students must develop strict digital discipline."}},
  {title:"Importance of English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students.",guidance:{point:"State why English is (or is not) essential for Ivorian students.",explanation:"Give specific reasons related to careers, education, or global communication.",evidence:"Include a fact or statistic about English in the African context.",link:"Connect to what students should do as a result."},example:{point:"Mastering English is essential for Ivorian students who wish to succeed in today's interconnected world.",explanation:"English is the dominant language of international business, scientific research, and global communication. Students who speak English fluently have access to a vastly wider range of opportunities, scholarships, and career paths than those who do not.",evidence:"The African Development Bank reports that English proficiency can increase an African graduate's starting salary by up to 25% compared to monolingual peers.",link:"Given these advantages, Ivorian students should treat English not as a foreign language requirement, but as a critical investment in their professional future."}},
];

/* ═══════════════════════════════════
   PLACEMENT TEST
═══════════════════════════════════ */
const PLACEMENT = [
  {section:"Grammar",q:"Choose the correct form: 'She ___ to school every day.'",opts:["go","goes","going","gone"],ans:1},
  {section:"Grammar",q:"Identify the error: 'The informations are on the table.'",opts:["The","informations","are","table"],ans:1},
  {section:"Grammar",q:"'If I ___ rich, I would travel the world.'",opts:["am","was","were","be"],ans:2},
  {section:"Grammar",q:"Choose the correct sentence:",opts:["She don't like coffee.","She doesn't likes coffee.","She doesn't like coffee.","She not like coffee."],ans:2},
  {section:"Grammar",q:"'Despite ___ tired, he finished the essay.'",opts:["be","being","been","to be"],ans:1},
  {section:"Vocabulary",q:"What does 'analyse' mean?",opts:["To ignore","To study carefully","To write quickly","To memorise"],ans:1},
  {section:"Vocabulary",q:"'Her essay was well-organised — it was very ___.'",opts:["confusing","coherent","boring","long"],ans:1},
  {section:"Vocabulary",q:"'Evidence' in academic writing means:",opts:["A feeling","A guess","Facts that support an argument","A question"],ans:2},
  {section:"Vocabulary",q:"Which word is a FALSE FRIEND for French speakers?",opts:["Book","Actually","Table","School"],ans:1},
  {section:"Vocabulary",q:"'The study requires ___ data, not just opinions.'",opts:["emotional","empirical","fictional","random"],ans:1},
  {section:"Reading",q:"'Okonkwo worked hard to overcome his father's failures.' — Why?",opts:["To become rich","To travel","To overcome his father's failures","To win a prize"],ans:2},
  {section:"Reading",q:"'Education was the light.' — Literary device?",opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {section:"Reading",q:"'Jaja's face was expressionless, but his hand shook.' — This suggests:",opts:["He was happy","He was calm","He was hiding emotions","He was cold"],ans:2},
  {section:"Reading",q:"In academic texts, a 'glossary' is:",opts:["A list of questions","A list of word definitions","A summary","A bibliography"],ans:1},
  {section:"Reading",q:"'The researcher concluded that technology improves learning.' — 'Concluded' means:",opts:["Started","Wondered","Reached a final decision","Forgot"],ans:2},
];

function PlacementTest({onDone}) {
  const [i,setI]=useState(0);
  const [sel,setSel]=useState(null);
  const [conf,setConf]=useState(false);
  const [scores,setScores]=useState({Grammar:0,Vocabulary:0,Reading:0});
  const q=PLACEMENT[i];
  const sections=["Grammar","Vocabulary","Reading"];
  const sIcons={Grammar:"✏️",Vocabulary:"🔤",Reading:"📖"};
  const sColors={Grammar:"#e3f2fd",Vocabulary:"#fff3e0",Reading:"#f3e5f5"};
  const sIdx=sections.indexOf(q.section);

  const confirm=()=>{
    if(sel===null)return;
    if(sel===q.ans)setScores(s=>({...s,[q.section]:s[q.section]+1}));
    setConf(true);
  };
  const next=()=>{
    if(i<PLACEMENT.length-1){setI(p=>p+1);setSel(null);setConf(false);}
    else{
      const fs={...scores};if(sel===q.ans)fs[q.section]++;
      const total=fs.Grammar+fs.Vocabulary+fs.Reading;
      onDone({level:total>=11?"Advanced":total>=6?"Intermediate":"Beginner",scores:fs,total});
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",flexDirection:"column",alignItems:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:20,paddingTop:16}}>
          <div style={{fontSize:36}}>🎯</div>
          <h2 style={{color:DK,margin:"6px 0 2px"}}>Placement Test</h2>
          <p style={{color:"#888",fontSize:13}}>15 questions — Find your level</p>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:6}}>
            <span>Question {i+1}/{PLACEMENT.length}</span>
            <span style={{color:G,fontWeight:700}}>{Math.round((i/PLACEMENT.length)*100)}%</span>
          </div>
          <div style={{background:"#e0e0e0",borderRadius:99,height:8}}>
            <div style={{background:G,height:8,borderRadius:99,width:`${(i/PLACEMENT.length)*100}%`,transition:"width .4s"}}/>
          </div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {sections.map((s,si)=>(
              <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:si<sIdx?G:si===sIdx?"#81c784":"#e0e0e0"}}/>
                <span style={{fontSize:11,color:si<=sIdx?G:"#bbb",fontWeight:si===sIdx?700:400}}>{sIcons[s]} {s}</span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{marginBottom:14}}>
          <div style={{background:sColors[q.section],borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:DK}}>{sIcons[q.section]} {q.section}</span>
          </div>
          <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{q.q}</p>
        </Card>
        {q.opts.map((o,oi)=>{
          const correct=oi===q.ans,picked=oi===sel;
          let bg="#fff",border="#e0e0e0";
          if(conf){if(correct){bg="#e8f5e9";border=G}else if(picked){bg="#ffebee";border="#e53935"}}
          else if(picked){bg=LT;border=G}
          return <button key={oi} onClick={()=>!conf&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:conf?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
            {conf&&correct?"✅ ":conf&&picked&&!correct?"❌ ":""}{o}
          </button>;
        })}
        {!conf?<Btn full disabled={sel===null} onClick={confirm}>Confirm Answer</Btn>
              :<Btn full onClick={next}>{i<PLACEMENT.length-1?"Next →":"See My Level 🎯"}</Btn>}
      </div>
    </div>
  );
}

function LevelResult({result,onContinue}) {
  const icons={Beginner:"🌱",Intermediate:"🌿",Advanced:"🌳"};
  const descs={Beginner:"Your content will focus on basic grammar, essential vocabulary, and simple reading.",Intermediate:"Your content will challenge you with more complex grammar and academic vocabulary.",Advanced:"Your content will push your academic writing and critical reading skills."};
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
        <Btn full onClick={onContinue}>Start Learning →</Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   AUTH
═══════════════════════════════════ */
function Landing({go}) {
  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${DK} 0%,${G} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,color:"#fff",textAlign:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:60,marginBottom:10}}>✍️</div>
      <h1 style={{fontSize:28,fontWeight:900,margin:"0 0 6px"}}>WriteUP UPGC</h1>
      <p style={{opacity:.85,fontSize:15,marginBottom:4}}>Academic English for L2 Students</p>
      <p style={{opacity:.6,fontSize:12,marginBottom:36}}>Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:40}}>
        <button onClick={()=>go("login")} style={{background:"#fff",color:G,border:"none",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Log In</button>
        <button onClick={()=>go("register")} style={{background:"transparent",color:"#fff",border:"2px solid #fff",borderRadius:12,padding:"14px 36px",fontWeight:800,fontSize:15,cursor:"pointer"}}>Sign Up</button>
      </div>
      <div style={{display:"flex",gap:20,opacity:.7,fontSize:12,flexWrap:"wrap",justifyContent:"center"}}>
        {["🌐 PWA","🆓 Free","🎯 Level Test","📚 Rich Content","💾 Cloud Save"].map(t=><span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

function AuthForm({mode,onDone,onSwitch}) {
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
        const res=await authSignUp(f.email,f.pw);
        if(res.error){setErr(res.error.message||"Registration failed.");setL(false);return;}
        const uid=res.user?.id;
        if(uid){
          await sbPost("users",{id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",placement_done:false,last_login:todayStr()},res.access_token);
          onDone({id:uid,name:f.name,email:f.email,xp:0,streak:1,level:"Beginner",isNew:true,token:res.access_token});
        }
      }else{
        const res=await authSignIn(f.email,f.pw);
        if(res.error){setErr("Invalid email or password.");setL(false);return;}
        const uid=res.user?.id;const token=res.access_token;
        const profiles=await sbGet(`users?id=eq.${uid}`,token);
        const profile=profiles[0];
        if(profile){
          const last=new Date(profile.last_login);
          const diff=Math.floor((new Date()-last)/(1000*60*60*24));
          const newStreak=diff===1?profile.streak+1:diff>1?1:profile.streak;
          await sbPatch(`users?id=eq.${uid}`,{last_login:todayStr(),streak:newStreak},token);
          onDone({...profile,streak:newStreak,isNew:!profile.placement_done,token});
        }else{setErr("Profile not found. Please sign up.");}
      }
    }catch(e){setErr("Connection error. Please try again.");}
    setL(false);
  };
  return (
    <div style={{minHeight:"100vh",background:"#f0f7f4",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Segoe UI',sans-serif"}}>
      <Card style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:40}}>✍️</div>
          <h2 style={{color:G,margin:"8px 0 4px"}}>{mode==="login"?"Welcome Back":"Create Account"}</h2>
          <p style={{color:"#888",fontSize:13}}>WriteUP UPGC — Academic English</p>
        </div>
        {mode==="register"&&<input placeholder="Full name" value={f.name} onChange={upd("name")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>}
        <input placeholder="Email address" type="email" value={f.email} onChange={upd("email")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        <input placeholder="Password (min. 6 characters)" type="password" value={f.pw} onChange={upd("pw")} style={{display:"block",width:"100%",boxSizing:"border-box",border:"1.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
        {err&&<p style={{color:"#c62828",fontSize:13,marginBottom:8}}>{err}</p>}
        {loading?<Loader text={mode==="login"?"Logging in…":"Creating account…"}/>:
          <Btn full onClick={submit}>{mode==="login"?"Log In":"Register & Take Placement Test"}</Btn>}
        <p style={{textAlign:"center",fontSize:13,color:"#888",marginTop:14}}>
          {mode==="login"?"No account? ":"Already registered? "}
          <span onClick={onSwitch} style={{color:G,cursor:"pointer",fontWeight:700}}>{mode==="login"?"Sign up":"Log in"}</span>
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════
   MAIN APP
═══════════════════════════════════ */
const MODS=[
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",    sub:"Random exercise every session",  xp:10,color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",   sub:"Random word every session",      xp:5, color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Guided Writing",    sub:"PEEL paragraph + AI feedback",   xp:50,color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",      sub:"Random passage every session",   xp:20,color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes",  sub:"Random error lesson every session",xp:10,color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",        sub:"5 random questions every session",xp:30,color:"#fff8e1"},
];

const BADGES_DEF=[
  {icon:"✍️",name:"First Write",  desc:"Submit your first paragraph"},
  {icon:"🔥",name:"Streak 7",     desc:"Log in 7 days in a row"},
  {icon:"📐",name:"Grammar Master",desc:"Complete 30 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 30 words"},
  {icon:"🍃",name:"PEEL Expert",  desc:"Submit 5 PEEL paragraphs"},
  {icon:"🌍",name:"African Reader",desc:"Complete 10 reading passages"},
];

export default function WriteUpApp() {
  const [screen,setScreen]=useState("landing");
  const [user,setUser]=useState(null);
  const [token,setToken]=useState(null);
  const [placement,setPlacement]=useState(null);
  const [tab,setTab]=useState("home");
  const [activeMod,setActiveMod]=useState(null);
  const [xp,setXp]=useState(0);
  const [streak,setStreak]=useState(1);
  const [doneToday,setDoneToday]=useState([]);
  const [badges,setBadges]=useState([]);

  const loadToday=async(uid,tk)=>{
    const data=await sbGet(`daily_progress?user_id=eq.${uid}&date=eq.${todayStr()}&completed=eq.true&select=module`,tk);
    setDoneToday(Array.isArray(data)?data.map(d=>d.module):[]);
  };
  const loadBadges=async(uid,tk)=>{
    const data=await sbGet(`user_badges?user_id=eq.${uid}&select=badge_name`,tk);
    setBadges(Array.isArray(data)?data.map(d=>d.badge_name):[]);
  };
  const afterAuth=async u=>{
    setUser(u);setToken(u.token);setXp(u.xp||0);setStreak(u.streak||1);
    if(u.isNew){setScreen("placement");}
    else{setPlacement({level:u.level||"Beginner"});await loadToday(u.id,u.token);await loadBadges(u.id,u.token);setScreen("app");}
  };
  const afterPlacement=async result=>{
    setPlacement(result);
    if(user?.id)await sbPatch(`users?id=eq.${user.id}`,{level:result.level,placement_done:true},token);
    setScreen("result");
  };
  const addXp=async(n,moduleId)=>{
    const newXp=xp+n;setXp(newXp);setDoneToday(p=>[...p,moduleId]);
    if(user?.id){
      await sbUpsert("daily_progress",{user_id:user.id,date:todayStr(),module:moduleId,completed:true,xp_earned:n},token);
      await sbPatch(`users?id=eq.${user.id}`,{xp:newXp},token);
      if(moduleId==="peel")awardBadge("First Write");
      if(streak>=7)awardBadge("Streak 7");
    }
  };
  const awardBadge=async name=>{
    if(badges.includes(name))return;
    await sbPost("user_badges",{user_id:user.id,badge_name:name},token);
    setBadges(p=>[...p,name]);
  };

  if(screen==="landing")   return <Landing go={setScreen}/>;
  if(screen==="login")     return <AuthForm mode="login"    onDone={afterAuth} onSwitch={()=>setScreen("register")}/>;
  if(screen==="register")  return <AuthForm mode="register" onDone={afterAuth} onSwitch={()=>setScreen("login")}/>;
  if(screen==="placement") return <PlacementTest onDone={afterPlacement}/>;
  if(screen==="result")    return <LevelResult result={placement} onContinue={()=>{loadToday(user?.id,token);setScreen("app");}}/>;

  const lvl=getLvl(xp);
  const pct=Math.round(((xp-lvl.min)/(lvl.next-lvl.min))*100);
  const level=placement?.level||"Beginner";

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
        {activeMod
          ?<ModShell mod={activeMod} level={level} addXp={addXp} onBack={()=>{setActiveMod(null);loadToday(user?.id,token);}} token={token}/>
          :tab==="home"    ?<Home setMod={setActiveMod} xp={xp} lvl={lvl} pct={pct} level={level} doneToday={doneToday}/>
          :tab==="profile" ?<Profile user={user} xp={xp} lvl={lvl} level={level} badges={badges} streak={streak}/>
          :tab==="board"   ?<Board userId={user?.id} myXp={xp} token={token}/>
          :<Settings user={user} onLogout={async()=>{setScreen("landing");setUser(null);setToken(null);}}/>
        }
      </div>
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

function Home({setMod,xp,lvl,pct,level,doneToday}) {
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
      <Card style={{marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
          <span style={{fontWeight:700,color:G}}>{lvl.name} · {level}</span>
          <span style={{color:"#888"}}>{xp}/{lvl.next} XP</span>
        </div>
        <div style={{background:"#e8f5e9",borderRadius:99,height:10}}>
          <div style={{background:G,height:10,borderRadius:99,width:`${pct}%`,transition:"width .5s"}}/>
        </div>
        <p style={{color:"#888",fontSize:12,marginTop:6}}>{lvl.next-xp} XP to next level</p>
      </Card>
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
            :<Tag>+{m.xp} XP</Tag>}
        </button>
      ))}
    </div>
  );
}

function ModShell({mod,level,addXp,onBack,token}) {
  const earn=async n=>{await addXp(n,mod.id);};
  return (
    <div style={{padding:18}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div>
        <div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div>
      </div>
      {mod.id==="grammar"    &&<GrammarMod    earn={earn} onBack={onBack}/>}
      {mod.id==="vocabulary" &&<VocabMod      earn={earn} onBack={onBack}/>}
      {mod.id==="peel"       &&<PeelMod       earn={earn} onBack={onBack} level={level}/>}
      {mod.id==="reading"    &&<ReadingMod    earn={earn} onBack={onBack}/>}
      {mod.id==="mistakes"   &&<MistakesMod   earn={earn} onBack={onBack}/>}
      {mod.id==="quiz"       &&<QuizMod       earn={earn} onBack={onBack}/>}
    </div>
  );
}

function DoneScreen({xp,onBack,addXp}) {
  useEffect(()=>{ if(addXp) addXp(xp); },[]);
  return (
    <div style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:64,marginBottom:12}}>🎉</div>
      <h2 style={{color:G}}>Well done!</h2>
      <p style={{color:"#666"}}>You earned <strong style={{color:G,fontSize:20}}>+{xp} XP</strong></p>
      <p style={{color:"#888",fontSize:13}}>Progress saved ✅</p>
      <Btn full onClick={onBack}>← Back to Modules</Btn>
    </div>
  );
}

/* ── Grammar ── */
function GrammarMod({earn,onBack}) {
  const [c]=useState(()=>rnd(GRAMMAR_BANK));
  const [sel,setSel]=useState(null);const [done,setDone]=useState(false);
  const confirmed=sel!==null;
  if(done)return <DoneScreen xp={10} onBack={onBack}/>;
  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:12,color:"#888"}}>📚 Topic</div>
        <div style={{fontWeight:800,color:DK,fontSize:16}}>{c.title}</div>
        <div style={{fontSize:13,color:"#555",marginTop:4}}>{c.instruction}</div>
      </Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.question}</p></Card>
      {c.opts.map((o,oi)=>{
        const correct=oi===c.ans,picked=oi===sel;
        let bg="#fff",border="#e0e0e0";
        const isWrong = confirmed && picked && !correct;
        const isCorrectReveal = confirmed && correct && sel === c.ans;
        if(confirmed){ if(picked&&correct){bg="#e8f5e9";border=G} else if(isWrong){bg="#ffebee";border="#e53935"} }
        else if(picked){bg=LT;border=G}
        return <button key={oi} onClick={()=>!confirmed&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&picked&&correct?"✅ ":isWrong?"❌ ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        {sel===c.ans
          ?<Card style={{background:"#e8f5e9",marginBottom:10}}><p style={{margin:0,fontSize:13,color:DK,lineHeight:1.7}}>💡 {c.explanation}</p></Card>
          :<Card style={{background:"#ffebee",marginBottom:10}}><p style={{margin:0,fontSize:13,color:"#c62828",lineHeight:1.7}}>❌ Incorrect. Review the rule and try again next time!</p></Card>
        }
        <Card style={{background:"#e3f2fd",marginBottom:14}}><p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 {c.tip}</p></Card>
        <Btn full onClick={()=>setDone(true)}>Earn +10 XP →</Btn>
      </>}
    </div>
  );
}

/* ── Vocabulary ── */
function VocabMod({earn,onBack}) {
  const [c]=useState(()=>rnd(VOCAB_BANK));
  const [phase,setPhase]=useState("learn");const [sel,setSel]=useState(null);const [done,setDone]=useState(false);
  const confirmed=sel!==null;
  if(done)return <DoneScreen xp={5} onBack={onBack}/>;
  if(phase==="learn")return (
    <div>
      <Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:6}}>📚 Word to Learn</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><h2 style={{color:G,margin:"0 0 2px",fontSize:26}}>{c.word}</h2><div style={{color:"#999",fontSize:12}}>{c.phonetic} · <em>{c.partOfSpeech}</em></div></div>
          <Tag color="#fff3e0">{c.french}</Tag>
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
      <Btn full onClick={()=>setPhase("practice")}>Practice this word →</Btn>
    </div>
  );
  return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.example}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const correct=oi===c.ans,picked=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){if(correct){bg="#e8f5e9";border=G}else if(picked){bg="#ffebee";border="#e53935"}}
        else if(picked){bg=LT;border=G}
        return <button key={oi} onClick={()=>!confirmed&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&correct?"✅ ":confirmed&&picked&&!correct?"❌ ":""}{o}
        </button>;
      })}
      {confirmed&&(
        sel===c.ans
          ?<Btn full onClick={()=>setDone(true)}>Earn +5 XP →</Btn>
          :<>
            <Card style={{background:"#ffebee",marginBottom:10}}>
              <p style={{margin:0,fontSize:13,color:"#c62828",lineHeight:1.7}}>❌ Incorrect. The correct answer is: <strong>{c.opts[c.ans]}</strong>. Review the definition and try again!</p>
            </Card>
            <Btn full onClick={onBack}>← Try another word</Btn>
          </>
      )}
    </div>
  );
}

/* ── PEEL (with AI feedback) ── */
function PeelMod({earn,onBack,level}) {
  const [c]=useState(()=>rnd(PEEL_TOPICS));
  const [step,setStep]=useState(0);
  const [vals,setVals]=useState({point:"",explanation:"",evidence:"",link:""});
  const [feedback,setFeedback]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [done,setDone]=useState(false);
  const keys=["point","explanation","evidence","link"];
  const labels=["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];

  const getAI=async()=>{
    setAiLoading(true);
    try{
      const res=await fetch("/api/generate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          prompt:`You are an experienced English writing tutor working with ${level} university students in Côte d'Ivoire whose first language is French. Your role is to give detailed, constructive, and encouraging feedback on their PEEL paragraph.

Here is the student's paragraph:
Topic: "${c.prompt}"
Point: ${vals.point}
Explanation: ${vals.explanation}
Evidence: ${vals.evidence}
Link: ${vals.link}

Write your feedback in clearly labelled sections as follows:

**Overall Impression** (2-3 sentences): Describe the general quality of the paragraph. Is the argument clear? Is the structure logical?

**Point**: Evaluate whether the student stated their main argument clearly and directly. If not, explain what is missing and give a corrected or improved version.

**Explanation**: Assess whether the explanation develops the point logically. Point out any vague or repetitive sentences. Suggest a specific improvement with an example.

**Evidence**: Check whether the evidence is relevant, specific, and properly introduced. If the evidence is weak or missing, suggest the type of evidence that would strengthen the argument (e.g. statistics, quotes, real examples).

**Link**: Evaluate whether the link effectively connects back to the topic. If not, provide a model sentence they can use as a guide.

**Grammar & Vocabulary** (2-3 sentences): Identify 2 specific grammar or vocabulary errors. For each error, write the incorrect version and then the corrected version. Suggest one stronger academic word they could use.

**Final Encouragement** (1-2 sentences): End with a warm, specific, and motivating closing remark that acknowledges their effort and progress.

Be thorough, specific, and always explain WHY something needs to change. Use simple, clear English that a French-speaking student can understand.`,
          maxTokens:1200
        })
      });
      const data=await res.json();
      setFeedback(data.text||"Great effort! Keep practising your PEEL structure.");
    }catch{setFeedback("Great effort! Your paragraph structure is developing well. Focus on making your evidence more specific and your link more directly connected to the topic. Keep practising — you are making excellent progress!");}
    setAiLoading(false);
  };

  if(done)return <DoneScreen xp={50} onBack={onBack}/>;
  if(feedback)return (
    <div>
      <Card style={{borderLeft:`4px solid ${G}`,marginBottom:14}}>
        <h4 style={{color:G,marginBottom:10}}>🤖 AI Tutor Feedback</h4>
        <p style={{color:"#444",lineHeight:1.8,fontSize:14}}>{feedback}</p>
      </Card>
      <Card style={{background:"#f9fbe7",marginBottom:14}}>
        <h5 style={{color:DK,margin:"0 0 8px"}}>📄 Your Paragraph</h5>
        {keys.map(k=>vals[k]&&<p key={k} style={{fontSize:13,color:"#555",margin:"4px 0",lineHeight:1.6}}><strong style={{color:G}}>{k.charAt(0).toUpperCase()+k.slice(1)}:</strong> {vals[k]}</p>)}
      </Card>
      <Btn full onClick={()=>setDone(true)}>Earn +50 XP 🎉</Btn>
    </div>
  );
  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888"}}>📝 Topic</div>
        <div style={{fontWeight:800,color:DK,fontSize:15,marginTop:2}}>{c.title}</div>
        <div style={{color:"#555",fontSize:13,marginTop:4}}>{c.prompt}</div>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {keys.map((k,idx)=>(
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div style={{height:5,borderRadius:99,background:vals[k]?G:idx===step?"#81c784":"#e0e0e0",marginBottom:4}}/>
            <div style={{fontSize:10,color:idx<=step?G:"#bbb",fontWeight:idx===step?700:400}}>{k.charAt(0).toUpperCase()}</div>
          </div>
        ))}
      </div>
      <h4 style={{color:G,margin:"0 0 4px"}}>{labels[step]}</h4>
      <p style={{color:"#777",fontSize:12,marginBottom:6}}>{c.guidance[keys[step]]}</p>
      <div style={{background:"#f0f7f4",borderRadius:10,padding:10,marginBottom:10,fontSize:12,color:"#555",lineHeight:1.6}}>
        <strong>Example:</strong> {c.example[keys[step]]}
      </div>
      <textarea value={vals[keys[step]]} onChange={e=>setVals(p=>({...p,[keys[step]]:e.target.value}))}
        placeholder={`Write your ${keys[step]}…`} rows={4}
        style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${G}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit"}}/>
      <Btn full disabled={!vals[keys[step]]||aiLoading} onClick={()=>{if(step<3)setStep(s=>s+1);else getAI();}}>
        {aiLoading?"Getting AI Feedback…":step<3?`Next: ${labels[step+1]} →`:"🤖 Get AI Feedback"}
      </Btn>
    </div>
  );
}

/* ── Reading ── */
function ReadingMod({earn,onBack}) {
  const [c]=useState(()=>rnd(READING_BANK));
  const [phase,setPhase]=useState("read");
  const [ans,setAns]=useState([null,null,null]);
  const [checked,setChecked]=useState(false);
  const [done,setDone]=useState(false);
  if(done)return <DoneScreen xp={20} onBack={onBack}/>;
  const score=ans.filter((a,i)=>a===c.questions[i]?.ans).length;
  if(phase==="read")return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        <p style={{lineHeight:1.9,fontSize:14,color:"#333"}}>{c.passage}</p>
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <div style={{fontWeight:700,color:"#e65100",marginBottom:8,fontSize:13}}>📖 Glossary</div>
        {c.glossary.map(g=><div key={g.word} style={{display:"flex",gap:8,marginBottom:6,fontSize:13}}><strong style={{color:DK,minWidth:100}}>{g.word}</strong><span style={{color:"#555"}}>{g.definition}</span></div>)}
      </Card>
      <Btn full onClick={()=>setPhase("quiz")}>Answer Questions →</Btn>
    </div>
  );
  return (
    <div>
      {c.questions.map((q,qi)=>(
        <Card key={qi} style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10}}>{qi+1}. {q.q}</p>
          {q.opts.map((o,oi)=>{
            const correct=oi===q.ans,picked=oi===ans[qi];
            let bg="#f9f9f9",border="#e0e0e0";
            if(checked){if(correct){bg="#e8f5e9";border=G}else if(picked){bg="#ffebee";border="#e53935"}}
            else if(picked){bg=LT;border=G}
            return <button key={oi} onClick={()=>{if(!checked)setAns(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${border}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&correct?"✅ ":checked&&picked&&!correct?"❌ ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked?<Btn full disabled={ans.includes(null)} onClick={()=>setChecked(true)}>Check Answers</Btn>:
        <div>
          <Card style={{background:LT,textAlign:"center",marginBottom:14}}>
            <strong style={{color:G,fontSize:16}}>{score}/3 correct! {score===3?"🎉":""}</strong>
          </Card>
          <Btn full onClick={()=>setDone(true)}>Earn +20 XP</Btn>
        </div>}
    </div>
  );
}

/* ── Mistakes ── */
function MistakesMod({earn,onBack}) {
  const [c]=useState(()=>rnd(MISTAKES_BANK));
  const [done,setDone]=useState(false);
  if(done)return <DoneScreen xp={10} onBack={onBack}/>;
  return (
    <div>
      <Card style={{borderLeft:`4px solid #ff9800`,marginBottom:14}}>
        <Tag color="#fff3e0">{c.title}</Tag>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
          <span style={{fontSize:18}}>🇫🇷</span>
          <span style={{fontSize:13,color:"#666",fontStyle:"italic"}}>French: <strong>{c.french_pattern}</strong></span>
        </div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}>
        <div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:6}}>❌ Common Error</div>
        <p style={{color:"#333",fontSize:14,margin:0}}>"{c.wrong_english}"</p>
      </Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}>
        <div style={{fontSize:12,color:G,fontWeight:700,marginBottom:6}}>✅ Correct English</div>
        <p style={{color:"#333",fontSize:14,margin:0}}>"{c.correct_english}"</p>
      </Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}>
        <div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:6}}>📐 Rule</div>
        <p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.7}}>{c.rule}</p>
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:10}}>More examples:</div>
        {c.extra_examples.map((e,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <div style={{fontSize:13,color:"#c62828"}}>❌ {e.wrong}</div>
            <div style={{fontSize:13,color:G}}>✅ {e.right}</div>
          </div>
        ))}
      </Card>
      <Btn full onClick={()=>setDone(true)}>Got it! Earn +10 XP</Btn>
    </div>
  );
}

/* ── Quiz ── */
function QuizMod({earn,onBack}) {
  const [qs]=useState(()=>rnd(QUIZ_BANK));
  const [i,setI]=useState(0);const [sel,setSel]=useState(null);const [score,setScore]=useState(0);const [review,setReview]=useState(false);const [done,setDone]=useState(false);
  if(done)return <DoneScreen xp={30} onBack={onBack}/>;
  const q=qs[i];const confirmed=sel!==null;
  if(review)return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#666",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
        <p style={{color:"#888",fontSize:13}}>{score>=4?"Excellent work!":score>=2?"Good effort — keep practising!":"Review the lessons and try again!"}</p>
      </Card>
      <Btn full onClick={()=>setDone(true)}>Claim +30 XP →</Btn>
    </div>
  );
  const next=()=>{if(i<qs.length-1){setI(p=>p+1);setSel(null);}else setReview(true);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#888",marginBottom:8}}>
        <span>Q {i+1}/{qs.length}</span>
        <span style={{color:G,fontWeight:700}}>Score: {score}</span>
      </div>
      <div style={{background:"#e8f5e9",borderRadius:8,height:6,marginBottom:14}}>
        <div style={{background:G,height:6,borderRadius:8,width:`${(i/qs.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <Card style={{marginBottom:14}}><p style={{fontWeight:700,color:DK,fontSize:15,lineHeight:1.6,margin:0}}>{q.q}</p></Card>
      {q.opts.map((o,oi)=>{
        const correct=oi===q.ans,picked=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){if(correct){bg="#e8f5e9";border=G}else if(picked){bg="#ffebee";border="#e53935"}}
        else if(picked){bg=LT;border=G}
        return <button key={oi} onClick={()=>!confirmed&&(setSel(oi),correct&&setScore(s=>s+1))} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&correct?"✅ ":confirmed&&picked&&!correct?"❌ ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background: sel===q.ans?"#e8f5e9":"#ffebee",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:sel===q.ans?DK:"#c62828",lineHeight:1.7}}>
            {sel===q.ans?"💡 "+q.exp:"❌ Incorrect. "+q.exp}
          </p>
        </Card>
        <Btn full onClick={next}>{i<qs.length-1?"Next →":"See Results"}</Btn>
      </>}
    </div>
  );
}

/* ── Profile ── */
function Profile({user,xp,lvl,level,badges,streak}) {
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
            <div style={{fontSize:11,color:"#777"}}>{b.desc}</div>
            {!earned&&<div style={{fontSize:10,color:"#bbb",marginTop:4}}>🔒 Locked</div>}
          </div>;
        })}
      </div>
    </div>
  );
}

/* ── Leaderboard ── */
function Board({userId,myXp,token}) {
  const [lb,setLb]=useState([]);
  useEffect(()=>{
    sbGet("users?select=id,name,xp&order=xp.desc&limit=10",token).then(data=>{
      if(Array.isArray(data))setLb(data);
    });
  },[]);
  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:4}}>🏆 Leaderboard</h3>
      <p style={{color:"#888",fontSize:13,marginBottom:16}}>Top students — Real time</p>
      {lb.length===0&&<Loader text="Loading leaderboard…"/>}
      {lb.map((l,idx)=>{
        const isMe=l.id===userId;
        const medals=["🥇","🥈","🥉"];
        return <div key={l.id} style={{background:isMe?LT:"#fff",border:isMe?`2px solid ${G}`:"1px solid #eee",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
          <span style={{fontSize:22,width:30,textAlign:"center"}}>{medals[idx]||`#${idx+1}`}</span>
          <div style={{flex:1,fontWeight:isMe?800:600,color:isMe?G:DK}}>{l.name}{isMe?" (You)":""}</div>
          <span style={{fontWeight:700,color:G}}>⭐ {isMe?myXp:l.xp}</span>
        </div>;
      })}
    </div>
  );
}

/* ── Settings ── */
function Settings({user,onLogout}) {
  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>⚙️ Settings</h3>
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#888",marginBottom:2}}>Logged in as</div>
        <div style={{fontWeight:700,color:DK}}>{user?.name}</div>
        <div style={{fontSize:13,color:"#888"}}>{user?.email}</div>
      </Card>
      {[["🔔 Notifications","Daily reminder at 8:00 AM"],["📴 Offline Mode","Download today's content"],["🌐 Language","English / Français"],["🔒 Privacy","ARTCI compliance n°2013-450"]].map(([t,d])=>(
        <Card key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"14px 16px"}}>
          <div><div style={{fontWeight:600,color:DK,fontSize:14}}>{t}</div><div style={{fontSize:12,color:"#888"}}>{d}</div></div>
          <span style={{color:"#ccc",fontSize:20}}>›</span>
        </Card>
      ))}
      <button onClick={onLogout} style={{width:"100%",marginTop:12,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Log Out</button>
    </div>
  );
}
