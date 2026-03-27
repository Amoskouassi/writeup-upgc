import { useState, useEffect } from "react";

const G = "#2D6A4F", LT = "#d8f3dc", DK = "#1b4332", ACC = "#52b788";

const GRAMMAR_BANK = [
  { q: "She ___ to school every day.", opts: ["go","goes","going","gone"], ans: 1, exp: "Third person singular takes -s: she goes.", tip: "He/She/It → always add -s!" },
  { q: "I have lived here ___ 2010.", opts: ["for","since","during","from"], ans: 1, exp: "'Since' is used with a point in time.", tip: "Since = point in time; For = duration." },
  { q: "There is ___ water in the bottle.", opts: ["a","an","some","many"], ans: 2, exp: "'Water' is uncountable — use 'some'.", tip: "Uncountables: water, advice, information → some/any." },
  { q: "If I ___ rich, I would travel the world.", opts: ["am","was","were","be"], ans: 2, exp: "Second conditional uses 'were' for all subjects.", tip: "If I were you… (not 'was')." },
  { q: "The book ___ written by Achebe.", opts: ["is","was","were","be"], ans: 1, exp: "Past passive: was + past participle.", tip: "Passive = to be + past participle." },
  { q: "She avoided ___ the question.", opts: ["answer","to answer","answering","answered"], ans: 2, exp: "'Avoid' is followed by a gerund (-ing).", tip: "Avoid, enjoy, finish → always use -ing." },
  { q: "I ___ my homework before dinner yesterday.", opts: ["finish","finished","had finished","have finished"], ans: 2, exp: "Past perfect shows an action completed before another past action.", tip: "Had + past participle = past perfect." },
  { q: "___ apple a day keeps the doctor away.", opts: ["A","An","The","—"], ans: 1, exp: "'Apple' starts with a vowel sound → 'An'.", tip: "Use 'an' before vowel sounds: a, e, i, o, u." },
  { q: "Neither the students nor the teacher ___ ready.", opts: ["are","is","were","been"], ans: 1, exp: "With 'neither…nor', the verb agrees with the nearest subject.", tip: "Nearest subject rule: 'teacher' → is." },
  { q: "He said he ___ come tomorrow.", opts: ["will","would","shall","can"], ans: 1, exp: "Reported speech: 'will' becomes 'would'.", tip: "Direct: 'I will come' → Reported: he said he would come." },
  { q: "I'm interested ___ learning new languages.", opts: ["in","at","on","for"], ans: 0, exp: "'Interested in' is the correct collocation.", tip: "Interested IN, good AT, responsible FOR." },
  { q: "She ___ already left when I arrived.", opts: ["has","had","have","was"], ans: 1, exp: "Past perfect: had + past participle.", tip: "Before another past event → use past perfect." },
];

const VOCAB_BANK = [
  { word: "Analyse", ipa: "/ˈænəlaɪz/", fr: "Analyser", def: "To examine in detail in order to understand.", ex: "You must ___ the data carefully.", ans: "analyse", tip: "Think of 'analysis' — breaking things apart to understand them." },
  { word: "Significant", ipa: "/sɪɡˈnɪfɪkənt/", fr: "Important / Significatif", def: "Important enough to have an effect or be noticed.", ex: "There was a ___ improvement in her grades.", ans: "significant", tip: "Signify + cant = worth noting." },
  { word: "Coherent", ipa: "/kəʊˈhɪərənt/", fr: "Cohérent", def: "Logical and consistent; easy to understand.", ex: "Your essay must present a ___ argument.", ans: "coherent", tip: "Co (together) + here: ideas that stick together." },
  { word: "Evidence", ipa: "/ˈevɪdəns/", fr: "Preuve / Évidence", def: "Facts or information indicating whether something is true.", ex: "Provide ___ to support your claim.", ans: "evidence", tip: "⚠️ False friend! 'Évident' in French ≠ obvious evidence." },
  { word: "Conclude", ipa: "/kənˈkluːd/", fr: "Conclure", def: "To arrive at a judgment or opinion by reasoning.", ex: "We can ___ that education is vital.", ans: "conclude", tip: "End with a conclusion that wraps everything up." },
  { word: "Fundamental", ipa: "/ˌfʌndəˈmentl/", fr: "Fondamental", def: "Forming a necessary base or core; essential.", ex: "Reading is a ___ skill for students.", ans: "fundamental", tip: "Fund = foundation = the base of everything." },
  { word: "Illustrate", ipa: "/ˈɪləstreɪt/", fr: "Illustrer / Démontrer", def: "To explain or make clear by using examples.", ex: "This graph helps to ___ the trend.", ans: "illustrate", tip: "Illustrate = show through examples, not just pictures!" },
  { word: "Consequence", ipa: "/ˈkɒnsɪkwəns/", fr: "Conséquence", def: "A result or effect of an action or condition.", ex: "Failing to study has serious ___s.", ans: "consequence", tip: "Con + sequence = what comes after in sequence." },
  { word: "Emphasise", ipa: "/ˈemfəsaɪz/", fr: "Souligner / Mettre en valeur", def: "To give special importance or prominence to.", ex: "The teacher ___d the importance of grammar.", ans: "emphasise", tip: "Put EMPHASIS on key words when speaking." },
  { word: "Relevant", ipa: "/ˈreləvənt/", fr: "Pertinent", def: "Closely connected or appropriate to what is being discussed.", ex: "Always use ___ examples in your essay.", ans: "relevant", tip: "Re + levant = what 'rises' to the level of your argument." },
  { word: "Justify", ipa: "/ˈdʒʌstɪfaɪ/", fr: "Justifier", def: "To show or prove to be right or reasonable.", ex: "You need to ___ your opinion with facts.", ans: "justify", tip: "Justice + fy = making your claim fair and supported." },
  { word: "Approach", ipa: "/əˈprəʊtʃ/", fr: "Approche / Méthode", def: "A way of dealing with something.", ex: "A critical ___ is needed for this essay.", ans: "approach", tip: "Your academic approach = your method of thinking." },
];

const READING_BANK = [
  {
    title: "Education and Development in Africa",
    text: `Education is widely regarded as the cornerstone of development in Africa. Across the continent, governments and international organisations have invested heavily in expanding access to schooling, recognising that an educated population drives economic growth, reduces poverty, and strengthens democratic institutions. In Côte d'Ivoire, for example, the government has made primary education compulsory, leading to significant increases in enrolment rates over the past two decades.\n\nHowever, access alone is insufficient. The quality of education remains a critical challenge. Many schools in rural areas lack qualified teachers, adequate infrastructure, and learning materials. Students who attend under-resourced schools often struggle to develop foundational literacy and numeracy skills. This gap between urban and rural education is a persistent inequality that policymakers must urgently address.\n\nHigher education institutions, such as the Université Peleforo Gon Coulibaly in Korhogo, play a vital role in training the next generation of professionals. By equipping students with academic and critical thinking skills, universities contribute directly to national development. Proficiency in English, as an international language of science and commerce, is increasingly seen as essential for graduates who wish to participate in the global economy.`,
    glossary: { cornerstone: "most important part", compulsory: "obligatory/required", enrolment: "registration in school", infrastructure: "buildings and facilities", foundational: "basic and essential" },
    questions: [
      { q: "Why has Côte d'Ivoire made primary education compulsory?", opts: ["To increase teacher salaries","To drive development and increase enrolment","To reduce university fees","To improve English skills"], ans: 1 },
      { q: "What is the main challenge mentioned regarding education quality?", opts: ["Too many students","Lack of resources in rural schools","No universities","High tuition fees"], ans: 1 },
      { q: "What role does the UPGC play according to the text?", opts: ["Teaching primary school children","Training professionals for national development","Managing rural schools","Publishing textbooks"], ans: 1 },
    ]
  },
  {
    title: "The Power of Reading",
    text: `Reading is one of the most powerful tools available to students seeking academic success. Unlike passive activities such as watching television, reading demands active mental engagement. The reader must decode words, construct meaning, and connect new information to existing knowledge. This process strengthens vocabulary, improves concentration, and develops critical thinking skills that are transferable across all academic disciplines.\n\nResearch consistently demonstrates a strong correlation between reading habits and academic achievement. Students who read regularly outside of class perform better on examinations, write more fluently, and demonstrate greater analytical ability. Furthermore, exposure to diverse texts broadens a student's understanding of the world, fostering empathy and cultural awareness.\n\nDespite these benefits, many students in tertiary education report that they read only when required for assignments. This instrumental approach to reading limits intellectual growth. Academics encourage students to develop a reading habit that goes beyond the curriculum — to explore journals, newspapers, and literature in English as a means of continuous self-improvement.`,
    glossary: { passive: "not active", decode: "understand the meaning", correlation: "relationship between two things", fluently: "smoothly and easily", instrumental: "done only for a practical purpose" },
    questions: [
      { q: "How does reading differ from watching television according to the text?", opts: ["Reading is cheaper","Reading requires active mental engagement","Television is more educational","Reading takes more time"], ans: 1 },
      { q: "What does the text say about students who read regularly?", opts: ["They have less free time","They perform better academically","They read only for assignments","They prefer fiction"], ans: 1 },
      { q: "What does 'instrumental approach to reading' mean in this context?", opts: ["Reading with musical instruments","Reading for pleasure only","Reading only when required for assignments","Reading very quickly"], ans: 2 },
    ]
  },
  {
    title: "Chinua Achebe and African Literature",
    text: `Chinua Achebe, born in 1930 in Nigeria, is widely considered the father of modern African literature in English. His debut novel, Things Fall Apart (1958), challenged the dominant Western narrative that portrayed Africa as primitive and without history. Through the story of Okonkwo, an Igbo leader whose world is disrupted by colonialism, Achebe presented African culture with complexity, dignity, and humanity.\n\nAchebe's significance extends beyond literature. He demonstrated that African writers could use the English language — the language of the coloniser — as a vehicle for authentic African expression. This was a revolutionary act. Rather than abandoning English, Achebe adapted it, infusing it with Igbo proverbs, rhythms, and sensibilities to create a distinctive literary voice.\n\nHis influence on subsequent generations of African writers has been immense. Writers from Côte d'Ivoire, Ghana, Kenya, and across the continent have cited Achebe as an inspiration. His work established that African stories, told by African voices, deserve a central place in world literature. Students of English in Africa study Achebe not merely as a literary figure, but as a symbol of intellectual independence and cultural pride.`,
    glossary: { narrative: "a story or account", colonialism: "control by one country over another", infusing: "filling with a quality", sensibilities: "emotional and aesthetic responses", subsequent: "coming after" },
    questions: [
      { q: "What was revolutionary about Achebe's use of the English language?", opts: ["He invented new English words","He used English to express authentic African culture","He refused to write in English","He translated English texts to Igbo"], ans: 1 },
      { q: "What does Things Fall Apart challenge?", opts: ["Nigerian independence","Western narratives portraying Africa negatively","The Igbo writing system","European colonialism directly"], ans: 1 },
      { q: "Why do African students of English study Achebe?", opts: ["Only for his grammar","As a symbol of cultural pride and intellectual independence","Because he wrote in French","Because he studied at African universities"], ans: 1 },
    ]
  },
  {
    title: "Climate Change and Africa",
    text: `Africa is widely recognised as the continent most vulnerable to the impacts of climate change, despite contributing the least to global greenhouse gas emissions. Rising temperatures, shifting rainfall patterns, and more frequent extreme weather events threaten agricultural productivity, water security, and public health across the continent. In the Sahel region, prolonged droughts have already displaced millions of people, contributing to food insecurity and conflict.\n\nThe scientific consensus, as documented by the Intergovernmental Panel on Climate Change (IPCC), is clear: without significant reductions in carbon emissions globally, Africa will experience increasingly severe consequences. Coastal cities face the threat of rising sea levels, while inland areas contend with desertification and loss of biodiversity.\n\nYet Africa also holds enormous potential for climate solutions. The continent has vast renewable energy resources — solar, wind, and hydropower — that remain largely underdeveloped. Investment in green infrastructure could simultaneously address energy poverty and reduce emissions. Academics argue that African nations must assert their voices in international climate negotiations to ensure that adaptation funding reaches communities most in need. Education plays a vital role in preparing young Africans to understand, communicate, and respond to the climate crisis.`,
    glossary: { vulnerable: "at risk of harm", emissions: "gases released into the atmosphere", desertification: "land becoming desert", adaptation: "adjusting to new conditions", assert: "state or claim confidently" },
    questions: [
      { q: "Why is it ironic that Africa is most vulnerable to climate change?", opts: ["Africa has the most forests","Africa contributes the least to global emissions","Africa is the largest continent","Africa has the most scientists"], ans: 1 },
      { q: "What does the IPCC document?", opts: ["Africa's economic growth","The scientific consensus on climate change","Renewable energy investments","African climate negotiations"], ans: 1 },
      { q: "What role can education play according to the final paragraph?", opts: ["Reducing carbon emissions directly","Preparing youth to understand and respond to climate change","Funding green infrastructure","Training climate negotiators only"], ans: 2 },
    ]
  },
];

const MISTAKES_BANK = [
  { title: "Make vs Do", rule: "Use 'make' for creating/producing. Use 'do' for tasks/activities.", examples: [{ wrong: "I did a mistake.", right: "I made a mistake.", note: "Make: mistake, effort, progress, a decision" }, { wrong: "Can you make this exercise?", right: "Can you do this exercise?", note: "Do: homework, exercise, research, a job" }] },
  { title: "Since vs For", rule: "'Since' = a point in time. 'For' = a duration.", examples: [{ wrong: "I've been here since three hours.", right: "I've been here for three hours.", note: "For = duration: for 3 hours, for years" }, { wrong: "I've lived here for 2010.", right: "I've lived here since 2010.", note: "Since = point: since 2010, since Monday" }] },
  { title: "Actually ≠ Actuellement", rule: "'Actually' means 'in reality / in fact', NOT 'currently/nowadays'.", examples: [{ wrong: "Actually, I study at UPGC. (meaning: currently)", right: "Currently / At the moment, I study at UPGC.", note: "'Actually' corrects a misunderstanding" }, { wrong: "He's actually the director? (surprise)", right: "He's actually the director! (= in reality, he really is)", note: "Actually = 'en réalité', not 'actuellement'" }] },
  { title: "Double Negatives", rule: "English does NOT use double negatives. Use only one negative.", examples: [{ wrong: "I didn't say nothing.", right: "I didn't say anything.", note: "Didn't + nothing = double negative (incorrect)" }, { wrong: "She can't go nowhere.", right: "She can't go anywhere.", note: "Can't + nowhere → can't + anywhere" }] },
  { title: "Assist vs Attend", rule: "'Assist' = to help someone. 'Attend' = to go to an event.", examples: [{ wrong: "I assisted the conference. (meaning: I was there)", right: "I attended the conference.", note: "Attend = participer à (an event)" }, { wrong: "He attended her during the exam.", right: "He assisted her during the exam.", note: "Assist = aider quelqu'un" }] },
  { title: "Uncountable Nouns", rule: "Words like 'information', 'advice', 'knowledge' have NO plural.", examples: [{ wrong: "Can you give me some informations?", right: "Can you give me some information?", note: "Information = uncountable, no -s" }, { wrong: "I need advices from my teacher.", right: "I need advice from my teacher.", note: "Advice, knowledge, furniture — no plural" }] },
  { title: "Present vs Going To", rule: "Use 'going to' for future plans. Present simple ≠ future.", examples: [{ wrong: "Tomorrow I go to Abidjan.", right: "Tomorrow I'm going to Abidjan.", note: "Use going to / will for future actions" }, { wrong: "She study tomorrow.", right: "She is going to study tomorrow.", note: "Present simple cannot express future plans" }] },
];

const PEEL_TOPICS = [
  { id: 1, title: "Technology in Education", prompt: "Discuss how technology can improve the quality of education at UPGC." },
  { id: 2, title: "Gender Equality in Education", prompt: "Why is it important to ensure equal access to education for men and women in Côte d'Ivoire?" },
  { id: 3, title: "Social Media and Students", prompt: "Social media has a negative impact on students' academic performance. Do you agree?" },
  { id: 4, title: "English in Côte d'Ivoire", prompt: "Explain why proficiency in English is increasingly important for students in Côte d'Ivoire." },
];

const PLACEMENT_Q = [
  { section: "Grammar", q: "She ___ to university every day.", opts: ["go","goes","going","gone"], ans: 1 },
  { section: "Grammar", q: "If I ___ you, I would study harder.", opts: ["am","was","were","be"], ans: 2 },
  { section: "Grammar", q: "They ___ the report before the meeting started.", opts: ["finish","finished","had finished","have finished"], ans: 2 },
  { section: "Grammar", q: "There is ___ advice I can give you.", opts: ["a","an","some","many"], ans: 2 },
  { section: "Grammar", q: "The results ___ published last week.", opts: ["is","are","were","be"], ans: 2 },
  { section: "Vocabulary", q: "Which word means 'to examine in detail'?", opts: ["Justify","Analyse","Conclude","Illustrate"], ans: 1 },
  { section: "Vocabulary", q: "'Actually' in English means:", opts: ["Currently/nowadays","In reality/in fact","Usually","Recently"], ans: 1 },
  { section: "Vocabulary", q: "Choose the correct sentence:", opts: ["Give me some informations.","Give me some information.","Give me an information.","Give me informations."], ans: 1 },
  { section: "Vocabulary", q: "I ___ a mistake in my essay.", opts: ["did","made","done","make"], ans: 1 },
  { section: "Vocabulary", q: "Which word means 'logical and consistent'?", opts: ["Relevant","Significant","Coherent","Fundamental"], ans: 2 },
  { section: "Reading", q: "In academic writing, 'evidence' refers to:", opts: ["Personal opinions","Facts that support a claim","Creative ideas","Introductory sentences"], ans: 1 },
  { section: "Reading", q: "A 'PEEL paragraph' stands for:", opts: ["Point, Example, Explain, Link","Point, Explanation, Evidence, Link","Plan, Execute, Edit, Launch","Paragraph, Essay, Edit, List"], ans: 1 },
  { section: "Reading", q: "Which sentence uses the passive voice correctly?", opts: ["The student wrote the essay.","The essay was written by the student.","The essay writing by the student.","The student has writing the essay."], ans: 1 },
  { section: "Reading", q: "Which is an uncountable noun?", opts: ["Chair","Book","Knowledge","Student"], ans: 2 },
  { section: "Reading", q: "Chinua Achebe is known for:", opts: ["French literature","African literature in English","Scientific research","Political speeches"], ans: 1 },
];

const QUIZ_BANK = [
  { q: "Which sentence is correct?", opts: ["I have lived here since 5 years.","I have lived here for 5 years.","I live here since 5 years.","I lived here for 5 years."], ans: 1 },
  { q: "What does 'emphasise' mean?", opts: ["To ignore","To give special importance","To question","To remove"], ans: 1 },
  { q: "Choose the correct form:", opts: ["She can't go nowhere.","She can't go anywhere.","She cannot go no where.","She didn't go nowhere."], ans: 1 },
  { q: "Which word means 'coming after in time'?", opts: ["Previous","Prior","Subsequent","Earlier"], ans: 2 },
  { q: "I need to ___ my argument with facts.", opts: ["justify","make","do","attend"], ans: 0 },
  { q: "'Attend' means:", opts: ["To help someone","To go to an event","To create","To analyse"], ans: 1 },
  { q: "Which is correct passive voice?", opts: ["She written the report.","The report written by her.","The report was written by her.","She was written the report."], ans: 2 },
  { q: "What is the correct collocation?", opts: ["Do a decision","Make a decision","Do progress","Make homework"], ans: 1 },
  { q: "A 'coherent' essay is one that is:", opts: ["Long and detailed","Logical and consistent","Written in French","Full of quotations"], ans: 1 },
  { q: "'Currently' in French is:", opts: ["Actually","Actuellement","Evidemment","Maintenant"], ans: 1 },
  { q: "Which word is UNCOUNTABLE?", opts: ["Problem","Advice","Question","Result"], ans: 1 },
  { q: "He ___ the conference last week.", opts: ["assisted","attended","assisted to","made"], ans: 1 },
  { q: "Tomorrow I ___ to Korhogo.", opts: ["go","goes","am going","went"], ans: 2 },
  { q: "The word 'fundamental' means:", opts: ["Optional","Extra","Basic and essential","Advanced"], ans: 2 },
  { q: "Choose the correct sentence:", opts: ["I didn't say nothing.","I said nothing.","I didn't said nothing.","I not said anything."], ans: 1 },
];

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

const XP_LEVEL = xp => xp >= 3000 ? "Platinum" : xp >= 1500 ? "Gold" : xp >= 500 ? "Silver" : "Bronze";
const LEVEL_COLOR = l => l === "Platinum" ? "#e5e4e2" : l === "Gold" ? "#FFD700" : l === "Silver" ? "#C0C0C0" : "#CD7F32";

const s = (obj) => ({ ...obj });

// ─── Components ───
const Btn = ({ children, onClick, secondary, danger, style = {} }) => (
  <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: danger ? "#e63946" : secondary ? LT : G, color: danger ? "#fff" : secondary ? DK : "#fff", ...style }}>
    {children}
  </button>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px #0001", marginBottom: 16, ...style }}>{children}</div>
);

const Tag = ({ label, color = G }) => (
  <span style={{ background: color + "22", color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{label}</span>
);

const ProgressBar = ({ val, max, color = G }) => (
  <div style={{ background: "#eee", borderRadius: 8, height: 8, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, (val / max) * 100)}%`, height: "100%", background: color, transition: "width 0.4s" }} />
  </div>
);

// ─── Main App ───
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ xp: 0, sessions: 0, streak: 1, grammarAcc: [], vocabAcc: [], quizAcc: [] });
  const [placementDone, setPlacementDone] = useState(false);
  const [placementLevel, setPlacementLevel] = useState(null);

  const addXP = (pts) => setStats(s => ({ ...s, xp: s.xp + pts, sessions: s.sessions + 1 }));

  if (screen === "auth") return <AuthScreen onLogin={(u) => { setUser(u); setScreen("home"); }} />;
  if (screen === "placement") return <PlacementTest onDone={(lvl) => { setPlacementDone(true); setPlacementLevel(lvl); setScreen("home"); }} />;
  if (screen === "grammar") return <GrammarModule onDone={(acc) => { addXP(30); setStats(s => ({ ...s, grammarAcc: [...s.grammarAcc, acc] })); setScreen("home"); }} />;
  if (screen === "vocab") return <VocabModule onDone={(acc) => { addXP(25); setStats(s => ({ ...s, vocabAcc: [...s.vocabAcc, acc] })); setScreen("home"); }} />;
  if (screen === "reading") return <ReadingModule onDone={() => { addXP(35); setScreen("home"); }} />;
  if (screen === "peel") return <PEELModule onDone={() => { addXP(50); setScreen("home"); }} />;
  if (screen === "mistakes") return <MistakesModule onDone={() => { addXP(20); setScreen("home"); }} />;
  if (screen === "quiz") return <QuizModule onDone={(acc) => { addXP(20); setStats(s => ({ ...s, quizAcc: [...s.quizAcc, acc] })); setScreen("home"); }} />;
  if (screen === "stats") return <StatsScreen stats={stats} level={placementLevel} onBack={() => setScreen("home")} />;

  return <HomeScreen user={user} stats={stats} placementDone={placementDone} onPlacement={() => setScreen("placement")} onModule={setScreen} />;
}

// ─── Auth ───
function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const handle = () => {
    if (!email || !pass) return setErr("Please fill all fields.");
    if (tab === "signup" && !name) return setErr("Please enter your name.");
    onLogin({ email, name: name || email.split("@")[0] });
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${DK}, ${G})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>✍️</div>
          <h1 style={{ color: G, margin: "8px 0 4px", fontSize: 26 }}>WriteUP UPGC</h1>
          <p style={{ color: "#888", fontSize: 13 }}>Academic English · Université Peleforo Gon Coulibaly</p>
        </div>
        <div style={{ display: "flex", marginBottom: 20, background: LT, borderRadius: 10, padding: 4 }}>
          {["login", "signup"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, background: tab === t ? G : "transparent", color: tab === t ? "#fff" : DK }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>
        {tab === "signup" && <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={inputSt} />}
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputSt} />
        <input placeholder="Password" type="password" value={pass} onChange={e => setPass(e.target.value)} style={inputSt} />
        {err && <p style={{ color: "red", fontSize: 13 }}>{err}</p>}
        <Btn onClick={handle} style={{ width: "100%", padding: "12px" }}>{tab === "login" ? "Log In" : "Create Account"}</Btn>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: 11, marginTop: 16 }}>Demo mode — no real authentication required</p>
      </div>
    </div>
  );
}
const inputSt = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 12, fontSize: 14, boxSizing: "border-box" };

// ─── Home ───
function HomeScreen({ user, stats, placementDone, onPlacement, onModule }) {
  const lvl = XP_LEVEL(stats.xp);
  const modules = [
    { id: "grammar", icon: "✏️", title: "Daily Grammar", sub: "Practice grammar rules", xp: "+30 XP" },
    { id: "vocab", icon: "🔤", title: "Word of the Day", sub: "Academic vocabulary", xp: "+25 XP" },
    { id: "reading", icon: "📖", title: "Reading Room", sub: "Comprehension passages", xp: "+35 XP" },
    { id: "peel", icon: "📝", title: "Guided Writing", sub: "PEEL paragraph feedback", xp: "+50 XP" },
    { id: "mistakes", icon: "🇫🇷", title: "Common Mistakes", sub: "French-English errors", xp: "+20 XP" },
    { id: "quiz", icon: "🧪", title: "Daily Quiz", sub: "Mixed practice", xp: "+20 XP" },
  ];

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${DK}, ${G})`, padding: "24px 20px 32px", borderRadius: "0 0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: "#a8d5b5", fontSize: 13, margin: 0 }}>Welcome back,</p>
            <h2 style={{ color: "#fff", margin: "4px 0 0", fontSize: 22 }}>{user?.name} 👋</h2>
          </div>
          <button onClick={() => onModule("stats")} style={{ background: "#ffffff22", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 13 }}>📊 Stats</button>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          <div style={{ background: "#ffffff22", borderRadius: 12, padding: "12px 16px", flex: 1, textAlign: "center" }}>
            <p style={{ color: "#a8d5b5", fontSize: 11, margin: 0 }}>LEVEL</p>
            <p style={{ color: LEVEL_COLOR(lvl), fontSize: 18, fontWeight: 800, margin: "4px 0 0" }}>{lvl}</p>
          </div>
          <div style={{ background: "#ffffff22", borderRadius: 12, padding: "12px 16px", flex: 1, textAlign: "center" }}>
            <p style={{ color: "#a8d5b5", fontSize: 11, margin: 0 }}>XP</p>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "4px 0 0" }}>{stats.xp}</p>
          </div>
          <div style={{ background: "#ffffff22", borderRadius: 12, padding: "12px 16px", flex: 1, textAlign: "center" }}>
            <p style={{ color: "#a8d5b5", fontSize: 11, margin: 0 }}>STREAK</p>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "4px 0 0" }}>🔥{stats.streak}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {!placementDone && (
          <Card style={{ background: `linear-gradient(135deg, ${LT}, #b7e4c7)`, border: `2px solid ${G}` }}>
            <p style={{ fontWeight: 700, color: DK, margin: "0 0 4px" }}>🎯 Take your Placement Test!</p>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 12px" }}>Find your starting level before exploring the modules.</p>
            <Btn onClick={onPlacement}>Start Placement Test →</Btn>
          </Card>
        )}

        <h3 style={{ color: DK, margin: "8px 0 12px" }}>Your Modules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {modules.map(m => (
            <button key={m.id} onClick={() => onModule(m.id)} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 16, textAlign: "left", cursor: "pointer", boxShadow: "0 2px 8px #0001" }}>
              <div style={{ fontSize: 28 }}>{m.icon}</div>
              <p style={{ fontWeight: 700, color: DK, fontSize: 14, margin: "8px 0 2px" }}>{m.title}</p>
              <p style={{ color: "#888", fontSize: 11, margin: "0 0 8px" }}>{m.sub}</p>
              <span style={{ background: LT, color: G, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>{m.xp}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Placement Test ───
function PlacementTest({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState(null);
  const q = PLACEMENT_Q[idx];

  const pick = (i) => {
    if (chosen !== null) return;
    const correct = i === q.ans;
    setChosen(i);
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    if (idx + 1 >= PLACEMENT_Q.length) {
      const sc = score + (chosen === q.ans ? 1 : 0);
      const lvl = sc >= 13 ? "Gold" : sc >= 8 ? "Silver" : "Bronze";
      onDone(lvl);
    } else {
      setIdx(i => i + 1);
      setChosen(null);
    }
  };

  return (
    <ModuleWrapper title="Placement Test" icon="🎯" section={q.section} progress={idx + 1} total={PLACEMENT_Q.length}>
      <QuestionBlock q={q} chosen={chosen} onPick={pick} onNext={next} isLast={idx + 1 >= PLACEMENT_Q.length} />
    </ModuleWrapper>
  );
}

// ─── Grammar Module ───
function GrammarModule({ onDone }) {
  const [qs] = useState(() => shuffle(GRAMMAR_BANK).slice(0, 6));
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState(null);
  const q = qs[idx];

  const pick = (i) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.ans) setCorrect(c => c + 1);
  };
  const next = () => {
    if (idx + 1 >= qs.length) onDone(Math.round(((correct + (chosen === q.ans ? 1 : 0)) / qs.length) * 100));
    else { setIdx(i => i + 1); setChosen(null); }
  };

  return (
    <ModuleWrapper title="Daily Grammar" icon="✏️" progress={idx + 1} total={qs.length}>
      <QuestionBlock q={q} chosen={chosen} onPick={pick} onNext={next} isLast={idx + 1 >= qs.length} showExp showTip />
    </ModuleWrapper>
  );
}

// ─── Vocab Module ───
function VocabModule({ onDone }) {
  const [words] = useState(() => shuffle(VOCAB_BANK).slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("learn"); // learn | practice
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [correct, setCorrect] = useState(0);
  const w = words[idx];

  const check = () => {
    const ok = input.trim().toLowerCase() === w.ans.toLowerCase();
    setResult(ok);
    if (ok) setCorrect(c => c + 1);
  };
  const next = () => {
    if (idx + 1 >= words.length) onDone(Math.round((correct / words.length) * 100));
    else { setIdx(i => i + 1); setPhase("learn"); setInput(""); setResult(null); }
  };

  return (
    <ModuleWrapper title="Word of the Day" icon="🔤" progress={idx + 1} total={words.length}>
      {phase === "learn" ? (
        <Card>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <h2 style={{ color: G, fontSize: 28, margin: 0 }}>{w.word}</h2>
            <p style={{ color: "#888", fontStyle: "italic", margin: "4px 0 0" }}>{w.ipa}</p>
            <Tag label={w.fr} color="#6c757d" />
          </div>
          <div style={{ background: LT, borderRadius: 10, padding: 14, margin: "12px 0" }}>
            <p style={{ fontWeight: 700, color: DK, margin: "0 0 4px" }}>Definition:</p>
            <p style={{ color: "#333", margin: 0 }}>{w.def}</p>
          </div>
          <div style={{ background: "#fff8e1", borderRadius: 10, padding: 14, margin: "0 0 12px" }}>
            <p style={{ fontWeight: 700, color: "#a36700", margin: "0 0 4px" }}>💡 Memory Tip:</p>
            <p style={{ color: "#555", margin: 0, fontSize: 13 }}>{w.tip}</p>
          </div>
          <Btn onClick={() => setPhase("practice")} style={{ width: "100%" }}>Practice This Word →</Btn>
        </Card>
      ) : (
        <Card>
          <p style={{ fontWeight: 600, color: DK }}>Fill in the blank:</p>
          <p style={{ fontSize: 16, color: "#333", margin: "0 0 16px", padding: 12, background: LT, borderRadius: 8 }}>{w.ex}</p>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type the word…" style={{ ...inputSt, border: result === null ? "1px solid #ddd" : result ? "2px solid green" : "2px solid red" }} disabled={result !== null} />
          {result === null
            ? <Btn onClick={check} style={{ width: "100%" }}>Check ✓</Btn>
            : <div>
              <div style={{ padding: 12, borderRadius: 8, background: result ? "#d4edda" : "#f8d7da", marginBottom: 12 }}>
                {result ? "✅ Correct!" : `❌ The answer is: ${w.ans}`}
              </div>
              <Btn onClick={next} style={{ width: "100%" }}>Next →</Btn>
            </div>
          }
        </Card>
      )}
    </ModuleWrapper>
  );
}

// ─── Reading Module ───
function ReadingModule({ onDone }) {
  const [passage] = useState(() => READING_BANK[Math.floor(Math.random() * READING_BANK.length)]);
  const [phase, setPhase] = useState("read"); // read | quiz
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [showGloss, setShowGloss] = useState(false);
  const q = passage.questions[idx];

  const pick = (i) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.ans) setScore(s => s + 1);
  };
  const next = () => {
    if (idx + 1 >= passage.questions.length) onDone();
    else { setIdx(i => i + 1); setChosen(null); }
  };

  return (
    <ModuleWrapper title="Reading Room" icon="📖" progress={phase === "quiz" ? idx + 1 : 0} total={passage.questions.length}>
      {phase === "read" ? (
        <div>
          <Card>
            <h3 style={{ color: G, margin: "0 0 12px" }}>{passage.title}</h3>
            {passage.text.split("\n\n").map((para, i) => <p key={i} style={{ color: "#333", lineHeight: 1.7, marginBottom: 12 }}>{para}</p>)}
          </Card>
          <Card>
            <button onClick={() => setShowGloss(!showGloss)} style={{ background: LT, border: "none", color: DK, fontWeight: 700, padding: "8px 16px", borderRadius: 8, cursor: "pointer", width: "100%" }}>
              📚 Glossary {showGloss ? "▲" : "▼"}
            </button>
            {showGloss && (
              <div style={{ marginTop: 12 }}>
                {Object.entries(passage.glossary).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <span style={{ fontWeight: 700, color: G, minWidth: 100 }}>{k}</span>
                    <span style={{ color: "#555", fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Btn onClick={() => setPhase("quiz")} style={{ width: "100%", padding: "12px" }}>Answer Questions →</Btn>
        </div>
      ) : (
        <QuestionBlock q={q} chosen={chosen} onPick={pick} onNext={next} isLast={idx + 1 >= passage.questions.length} />
      )}
    </ModuleWrapper>
  );
}

// ─── PEEL Module with AI ───
function PEELModule({ onDone }) {
  const [topic] = useState(() => PEEL_TOPICS[Math.floor(Math.random() * PEEL_TOPICS.length)]);
  const [point, setPoint] = useState("");
  const [explanation, setExplanation] = useState("");
  const [evidence, setEvidence] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [err, setErr] = useState("");

  const wordCount = (t) => t.trim().split(/\s+/).filter(Boolean).length;
  const total = [point, explanation, evidence, link].join(" ");
  const wc = wordCount(total);

  const submit = async () => {
    if (!point || !explanation || !evidence || !link) return setErr("Please fill all four sections.");
    if (wc < 120) return setErr(`Minimum 120 words required. You have ${wc}.`);
    setErr(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an expert academic English writing coach for university students in Côte d'Ivoire. Score PEEL paragraphs strictly and helpfully. Respond ONLY with valid JSON, no markdown, no extra text.`,
          messages: [{
            role: "user",
            content: `Score this PEEL paragraph on the topic: "${topic.prompt}"\n\nPOINT: ${point}\nEXPLANATION: ${explanation}\nEVIDENCE: ${evidence}\nLINK: ${link}\n\nReturn JSON with keys: point_score (0-25), explanation_score (0-25), evidence_score (0-25), link_score (0-25), grammar_score (0-15, but include in total feedback), total (sum of above 4 only), passed (bool, total>=70), point_feedback, explanation_feedback, evidence_feedback, link_feedback, overall_tip (one actionable tip in English)`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setFeedback(JSON.parse(clean));
    } catch (e) {
      setErr("AI feedback unavailable. Please try again.");
    }
    setLoading(false);
  };

  if (feedback) return (
    <ModuleWrapper title="PEEL Feedback" icon="📝">
      <Card style={{ textAlign: "center", background: feedback.passed ? "#d4edda" : "#f8d7da" }}>
        <p style={{ fontSize: 40, margin: 0 }}>{feedback.passed ? "🎉" : "📚"}</p>
        <h2 style={{ color: feedback.passed ? "#155724" : "#721c24", margin: "8px 0" }}>{feedback.total}/100</h2>
        <p style={{ color: feedback.passed ? "#155724" : "#721c24", fontWeight: 700 }}>{feedback.passed ? "Passed! Well done." : "Keep practising!"}</p>
      </Card>
      {[
        { label: "Point", score: feedback.point_score, max: 25, fb: feedback.point_feedback },
        { label: "Explanation", score: feedback.explanation_score, max: 25, fb: feedback.explanation_feedback },
        { label: "Evidence", score: feedback.evidence_score, max: 25, fb: feedback.evidence_feedback },
        { label: "Link", score: feedback.link_score, max: 25, fb: feedback.link_feedback },
      ].map(({ label, score, max, fb }) => (
        <Card key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <b style={{ color: DK }}>{label}</b>
            <span style={{ color: G, fontWeight: 700 }}>{score}/{max}</span>
          </div>
          <ProgressBar val={score} max={max} />
          <p style={{ color: "#555", fontSize: 13, margin: "8px 0 0" }}>{fb}</p>
        </Card>
      ))}
      <Card style={{ background: "#fff8e1" }}>
        <p style={{ fontWeight: 700, color: "#a36700", margin: "0 0 4px" }}>💡 Top Tip:</p>
        <p style={{ color: "#555", margin: 0, fontSize: 13 }}>{feedback.overall_tip}</p>
      </Card>
      <Btn onClick={onDone} style={{ width: "100%", padding: "12px" }}>Back to Home</Btn>
    </ModuleWrapper>
  );

  return (
    <ModuleWrapper title="Guided Writing" icon="📝">
      <Card style={{ background: LT }}>
        <Tag label="PEEL Paragraph" />
        <p style={{ fontWeight: 700, color: DK, margin: "8px 0 4px" }}>Topic:</p>
        <p style={{ color: "#333", margin: 0, fontSize: 14 }}>{topic.prompt}</p>
      </Card>
      {[
        { label: "P — Point", hint: "State your main argument clearly.", val: point, set: setPoint, placeholder: "Your main claim about the topic…" },
        { label: "E — Explanation", hint: "Explain why your point is true.", val: explanation, set: setExplanation, placeholder: "Develop your reasoning…" },
        { label: "E — Evidence", hint: "Provide an example or fact.", val: evidence, set: setEvidence, placeholder: "Give a specific example or evidence…" },
        { label: "L — Link", hint: "Connect back to the question.", val: link, set: setLink, placeholder: "Conclude by linking back to the question…" },
      ].map(({ label, hint, val, set, placeholder }) => (
        <Card key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <b style={{ color: G }}>{label}</b>
            <span style={{ fontSize: 11, color: "#888" }}>{wordCount(val)} words</span>
          </div>
          <p style={{ color: "#888", fontSize: 12, margin: "0 0 8px" }}>{hint}</p>
          <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder} rows={3} style={{ width: "100%", borderRadius: 8, border: "1px solid #ddd", padding: 10, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
        </Card>
      ))}
      <div style={{ textAlign: "right", color: "#888", fontSize: 13, marginBottom: 8 }}>Total: {wc} words (min. 120)</div>
      {err && <p style={{ color: "red", fontSize: 13 }}>{err}</p>}
      {loading ? <div style={{ textAlign: "center", padding: 20 }}><div style={{ fontSize: 24 }}>⏳</div><p style={{ color: G }}>AI is reviewing your writing…</p></div>
        : <Btn onClick={submit} style={{ width: "100%", padding: "12px" }}>Get AI Feedback ✨</Btn>}
    </ModuleWrapper>
  );
}

// ─── Mistakes Module ───
function MistakesModule({ onDone }) {
  const [idx, setIdx] = useState(0);
  const m = MISTAKES_BANK[idx];
  const next = () => { if (idx + 1 >= MISTAKES_BANK.length) onDone(); else setIdx(i => i + 1); };

  return (
    <ModuleWrapper title="Common Mistakes" icon="🇫🇷" progress={idx + 1} total={MISTAKES_BANK.length}>
      <Card>
        <h3 style={{ color: G, margin: "0 0 8px" }}>{m.title}</h3>
        <div style={{ background: LT, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <p style={{ fontWeight: 700, color: DK, margin: "0 0 4px" }}>📌 Rule:</p>
          <p style={{ margin: 0, color: "#333" }}>{m.rule}</p>
        </div>
        {m.examples.map((ex, i) => (
          <div key={i} style={{ borderLeft: `4px solid ${G}`, paddingLeft: 14, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ color: "red", fontWeight: 700, minWidth: 20 }}>✗</span>
              <span style={{ color: "#c0392b", textDecoration: "line-through" }}>{ex.wrong}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
              <span style={{ color: "green", fontWeight: 700, minWidth: 20 }}>✓</span>
              <span style={{ color: "#155724", fontWeight: 600 }}>{ex.right}</span>
            </div>
            <p style={{ color: "#888", fontSize: 12, margin: 0, fontStyle: "italic" }}>{ex.note}</p>
          </div>
        ))}
      </Card>
      <Btn onClick={next} style={{ width: "100%", padding: "12px" }}>{idx + 1 >= MISTAKES_BANK.length ? "Finish ✓" : "Next Mistake →"}</Btn>
    </ModuleWrapper>
  );
}

// ─── Quiz Module ───
function QuizModule({ onDone }) {
  const [qs] = useState(() => shuffle(QUIZ_BANK).slice(0, 5));
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState(null);
  const q = qs[idx];

  const pick = (i) => {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.ans) setCorrect(c => c + 1);
  };
  const next = () => {
    if (idx + 1 >= qs.length) onDone(Math.round(((correct + (chosen === q.ans ? 1 : 0)) / qs.length) * 100));
    else { setIdx(i => i + 1); setChosen(null); }
  };

  return (
    <ModuleWrapper title="Daily Quiz" icon="🧪" progress={idx + 1} total={qs.length}>
      <QuestionBlock q={q} chosen={chosen} onPick={pick} onNext={next} isLast={idx + 1 >= qs.length} />
    </ModuleWrapper>
  );
}

// ─── Stats Screen ───
function StatsScreen({ stats, level, onBack }) {
  const lvl = XP_LEVEL(stats.xp);
  const nextXP = lvl === "Bronze" ? 500 : lvl === "Silver" ? 1500 : lvl === "Gold" ? 3000 : 9999;
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "16px 16px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: LT, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: DK, fontWeight: 700 }}>← Back</button>
        <h2 style={{ margin: 0, color: DK }}>Your Stats</h2>
      </div>
      <Card style={{ background: `linear-gradient(135deg, ${DK}, ${G})`, color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#a8d5b5", margin: 0, fontSize: 13 }}>Current Level</p>
          <h2 style={{ color: LEVEL_COLOR(lvl), fontSize: 32, margin: "4px 0" }}>{lvl}</h2>
          <p style={{ color: "#ddd", fontSize: 13, margin: 0 }}>{stats.xp} XP / {nextXP === 9999 ? "MAX" : nextXP + " XP"}</p>
          <div style={{ marginTop: 10 }}>
            <ProgressBar val={stats.xp} max={nextXP === 9999 ? stats.xp : nextXP} color={LEVEL_COLOR(lvl)} />
          </div>
          {level && <p style={{ color: "#a8d5b5", fontSize: 12, marginTop: 8 }}>Placement Level: {level}</p>}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Sessions Done", val: stats.sessions, icon: "📚" },
          { label: "Streak", val: `🔥 ${stats.streak} days`, icon: "" },
          { label: "Grammar Avg", val: stats.grammarAcc.length ? avg(stats.grammarAcc) + "%" : "—", icon: "✏️" },
          { label: "Vocab Avg", val: stats.vocabAcc.length ? avg(stats.vocabAcc) + "%" : "—", icon: "🔤" },
          { label: "Quiz Avg", val: stats.quizAcc.length ? avg(stats.quizAcc) + "%" : "—", icon: "🧪" },
          { label: "Total XP", val: stats.xp, icon: "⭐" },
        ].map(({ label, val, icon }) => (
          <Card key={label} style={{ textAlign: "center", padding: 16 }}>
            <p style={{ color: "#aaa", fontSize: 11, margin: 0 }}>{icon} {label.toUpperCase()}</p>
            <p style={{ color: DK, fontWeight: 800, fontSize: 20, margin: "6px 0 0" }}>{val}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Components ───
function ModuleWrapper({ title, icon, progress, total, children }) {
  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 0 32px" }}>
      <div style={{ background: `linear-gradient(135deg, ${DK}, ${G})`, padding: "20px 20px 24px" }}>
        <h2 style={{ color: "#fff", margin: 0 }}>{icon} {title}</h2>
        {progress !== undefined && total && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#a8d5b5", fontSize: 12, marginBottom: 6 }}>
              <span>Question {progress} of {total}</span>
              <span>{Math.round((progress / total) * 100)}%</span>
            </div>
            <ProgressBar val={progress} max={total} color="#52b788" />
          </div>
        )}
      </div>
      <div style={{ padding: "16px 16px 0" }}>{children}</div>
    </div>
  );
}

function QuestionBlock({ q, chosen, onPick, onNext, isLast, showExp, showTip }) {
  return (
    <Card>
      <p style={{ fontWeight: 700, color: DK, fontSize: 16, marginBottom: 16 }}>{q.q}</p>
      {q.opts.map((opt, i) => {
        const picked = chosen === i;
        const correct = i === q.ans;
        let bg = "#f9f9f9", border = "1px solid #eee", color = "#333";
        if (chosen !== null) {
          if (correct) { bg = "#d4edda"; border = "2px solid green"; color = "#155724"; }
          else if (picked) { bg = "#f8d7da"; border = "2px solid red"; color = "#721c24"; }
        }
        return (
          <button key={i} onClick={() => onPick(i)} disabled={chosen !== null} style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", marginBottom: 8, borderRadius: 10, border, background: bg, color, cursor: chosen === null ? "pointer" : "default", fontSize: 14 }}>
            <span style={{ fontWeight: 700, marginRight: 8 }}>{["A","B","C","D"][i]}.</span>{opt}
          </button>
        );
      })}
      {chosen !== null && (
        <div>
          {showExp && q.exp && <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 13, color: "#1b5e20" }}>💡 {q.exp}</div>}
          {showTip && q.tip && <div style={{ background: "#fff8e1", borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 13, color: "#a36700" }}>🎯 {q.tip}</div>}
          <Btn onClick={onNext} style={{ width: "100%", marginTop: 12 }}>{isLast ? "Finish ✓" : "Next →"}</Btn>
        </div>
      )}
    </Card>
  );
}
