import { useState, useEffect } from "react";

const G="#2D6A4F",LT="#d8f3dc",DK="#1b4332";
const SB_URL=import.meta.env.VITE_SUPABASE_URL||"https://qnxeyoxashvbljjmqkrp.supabase.co";
const SB_KEY=import.meta.env.VITE_SUPABASE_KEY||"sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC";

const sbH=t=>({"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${t||SB_KEY}`,"Prefer":"return=representation"});
const sbGet=(p,t)=>fetch(`${SB_URL}/rest/v1/${p}`,{headers:sbH(t)}).then(r=>r.json());
const sbPost=(p,b,t)=>fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",headers:sbH(t),body:JSON.stringify(b)}).then(r=>r.json());
const sbPatch=(p,b,t)=>fetch(`${SB_URL}/rest/v1/${p}`,{method:"PATCH",headers:{...sbH(t),"Prefer":"return=representation"},body:JSON.stringify(b)}).then(r=>r.json());
const sbUpsert=(p,b,t)=>fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(b)}).then(r=>r.json());
const authSignUp=(e,p)=>fetch(`${SB_URL}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
const authSignIn=(e,p)=>fetch(`${SB_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SB_KEY},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());

const todayStr=()=>new Date().toISOString().slice(0,10);
const getLvl=xp=>{
  if(xp<500)  return{name:"Bronze", color:"#cd7f32",min:0,   next:500};
  if(xp<1500) return{name:"Silver", color:"#9e9e9e",min:500, next:1500};
  if(xp<3000) return{name:"Gold",   color:"#ffd700",min:1500,next:3000};
  return             {name:"Platinum",color:"#4fc3f7",min:3000,next:5000};
};
const rnd=arr=>arr[Math.floor(Math.random()*arr.length)];

const Btn=({onClick,children,full,secondary,disabled,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{width:full?"100%":"auto",background:secondary?"transparent":G,color:secondary?G:"#fff",border:secondary?`2px solid ${G}`:"none",borderRadius:12,padding:"12px 20px",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,marginTop:8,fontFamily:"inherit",...style}}>{children}</button>
);
const Card=({children,style={}})=>(
  <div style={{background:"#fff",borderRadius:16,padding:18,boxShadow:"0 2px 12px #0001",...style}}>{children}</div>
);
const Tag=({children,color})=>(
  <span style={{background:color||LT,color:G,borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:600}}>{children}</span>
);
const Loader=({text="Loading…"})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:16}}>
    <div style={{width:40,height:40,border:`4px solid ${LT}`,borderTop:`4px solid ${G}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
    <p style={{color:G,fontWeight:600,fontSize:14,textAlign:"center"}}>{text}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ══════ CONTENT BANKS ══════ */

const GRAMMAR_BANK=[
  {title:"Present Simple — Habits",instruction:"Choose the correct verb form.",question:"She ___ to the library every Tuesday morning.",opts:["go","goes","is going","has gone"],ans:1,explanation:"We use present simple for habits and routines. 'Every Tuesday' signals a habit, so 'goes' is correct.",tip:"Present simple = habits/routines. Key words: always, usually, every day, never, sometimes."},
  {title:"Uncountable Nouns",instruction:"Choose the correct sentence.",question:"Which sentence is grammatically correct?",opts:["She gave me some advices.","She gave me some advice.","She gave me an advice.","She gave me advices."],ans:1,explanation:"'Advice' is uncountable — it has no plural. You can never say 'advices' or 'an advice'. Always say 'some advice' or 'a piece of advice'.",tip:"Uncountable nouns (no plural -s): advice, information, furniture, equipment, news, progress, knowledge, research."},
  {title:"Second Conditional",instruction:"Choose the correct form.",question:"If I ___ more time, I would read every day.",opts:["have","had","has","will have"],ans:1,explanation:"Second conditional = If + past simple + would + base verb. It describes hypothetical or unreal situations in the present or future.",tip:"Second conditional structure: 'If + subject + past simple, subject + would + base verb.' Example: If I had money, I would travel."},
  {title:"Relative Clauses",instruction:"Choose the correct relative pronoun.",question:"The student ___ scored highest in the test received a prize.",opts:["which","whose","who","whom"],ans:2,explanation:"Use 'who' for people in relative clauses. 'Which' is used for things and animals. 'Whose' shows possession.",tip:"Who = people. Which = things. Whose = possession. That = people or things (informal). Example: The book which I read was excellent."},
  {title:"Articles: A, An, The",instruction:"Choose the correct article.",question:"She is studying at ___ university in Korhogo.",opts:["a","an","the","—"],ans:0,explanation:"'University' starts with a /j/ sound (consonant sound), so we use 'a', not 'an'. The rule depends on SOUND, not spelling.",tip:"Use 'an' before vowel SOUNDS: an hour /aʊə/, an umbrella. Use 'a' before consonant SOUNDS: a university /juː/, a European."},
  {title:"Past Perfect",instruction:"Choose the correct tense.",question:"By the time the teacher arrived, the students ___ their essays.",opts:["finish","finished","had finished","have finished"],ans:2,explanation:"Past perfect (had + past participle) is used for an action completed BEFORE another past action. The students finished before the teacher arrived.",tip:"Past perfect = had + past participle. Use it when one past action happened before another. Signal words: by the time, already, before, after."},
  {title:"Passive Voice",instruction:"Choose the correct passive form.",question:"All assignments ___ before the end of the semester.",opts:["must submit","must be submitted","must submitted","must be submit"],ans:1,explanation:"Passive voice = modal + be + past participle. 'Must be submitted' means the assignments receive the action (someone submits them).",tip:"Passive voice formula: subject + be + past participle. Active: 'Students submit essays.' Passive: 'Essays are submitted by students.'"},
  {title:"Gerund vs Infinitive",instruction:"Choose the correct form.",question:"She avoided ___ the difficult questions during the debate.",opts:["to answer","answer","answering","answered"],ans:2,explanation:"'Avoid' must always be followed by a gerund (-ing form). Using an infinitive after 'avoid' is incorrect.",tip:"Verbs + gerund (-ing): avoid, enjoy, finish, consider, suggest, practise, keep. Verbs + infinitive (to): want, need, decide, hope, plan, agree, refuse."},
  {title:"Subject-Verb Agreement",instruction:"Choose the correct verb.",question:"Neither the students nor the teacher ___ aware of the schedule change.",opts:["were","are","was","is"],ans:2,explanation:"With 'neither...nor', the verb agrees with the NEAREST subject. 'Teacher' is singular, so we use 'was'.",tip:"Neither...nor / either...or: the verb agrees with the closest subject. If the closest subject is plural, use a plural verb."},
  {title:"Reported Speech",instruction:"Choose the correct reported speech form.",question:"She said: 'I am preparing for my exams.' → She said that she ___ for her exams.",opts:["is preparing","was preparing","has been preparing","prepares"],ans:1,explanation:"In reported speech, present continuous (am preparing) shifts back to past continuous (was preparing). This is called 'backshift'.",tip:"Reported speech backshift: am/is/are → was/were | have/has → had | will → would | can → could | present simple → past simple."},
  {title:"Prepositions with Adjectives",instruction:"Choose the correct preposition.",question:"She is very good ___ mathematics and statistics.",opts:["in","on","at","for"],ans:2,explanation:"In English, we say 'good at' a subject or skill. This is a fixed expression — 'good in' or 'good on' are incorrect.",tip:"Fixed preposition expressions: good at, bad at, interested in, responsible for, afraid of, proud of, similar to, different from."},
  {title:"Present Perfect vs Past Simple",instruction:"Choose the correct tense.",question:"I ___ my homework, so I can go out now.",opts:["finish","finished","have finished","had finished"],ans:2,explanation:"Present perfect is used when a past action has a result or relevance in the present. 'I have finished' explains why I can go out now.",tip:"Present perfect = have/has + past participle. Use it for: recent actions with present results, life experiences, actions continuing until now."},
];

const VOCAB_BANK=[
  {word:"Analyse",phonetic:"/ˈæn.ə.laɪz/",french:"Analyser",partOfSpeech:"verb",definition:"To examine something carefully and in detail in order to understand it fully.",example:"The students must ___ the poem before writing their critical essay.",blank:"analyse",opts:["analyse","ignore","copy","avoid"],ans:0,memory_tip:"Think of 'ana' (apart) + 'lyse' (loosen). To analyse is to break something apart to understand each piece."},
  {word:"Significant",phonetic:"/sɪɡˈnɪf.ɪ.kənt/",french:"Important / Significatif",partOfSpeech:"adjective",definition:"Important or large enough to have a noticeable effect or to be worth attention.",example:"There has been a ___ improvement in her academic writing since last semester.",blank:"significant",opts:["significant","small","boring","strange"],ans:0,memory_tip:"'Sign' is inside significant — something significant gives a clear sign that it matters."},
  {word:"Coherent",phonetic:"/kəʊˈhɪə.rənt/",french:"Cohérent / Logique",partOfSpeech:"adjective",definition:"Logical, well-organised, and easy to understand; all parts connecting well together.",example:"A well-written essay must present a ___ argument that flows from beginning to end.",blank:"coherent",opts:["emotional","coherent","confusing","short"],ans:1,memory_tip:"'Co' (together) + 'here' (stick). Coherent ideas stick together in a logical way."},
  {word:"Evidence",phonetic:"/ˈev.ɪ.dəns/",french:"Preuve / Élément de preuve",partOfSpeech:"noun (uncountable)",definition:"Facts, information, or signs that show whether a claim or belief is true or valid.",example:"Every argument in an academic essay must be supported by reliable ___.",blank:"evidence",opts:["opinion","evidence","feeling","title"],ans:1,memory_tip:"'Evident' comes from the same root — something evident is easy to see, just like evidence makes the truth visible."},
  {word:"Conclude",phonetic:"/kənˈkluːd/",french:"Conclure",partOfSpeech:"verb",definition:"To decide that something is true after carefully considering all available information.",example:"Based on the research findings, we can ___ that education significantly reduces poverty.",blank:"conclude",opts:["begin","wonder","conclude","forget"],ans:2,memory_tip:"'Con' + 'clude' (close). To conclude is to close your thinking with a final, well-reasoned decision."},
  {word:"Fundamental",phonetic:"/ˌfʌn.dəˈmen.təl/",french:"Fondamental / Essentiel",partOfSpeech:"adjective",definition:"Forming the necessary base or core of something; of central and essential importance.",example:"Critical thinking is a ___ skill that all university students must develop.",blank:"fundamental",opts:["optional","fundamental","difficult","rare"],ans:1,memory_tip:"'Fund' = foundation (like a building's base). Fundamental = what everything else is built upon."},
  {word:"Illustrate",phonetic:"/ˈɪl.ə.streɪt/",french:"Illustrer / Démontrer",partOfSpeech:"verb",definition:"To make the meaning of something clearer or more vivid by providing examples, diagrams, or evidence.",example:"This graph will clearly ___ how students' scores have improved over three years.",blank:"illustrate",opts:["hide","illustrate","remove","question"],ans:1,memory_tip:"'Illustrate' contains 'lustre' (light/brightness). You illuminate or shed light on an idea with a clear example."},
  {word:"Consequence",phonetic:"/ˈkɒn.sɪ.kwəns/",french:"Conséquence / Résultat",partOfSpeech:"noun",definition:"A result or effect of an action, decision, or condition — often an important or negative one.",example:"Poor time management can have serious academic ___s, including failing examinations.",blank:"consequence",opts:["reason","consequence","beginning","title"],ans:1,memory_tip:"'Con' + 'sequence' — consequences follow in sequence after an action, like dominoes falling."},
  {word:"Emphasise",phonetic:"/ˈem.fə.saɪz/",french:"Souligner / Insister sur",partOfSpeech:"verb",definition:"To show that something is especially important or deserves particular attention.",example:"The professor always ___ the importance of proofreading before submitting any assignment.",blank:"emphasise",opts:["ignore","forget","emphasise","remove"],ans:2,memory_tip:"'Em' + 'phase' — to put something in sharp focus, like a camera emphasising one subject over others."},
  {word:"Approach",phonetic:"/əˈprəʊtʃ/",french:"Approche / Méthode",partOfSpeech:"noun / verb",definition:"A way of dealing with a situation or problem; to come near to something physically or conceptually.",example:"The researcher used a qualitative ___ to study students' writing habits.",blank:"approach",opts:["problem","mistake","approach","question"],ans:2,memory_tip:"Think of 'approach' as stepping closer to a solution — you get nearer to it step by step."},
  {word:"Relevant",phonetic:"/ˈrel.ɪ.vənt/",french:"Pertinent / Approprié",partOfSpeech:"adjective",definition:"Closely connected or appropriate to the subject or matter being discussed.",example:"Make sure all the evidence you include in your essay is ___ to your main argument.",blank:"relevant",opts:["relevant","old","boring","random"],ans:0,memory_tip:"'Relevant' shares a root with 'relate'. Relevant information relates directly to your topic."},
  {word:"Justify",phonetic:"/ˈdʒʌs.tɪ.faɪ/",french:"Justifier",partOfSpeech:"verb",definition:"To show or prove that a decision, action, or statement is reasonable and has good reason.",example:"You must ___ every claim you make in an academic essay with reliable evidence.",blank:"justify",opts:["hide","justify","ignore","repeat"],ans:1,memory_tip:"'Just' = fair/right. To justify means to show that something is fair, right, or well-reasoned."},
];

const READING_BANK=[
  {title:"Education and Development in Africa",topic:"Education · Development",passage:`Education is widely recognised as one of the most powerful tools for sustainable development in Africa. Countries that invest seriously in schools and universities tend to experience stronger economic growth, lower poverty rates, and more stable governments. In Côte d'Ivoire, the government has significantly increased spending on education over the past decade, resulting in higher enrolment rates at both primary and secondary levels.

However, significant challenges remain. A shortage of qualified teachers in rural areas, limited access to technology, and inadequate school infrastructure continue to hinder progress. Many students in remote regions must walk several kilometres each day simply to attend school.

Despite these obstacles, research consistently shows the transformative power of education. Students who complete secondary school are three times more likely to find formal employment than those who drop out. Experts argue that improving the quality of education — not merely access to it — must be the central priority for Africa's next generation of leaders and policymakers.`,glossary:[{word:"sustainable",definition:"able to continue over a long period without causing damage"},{word:"enrolment",definition:"the process of officially registering in a school or course"},{word:"infrastructure",definition:"the basic physical structures needed for a society to function, such as roads and buildings"},{word:"transformative",definition:"causing a major positive change"},{word:"policymakers",definition:"people in positions of authority who create official rules and plans"}],questions:[{q:"What does the passage say about countries that invest in education?",opts:["They face more economic problems","They experience stronger growth and lower poverty","They have fewer qualified teachers","They spend less on healthcare"],ans:1},{q:"What challenge regarding teachers is mentioned in the passage?",opts:["Too many teachers in cities","Shortage of qualified teachers in rural areas","Teachers are not well paid","Teachers refuse to work in villages"],ans:1},{q:"How much more likely are secondary school graduates to find employment?",opts:["Twice as likely","Four times as likely","Three times as likely","Five times as likely"],ans:2}]},
  {title:"The Power of Reading",topic:"Literacy · Academic Success",passage:`Reading is arguably the single most important habit that a university student can cultivate. Research consistently demonstrates that students who read widely — both within and beyond their coursework — perform significantly better in examinations and produce higher quality written work. Reading expands vocabulary, sharpens comprehension skills, and develops the kind of critical thinking that academic success demands.

In many African universities, however, access to books and academic journals remains severely limited. Physical libraries are often under-resourced, and the cost of purchasing textbooks places a heavy financial burden on students and their families. Digital libraries and mobile reading applications are beginning to address this situation, but internet access remains unreliable in many areas.

A student who commits to reading for just thirty minutes each day can experience a measurable improvement in their academic performance within a single semester. The habit of reading is not a luxury reserved for those with abundant time — it is a daily discipline and a fundamental necessity for anyone who aspires to academic and professional excellence.`,glossary:[{word:"cultivate",definition:"to develop a skill or habit through regular effort and attention"},{word:"comprehension",definition:"the ability to understand something fully"},{word:"aspires",definition:"has a strong desire to achieve something great"},{word:"discipline",definition:"the ability to control your behaviour and follow a regular practice"},{word:"measurable",definition:"large enough to be noticed and evaluated"}],questions:[{q:"According to the passage, what is the most important habit for a university student?",opts:["Attending all lectures","Reading widely","Taking detailed notes","Joining study groups"],ans:1},{q:"What financial challenge related to reading is mentioned?",opts:["Libraries are too expensive to build","Students cannot afford textbooks","Professors charge for reading lists","Digital books are too costly"],ans:1},{q:"What does the author say about reading for 30 minutes a day?",opts:["It is too little to make a difference","It leads to measurable academic improvement","It is only useful in the first year","It replaces the need to attend lectures"],ans:1}]},
  {title:"Chinua Achebe and African Literature",topic:"African Literature · Cultural Identity",passage:`Chinua Achebe is widely regarded as the father of modern African literature in English. His landmark novel, Things Fall Apart, published in 1958, tells the story of Okonkwo — a proud and complex Igbo warrior whose life is profoundly disrupted by the arrival of European colonisers in Nigeria. The novel was groundbreaking not only for its compelling narrative but also because it presented African culture, values, and social structures entirely from an African perspective.

Prior to Achebe's work, Africa had largely been portrayed in European literature as a dark, primitive, and voiceless continent. Achebe deliberately set out to challenge and correct this misrepresentation. He wrote in English, the language of the coloniser, but filled his prose with Igbo proverbs, oral traditions, and cultural references, creating a literary style that was entirely his own.

Things Fall Apart has since been translated into more than fifty languages and is studied in schools and universities across the world. Achebe believed deeply that literature had the power to change how individuals and societies understand themselves. He once wrote that a writer must stand on the side of life and of humanity.`,glossary:[{word:"landmark",definition:"something important that marks a significant change or achievement"},{word:"disrupted",definition:"seriously disturbed or interrupted"},{word:"groundbreaking",definition:"new and very important; doing something never done before"},{word:"misrepresentation",definition:"a false or misleading description of something"},{word:"prose",definition:"written language in its ordinary form, not poetry"}],questions:[{q:"Why is Things Fall Apart considered groundbreaking?",opts:["It was the first novel written in Africa","It presented African culture from an African perspective","It was written in the Igbo language","It was the longest African novel ever written"],ans:1},{q:"How did Achebe incorporate African culture into his English writing?",opts:["By refusing to use English grammar","By translating directly from Igbo","By using Igbo proverbs and oral traditions","By writing only about traditional ceremonies"],ans:2},{q:"Into how many languages has Things Fall Apart been translated?",opts:["Over 20","Over 30","Over 40","More than 50"],ans:3}]},
  {title:"Climate Change and Africa",topic:"Environment · Science",passage:`Climate change poses one of the most serious threats to Africa's development, even though the continent contributes relatively little to global greenhouse gas emissions. Rising temperatures, unpredictable rainfall, and increasingly frequent extreme weather events are already disrupting agriculture, threatening food security, and displacing communities across the continent.

In the Sahel region, which stretches across sub-Saharan Africa from Senegal to Sudan, prolonged droughts have made farming increasingly difficult. Millions of people who depend on rain-fed agriculture for their livelihoods are being forced to migrate to cities, placing enormous pressure on urban infrastructure and services.

At the same time, Africa possesses extraordinary natural resources that could support a green energy transition. The continent receives more solar energy than any other region on Earth, and its vast rivers offer significant hydroelectric potential. Experts argue that with the right investment and political will, Africa could not only adapt to climate change but also become a global leader in renewable energy production.`,glossary:[{word:"emissions",definition:"gases released into the atmosphere, especially those causing climate change"},{word:"livelihoods",definition:"ways of earning money and supporting oneself"},{word:"transition",definition:"a process of changing from one state or system to another"},{word:"hydroelectric",definition:"producing electricity using the power of flowing water"},{word:"renewable",definition:"naturally replenished and not permanently depleted when used"}],questions:[{q:"What does the passage say about Africa's contribution to climate change?",opts:["Africa is the biggest contributor","Africa contributes very little to global emissions","Africa produces no greenhouse gases","Africa is not affected by climate change"],ans:1},{q:"What is happening in the Sahel region according to the passage?",opts:["Farmers are becoming very wealthy","Cities are being abandoned","Droughts are forcing farmers to migrate","New farms are being created"],ans:2},{q:"What natural advantage does Africa have for green energy?",opts:["The most wind energy in the world","The largest coal reserves","More solar energy than any other region","The deepest ocean currents"],ans:2}]},
];

const MISTAKES_BANK=[
  {title:"'Make' vs 'Do'",french_pattern:"Faire une erreur / Faire ses devoirs / Faire un effort",wrong_english:"I did a mistake in my essay and I must do an effort to improve.",correct_english:"I made a mistake in my essay and I must make an effort to improve.",rule:"Use MAKE for: mistakes, decisions, progress, noise, suggestions, an effort, a difference, friends. Use DO for: homework, exercises, work, research, a course, one's best, a favour. There is no simple rule — these are fixed collocations that must be memorised.",extra_examples:[{wrong:"She did a good decision to study English.",right:"She made a good decision to study English."},{wrong:"He is doing progress in his writing.",right:"He is making progress in his writing."},{wrong:"Can you make this exercise for me?",right:"Can you do this exercise for me?"}]},
  {title:"'Since' vs 'For'",french_pattern:"J'étudie l'anglais depuis 3 ans / depuis 2021",wrong_english:"I study English since 3 years and I am at UPGC since 2022.",correct_english:"I have been studying English for 3 years and I have been at UPGC since 2022.",rule:"'Since' refers to a specific point in time (since 2021, since Monday, since I was a child). 'For' refers to a duration — a period of time (for 3 years, for two months, for a long time). Both expressions require the present perfect tense in English, NOT the present simple.",extra_examples:[{wrong:"She lives here since 5 years.",right:"She has lived here for 5 years."},{wrong:"I wait for you since 2 o'clock.",right:"I have been waiting for you since 2 o'clock."},{wrong:"He works at this school since a long time.",right:"He has worked at this school for a long time."}]},
  {title:"'Actually' ≠ 'Actuellement'",french_pattern:"Actuellement, je travaille à l'UPGC / il étudie actuellement",wrong_english:"Actually, I am a student at UPGC. Actually, I am studying for my exams.",correct_english:"Currently, I am a student at UPGC. At the moment, I am studying for my exams.",rule:"'Actually' is a very common false friend for French speakers. In English, 'actually' does NOT mean 'at this present time'. It means 'in fact', 'in reality', or 'to tell the truth'. For the French meaning of 'actuellement', always use 'currently', 'at present', 'at the moment', or 'right now'.",extra_examples:[{wrong:"Actually, the economy is growing fast.",right:"Currently, the economy is growing fast. (meaning 'at present')"},{wrong:"He actually studies medicine.",right:"He is currently studying medicine. (meaning 'right now')"},{wrong:"Actually, she lives in Abidjan.",right:"She actually lives in Abidjan. (meaning 'in fact, surprisingly')"}]},
  {title:"Double Negatives",french_pattern:"Je n'ai rien dit / Je ne vais nulle part / Je ne connais personne",wrong_english:"I didn't say nothing. I don't know nobody here. I never go nowhere.",correct_english:"I didn't say anything. I don't know anybody here. I never go anywhere.",rule:"Standard English does NOT allow double negatives. When you use 'not' or 'didn't' in a sentence, you must use positive words like 'anything', 'anybody', 'anywhere', 'ever'. Alternatively, you can use 'nothing', 'nobody', 'nowhere' WITHOUT 'not'. Two negatives cancel each other out in English logic.",extra_examples:[{wrong:"She doesn't know nothing about grammar.",right:"She doesn't know anything about grammar. / She knows nothing about grammar."},{wrong:"He never tells nobody his problems.",right:"He never tells anybody his problems."},{wrong:"I can't find it nowhere.",right:"I can't find it anywhere. / I can find it nowhere."}]},
  {title:"'Assist' vs 'Attend'",french_pattern:"J'ai assisté au cours / J'ai assisté à la conférence",wrong_english:"I assisted the lecture this morning. Did you assist the meeting yesterday?",correct_english:"I attended the lecture this morning. Did you attend the meeting yesterday?",rule:"'Assist' in English means to help or support someone (aider quelqu'un). 'Attend' means to be present at an event, meeting, or class (assister à quelque chose). This is one of the most common false friends for French speakers in academic and professional contexts.",extra_examples:[{wrong:"She assisted the wedding ceremony last Saturday.",right:"She attended the wedding ceremony last Saturday."},{wrong:"All students must assist the orientation day.",right:"All students must attend the orientation day."},{wrong:"He assisted me with my homework. ✅ (This one is correct — 'assist' = help)",right:"He assisted me with my homework. ✅"}]},
  {title:"Plural of Uncountable Nouns",french_pattern:"Des informations importantes / Des conseils utiles / Des bagages lourds",wrong_english:"She gave me some useful informations and good advices for my essay.",correct_english:"She gave me some useful information and good advice for my essay.",rule:"Several nouns that are countable in French are UNCOUNTABLE in English — they have no plural form and cannot be used with 'a/an'. The most important ones are: information, advice, furniture, equipment, luggage/baggage, news, research, knowledge, progress, evidence, feedback.",extra_examples:[{wrong:"The news are very bad today.",right:"The news is very bad today."},{wrong:"I need some furnitures for my new room.",right:"I need some furniture for my new room."},{wrong:"Can you give me some advices?",right:"Can you give me some advice?"}]},
  {title:"Verb Tense: Present for Future Plans",french_pattern:"Le cours commence demain / Le match a lieu vendredi",wrong_english:"Tomorrow the lecture begins at 8am. The exam takes place next Monday.",correct_english:"Tomorrow the lecture begins at 8am. ✅ (This is acceptable for fixed schedules.)",rule:"In English, the present simple CAN be used for scheduled future events (timetables, programmes). However, for personal plans and intentions, use 'going to' or 'will'. Example: 'I am going to study tonight' (personal plan). 'The train leaves at 9am' (fixed schedule). French speakers often overuse the present simple for all future events.",extra_examples:[{wrong:"I study tomorrow instead of going out.",right:"I am going to study tomorrow instead of going out."},{wrong:"She travels to Abidjan next week.",right:"She is travelling to Abidjan next week. / She is going to travel to Abidjan next week."},{wrong:"The conference starts at 10. ✅",right:"The conference starts at 10. ✅ (Fixed timetable — correct)"}]},
];

const QUIZ_BANK=[
  [{q:"Which sentence is correct?",opts:["She don't study hard.","She doesn't study hard.","She not study hard.","She studies not hard."],ans:1,exp:"Negative sentences: subject + doesn't/don't + base verb. 'She doesn't study' is the correct form."},{q:"What does 'evidence' mean in academic writing?",opts:["A personal opinion","A question to ask","Facts that support an argument","A type of paragraph"],ans:2,exp:"Evidence = facts, data, or information that prove or support a claim. It is uncountable (no plural -s)."},{q:"In PEEL writing, the letter 'L' stands for:",opts:["Language","Link","List","Literature"],ans:1,exp:"PEEL = Point, Explanation, Evidence, Link. The Link reconnects the argument back to the main topic or question."},{q:"'She gave me some ___.' Which is correct?",opts:["advices","an advice","advice","the advices"],ans:2,exp:"'Advice' is uncountable in English — it has no plural form. Always say 'some advice' or 'a piece of advice'."},{q:"'Actually' in English means:",opts:["Currently / At this moment","In fact / To tell the truth","Truly / Really fast","Often / Sometimes"],ans:1,exp:"'Actually' is a false friend! It means 'in fact' or 'to be honest', NOT 'currently'. Use 'currently' for the French 'actuellement'."}],
  [{q:"Choose the correct form: 'I ___ here since 2020.'",opts:["live","lived","have lived","am living"],ans:2,exp:"'Since' + point in time requires present perfect: 'I have lived here since 2020'. Present simple is incorrect here."},{q:"What does 'coherent' mean?",opts:["Confusing and disorganised","Logical, well-structured, and clear","Emotional and passionate","Very long and detailed"],ans:1,exp:"Coherent = logical, well-organised, easy to understand. A coherent essay flows logically from beginning to end."},{q:"Which is the correct sentence?",opts:["He made a homework.","He did a mistake in his essay.","He made a mistake in his essay.","He did a progress this semester."],ans:2,exp:"'Make a mistake' is the correct collocation. Use 'make' for mistakes, decisions, progress. Use 'do' for homework, exercises, work."},{q:"What type of noun is 'information'?",opts:["Countable noun","Uncountable noun","Proper noun","Abstract noun only"],ans:1,exp:"'Information' is uncountable — no plural -s, no 'a/an'. Say 'some information' or 'a piece of information', never 'informations'."},{q:"Which sentence correctly uses the passive voice?",opts:["The essay must submit by Friday.","The essay must be submitted by Friday.","The essay must submitted by Friday.","The essay must be submit by Friday."],ans:1,exp:"Passive voice = modal + be + past participle. 'Must be submitted' is correct. The essay receives the action of submitting."}],
  [{q:"'Despite ___ tired, she continued studying all night.'",opts:["be","to be","been","being"],ans:3,exp:"After 'despite', always use the gerund (-ing form): 'Despite being tired'. 'Despite' is a preposition and must be followed by a noun or gerund."},{q:"What does 'fundamental' mean?",opts:["Optional and unimportant","Very difficult to understand","Forming the essential base; of core importance","Interesting and unusual"],ans:2,exp:"Fundamental = forming the foundation; of central, essential importance. Example: 'Reading is a fundamental academic skill.'"},{q:"'I assisted the conference yesterday.' What is the error?",opts:["'I' should be 'We'","'assisted' should be 'attended'","'conference' is the wrong word","There is no error"],ans:1,exp:"'Assist' means to help someone. 'Attend' means to be present at an event. Always say 'attended the conference'."},{q:"In reported speech: 'I am preparing my essay.' → She said that she ___ her essay.",opts:["is preparing","was preparing","has prepared","prepares"],ans:1,exp:"Reported speech backshift: present continuous (am preparing) → past continuous (was preparing). This is mandatory in formal reported speech."},{q:"Which word is the correct academic synonym for 'show'?",opts:["Demonstrate","Tell","Say","Speak"],ans:0,exp:"'Demonstrate' is the academic equivalent of 'show'. Other strong academic verbs: illustrate, indicate, reveal, suggest, argue, contend."}],
  [{q:"Choose the correct sentence about a future plan:",opts:["I study tonight instead of watching TV.","I am going to study tonight instead of watching TV.","I will to study tonight.","I studying tonight."],ans:1,exp:"For personal future plans, use 'going to' + base verb. Present simple is only used for fixed schedules like timetables."},{q:"What does 'relevant' mean?",opts:["Very important and impressive","Closely connected and appropriate to the topic","Old and out of date","Difficult to understand"],ans:1,exp:"Relevant = directly connected to and appropriate for the subject being discussed. In essays, all evidence must be relevant to your argument."},{q:"Which sentence correctly uses 'since' and 'for'?",opts:["I have studied here since two years.","I have studied here for 2019.","I have studied here for two years.","I study here since two years."],ans:2,exp:"'For' + duration (two years, six months). 'Since' + point in time (since 2019, since Monday). Both require present perfect tense."},{q:"'She ___ her assignment before the deadline.' Best option:",opts:["submits","submitted","had submitted","submitting"],ans:1,exp:"Past simple (submitted) is used for a completed action at a specific past time. 'Before the deadline' tells us it happened in the past."},{q:"What is the purpose of the 'Evidence' section in a PEEL paragraph?",opts:["To restate the main point","To provide facts or examples that prove your argument","To conclude the essay","To introduce a new topic"],ans:1,exp:"Evidence in PEEL provides concrete proof for your argument — statistics, quotes, examples, or research findings that make your point credible."}],
];

const PEEL_TOPICS=[
  {title:"Technology in Education",prompt:"Should technology be used more widely in African universities?",guidance:{point:"State your main position clearly and directly in 1-2 sentences. Avoid vague openings.",explanation:"Explain WHY technology would help (or harm) — give at least 2 specific, well-developed reasons.",evidence:"Include a specific statistic, research finding, or real example. Name your source if possible.",link:"Connect your argument back to the original question about African universities specifically."},example:{point:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.",explanation:"With smartphones, laptops, and reliable internet connections, students can access thousands of academic journals, textbooks, and online courses that are entirely unavailable in most African university libraries. Furthermore, digital tools such as educational apps and video lectures allow students to learn at their own pace, reinforcing content that is difficult to grasp in a single classroom session.",evidence:"According to a UNESCO report published in 2022, students who regularly use digital learning tools score on average 35% higher on standardised assessments than those who rely solely on traditional teaching methods.",link:"Given this evidence, increasing technological integration in African universities is not merely a matter of modernisation — it is an urgent educational priority that would directly improve academic outcomes and better prepare graduates for an increasingly digital global economy."}},
  {title:"Gender Equality in Education",prompt:"Boys and girls should have equal access to education.",guidance:{point:"State whether you agree or disagree clearly. Do not sit on the fence.",explanation:"Give 2-3 well-developed reasons that go beyond the obvious. Think about economic, social, and cultural arguments.",evidence:"Include a specific statistic or real-world example. Avoid general statements without proof.",link:"Connect your conclusion to national development, African progress, or global equality."},example:{point:"Boys and girls must have completely equal access to education if African nations are to achieve their full economic and social potential.",explanation:"When girls are systematically denied education, entire communities lose half of their intellectual potential. Educated women are statistically more likely to invest in their children's health and schooling, creating a positive generational cycle of development. Moreover, gender equality in education reduces harmful social practices, promotes civic participation, and strengthens democracy.",evidence:"The World Bank reported in 2021 that every additional year a girl spends in formal education can increase her future earnings by up to 10%, with cumulative effects that dramatically raise household and national income.",link:"For these reasons, gender equality in education is not simply a question of moral fairness — it is a strategic economic investment whose returns benefit entire communities, nations, and the African continent as a whole."}},
  {title:"Social Media and Students",prompt:"Social media does more harm than good to university students.",guidance:{point:"Take a clear position. Do not try to argue both sides equally in a single PEEL paragraph.",explanation:"Focus on 2-3 specific, concrete ways social media affects student life. Use precise language.",evidence:"Use a specific study, statistic, or well-known example. Avoid saying 'studies show' without details.",link:"Return directly to the question. Does the harm outweigh any benefit for university students specifically?"},example:{point:"For the majority of university students, social media causes significantly more harm than good, particularly in terms of academic performance and mental health.",explanation:"Students who spend excessive time on platforms such as TikTok, Instagram, and Facebook frequently report difficulty concentrating during lectures and study sessions, as the constant stimulation of social media trains the brain to expect rapid, fragmented information. This directly undermines the deep, sustained focus that academic reading and essay writing require. Additionally, the culture of comparison promoted by social media platforms has been linked to rising rates of anxiety and low self-esteem among university students.",evidence:"A longitudinal study conducted by researchers at Harvard University in 2020 found that students who spent more than three hours daily on social media had a grade point average (GPA) that was 20% lower than those who limited their usage to under one hour per day.",link:"While social media does offer some benefits for networking and information sharing, the weight of evidence suggests that its negative impact on concentration, mental health, and academic performance makes it far more harmful than helpful for university students who wish to succeed."}},
  {title:"English in Côte d'Ivoire",prompt:"English is an essential skill for Ivorian university students today.",guidance:{point:"State clearly why English is (or is not) essential for Ivorian students in the current context.",explanation:"Think about career opportunities, international education, research access, and global communication.",evidence:"Use a fact, statistic, or real example related to English in Africa or Côte d'Ivoire.",link:"Connect to what Ivorian students should do as a practical result of your argument."},example:{point:"Mastering English has become an essential skill for Ivorian university students who wish to compete successfully in today's globalised professional and academic environment.",explanation:"English is the dominant language of international business, scientific research, and global communication, meaning that graduates who are not proficient in English are immediately at a competitive disadvantage when applying for international scholarships, multinational company positions, or postgraduate programmes abroad. Furthermore, the vast majority of the world's most important academic journals, textbooks, and research databases are published exclusively in English, making strong reading and writing skills in English indispensable for any serious university student.",evidence:"The African Development Bank has estimated that English language proficiency can increase an African graduate's starting salary by as much as 25% compared to monolingual French-speaking peers applying for the same positions.",link:"For these compelling reasons, Ivorian students should treat the development of their English writing and communication skills not as an optional extra, but as one of the most strategic and rewarding investments they can make in their academic and professional futures."}},
];

/* ══ ANALYTICS HELPERS ══ */
const getWeekNumber=()=>{
  const d=new Date();
  const onejan=new Date(d.getFullYear(),0,1);
  return Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7);
};

const savePlacementResult=async(userId,token,scores,level,answers=[])=>{
  try{
    await sbPost("placement_results",{
      user_id:userId,
      grammar_score:scores.Grammar,
      vocab_score:scores.Vocabulary,
      reading_score:scores.Reading,
      total_score:scores.Grammar+scores.Vocabulary+scores.Reading,
      level_assigned:level,
      answers_detail:answers,
      week_number:getWeekNumber()
    },token);
    await sbPatch(`users?id=eq.${userId}`,{
      initial_level:level,
      initial_score:scores.Grammar+scores.Vocabulary+scores.Reading,
      current_level:level
    },token);
  }catch(e){console.error("placement save error",e);}
};

const saveModuleSession=async(userId,token,{module,score,total,passed,xpEarned,timeSec,errors=[],title=""})=>{
  try{
    const accuracy=total>0?Math.round((score/total)*100):0;
    await sbPost("module_sessions",{
      user_id:userId,
      module,
      score,
      total_questions:total,
      accuracy,
      passed,
      xp_earned:xpEarned,
      time_spent_sec:timeSec,
      errors_detail:errors,
      content_title:title
    },token);
    // Update user accuracy stats
    const field={grammar:"grammar_accuracy",vocabulary:"vocab_accuracy",quiz:"quiz_accuracy"}[module];
    if(field){
      const prev=await sbGet(`users?id=eq.${userId}&select=${field}`,token);
      const prevVal=prev?.[0]?.[field]||0;
      const newVal=prevVal===0?accuracy:Math.round((prevVal+accuracy)/2);
      await sbPatch(`users?id=eq.${userId}`,{[field]:newVal,total_sessions:undefined,last_active_date:todayStr()},token);
    }
    // Update total_sessions
    const userData=await sbGet(`users?id=eq.${userId}&select=total_sessions,total_time_minutes`,token);
    const prev=userData?.[0]||{};
    await sbPatch(`users?id=eq.${userId}`,{
      total_sessions:(prev.total_sessions||0)+1,
      total_time_minutes:(prev.total_time_minutes||0)+Math.round(timeSec/60),
      last_active_date:todayStr()
    },token);
  }catch(e){console.error("module session save error",e);}
};

const savePeelAttempt=async(userId,token,{topic,attemptNum,vals,scores,passed,timeSec})=>{
  try{
    const wordTotal=Object.values(vals).reduce((a,v)=>a+(v.trim().split(/\s+/).filter(w=>w).length),0);
    // Get previous score for improvement calc
    const prev=await sbGet(`peel_attempts?user_id=eq.${userId}&order=created_at.desc&limit=1&select=total_score`,token);
    const prevScore=prev?.[0]?.total_score||0;
    await sbPost("peel_attempts",{
      user_id:userId,
      topic,
      attempt_number:attemptNum,
      point_text:vals.point,
      explanation_text:vals.explanation,
      evidence_text:vals.evidence,
      link_text:vals.link,
      score_point:scores.point,
      score_expl:scores.expl,
      score_evidence:scores.evidence,
      score_link:scores.link,
      score_grammar:scores.grammar,
      score_length:scores.length,
      total_score:scores.total,
      passed,
      time_spent_sec:timeSec,
      word_count_total:wordTotal,
      score_improvement:scores.total-prevScore
    },token);
    // Update user peel stats
    const userData=await sbGet(`users?id=eq.${userId}&select=peel_avg_score,peel_attempts_total`,token);
    const u=userData?.[0]||{};
    const prevAvg=u.peel_avg_score||0;
    const prevCount=u.peel_attempts_total||0;
    const newAvg=prevCount===0?scores.total:Math.round((prevAvg*prevCount+scores.total)/(prevCount+1));
    await sbPatch(`users?id=eq.${userId}`,{
      peel_avg_score:newAvg,
      peel_attempts_total:prevCount+1,
      last_active_date:todayStr()
    },token);
  }catch(e){console.error("peel attempt save error",e);}
};

const saveXpHistory=async(userId,token,newXp,moduleId)=>{
  try{
    const existing=await sbGet(`xp_history?user_id=eq.${userId}&date=eq.${todayStr()}`,token);
    const prev=existing?.[0];
    if(prev){
      await sbPatch(`xp_history?user_id=eq.${userId}&date=eq.${todayStr()}`,{
        xp_earned:(prev.xp_earned||0)+(newXp),
        xp_total:newXp,
        modules_done:[...(prev.modules_done||[]),moduleId]
      },token);
    } else {
      await sbPost("xp_history",{
        user_id:userId,
        date:todayStr(),
        xp_earned:newXp,
        xp_total:newXp,
        modules_done:[moduleId]
      },token);
    }
  }catch(e){console.error("xp history error",e);}
};

const saveWeeklySnapshot=async(userId,token,userData)=>{
  try{
    const weekStart=new Date();
    weekStart.setDate(weekStart.getDate()-weekStart.getDay());
    const weekStartStr=weekStart.toISOString().slice(0,10);
    const weekNum=getWeekNumber();
    const year=new Date().getFullYear();
    // Check if snapshot exists for this week
    const existing=await sbGet(`weekly_snapshots?user_id=eq.${userId}&week_number=eq.${weekNum}&year=eq.${year}`,token);
    const xpThisWeek=await sbGet(`xp_history?user_id=eq.${userId}&date=gte.${weekStartStr}&select=xp_earned`,token);
    const weekXp=(xpThisWeek||[]).reduce((a,r)=>a+(r.xp_earned||0),0);
    const snapshot={
      user_id:userId,
      week_start:weekStartStr,
      week_number:weekNum,
      year,
      level:userData.current_level||userData.level||"Beginner",
      xp_total:userData.xp||0,
      xp_gained_week:weekXp,
      days_active:userData.days_active||0,
      grammar_accuracy:userData.grammar_accuracy||0,
      vocab_accuracy:userData.vocab_accuracy||0,
      quiz_accuracy:userData.quiz_accuracy||0,
      peel_avg_score:userData.peel_avg_score||0,
      peel_attempts:userData.peel_attempts_total||0,
      streak_at_snapshot:userData.streak||0
    };
    if(existing?.[0]){
      await sbPatch(`weekly_snapshots?user_id=eq.${userId}&week_number=eq.${weekNum}&year=eq.${year}`,snapshot,token);
    } else {
      await sbPost("weekly_snapshots",snapshot,token);
    }
  }catch(e){console.error("weekly snapshot error",e);}
};
const PLACEMENT=[
  {section:"Grammar",q:"Choose the correct form: 'She ___ to school every day.'",opts:["go","goes","going","gone"],ans:1},
  {section:"Grammar",q:"Identify the error: 'The informations are on the table.'",opts:["The","informations","are","table"],ans:1},
  {section:"Grammar",q:"'If I ___ rich, I would travel the world.'",opts:["am","was","were","be"],ans:2},
  {section:"Grammar",q:"Choose the correct sentence:",opts:["She don't like coffee.","She doesn't likes coffee.","She doesn't like coffee.","She not like coffee."],ans:2},
  {section:"Grammar",q:"'Despite ___ tired, he finished the essay.'",opts:["be","being","been","to be"],ans:1},
  {section:"Vocabulary",q:"What does 'analyse' mean?",opts:["To ignore","To study carefully in detail","To write quickly","To memorise"],ans:1},
  {section:"Vocabulary",q:"'Her essay was well-organised — it was very ___.'",opts:["confusing","coherent","boring","long"],ans:1},
  {section:"Vocabulary",q:"'Evidence' in academic writing means:",opts:["A feeling","A guess","Facts that support an argument","A question"],ans:2},
  {section:"Vocabulary",q:"Which word is a FALSE FRIEND for French speakers?",opts:["Book","Actually","Table","School"],ans:1},
  {section:"Vocabulary",q:"'The study requires ___ data, not just opinions.'",opts:["emotional","empirical","fictional","random"],ans:1},
  {section:"Reading",q:"'Okonkwo worked hard to overcome his father's failures.' — Why did he work hard?",opts:["To become rich","To travel abroad","To overcome his father's failures","To win a wrestling prize"],ans:2},
  {section:"Reading",q:"'Education was the light that would lead Njoroge out of poverty.' — Literary device?",opts:["Simile","Metaphor","Rhyme","Alliteration"],ans:1},
  {section:"Reading",q:"'Jaja's face was expressionless, but his hand shook slightly.' — What does this suggest?",opts:["He was happy","He was calm","He was hiding strong emotions","He was cold"],ans:2},
  {section:"Reading",q:"In academic texts, a 'glossary' is:",opts:["A list of questions","A list of word definitions","A summary","A bibliography"],ans:1},
  {section:"Reading",q:"'The researcher concluded that technology improves learning.' — 'Concluded' means:",opts:["Started an argument","Wondered about something","Reached a final decision","Forgot the main point"],ans:2},
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
  const descs={Beginner:"Your content will focus on essential grammar, core vocabulary, and accessible reading passages.",Intermediate:"Your content will challenge you with more complex grammar, academic vocabulary, and analytical reading.",Advanced:"Your content will develop your academic writing, sophisticated vocabulary, and critical reading skills."};
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

/* ══════ AUTH ══════ */
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

/* ══════ MAIN APP ══════ */
const MODS=[
  {id:"grammar",   icon:"✏️",name:"Daily Grammar",    sub:"Random exercise every session",     xp:10,color:"#e3f2fd"},
  {id:"vocabulary",icon:"🔤",name:"Word of the Day",   sub:"Random word every session",         xp:5, color:"#fff3e0"},
  {id:"peel",      icon:"📝",name:"Guided Writing",    sub:"PEEL paragraph + AI feedback",      xp:50,color:"#fce4ec"},
  {id:"reading",   icon:"📖",name:"Reading Room",      sub:"Random passage every session",      xp:20,color:"#f3e5f5"},
  {id:"mistakes",  icon:"🇫🇷",name:"Common Mistakes",  sub:"Random error lesson every session", xp:10,color:"#e0f2f1"},
  {id:"quiz",      icon:"🧪",name:"Daily Quiz",        sub:"5 random questions every session",  xp:30,color:"#fff8e1"},
];

const BADGES_DEF=[
  {icon:"✍️",name:"First Write",  desc:"Submit your first PEEL paragraph"},
  {icon:"🔥",name:"Streak 7",     desc:"Log in 7 days in a row"},
  {icon:"📐",name:"Grammar Master",desc:"Complete 30 grammar exercises"},
  {icon:"📖",name:"Vocab Champion",desc:"Learn 30 vocabulary words"},
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

  const [swReg, setSwReg] = useState(null);

  useEffect(() => {
    registerSW().then(reg => {
      setSwReg(reg);
      // Schedule daily reminder if already enabled
      const savedTime = localStorage.getItem("writeup_notif_time");
      const enabled = localStorage.getItem("writeup_notif_enabled") === "true";
      if (enabled && savedTime && Notification?.permission === "granted") {
        scheduleDailyReminder(reg, savedTime);
      }
      // Weekly challenge notification every Monday
      const today = new Date();
      if (today.getDay() === 1 && localStorage.getItem("writeup_notif_weekly") !== "false") {
        const msg = NOTIF_MESSAGES.weekly[Math.floor(Math.random() * NOTIF_MESSAGES.weekly.length)];
        scheduleNotification(reg, { ...msg, delayMs: 5000 });
      }
    });
  }, []);
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
    if(user?.id){
      await sbPatch(`users?id=eq.${user.id}`,{level:result.level,placement_done:true},token);
      await savePlacementResult(user.id,token,result.scores,result.level);
    }
    setScreen("result");
  };

  const addXp=async(n,moduleId,sessionData={})=>{
    const newXp=xp+n;
    setXp(newXp);
    setDoneToday(p=>[...p,moduleId]);
    if(user?.id){
      await sbUpsert("daily_progress",{user_id:user.id,date:todayStr(),module:moduleId,completed:true,xp_earned:n},token);
      await sbPatch(`users?id=eq.${user.id}`,{xp:newXp,current_level:placement?.level||"Beginner"},token);
      await saveXpHistory(user.id,token,n,moduleId);
      // Save module session if data provided
      if(sessionData.module){
        await saveModuleSession(user.id,token,{...sessionData,xpEarned:n});
      }
      // Save PEEL attempt if provided
      if(sessionData.peelData){
        await savePeelAttempt(user.id,token,sessionData.peelData);
      }
      // Weekly snapshot every time (upserts so safe)
      const userData=await sbGet(`users?id=eq.${user.id}`,token);
      if(userData?.[0]) await saveWeeklySnapshot(user.id,token,userData[0]);
      // Badges
      if(moduleId==="peel") awardBadge("First Write");
      if(streak>=7) awardBadge("Streak 7");
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
          ?<ModShell mod={activeMod} level={level} addXp={addXp} onBack={()=>{setActiveMod(null);loadToday(user?.id,token);}}/>
          :tab==="home"    ?<Home setMod={setActiveMod} xp={xp} lvl={lvl} pct={pct} level={level} doneToday={doneToday}/>
          :tab==="profile" ?<Profile user={user} xp={xp} lvl={lvl} level={level} badges={badges} streak={streak}/>
          :tab==="board"   ?<Board userId={user?.id} myXp={xp} token={token}/>
          :<Settings user={user} xp={xp} placement={placement} onLogout={async()=>{setScreen("landing");setUser(null);setToken(null);}}/>
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

function ModShell({mod,level,addXp,onBack}) {
  return (
    <div style={{padding:18}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:G,fontWeight:700,fontSize:15,cursor:"pointer",padding:0,marginBottom:16}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <div style={{background:mod.color,borderRadius:14,width:52,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{mod.icon}</div>
        <div><h2 style={{margin:0,color:DK,fontSize:18}}>{mod.name}</h2><p style={{margin:0,color:"#888",fontSize:12}}>{mod.sub}</p></div>
      </div>
      {mod.id==="grammar"    &&<GrammarMod    addXp={addXp} onBack={onBack}/>}
      {mod.id==="vocabulary" &&<VocabMod      addXp={addXp} onBack={onBack}/>}
      {mod.id==="peel"       &&<PeelMod       addXp={addXp} onBack={onBack} level={level}/>}
      {mod.id==="reading"    &&<ReadingMod    addXp={addXp} onBack={onBack}/>}
      {mod.id==="mistakes"   &&<MistakesMod   addXp={addXp} onBack={onBack}/>}
      {mod.id==="quiz"       &&<QuizMod       addXp={addXp} onBack={onBack}/>}
    </div>
  );
}

/* ── Done Screen ── */
function DoneScreen({xp,onBack,earnNow}) {
  useEffect(()=>{if(earnNow)earnNow();},[]);
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
function GrammarMod({addXp,onBack}) {
  const [c]=useState(()=>rnd(GRAMMAR_BANK));
  const [sel,setSel]=useState(null);
  const [done,setDone]=useState(false);
  const [startTime]=useState(()=>Date.now());
  const confirmed=sel!==null;
  const correct=sel===c.ans;

  if(done)return <DoneScreen xp={10} onBack={onBack} earnNow={()=>addXp(10,"grammar",{
    module:"grammar", score:correct?1:0, total:1, passed:correct,
    timeSec:Math.round((Date.now()-startTime)/1000),
    errors:correct?[]:[{question:c.question,chosen:c.opts[sel],correct:c.opts[c.ans]}],
    title:c.title
  })}/>;

  return (
    <div>
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:12,color:"#888"}}>📚 Topic</div>
        <div style={{fontWeight:800,color:DK,fontSize:16}}>{c.title}</div>
        <div style={{fontSize:13,color:"#555",marginTop:4}}>{c.instruction}</div>
      </Card>
      <Card style={{marginBottom:14}}><p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7,margin:0}}>{c.question}</p></Card>
      {c.opts.map((o,oi)=>{
        const isCorrect=oi===c.ans,isPicked=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){
          if(isPicked&&isCorrect){bg="#e8f5e9";border=G;}
          else if(isPicked&&!isCorrect){bg="#ffebee";border="#e53935";}
          else if(!isPicked&&isCorrect&&!correct){bg="#fff9c4";border="#f9a825";}
        } else if(isPicked){bg=LT;border=G;}
        return <button key={oi} onClick={()=>!confirmed&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit",transition:"all .2s"}}>
          {confirmed&&isPicked&&isCorrect?"✅ ":confirmed&&isPicked&&!isCorrect?"❌ ":confirmed&&!isPicked&&isCorrect&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?"✅ Correct! ":"⚠️ Not quite. "}{c.explanation}
          </p>
        </Card>
        <Card style={{background:"#e3f2fd",marginBottom:14}}>
          <p style={{margin:0,fontSize:13,color:"#1565c0"}}>📐 <strong>Rule:</strong> {c.tip}</p>
        </Card>
        {correct
          ?<Btn full onClick={()=>setDone(true)}>Earn +10 XP →</Btn>
          :<Btn full secondary onClick={onBack}>← Try another exercise</Btn>}
      </>}
    </div>
  );
}

/* ── Vocabulary ── */
function VocabMod({addXp,onBack}) {
  const [c]=useState(()=>rnd(VOCAB_BANK));
  const [phase,setPhase]=useState("learn");
  const [sel,setSel]=useState(null);
  const [done,setDone]=useState(false);
  const [startTime]=useState(()=>Date.now());
  const confirmed=sel!==null;
  const correct=sel===c.ans;

  if(done)return <DoneScreen xp={5} onBack={onBack} earnNow={()=>addXp(5,"vocabulary",{
    module:"vocabulary", score:correct?1:0, total:1, passed:correct,
    timeSec:Math.round((Date.now()-startTime)/1000),
    errors:correct?[]:[{word:c.word,chosen:c.opts[sel],correct:c.opts[c.ans]}],
    title:c.word
  })}/>;

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
        <div style={{fontSize:12,color:"#888",marginBottom:6}}>💬 Complete the sentence:</div>
        <p style={{fontWeight:600,color:DK,fontSize:15,lineHeight:1.7}}>{c.example}</p>
      </Card>
      {c.opts.map((o,oi)=>{
        const isCorrect=oi===c.ans,isPicked=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){
          if(isPicked&&isCorrect){bg="#e8f5e9";border=G;}
          else if(isPicked&&!isCorrect){bg="#ffebee";border="#e53935";}
          else if(!isPicked&&isCorrect&&!correct){bg="#fff9c4";border="#f9a825";}
        } else if(isPicked){bg=LT;border=G;}
        return <button key={oi} onClick={()=>!confirmed&&setSel(oi)} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&isPicked&&isCorrect?"✅ ":confirmed&&isPicked&&!isCorrect?"❌ ":confirmed&&!isPicked&&isCorrect&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?`✅ Correct! "${c.word}" fits perfectly here.`:`⚠️ Not quite. The correct word is "${c.opts[c.ans]}". Review the definition and try again!`}
          </p>
        </Card>
        {correct
          ?<Btn full onClick={()=>setDone(true)}>Earn +5 XP →</Btn>
          :<Btn full secondary onClick={onBack}>← Try another word</Btn>}
      </>}
    </div>
  );
}

/* ── PEEL ── */
const PEEL_THEORY = {
  what: "PEEL is a method for writing clear, well-structured academic paragraphs. Each letter stands for one essential part of the paragraph.",
  why: "Academic writing requires logical organisation. Without a clear structure, even good ideas fail to convince the reader. PEEL ensures every paragraph has a purpose, develops an argument, provides proof, and connects back to the essay question.",
  parts: [
    { letter:"P", name:"Point", color:"#e3f2fd", icon:"📌", role:"Your opening sentence. State your main argument clearly and directly. This is your claim — make it specific, not vague.", do:"Start with a strong, confident statement. Avoid 'I think' or 'In my opinion' in formal academic writing.", dont:"Do not begin with a question, a quote, or a general observation. Get straight to the point." },
    { letter:"E", name:"Explanation", color:"#e8f5e9", icon:"💬", role:"Develop your point by explaining WHY it is true. Give 2-3 logical reasons that build on each other.", do:"Use linking words: 'Furthermore', 'In addition', 'This means that', 'As a result'. Each sentence should add new information.", dont:"Do not simply repeat your Point in different words. Every sentence must add new reasoning or a new dimension to your argument." },
    { letter:"E", name:"Evidence", color:"#fff3e0", icon:"📚", role:"Provide concrete proof for your argument — a statistic, a study, a real example, or a quote from an expert.", do:"Introduce your evidence: 'According to...', 'Research by...', 'A study conducted by... found that...'. Be as specific as possible.", dont:"Never use vague evidence like 'studies show' without naming the study. Avoid using personal anecdotes as your main evidence in formal essays." },
    { letter:"L", name:"Link", color:"#fce4ec", icon:"🔗", role:"Close the paragraph by connecting your argument back to the essay question or thesis statement.", do:"Use phrases like: 'Therefore...', 'This demonstrates that...', 'It is clear from the evidence that...', 'For these reasons...'", dont:"Do not introduce new arguments or evidence in the Link. Do not simply copy your Point sentence. Synthesise and reconnect." },
  ],
  badExample: {
    topic: "Should technology be used more in African universities?",
    paragraph: "Technology is good for students. Many students use phones. The internet has a lot of information. Students can find things easily. So technology is important.",
    annotations: [
      { part:"Point", text:"Technology is good for students.", issue:"❌ Too vague. 'Good' is not academic vocabulary. The argument is not specific enough — good in what way? For whom exactly?" },
      { part:"Explanation", text:"Many students use phones. The internet has a lot of information. Students can find things easily.", issue:"❌ These are three unconnected observations, not a logical explanation. There is no development of WHY technology improves education. No linking words are used." },
      { part:"Evidence", text:"(No evidence provided)", issue:"❌ There is no evidence at all. This makes the argument unconvincing and unacademic. Any claim in academic writing must be supported by proof." },
      { part:"Link", text:"So technology is important.", issue:"❌ This is too brief and does not connect back to the specific question about African universities. 'So' is too informal for academic writing." },
    ]
  },
  goodExample: {
    topic: "Should technology be used more in African universities?",
    paragraph: "Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning. With smartphones and reliable internet connections, students can access thousands of academic journals and online courses that are entirely unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace, reinforcing difficult content outside the classroom. According to a UNESCO report published in 2022, students who regularly use digital learning tools score on average 35% higher on standardised assessments than those who rely solely on traditional methods. Given this compelling evidence, increasing technological integration in African universities is not merely a matter of modernisation — it is an urgent academic priority that would directly improve educational outcomes across the continent.",
    annotations: [
      { part:"Point", text:"Technology should be integrated more widely into African universities because it significantly improves both access to knowledge and the quality of learning.", issue:"✅ Clear, specific, and directly addresses the question. Uses strong academic vocabulary ('integrated', 'significantly'). Includes a 'because' to signal that reasoning will follow." },
      { part:"Explanation", text:"With smartphones and reliable internet connections, students can access thousands of academic journals and online courses that are entirely unavailable in most African university libraries. Furthermore, digital tools allow students to learn at their own pace, reinforcing difficult content outside the classroom.", issue:"✅ Two well-developed reasons, logically connected with 'Furthermore'. Each sentence adds new information. Uses specific, academic vocabulary." },
      { part:"Evidence", text:"According to a UNESCO report published in 2022, students who regularly use digital learning tools score on average 35% higher on standardised assessments than those who rely solely on traditional methods.", issue:"✅ Specific, credible, and properly introduced with 'According to'. Names the source (UNESCO) and the year (2022). Includes a precise statistic (35%)." },
      { part:"Link", text:"Given this compelling evidence, increasing technological integration in African universities is not merely a matter of modernisation — it is an urgent academic priority that would directly improve educational outcomes across the continent.", issue:"✅ Directly reconnects to the question about African universities. Uses 'Given this compelling evidence' to signal synthesis. Elevates the argument with strong academic phrasing." },
    ]
  }
};

const SCORING_CRITERIA = [
  { id:"point",    label:"Clarity & Precision of Argument (Point)",    max:4, desc:"Is the main argument stated clearly, directly, and specifically? Does it directly address the question?" },
  { id:"expl",     label:"Logical Development (Explanation)",           max:4, desc:"Does the explanation develop the point with clear reasoning? Are linking words used? Is each sentence adding new information?" },
  { id:"evidence", label:"Quality & Relevance of Evidence",             max:4, desc:"Is the evidence specific, credible, and properly introduced? Is a source named? Is a statistic or real example used?" },
  { id:"link",     label:"Cohesion & Return to Topic (Link)",           max:3, desc:"Does the link effectively connect back to the question? Does it synthesise the argument without introducing new ideas?" },
  { id:"grammar",  label:"Grammar & Academic Vocabulary",               max:3, desc:"Is the grammar accurate? Is academic vocabulary used? Are there false friends or common French-speaker errors?" },
  { id:"length",   label:"Length & Sufficient Development",             max:2, desc:"Is the paragraph long enough? Is each section sufficiently developed (minimum 2-3 sentences for Explanation)?" },
];

const WORD_MINIMUMS = {
  Beginner:     { point:10, explanation:20, evidence:10, link:10 },
  Intermediate: { point:15, explanation:40, evidence:20, link:15 },
  Advanced:     { point:25, explanation:60, evidence:25, link:20 },
};

function PeelMod({addXp,onBack,level}) {
  const [phase,setPhase]=useState("theory");
  const [c]=useState(()=>rnd(PEEL_TOPICS));
  const [theoryTab,setTheoryTab]=useState(0);
  const [step,setStep]=useState(0);
  const [vals,setVals]=useState({point:"",explanation:"",evidence:"",link:""});
  const [feedback,setFeedback]=useState(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [attempts,setAttempts]=useState(0);
  const [startTime]=useState(()=>Date.now());
  const keys=["point","explanation","evidence","link"];
  const labels=["📌 Point","💬 Explanation","📚 Evidence","🔗 Link"];
  const minWords = WORD_MINIMUMS[level] || WORD_MINIMUMS.Beginner;
  const wordCount=txt=>txt.trim().split(/\s+/).filter(w=>w.length>0).length;

  const getAI=async(isRevision=false)=>{
    setAiLoading(true);
    try{
      const res=await fetch("/api/generate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          prompt:`You are a strict but fair English writing examiner assessing a PEEL paragraph written by a ${level} university student in Côte d'Ivoire (French speaker). This is attempt number ${attempts+1}.${isRevision?" The student has revised their paragraph based on previous feedback.":""} You must provide a detailed structured assessment with a score out of 20.

TOPIC: "${c.prompt}"
STUDENT'S PARAGRAPH:
Point: ${vals.point}
Explanation: ${vals.explanation}
Evidence: ${vals.evidence}
Link: ${vals.link}

Your response must follow this EXACT structure:

---SCORES---
POINT: [0-4]/4
EXPLANATION: [0-4]/4
EVIDENCE: [0-4]/4
LINK: [0-3]/3
GRAMMAR: [0-3]/3
LENGTH: [0-2]/2
TOTAL: [sum]/20
---END SCORES---

---FEEDBACK---

## Overall Assessment
[2-3 honest sentences about the overall quality. State the score and what it means. If this is a revision, acknowledge improvement or continued weaknesses.]

## 📌 Point — [score]/4
ISSUES: [List each weak or problematic sentence from the student's Point below, one per line, preceded by ⚠️]
⚠️ "[exact problematic sentence from student]"
→ Problem: [specific explanation of what is wrong]
→ Fix: [rewritten improved version]
[If the Point is strong (3-4/4), skip the ISSUES block and write: ✅ Strong — [specific praise]]

## 💬 Explanation — [score]/4
ISSUES: [List each weak or problematic sentence from the student's Explanation]
⚠️ "[exact problematic sentence]"
→ Problem: [specific explanation]
→ Fix: [rewritten improved version]
[If strong, skip and write: ✅ Strong — [specific praise]]

## 📚 Evidence — [score]/4
ISSUES:
⚠️ "[exact problematic sentence or 'No evidence provided']"
→ Problem: [specific explanation]
→ Fix: [model evidence sentence with named source and statistic]
[If strong, skip and write: ✅ Strong — [specific praise]]

## 🔗 Link — [score]/3
ISSUES:
⚠️ "[exact problematic sentence]"
→ Problem: [specific explanation]
→ Fix: [model link sentence]
[If strong, skip and write: ✅ Strong — [specific praise]]

## ✏️ Grammar & Academic Vocabulary — [score]/3
[List 2-3 specific errors:]
❌ "[wrong sentence from student]"
✅ "[corrected version]"
📖 Rule: [brief grammar explanation]

[Then suggest 2 stronger academic words to replace informal ones, with examples.]

## 📏 Length & Development — [score]/2
[Comment on whether each section meets the minimum word requirements for ${level} level: Point=${minWords.point} words, Explanation=${minWords.explanation} words, Evidence=${minWords.evidence} words, Link=${minWords.link} words.]

## 🎯 Priority Actions — What you MUST improve
${attempts>=1?"Based on your revision, here are the remaining issues to address:":"Here are the 3 most important things to fix before your next attempt:"}
1. [Most critical specific action]
2. [Second specific action]
3. [Third specific action]

## 💪 Encouragement
[1-2 warm sentences acknowledging specific strengths and motivating continued effort.]
---END FEEDBACK---

Be rigorous. A score of 15+/20 requires genuinely strong academic writing. Do not inflate scores.`,
          maxTokens:1500
        })
      });
      const data=await res.json();
      const text=data.text||"";
      const scoreMatch=text.match(/---SCORES---([\s\S]*?)---END SCORES---/);
      const feedbackMatch=text.match(/---FEEDBACK---([\s\S]*?)---END FEEDBACK---/);
      let scores={point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0};
      if(scoreMatch){
        const s=scoreMatch[1];
        scores.point=parseInt(s.match(/POINT:\s*(\d)/)?.[1]||0);
        scores.expl=parseInt(s.match(/EXPLANATION:\s*(\d)/)?.[1]||0);
        scores.evidence=parseInt(s.match(/EVIDENCE:\s*(\d)/)?.[1]||0);
        scores.link=parseInt(s.match(/LINK:\s*(\d)/)?.[1]||0);
        scores.grammar=parseInt(s.match(/GRAMMAR:\s*(\d)/)?.[1]||0);
        scores.length=parseInt(s.match(/LENGTH:\s*(\d)/)?.[1]||0);
        scores.total=scores.point+scores.expl+scores.evidence+scores.link+scores.grammar+scores.length;
      }
      setFeedback({text:feedbackMatch?feedbackMatch[1].trim():text,scores,passed:scores.total>=10});
      setAttempts(a=>a+1);
      setPhase("feedback");
      // 💪 PEEL low score notification
      if(scores.total<10 && localStorage.getItem("writeup_notif_peel")!=="false"){
        setTimeout(()=>{
          const msg=NOTIF_MESSAGES.peelLow(scores.total);
          showNotificationNow(msg.title,msg.body);
        },3000);
      }
    }catch{
      setFeedback({text:"Feedback could not be loaded. Please check your connection.",scores:{point:0,expl:0,evidence:0,link:0,grammar:0,length:0,total:0},passed:false});
      setPhase("feedback");
    }
    setAiLoading(false);
  };

  // Parse feedback text to highlight problematic sentences
  const renderFeedbackWithHighlights=(text)=>{
    if(!text) return null;
    return text.split("\n").map((line,i)=>{
      if(line.startsWith("⚠️")){
        return (
          <div key={i} style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:8,padding:"8px 12px",margin:"6px 0",fontSize:13}}>
            <span style={{color:"#856404"}}>{line}</span>
          </div>
        );
      }
      if(line.startsWith("→ Problem:")){
        return <div key={i} style={{background:"#ffebee",borderLeft:"3px solid #e53935",padding:"6px 10px",margin:"3px 0 3px 12px",fontSize:13,color:"#c62828",lineHeight:1.6}}>{line}</div>;
      }
      if(line.startsWith("→ Fix:")){
        return <div key={i} style={{background:"#e8f5e9",borderLeft:"3px solid "+G,padding:"6px 10px",margin:"3px 0 8px 12px",fontSize:13,color:DK,lineHeight:1.6}}>{line}</div>;
      }
      if(line.startsWith("❌")){
        return <div key={i} style={{background:"#ffebee",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:"#c62828"}}>{line}</div>;
      }
      if(line.startsWith("✅") && !line.includes("Strong")){
        return <div key={i} style={{background:"#e8f5e9",borderRadius:6,padding:"6px 10px",margin:"4px 0",fontSize:13,color:DK}}>{line}</div>;
      }
      if(line.startsWith("📖 Rule:")){
        return <div key={i} style={{background:"#e3f2fd",borderRadius:6,padding:"6px 10px",margin:"4px 0 8px",fontSize:12,color:"#1565c0"}}>{line}</div>;
      }
      if(line.startsWith("##")){
        return <h4 key={i} style={{color:G,margin:"16px 0 8px",fontSize:14,borderBottom:`1px solid ${LT}`,paddingBottom:4}}>{line.replace(/^#+\s*/,"")}</h4>;
      }
      if(line.trim()==="") return <div key={i} style={{height:4}}/>;
      return <p key={i} style={{margin:"4px 0",fontSize:13,color:"#333",lineHeight:1.7}}>{line}</p>;
    });
  };

  // THEORY phase
  if(phase==="theory") return (
    <div>
      <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
        <div style={{fontSize:11,opacity:.8,marginBottom:4}}>📚 Before you write · Level: {level}</div>
        <h3 style={{margin:"0 0 6px",fontSize:18}}>Understanding PEEL</h3>
        <p style={{margin:0,fontSize:13,opacity:.85,lineHeight:1.6}}>{PEEL_THEORY.what}</p>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {["What & Why","P — Point","E — Explanation","E — Evidence","L — Link"].map((t,idx)=>(
          <button key={idx} onClick={()=>setTheoryTab(idx)}
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
            <h4 style={{color:"#e65100",margin:"0 0 10px"}}>📐 The 4 Parts at a Glance</h4>
            {PEEL_THEORY.parts.map(p=>(
              <div key={p.letter+p.name} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                <div style={{background:p.color,borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{p.icon}</div>
                <div><div style={{fontWeight:700,color:DK,fontSize:14}}>{p.letter} — {p.name}</div><div style={{fontSize:12,color:"#666",lineHeight:1.5}}>{p.role}</div></div>
              </div>
            ))}
          </Card>
          <Card style={{background:LT,marginBottom:12}}>
            <h4 style={{color:G,margin:"0 0 8px"}}>📏 Word Minimums for Your Level ({level})</h4>
            {keys.map(k=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #c8e6c9"}}>
                <span style={{fontWeight:600,color:DK,textTransform:"capitalize"}}>{k}</span>
                <span style={{color:G,fontWeight:700}}>min {minWords[k]} words</span>
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
        {theoryTab>0&&<Btn secondary onClick={()=>setTheoryTab(t=>t-1)}>← Previous</Btn>}
        {theoryTab<4?<Btn full onClick={()=>setTheoryTab(t=>t+1)}>Next →</Btn>:<Btn full onClick={()=>setPhase("bad")}>See Examples →</Btn>}
      </div>
    </div>
  );

  // BAD EXAMPLE
  if(phase==="bad") return (
    <div>
      <Card style={{background:"#ffebee",marginBottom:14,borderLeft:"4px solid #e53935"}}>
        <div style={{fontWeight:800,color:"#c62828",fontSize:16,marginBottom:4}}>❌ Weak Paragraph — What NOT to do</div>
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>Topic: {PEEL_THEORY.badExample.topic}</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.8,fontStyle:"italic",background:"#fff",borderRadius:10,padding:12,margin:0}}>{PEEL_THEORY.badExample.paragraph}</p>
      </Card>
      <h4 style={{color:DK,marginBottom:10}}>🔍 Why is this paragraph weak?</h4>
      {PEEL_THEORY.badExample.annotations.map((a,i)=>(
        <Card key={i} style={{marginBottom:10,borderLeft:"3px solid #e53935"}}>
          <div style={{fontWeight:700,color:"#c62828",fontSize:12,marginBottom:6}}>❌ {a.part}</div>
          {a.text&&<p style={{fontSize:13,color:"#333",fontStyle:"italic",margin:"0 0 6px",background:"#fff9f9",padding:"6px 10px",borderRadius:8}}>"{a.text}"</p>}
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{a.issue}</p>
        </Card>
      ))}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <Btn secondary onClick={()=>setPhase("theory")}>← Theory</Btn>
        <Btn full onClick={()=>setPhase("good")}>See Good Example →</Btn>
      </div>
    </div>
  );

  // GOOD EXAMPLE
  if(phase==="good") return (
    <div>
      <Card style={{background:"#e8f5e9",marginBottom:14,borderLeft:"4px solid "+G}}>
        <div style={{fontWeight:800,color:G,fontSize:16,marginBottom:4}}>✅ Strong Paragraph — A model to follow</div>
        <div style={{fontSize:12,color:"#666",marginBottom:10}}>Topic: {PEEL_THEORY.goodExample.topic}</div>
        <p style={{fontSize:14,color:"#333",lineHeight:1.9,background:"#fff",borderRadius:10,padding:12,margin:0}}>{PEEL_THEORY.goodExample.paragraph}</p>
      </Card>
      <h4 style={{color:DK,marginBottom:10}}>🔍 Why is this paragraph strong?</h4>
      {PEEL_THEORY.goodExample.annotations.map((a,i)=>(
        <Card key={i} style={{marginBottom:10,borderLeft:`3px solid ${G}`}}>
          <div style={{fontWeight:700,color:G,fontSize:12,marginBottom:6}}>✅ {a.part}</div>
          <p style={{fontSize:13,color:"#333",fontStyle:"italic",margin:"0 0 6px",background:"#f9fbe7",padding:"6px 10px",borderRadius:8}}>"{a.text}"</p>
          <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.7}}>{a.issue}</p>
        </Card>
      ))}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <Btn secondary onClick={()=>setPhase("bad")}>← Bad Example</Btn>
        <Btn full onClick={()=>setPhase("write")}>Write My Paragraph →</Btn>
      </div>
    </div>
  );

  // WRITE phase
  if(phase==="write") return (
    <div>
      {attempts>0&&(
        <Card style={{background:"#fff3e0",marginBottom:12,borderLeft:"3px solid #f57c00"}}>
          <p style={{margin:0,fontSize:13,color:"#e65100",fontWeight:600}}>🔄 Revision attempt #{attempts} — Apply the feedback and improve your paragraph.</p>
        </Card>
      )}
      <Card style={{background:LT,marginBottom:14}}>
        <div style={{fontSize:11,color:"#888"}}>📝 Topic · {level} Level</div>
        <div style={{fontWeight:800,color:DK,fontSize:15,marginTop:2}}>{c.title}</div>
        <div style={{color:"#555",fontSize:13,marginTop:4,lineHeight:1.6}}>{c.prompt}</div>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {keys.map((k,idx)=>(
          <div key={k} style={{flex:1,textAlign:"center"}}>
            <div style={{height:6,borderRadius:99,background:vals[k]&&wordCount(vals[k])>=minWords[k]?G:vals[k]?"#f57c00":idx===step?"#81c784":"#e0e0e0",marginBottom:4,transition:"background .3s"}}/>
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
                <div>
                  <div style={{fontWeight:800,color:DK,fontSize:15}}>{p.icon} {labels[step]}</div>
                  <div style={{fontSize:12,color:"#666",marginTop:4,lineHeight:1.5}}>{p.role}</div>
                </div>
                <div style={{background:G,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:11,fontWeight:700,flexShrink:0,textAlign:"center"}}>
                  min {minWords[keys[step]]}<br/>words
                </div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:"#555"}}><strong>DO:</strong> {p.do}</div>
            </Card>
            <Card style={{background:"#f0f7f4",marginBottom:10}}>
              <div style={{fontSize:11,color:"#888",marginBottom:4}}>📋 Model from a strong paragraph:</div>
              <p style={{fontSize:13,color:"#444",margin:0,lineHeight:1.8,fontStyle:"italic"}}>"{c.example[keys[step]]}"</p>
            </Card>
            {/* Show previous feedback for this section if revision */}
            {attempts>0&&feedback&&(
              <Card style={{background:"#fff8e1",marginBottom:10}}>
                <div style={{fontSize:11,color:"#e65100",fontWeight:700,marginBottom:4}}>⚠️ Previous feedback on your {keys[step]}:</div>
                <p style={{fontSize:12,color:"#555",margin:0,lineHeight:1.6,fontStyle:"italic"}}>{vals[keys[step]]}</p>
              </Card>
            )}
            <textarea
              value={vals[keys[step]]}
              onChange={e=>setVals(p=>({...p,[keys[step]]:e.target.value}))}
              placeholder={`Write your ${keys[step]} here… (minimum ${minWords[keys[step]]} words for ${level} level)`}
              rows={6}
              style={{width:"100%",boxSizing:"border-box",border:`2px solid ${vals[keys[step]]&&wordCount(vals[keys[step]])>=minWords[keys[step]]?G:vals[keys[step]]?"#f57c00":"#ddd"}`,borderRadius:12,padding:12,fontSize:14,resize:"vertical",outline:"none",fontFamily:"inherit",transition:"border .2s"}}
            />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:4,marginBottom:10}}>
              <span style={{color:wordCount(vals[keys[step]])>=minWords[keys[step]]?G:wordCount(vals[keys[step]])>0?"#f57c00":"#aaa",fontWeight:600}}>
                {wordCount(vals[keys[step]])} / {minWords[keys[step]]} words min
                {wordCount(vals[keys[step]])>=minWords[keys[step]]?" ✅":wordCount(vals[keys[step]])>0?" ⚠️":""}
              </span>
              <span style={{color:"#aaa"}}>{vals[keys[step]].length} chars</span>
            </div>
            {step>0&&vals[keys[step-1]]&&(
              <Card style={{background:"#fafafa",marginBottom:10}}>
                <div style={{fontSize:11,color:"#888",marginBottom:4}}>📄 Your {keys[step-1]}:</div>
                <p style={{fontSize:12,color:"#555",margin:0,lineHeight:1.6,fontStyle:"italic"}}>"{vals[keys[step-1]]}"</p>
              </Card>
            )}
            <Btn full
              disabled={!vals[keys[step]]||wordCount(vals[keys[step]])<minWords[keys[step]]||aiLoading}
              onClick={()=>{if(step<3)setStep(s=>s+1);else getAI(attempts>0);}}>
              {aiLoading?"Analysing your paragraph…":step<3?`Next: ${labels[step+1]} →`:"🤖 Submit for Assessment"}
            </Btn>
          </div>
        );
      })()}
    </div>
  );

  // FEEDBACK phase
  if(phase==="feedback"&&feedback) return (
    <div>
      {/* Score card */}
      <Card style={{background:`linear-gradient(135deg,${feedback.scores.total>=15?DK:feedback.scores.total>=10?"#f57c00":"#c62828"},${feedback.scores.total>=15?G:feedback.scores.total>=10?"#ff9800":"#e53935"})`,color:"#fff",marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:13,opacity:.85,marginBottom:4}}>
          📊 Attempt #{attempts} · {feedback.passed?"✅ PASSED":"❌ NOT YET PASSED — Revision Required"}
        </div>
        <div style={{fontSize:52,fontWeight:900,marginBottom:4}}>{feedback.scores.total}<span style={{fontSize:24,fontWeight:400}}>/20</span></div>
        <div style={{fontSize:14,fontWeight:700,opacity:.9}}>
          {feedback.scores.total>=17?"🏆 Excellent":feedback.scores.total>=14?"👏 Good":feedback.scores.total>=10?"📈 Satisfactory — Passed":"💪 Below Average — Must Revise"}
        </div>
        {!feedback.passed&&<div style={{fontSize:12,opacity:.85,marginTop:6,background:"rgba(0,0,0,.2)",borderRadius:8,padding:"6px 12px"}}>You need 10/20 to pass. Read the feedback carefully, revise your paragraph, and resubmit.</div>}
      </Card>

      {/* Score breakdown */}
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

      {/* Detailed annotated feedback */}
      <Card style={{marginBottom:14}}>
        <h4 style={{color:G,marginBottom:12}}>🔍 Detailed Analysis</h4>
        <div>{renderFeedbackWithHighlights(feedback.text)}</div>
      </Card>

      {/* Student paragraph */}
      <Card style={{background:"#f9fbe7",marginBottom:14}}>
        <h5 style={{color:DK,margin:"0 0 12px"}}>📄 Your Submitted Paragraph</h5>
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
            <p style={{color:"#555",fontSize:13,margin:"4px 0 0"}}>You earned +50 XP for passing the PEEL assessment.</p>
          </Card>
          <Btn full onClick={()=>{addXp(50,"peel",{
          module:"peel", score:feedback.scores.total, total:20,
          passed:true, timeSec:Math.round((Date.now()-startTime)/1000),
          title:c.title,
          peelData:{
            topic:c.prompt, attemptNum:attempts,
            vals, scores:feedback.scores,
            passed:true, timeSec:Math.round((Date.now()-startTime)/1000)
          }
        });onBack();}}>Claim +50 XP & Continue →</Btn>
        </div>
      ) : (
        <div>
          <Card style={{background:"#fff3e0",marginBottom:14,borderLeft:"3px solid #f57c00"}}>
            <h5 style={{color:"#e65100",margin:"0 0 8px"}}>🔄 What to do now:</h5>
            <p style={{fontSize:13,color:"#555",margin:0,lineHeight:1.8}}>1. Read every ⚠️ highlighted sentence above carefully.<br/>2. Read each "→ Problem" and "→ Fix" explanation.<br/>3. Rewrite your paragraph applying all the corrections.<br/>4. Resubmit — you must reach 10/20 to pass.</p>
          </Card>
          <Btn full onClick={()=>{setPhase("write");setStep(0);}}>🔄 Revise My Paragraph →</Btn>
        </div>
      )}
    </div>
  );

  return <div style={{padding:20,textAlign:"center"}}><Loader text="Loading…"/></div>;
}

/* ── Reading ── */
function ReadingMod({addXp,onBack}) {
  const [c]=useState(()=>rnd(READING_BANK));
  const [phase,setPhase]=useState("read");
  const [ans,setAns]=useState([null,null,null]);
  const [checked,setChecked]=useState(false);
  const [done,setDone]=useState(false);
  if(done)return <DoneScreen xp={20} onBack={onBack} earnNow={()=>addXp(20,"reading")}/>;
  const score=ans.filter((a,i)=>a===c.questions[i]?.ans).length;
  if(phase==="read")return (
    <div>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:11,color:"#888",marginBottom:4}}>📖 {c.topic}</div>
        <h3 style={{color:G,margin:"0 0 12px"}}>{c.title}</h3>
        {c.passage.split("\n\n").map((p,i)=><p key={i} style={{lineHeight:1.9,fontSize:14,color:"#333",marginBottom:12}}>{p}</p>)}
      </Card>
      <Card style={{background:"#fff8e1",marginBottom:14}}>
        <div style={{fontWeight:700,color:"#e65100",marginBottom:10,fontSize:13}}>📖 Glossary</div>
        {c.glossary.map(g=><div key={g.word} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}>
          <strong style={{color:DK,minWidth:110,flexShrink:0}}>{g.word}</strong>
          <span style={{color:"#555",lineHeight:1.5}}>{g.definition}</span>
        </div>)}
      </Card>
      <Btn full onClick={()=>setPhase("quiz")}>Answer Questions →</Btn>
    </div>
  );
  return (
    <div>
      <h4 style={{color:DK,marginBottom:14}}>📝 Comprehension Questions</h4>
      {c.questions.map((q,qi)=>(
        <Card key={qi} style={{marginBottom:14}}>
          <p style={{fontWeight:600,color:DK,fontSize:14,marginBottom:10,lineHeight:1.6}}>{qi+1}. {q.q}</p>
          {q.opts.map((o,oi)=>{
            const isCorrect=oi===q.ans,isPicked=oi===ans[qi];
            let bg="#f9f9f9",border="#e0e0e0";
            if(checked){
              if(isPicked&&isCorrect){bg="#e8f5e9";border=G;}
              else if(isPicked&&!isCorrect){bg="#ffebee";border="#e53935";}
              else if(!isPicked&&isCorrect){bg="#fff9c4";border="#f9a825";}
            } else if(isPicked){bg=LT;border=G;}
            return <button key={oi} onClick={()=>{if(!checked)setAns(a=>{const n=[...a];n[qi]=oi;return n;})}} style={{display:"block",width:"100%",background:bg,border:`1.5px solid ${border}`,borderRadius:10,padding:"10px 14px",marginBottom:8,cursor:checked?"default":"pointer",textAlign:"left",fontSize:13,fontFamily:"inherit"}}>
              {checked&&isPicked&&isCorrect?"✅ ":checked&&isPicked&&!isCorrect?"❌ ":checked&&!isPicked&&isCorrect?"💡 ":""}{o}
            </button>;
          })}
        </Card>
      ))}
      {!checked
        ?<Btn full disabled={ans.includes(null)} onClick={()=>setChecked(true)}>Check Answers</Btn>
        :<div>
          <Card style={{background:score===3?LT:"#fff3e0",textAlign:"center",marginBottom:14}}>
            <strong style={{color:score===3?G:"#e65100",fontSize:16}}>{score}/3 correct {score===3?"🎉":"— keep reading to improve!"}</strong>
          </Card>
          <Btn full onClick={()=>setDone(true)}>Earn +20 XP</Btn>
        </div>}
    </div>
  );
}

/* ── Mistakes ── */
function MistakesMod({addXp,onBack}) {
  const [c]=useState(()=>rnd(MISTAKES_BANK));
  const [done,setDone]=useState(false);
  if(done)return <DoneScreen xp={10} onBack={onBack} earnNow={()=>addXp(10,"mistakes")}/>;
  return (
    <div>
      <Card style={{borderLeft:`4px solid #ff9800`,marginBottom:14}}>
        <Tag color="#fff3e0">{c.title}</Tag>
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
          <span style={{fontSize:18}}>🇫🇷</span>
          <span style={{fontSize:13,color:"#666",fontStyle:"italic",lineHeight:1.5}}>French pattern: <strong>{c.french_pattern}</strong></span>
        </div>
      </Card>
      <Card style={{background:"#ffebee",marginBottom:10}}>
        <div style={{fontSize:12,color:"#c62828",fontWeight:700,marginBottom:8}}>❌ Common Error</div>
        <p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.wrong_english}"</p>
      </Card>
      <Card style={{background:"#e8f5e9",marginBottom:10}}>
        <div style={{fontSize:12,color:G,fontWeight:700,marginBottom:8}}>✅ Correct English</div>
        <p style={{color:"#333",fontSize:14,margin:0,fontStyle:"italic"}}>"{c.correct_english}"</p>
      </Card>
      <Card style={{background:"#e3f2fd",marginBottom:14}}>
        <div style={{fontSize:12,color:"#1565c0",fontWeight:700,marginBottom:8}}>📐 Rule & Explanation</div>
        <p style={{color:"#333",fontSize:13,margin:0,lineHeight:1.8}}>{c.rule}</p>
      </Card>
      <Card style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:DK,marginBottom:12}}>📝 More Examples</div>
        {c.extra_examples.map((e,i)=>(
          <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<c.extra_examples.length-1?"1px solid #f0f0f0":"none"}}>
            <div style={{fontSize:13,color:"#c62828",marginBottom:4}}>❌ {e.wrong}</div>
            <div style={{fontSize:13,color:G}}>✅ {e.right}</div>
          </div>
        ))}
      </Card>
      <Btn full onClick={()=>setDone(true)}>Got it! Earn +10 XP</Btn>
    </div>
  );
}

/* ── Quiz ── */
function QuizMod({addXp,onBack}) {
  const [qs]=useState(()=>rnd(QUIZ_BANK));
  const [i,setI]=useState(0);
  const [sel,setSel]=useState(null);
  const [score,setScore]=useState(0);
  const [review,setReview]=useState(false);
  const [done,setDone]=useState(false);
  const [startTime]=useState(()=>Date.now());

  if(done)return <DoneScreen xp={score*6} onBack={onBack} earnNow={()=>addXp(score*6,"quiz",{
    module:"quiz", score, total:qs.length, passed:score>=3,
    timeSec:Math.round((Date.now()-startTime)/1000),
    title:"Daily Quiz"
  })}/>;


  const q=qs[i];
  const confirmed=sel!==null;
  const correct=sel===q?.ans;

  if(review)return (
    <div>
      <Card style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:52}}>{score>=4?"🏆":score>=2?"👏":"💪"}</div>
        <h3 style={{color:G,margin:"8px 0 4px"}}>Quiz Complete!</h3>
        <p style={{color:"#666",fontSize:14}}>Score: <strong style={{color:G,fontSize:20}}>{score}/{qs.length}</strong></p>
        <p style={{color:"#888",fontSize:13}}>{score>=4?"Excellent work! You have strong English foundations.":score>=2?"Good effort — review the explanations and keep practising!":"Review the lessons carefully and try again — every attempt is progress!"}</p>
      </Card>
      <Card style={{background:LT,marginBottom:14}}>
        <p style={{margin:0,fontSize:13,color:G,fontWeight:600}}>⭐ XP earned: +{score*6} (6 XP per correct answer)</p>
      </Card>
      <Btn full onClick={()=>setDone(true)}>Claim +{score*6} XP →</Btn>
    </div>
  );

  const next=()=>{if(i<qs.length-1){setI(p=>p+1);setSel(null);}else setReview(true);};

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
        const isCorrect=oi===q.ans,isPicked=oi===sel;
        let bg="#fff",border="#e0e0e0";
        if(confirmed){
          if(isPicked&&isCorrect){bg="#e8f5e9";border=G;}
          else if(isPicked&&!isCorrect){bg="#ffebee";border="#e53935";}
          else if(!isPicked&&isCorrect&&!correct){bg="#fff9c4";border="#f9a825";}
        } else if(isPicked){bg=LT;border=G;}
        return <button key={oi} onClick={()=>{if(!confirmed){setSel(oi);if(oi===q.ans)setScore(s=>s+1);}}} style={{display:"block",width:"100%",background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"12px 16px",marginBottom:10,cursor:confirmed?"default":"pointer",textAlign:"left",fontSize:14,fontFamily:"inherit"}}>
          {confirmed&&isPicked&&isCorrect?"✅ ":confirmed&&isPicked&&!isCorrect?"❌ ":confirmed&&!isPicked&&isCorrect&&!correct?"💡 ":""}{o}
        </button>;
      })}
      {confirmed&&<>
        <Card style={{background:correct?"#e8f5e9":"#fff3e0",marginBottom:10}}>
          <p style={{margin:0,fontSize:13,color:correct?DK:"#e65100",lineHeight:1.7}}>
            {correct?"✅ Correct! ":"⚠️ Not quite. "}{q.exp}
          </p>
        </Card>
        <Btn full onClick={next}>{i<qs.length-1?"Next Question →":"See Results"}</Btn>
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
            <div style={{fontSize:11,color:"#777",lineHeight:1.4}}>{b.desc}</div>
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
  const [loading,setLoading]=useState(true);
  const [lastRefresh,setLastRefresh]=useState(null);
  const [myRank,setMyRank]=useState(null);

  const fetchLb=async()=>{
    try{
      const data=await sbGet("public_leaderboard?limit=10",token);
      if(Array.isArray(data)){
        // Update my XP in the list in real time
        const updated=data.map(u=>u.id===userId?{...u,xp:myXp}:u);
        // Re-sort after updating my XP
        updated.sort((a,b)=>b.xp-a.xp);
        setLb(updated);
        // Find my rank in full leaderboard
        const allData=await sbGet("public_leaderboard?limit=50",token);
        if(Array.isArray(allData)){
          const allUpdated=allData.map(u=>u.id===userId?{...u,xp:myXp}:u);
          allUpdated.sort((a,b)=>b.xp-a.xp);
          const rank=allUpdated.findIndex(u=>u.id===userId)+1;
          setMyRank(rank>0?rank:null);
        }
      }
    }catch(e){console.error("leaderboard error",e);}
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(()=>{
    fetchLb();
    // Auto-refresh every 30 seconds
    const interval=setInterval(fetchLb,30000);
    return ()=>clearInterval(interval);
  },[myXp]);

  const medals=["🥇","🥈","🥉"];
  const levelColors={Bronze:"#cd7f32",Silver:"#9e9e9e",Gold:"#ffd700",Platinum:"#4fc3f7",Beginner:"#81c784",Intermediate:"#42a5f5",Advanced:"#ab47bc"};

  return (
    <div style={{padding:18}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h3 style={{color:DK,margin:"0 0 4px"}}>🏆 Leaderboard</h3>
          <p style={{color:"#888",fontSize:12,margin:0}}>
            {lastRefresh?`Updated ${lastRefresh.toLocaleTimeString([],({hour:"2-digit",minute:"2-digit"}))}`:"Loading…"}
          </p>
        </div>
        <button onClick={fetchLb} style={{background:LT,border:"none",borderRadius:10,padding:"6px 12px",color:G,fontWeight:700,fontSize:12,cursor:"pointer"}}>
          🔄 Refresh
        </button>
      </div>

      {/* My rank card if not in top 10 */}
      {myRank&&myRank>10&&(
        <Card style={{background:`linear-gradient(135deg,${DK},${G})`,color:"#fff",marginBottom:16}}>
          <div style={{fontSize:12,opacity:.8,marginBottom:4}}>📍 Your Current Rank</div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:32,fontWeight:900}}>#{myRank}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>Keep going!</div>
              <div style={{fontSize:12,opacity:.8}}>⭐ {myXp} XP — You need more to reach the top 10</div>
            </div>
          </div>
        </Card>
      )}

      {loading&&<Loader text="Loading leaderboard…"/>}

      {/* Top 10 */}
      {!loading&&lb.length===0&&(
        <Card style={{textAlign:"center",padding:32}}>
          <div style={{fontSize:40,marginBottom:8}}>🏆</div>
          <p style={{color:"#888"}}>No students yet. Be the first!</p>
        </Card>
      )}

      {lb.slice(0,10).map((l,idx)=>{
        const isMe=l.id===userId;
        const rank=idx+1;
        return (
          <div key={l.id} style={{
            background:isMe?LT:"#fff",
            border:isMe?`2px solid ${G}`:"1px solid #eee",
            borderRadius:14,padding:"12px 16px",
            display:"flex",alignItems:"center",gap:12,
            marginBottom:10,
            boxShadow:rank<=3?"0 2px 12px #0002":"none",
            transform:rank<=3?"scale(1.01)":"none",
            transition:"all .2s"
          }}>
            {/* Rank */}
            <div style={{width:36,textAlign:"center",flexShrink:0}}>
              {rank<=3
                ?<span style={{fontSize:24}}>{medals[idx]}</span>
                :<span style={{fontSize:14,fontWeight:800,color:"#bbb"}}>#{rank}</span>}
            </div>
            {/* Avatar */}
            <div style={{width:36,height:36,borderRadius:"50%",background:isMe?G:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:isMe?"#fff":"#999"}}>
              {l.name?.charAt(0)?.toUpperCase()||"?"}
            </div>
            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:isMe?800:600,color:isMe?G:DK,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {l.name}{isMe?" (You)":""}
              </div>
              <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
                {l.level&&<span style={{fontSize:10,fontWeight:700,color:levelColors[l.level]||"#888"}}>{l.level}</span>}
                {l.streak>0&&<span style={{fontSize:11,color:"#888"}}>🔥{l.streak}</span>}
              </div>
            </div>
            {/* XP */}
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:800,color:G,fontSize:15}}>⭐{isMe?myXp:l.xp}</div>
              {l.peel_avg_score>0&&<div style={{fontSize:10,color:"#aaa"}}>PEEL: {l.peel_avg_score}/20</div>}
            </div>
          </div>
        );
      })}

      {/* Stats */}
      {!loading&&lb.length>0&&(
        <Card style={{background:"#f9fbe7",marginTop:8}}>
          <div style={{fontSize:12,color:"#888",marginBottom:8}}>📊 Leaderboard Stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              ["👥 Students",lb.length],
              ["🏆 Top XP",`${lb[0]?.xp||0} XP`],
              ["📍 Your Rank",myRank?`#${myRank}`:"—"],
              ["⭐ Your XP",`${myXp} XP`],
            ].map(([label,val])=>(
              <div key={label} style={{textAlign:"center",background:"#fff",borderRadius:10,padding:"8px 4px"}}>
                <div style={{fontSize:13,fontWeight:700,color:DK}}>{val}</div>
                <div style={{fontSize:11,color:"#888"}}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══ NOTIFICATION SYSTEM ══ */
const NOTIF_MESSAGES = {
  daily: [
    { title:"✍️ WriteUP UPGC", body:"Your daily English challenge is ready! Keep your streak going 🔥" },
    { title:"📚 Time to learn!", body:"New grammar exercise + word of the day waiting for you." },
    { title:"🎯 Daily challenge!", body:"Complete today's modules and earn XP. Don't break your streak!" },
    { title:"✏️ WriteUP UPGC", body:"5 minutes of English today = big progress this week. Let's go!" },
  ],
  inactive: [
    { title:"😴 We miss you!", body:"You haven't practised English in 2 days. Come back and keep your progress!" },
    { title:"⚠️ Your streak is at risk!", body:"Log in now to save your streak and continue your English journey." },
    { title:"📉 Don't lose your progress!", body:"2 days without practice. Your classmates are moving ahead — come back!" },
  ],
  levelUp: (level) => ({ title:"🏆 Level Up!", body:`Congratulations! You just reached ${level} level. Keep pushing! 🎉` }),
  peelLow: (score) => ({ title:"💪 Keep improving!", body:`Your PEEL score was ${score}/20. Review the feedback and try again — you can do better!` }),
  weekly: [
    { title:"📅 Weekly Challenge!", body:"A new weekly challenge just dropped! Complete all 6 modules this week for bonus XP. 🌟" },
    { title:"🌟 New week, new goals!", body:"This week's challenge: score 15+/20 on your PEEL paragraph. Ready?" },
  ],
};

async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (e) { console.error("SW registration failed:", e); return null; }
}

async function requestNotifPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

function scheduleNotification(sw, { title, body, delayMs }) {
  if (!sw || Notification.permission !== "granted") return;
  sw.active?.postMessage({ type:"SCHEDULE_NOTIFICATION", title, body, delay:delayMs });
}

function showNotificationNow(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon:"/favicon.svg", vibrate:[200,100,200] });
  }
}

function scheduleDailyReminder(sw, timeStr) {
  // timeStr = "HH:MM"
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next - now;
  const msg = NOTIF_MESSAGES.daily[Math.floor(Math.random() * NOTIF_MESSAGES.daily.length)];
  scheduleNotification(sw, { ...msg, delayMs: delay });
  // Store in localStorage for persistence
  localStorage.setItem("writeup_notif_time", timeStr);
}

/* ── Settings ── */
function Settings({user, onLogout, xp, placement}) {
  const [notifPerm, setNotifPerm] = useState(Notification?.permission || "default");
  const [notifTime, setNotifTime] = useState(localStorage.getItem("writeup_notif_time") || "08:00");
  const [notifEnabled, setNotifEnabled] = useState(localStorage.getItem("writeup_notif_enabled") === "true");
  const [swReg, setSwReg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    registerSW().then(reg => setSwReg(reg));
  }, []);

  const enableNotifications = async () => {
    const perm = await requestNotifPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      setNotifEnabled(true);
      localStorage.setItem("writeup_notif_enabled", "true");
      scheduleDailyReminder(swReg, notifTime);
      showNotificationNow("✅ Notifications enabled!", "You'll receive your daily challenge reminder at " + notifTime);
    }
  };

  const saveNotifSettings = () => {
    setSaving(true);
    if (notifEnabled && notifPerm === "granted") {
      scheduleDailyReminder(swReg, notifTime);
      localStorage.setItem("writeup_notif_time", notifTime);
    }
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 500);
  };

  const lvl = getLvl(xp);

  return (
    <div style={{padding:18}}>
      <h3 style={{color:DK,marginBottom:16}}>⚙️ Settings</h3>

      {/* Profile card */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#888",marginBottom:2}}>Logged in as</div>
        <div style={{fontWeight:700,color:DK,fontSize:15}}>{user?.name}</div>
        <div style={{fontSize:13,color:"#888",marginBottom:8}}>{user?.email}</div>
        <div style={{display:"flex",gap:10}}>
          <Tag>{placement?.level||"Beginner"}</Tag>
          <Tag color="#e3f2fd">⭐ {xp} XP</Tag>
          <Tag color={lvl.color==="#ffd700"?"#fffde7":LT}>{lvl.name}</Tag>
        </div>
      </Card>

      {/* 🔔 Notifications */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontWeight:700,color:DK,fontSize:15}}>🔔 Notifications</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>
              {notifPerm==="granted"?"✅ Enabled":notifPerm==="denied"?"❌ Blocked in browser":"Not yet enabled"}
            </div>
          </div>
          {notifPerm!=="granted" && notifPerm!=="denied" && (
            <button onClick={enableNotifications}
              style={{background:G,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              Enable
            </button>
          )}
          {notifPerm==="denied" && (
            <span style={{fontSize:11,color:"#e53935",maxWidth:100,textAlign:"right",lineHeight:1.4}}>Enable in browser settings</span>
          )}
        </div>

        {notifPerm==="granted" && (
          <>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:DK,marginBottom:6}}>⏰ Daily reminder time</div>
              <input type="time" value={notifTime}
                onChange={e=>setNotifTime(e.target.value)}
                style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${G}`,borderRadius:10,padding:"10px 14px",fontSize:15,outline:"none",fontFamily:"inherit",color:DK}} />
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:DK,marginBottom:8}}>📬 Notification types</div>
              {[
                ["daily","📅 Daily challenge reminder","Every day at your chosen time"],
                ["inactive","😴 Inactivity alert","After 2 days without practice"],
                ["peel","💪 PEEL encouragement","After a score below 10/20"],
                ["level","🏆 Level up celebration","When you reach a new level"],
                ["weekly","🌟 Weekly challenge","Every Monday morning"],
              ].map(([key,label,desc])=>{
                const stored = localStorage.getItem(`writeup_notif_${key}`) !== "false";
                return (
                  <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:DK}}>{label}</div>
                      <div style={{fontSize:11,color:"#888"}}>{desc}</div>
                    </div>
                    <button onClick={()=>{
                      const cur=localStorage.getItem(`writeup_notif_${key}`)!=="false";
                      localStorage.setItem(`writeup_notif_${key}`,(!cur).toString());
                    }}
                      style={{background:stored?G:"#e0e0e0",color:stored?"#fff":"#999",border:"none",borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      {stored?"ON":"OFF"}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={saveNotifSettings}
              style={{width:"100%",background:saved?"#e8f5e9":G,color:saved?G:"#fff",border:saved?`1.5px solid ${G}`:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all .3s"}}>
              {saving?"Saving…":saved?"✅ Saved!":"Save Notification Settings"}
            </button>
          </>
        )}
      </Card>

      {/* 📴 Offline */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14,marginBottom:4}}>📴 Offline Mode</div>
        <div style={{fontSize:12,color:"#888",marginBottom:10}}>Grammar and Vocabulary work offline once loaded.</div>
        <button onClick={async()=>{
          if("serviceWorker" in navigator){
            const reg=await navigator.serviceWorker.ready;
            showNotificationNow("✅ Content cached!","Grammar and Vocabulary are now available offline.");
          }
        }} style={{background:LT,color:G,border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          📥 Cache for Offline
        </button>
      </Card>

      {/* Privacy */}
      <Card style={{marginBottom:14,padding:"14px 16px"}}>
        <div style={{fontWeight:600,color:DK,fontSize:14}}>🔒 Privacy</div>
        <div style={{fontSize:12,color:"#888",marginTop:4}}>ARTCI compliance n°2013-450 · Data stored securely on Supabase</div>
      </Card>

      <button onClick={onLogout}
        style={{width:"100%",marginTop:4,background:"#ffebee",color:"#c62828",border:"1.5px solid #ffcdd2",borderRadius:12,padding:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        Log Out
      </button>
    </div>
  );
}
