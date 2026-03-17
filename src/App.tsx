import { useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPA_URL = 'https://qnxeyoxashvbljjmqkrp.supabase.co';
const SUPA_KEY = 'sb_publishable_lgRs4KqlUybNQ--KiZP7BA_m-ntu3CC';
const supabase = createClient(SUPA_URL, SUPA_KEY);

const G = '#2D6A4F',
  LT = '#d8f3dc',
  DK = '#1b4332';
const API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

/* ── helpers ── */
const todayStr = () => new Date().toISOString().slice(0, 10);
const getLvl = (xp) => {
  if (xp < 500) return { name: 'Bronze', color: '#cd7f32', min: 0, next: 500 };
  if (xp < 1500)
    return { name: 'Silver', color: '#9e9e9e', min: 500, next: 1500 };
  if (xp < 3000)
    return { name: 'Gold', color: '#ffd700', min: 1500, next: 3000 };
  return { name: 'Platinum', color: '#4fc3f7', min: 3000, next: 5000 };
};
const Btn = ({ onClick, children, full, secondary, disabled, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: full ? '100%' : 'auto',
      background: secondary ? 'transparent' : G,
      color: secondary ? G : '#fff',
      border: secondary ? `2px solid ${G}` : 'none',
      borderRadius: 12,
      padding: '12px 20px',
      fontWeight: 700,
      fontSize: 14,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      marginTop: 8,
      fontFamily: 'inherit',
      ...style,
    }}
  >
    {children}
  </button>
);
const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 16,
      padding: 18,
      boxShadow: '0 2px 12px #0001',
      ...style,
    }}
  >
    {children}
  </div>
);
const Tag = ({ children, color }) => (
  <span
    style={{
      background: color || LT,
      color: G,
      borderRadius: 8,
      padding: '3px 10px',
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    {children}
  </span>
);
const Loader = ({ text = 'Chargement…' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      gap: 16,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: `4px solid ${LT}`,
        borderTop: `4px solid ${G}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <p style={{ color: G, fontWeight: 600, fontSize: 14 }}>{text}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

async function callAI(prompt, maxTokens = 1200) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || '';
}

/* ══════════════════════════════════════════
   PLACEMENT TEST
══════════════════════════════════════════ */
const PLACEMENT = [
  {
    section: 'Grammar',
    q: "Choose the correct form: 'She ___ to school every day.'",
    opts: ['go', 'goes', 'going', 'gone'],
    ans: 1,
  },
  {
    section: 'Grammar',
    q: "Identify the error: 'The informations are on the table.'",
    opts: ['The', 'informations', 'are', 'table'],
    ans: 1,
  },
  {
    section: 'Grammar',
    q: "'If I ___ rich, I would travel the world.'",
    opts: ['am', 'was', 'were', 'be'],
    ans: 2,
  },
  {
    section: 'Grammar',
    q: 'Choose the correct sentence:',
    opts: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      'She not like coffee.',
    ],
    ans: 2,
  },
  {
    section: 'Grammar',
    q: "'Despite ___ tired, he finished the essay.'",
    opts: ['be', 'being', 'been', 'to be'],
    ans: 1,
  },
  {
    section: 'Vocabulary',
    q: "What does 'analyse' mean?",
    opts: [
      'To ignore',
      'To study carefully',
      'To write quickly',
      'To memorise',
    ],
    ans: 1,
  },
  {
    section: 'Vocabulary',
    q: "'Her essay was well-organised — it was very ___.'",
    opts: ['confusing', 'coherent', 'boring', 'long'],
    ans: 1,
  },
  {
    section: 'Vocabulary',
    q: "'Evidence' in academic writing means:",
    opts: [
      'A feeling',
      'A guess',
      'Facts that support an argument',
      'A question',
    ],
    ans: 2,
  },
  {
    section: 'Vocabulary',
    q: 'Which word is a FALSE FRIEND for French speakers?',
    opts: ['Book', 'Actually', 'Table', 'School'],
    ans: 1,
  },
  {
    section: 'Vocabulary',
    q: "'The study requires ___ data, not just opinions.'",
    opts: ['emotional', 'empirical', 'fictional', 'random'],
    ans: 1,
  },
  {
    section: 'Reading',
    q: "'Okonkwo worked hard to overcome his father's failures.' — Why did he work hard?",
    opts: [
      'To become rich',
      'To travel',
      "To overcome his father's failures",
      'To win a prize',
    ],
    ans: 2,
  },
  {
    section: 'Reading',
    q: "'Education was the light that would lead Njoroge out of poverty.' — Literary device?",
    opts: ['Simile', 'Metaphor', 'Rhyme', 'Alliteration'],
    ans: 1,
  },
  {
    section: 'Reading',
    q: "'Jaja's face was expressionless, but his hand shook.' — This suggests:",
    opts: [
      'He was happy',
      'He was calm',
      'He was hiding emotions',
      'He was cold',
    ],
    ans: 2,
  },
  {
    section: 'Reading',
    q: "In academic texts, a 'glossary' is:",
    opts: [
      'A list of questions',
      'A list of word definitions',
      'A summary',
      'A bibliography',
    ],
    ans: 1,
  },
  {
    section: 'Reading',
    q: "'The researcher concluded that technology improves learning.' — 'Concluded' means:",
    opts: ['Started', 'Wondered', 'Reached a final decision', 'Forgot'],
    ans: 2,
  },
];

function PlacementTest({ onDone }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [scores, setScores] = useState({
    Grammar: 0,
    Vocabulary: 0,
    Reading: 0,
  });
  const [confirmed, setConfirmed] = useState(false);
  const q = PLACEMENT[i];
  const sections = ['Grammar', 'Vocabulary', 'Reading'];
  const sIdx = sections.indexOf(q.section);
  const sIcons = { Grammar: '✏️', Vocabulary: '🔤', Reading: '📖' };
  const sColors = {
    Grammar: '#e3f2fd',
    Vocabulary: '#fff3e0',
    Reading: '#f3e5f5',
  };

  const confirm = () => {
    if (sel === null) return;
    if (sel === q.ans)
      setScores((s) => ({ ...s, [q.section]: s[q.section] + 1 }));
    setConfirmed(true);
  };
  const next = () => {
    if (i < PLACEMENT.length - 1) {
      setI((p) => p + 1);
      setSel(null);
      setConfirmed(false);
    } else {
      const finalScores = { ...scores };
      if (sel === q.ans) finalScores[q.section]++;
      const total =
        finalScores.Grammar + finalScores.Vocabulary + finalScores.Reading;
      const level =
        total >= 11 ? 'Advanced' : total >= 6 ? 'Intermediate' : 'Beginner';
      onDone({ level, scores: finalScores, total });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f7f4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 20,
        fontFamily: "'Segoe UI',sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 16 }}>
          <div style={{ fontSize: 36 }}>🎯</div>
          <h2 style={{ color: DK, margin: '6px 0 2px' }}>Placement Test</h2>
          <p style={{ color: '#888', fontSize: 13 }}>
            15 questions — Find your level
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#888',
              marginBottom: 6,
            }}
          >
            <span>
              Question {i + 1} / {PLACEMENT.length}
            </span>
            <span style={{ color: G, fontWeight: 700 }}>
              {Math.round((i / PLACEMENT.length) * 100)}%
            </span>
          </div>
          <div style={{ background: '#e0e0e0', borderRadius: 99, height: 8 }}>
            <div
              style={{
                background: G,
                height: 8,
                borderRadius: 99,
                width: `${(i / PLACEMENT.length) * 100}%`,
                transition: 'width .4s',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {sections.map((s, si) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      si < sIdx ? G : si === sIdx ? '#81c784' : '#e0e0e0',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: si <= sIdx ? G : '#bbb',
                    fontWeight: si === sIdx ? 700 : 400,
                  }}
                >
                  {sIcons[s]} {s}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Card style={{ marginBottom: 14 }}>
          <div
            style={{
              background: sColors[q.section],
              borderRadius: 8,
              padding: '6px 12px',
              display: 'inline-block',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: DK }}>
              {sIcons[q.section]} {q.section}
            </span>
          </div>
          <p
            style={{
              fontWeight: 600,
              color: DK,
              fontSize: 15,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {q.q}
          </p>
        </Card>
        {q.opts.map((o, oi) => {
          const correct = oi === q.ans,
            picked = oi === sel;
          let bg = '#fff',
            border = '#e0e0e0';
          if (confirmed) {
            if (correct) {
              bg = '#e8f5e9';
              border = G;
            } else if (picked) {
              bg = '#ffebee';
              border = '#e53935';
            }
          } else if (picked) {
            bg = LT;
            border = G;
          }
          return (
            <button
              key={oi}
              onClick={() => !confirmed && setSel(oi)}
              style={{
                display: 'block',
                width: '100%',
                background: bg,
                border: `2px solid ${border}`,
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 10,
                cursor: confirmed ? 'default' : 'pointer',
                textAlign: 'left',
                fontSize: 14,
                fontFamily: 'inherit',
                transition: 'all .2s',
              }}
            >
              {confirmed && correct
                ? '✅ '
                : confirmed && picked && !correct
                ? '❌ '
                : ''}
              {o}
            </button>
          );
        })}
        {!confirmed ? (
          <Btn full disabled={sel === null} onClick={confirm}>
            Confirm Answer
          </Btn>
        ) : (
          <Btn full onClick={next}>
            {i < PLACEMENT.length - 1 ? 'Next →' : 'See My Level 🎯'}
          </Btn>
        )}
      </div>
    </div>
  );
}

function LevelResult({ result, onContinue }) {
  const icons = { Beginner: '🌱', Intermediate: '🌿', Advanced: '🌳' };
  const descs = {
    Beginner:
      'Your daily content will focus on basic grammar, common vocabulary, and simple reading.',
    Intermediate:
      'Your content will challenge you with more complex grammar, academic vocabulary, and analytical reading.',
    Advanced:
      'Your content will push your academic writing, sophisticated vocabulary, and critical reading skills.',
  };
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f7f4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Segoe UI',sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Card style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>
            {icons[result.level]}
          </div>
          <h2 style={{ color: G, fontSize: 24, margin: '0 0 4px' }}>
            Your Level:
          </h2>
          <div
            style={{
              background: LT,
              borderRadius: 12,
              padding: '10px 24px',
              display: 'inline-block',
              margin: '8px 0 12px',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 900, color: DK }}>
              {result.level}
            </span>
          </div>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7 }}>
            {descs[result.level]}
          </p>
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <h4 style={{ color: DK, margin: '0 0 12px' }}>📊 Your Scores</h4>
          {Object.entries(result.scores).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600, color: DK }}>{k}</span>
                <span style={{ color: G, fontWeight: 700 }}>{v} / 5</span>
              </div>
              <div
                style={{ background: '#e8f5e9', borderRadius: 99, height: 8 }}
              >
                <div
                  style={{
                    background: G,
                    height: 8,
                    borderRadius: 99,
                    width: `${(v / 5) * 100}%`,
                    transition: 'width .6s',
                  }}
                />
              </div>
            </div>
          ))}
          <div
            style={{
              borderTop: '1px solid #eee',
              paddingTop: 10,
              marginTop: 4,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 700, color: DK }}>Total</span>
            <span style={{ color: G, fontWeight: 800 }}>
              {result.total} / 15
            </span>
          </div>
        </Card>
        <Btn full onClick={onContinue}>
          Start Learning →
        </Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DAILY AI CONTENT HOOK
══════════════════════════════════════════ */
function useDailyContent(level, moduleId) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const key = `writeup_${moduleId}_${level}_${todayStr()}`;

  useEffect(() => {
    if (!level || !moduleId) return;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setContent(JSON.parse(cached));
      return;
    }
    setLoading(true);
    setError(false);
    const prompts = {
      grammar: `You are an English teacher for ${level} university students in Côte d'Ivoire. Today is ${todayStr()}. Generate a unique grammar exercise. Respond ONLY with valid JSON:\n{"title":"Daily Grammar — [topic]","instruction":"[what to do]","question":"[sentence]","opts":["A","B","C","D"],"ans":0,"explanation":"[why correct]","tip":"[grammar rule]"}`,
      vocabulary: `You are a vocabulary tutor for ${level} students in Côte d'Ivoire. Today is ${todayStr()}. Generate a Word of the Day from the Academic Word List. Respond ONLY with valid JSON:\n{"word":"[word]","phonetic":"[/phonetics/]","french":"[French translation]","partOfSpeech":"[noun/verb/adj]","definition":"[simple definition]","example":"[sentence with ___]","blank":"[the word]","opts":["[word]","[wrong1]","[wrong2]","[wrong3]"],"ans":0,"memory_tip":"[easy way to remember]"}`,
      peel: `You are a writing tutor for ${level} students in Côte d'Ivoire. Today is ${todayStr()}. Generate a unique PEEL topic. Respond ONLY with valid JSON:\n{"title":"[short title]","prompt":"[essay question]","guidance":{"point":"[guidance]","explanation":"[guidance]","evidence":"[guidance]","link":"[guidance]"},"example":{"point":"[model]","explanation":"[model]","evidence":"[model]","link":"[model]"}}`,
      reading: `You are a reading tutor for ${level} students in Côte d'Ivoire. Today is ${todayStr()}. Generate a short passage (5-8 sentences) about an African topic with 3 questions. Respond ONLY with valid JSON:\n{"title":"[title]","topic":"[topic]","passage":"[text]","glossary":[{"word":"[w]","definition":"[d]"},{"word":"[w]","definition":"[d]"},{"word":"[w]","definition":"[d]"}],"questions":[{"q":"[q]","opts":["A","B","C","D"],"ans":0},{"q":"[q]","opts":["A","B","C","D"],"ans":1},{"q":"[q]","opts":["A","B","C","D"],"ans":2}]}`,
      mistakes: `You are an error correction tutor for ${level} French-speaking students in Côte d'Ivoire. Today is ${todayStr()}. Generate a unique mistake lesson. Respond ONLY with valid JSON:\n{"title":"[mistake]","french_pattern":"[French expression]","wrong_english":"[wrong sentence]","correct_english":"[correct sentence]","rule":"[explanation]","extra_examples":[{"wrong":"[w]","right":"[r]"},{"wrong":"[w]","right":"[r]"}]}`,
      quiz: `You are a quiz master for ${level} students in Côte d'Ivoire. Today is ${todayStr()}. Generate 5 quiz questions. Respond ONLY with valid JSON:\n{"questions":[{"q":"[q]","opts":["A","B","C","D"],"ans":0,"exp":"[explanation]"},{"q":"[q]","opts":["A","B","C","D"],"ans":1,"exp":"[exp]"},{"q":"[q]","opts":["A","B","C","D"],"ans":2,"exp":"[exp]"},{"q":"[q]","opts":["A","B","C","D"],"ans":0,"exp":"[exp]"},{"q":"[q]","opts":["A","B","C","D"],"ans":1,"exp":"[exp]"}]}`,
    };
    const p = prompts[moduleId];
    if (!p) {
      setLoading(false);
      return;
    }
    callAI(p)
      .then((text) => {
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        sessionStorage.setItem(key, JSON.stringify(parsed));
        setContent(parsed);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [level, moduleId]);

  return { content, loading, error };
}

/* ══════════════════════════════════════════
   SUPABASE FUNCTIONS
══════════════════════════════════════════ */
async function saveProgress(userId, module, xpEarned) {
  await supabase.from('daily_progress').upsert(
    {
      user_id: userId,
      date: todayStr(),
      module,
      completed: true,
      xp_earned: xpEarned,
    },
    { onConflict: 'user_id,date,module' }
  );
  await supabase
    .from('users')
    .update({ xp: supabase.rpc ? undefined : undefined })
    .eq('id', userId);
  const { data } = await supabase
    .from('users')
    .select('xp')
    .eq('id', userId)
    .single();
  if (data) {
    await supabase
      .from('users')
      .update({ xp: (data.xp || 0) + xpEarned })
      .eq('id', userId);
  }
}

async function checkTodayProgress(userId) {
  const { data } = await supabase
    .from('daily_progress')
    .select('module')
    .eq('user_id', userId)
    .eq('date', todayStr())
    .eq('completed', true);
  return data ? data.map((d) => d.module) : [];
}

async function updateStreak(userId) {
  const { data } = await supabase
    .from('users')
    .select('last_login, streak')
    .eq('id', userId)
    .single();
  if (!data) return;
  const last = new Date(data.last_login);
  const now = new Date();
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  let newStreak = data.streak || 1;
  if (diffDays === 1) newStreak += 1;
  else if (diffDays > 1) newStreak = 1;
  await supabase
    .from('users')
    .update({ last_login: todayStr(), streak: newStreak })
    .eq('id', userId);
  return newStreak;
}

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */
function Landing({ go }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(160deg,${DK} 0%,${G} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        color: '#fff',
        textAlign: 'center',
        fontFamily: "'Segoe UI',sans-serif",
      }}
    >
      <div style={{ fontSize: 60, marginBottom: 10 }}>✍️</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px' }}>
        WriteUP UPGC
      </h1>
      <p style={{ opacity: 0.85, fontSize: 15, marginBottom: 4 }}>
        Academic English for L2 Students
      </p>
      <p style={{ opacity: 0.6, fontSize: 12, marginBottom: 36 }}>
        Université Peleforo Gon Coulibaly · Korhogo, Côte d'Ivoire
      </p>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 40,
        }}
      >
        <button
          onClick={() => go('login')}
          style={{
            background: '#fff',
            color: G,
            border: 'none',
            borderRadius: 12,
            padding: '14px 36px',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Log In
        </button>
        <button
          onClick={() => go('register')}
          style={{
            background: 'transparent',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: 12,
            padding: '14px 36px',
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Sign Up
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 20,
          opacity: 0.7,
          fontSize: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          '🌐 PWA',
          '🆓 Free',
          '🎯 Level Test',
          '🤖 Daily AI',
          '💾 Cloud Save',
        ].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function AuthForm({ mode, onDone, onSwitch }) {
  const [f, setF] = useState({ name: '', email: '', pw: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const upd = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    setErr('');
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: f.email,
          password: f.pw,
        });
        if (error) {
          setErr(error.message);
          setLoading(false);
          return;
        }
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id,
            name: f.name,
            email: f.email,
            xp: 0,
            streak: 1,
            level: 'Beginner',
            placement_done: false,
            last_login: todayStr(),
          });
          onDone({
            id: data.user.id,
            name: f.name,
            email: f.email,
            xp: 0,
            streak: 1,
            level: 'Beginner',
            isNew: true,
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: f.email,
          password: f.pw,
        });
        if (error) {
          setErr('Invalid email or password.');
          setLoading(false);
          return;
        }
        if (data.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          const newStreak = await updateStreak(data.user.id);
          onDone({
            ...profile,
            streak: newStreak || profile?.streak || 1,
            isNew: !profile?.placement_done,
          });
        }
      }
    } catch (e) {
      setErr('Connection error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f7f4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Segoe UI',sans-serif",
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40 }}>✍️</div>
          <h2 style={{ color: G, margin: '8px 0 4px' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: '#888', fontSize: 13 }}>
            WriteUP UPGC — Academic English
          </p>
        </div>
        {mode === 'register' && (
          <input
            placeholder="Full name"
            value={f.name}
            onChange={upd('name')}
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              border: '1.5px solid #e0e0e0',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 12,
              fontSize: 14,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        )}
        <input
          placeholder="Email address"
          type="email"
          value={f.email}
          onChange={upd('email')}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            border: '1.5px solid #e0e0e0',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 12,
            fontSize: 14,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <input
          placeholder="Password (min. 6 characters)"
          type="password"
          value={f.pw}
          onChange={upd('pw')}
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            border: '1.5px solid #e0e0e0',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 12,
            fontSize: 14,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {err && (
          <p style={{ color: '#c62828', fontSize: 13, marginBottom: 8 }}>
            {err}
          </p>
        )}
        {loading ? (
          <Loader
            text={mode === 'login' ? 'Logging in…' : 'Creating account…'}
          />
        ) : (
          <Btn full onClick={submit}>
            {mode === 'login' ? 'Log In' : 'Register & Take Placement Test'}
          </Btn>
        )}
        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#888',
            marginTop: 14,
          }}
        >
          {mode === 'login' ? 'No account? ' : 'Already registered? '}
          <span
            onClick={onSwitch}
            style={{ color: G, cursor: 'pointer', fontWeight: 700 }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </span>
        </p>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
const MODS = [
  {
    id: 'grammar',
    icon: '✏️',
    name: 'Daily Grammar',
    sub: 'New exercise every day',
    xp: 10,
    color: '#e3f2fd',
  },
  {
    id: 'vocabulary',
    icon: '🔤',
    name: 'Word of the Day',
    sub: 'New word every day',
    xp: 5,
    color: '#fff3e0',
  },
  {
    id: 'peel',
    icon: '📝',
    name: 'Daily Writing',
    sub: 'New PEEL topic daily',
    xp: 50,
    color: '#fce4ec',
  },
  {
    id: 'reading',
    icon: '📖',
    name: 'Daily Reading',
    sub: 'New passage every day',
    xp: 20,
    color: '#f3e5f5',
  },
  {
    id: 'mistakes',
    icon: '🇫🇷',
    name: 'Mistake of the Day',
    sub: 'New error lesson daily',
    xp: 10,
    color: '#e0f2f1',
  },
  {
    id: 'quiz',
    icon: '🧪',
    name: 'Daily Quiz',
    sub: '5 fresh questions daily',
    xp: 30,
    color: '#fff8e1',
  },
];

const BADGES_DEF = [
  { icon: '✍️', name: 'First Write', desc: 'Submit your first paragraph' },
  { icon: '🔥', name: 'Streak 7', desc: 'Log in 7 days in a row' },
  { icon: '📐', name: 'Grammar Master', desc: 'Complete 30 grammar exercises' },
  { icon: '📖', name: 'Vocab Champion', desc: 'Learn 30 words' },
  { icon: '🍃', name: 'PEEL Expert', desc: 'Submit 5 PEEL paragraphs' },
  { icon: '🌍', name: 'African Reader', desc: 'Complete 10 reading passages' },
];

export default function WriteUpApp() {
  const [screen, setScreen] = useState('loading');
  const [user, setUser] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [tab, setTab] = useState('home');
  const [activeMod, setActiveMod] = useState(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [doneToday, setDoneToday] = useState([]);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUser(data);
              setXp(data.xp || 0);
              setStreak(data.streak || 1);
              setPlacement({ level: data.level || 'Beginner' });
              loadTodayProgress(data.id);
              loadBadges(data.id);
              setScreen('app');
            } else setScreen('landing');
          });
      } else setScreen('landing');
    });
  }, []);

  const loadTodayProgress = async (uid) => {
    const done = await checkTodayProgress(uid);
    setDoneToday(done);
  };

  const loadBadges = async (uid) => {
    const { data } = await supabase
      .from('user_badges')
      .select('badge_name')
      .eq('user_id', uid);
    setBadges(data ? data.map((d) => d.badge_name) : []);
  };

  const awardBadge = async (badgeName) => {
    if (badges.includes(badgeName)) return;
    await supabase
      .from('user_badges')
      .insert({ user_id: user.id, badge_name: badgeName });
    setBadges((p) => [...p, badgeName]);
  };

  const addXp = async (n, moduleId) => {
    const newXp = xp + n;
    setXp(newXp);
    setDoneToday((p) => [...p, moduleId]);
    if (user?.id) await saveProgress(user.id, moduleId, n);
    // Badge checks
    if (moduleId === 'peel') awardBadge('First Write');
    if (streak >= 7) awardBadge('Streak 7');
  };

  const afterAuth = async (u) => {
    setUser(u);
    setXp(u.xp || 0);
    setStreak(u.streak || 1);
    if (u.isNew && !u.placement_done) setScreen('placement');
    else {
      setPlacement({ level: u.level || 'Beginner' });
      await loadTodayProgress(u.id);
      await loadBadges(u.id);
      setScreen('app');
    }
  };

  const afterPlacement = async (result) => {
    setPlacement(result);
    if (user?.id) {
      await supabase
        .from('users')
        .update({ level: result.level, placement_done: true })
        .eq('id', user.id);
    }
    setScreen('result');
  };

  if (screen === 'loading') return <Loader text="Loading WriteUP UPGC…" />;
  if (screen === 'landing') return <Landing go={setScreen} />;
  if (screen === 'login')
    return (
      <AuthForm
        mode="login"
        onDone={afterAuth}
        onSwitch={() => setScreen('register')}
      />
    );
  if (screen === 'register')
    return (
      <AuthForm
        mode="register"
        onDone={afterAuth}
        onSwitch={() => setScreen('login')}
      />
    );
  if (screen === 'placement') return <PlacementTest onDone={afterPlacement} />;
  if (screen === 'result')
    return (
      <LevelResult result={placement} onContinue={() => setScreen('app')} />
    );

  const lvl = getLvl(xp);
  const pct = Math.round(((xp - lvl.min) / (lvl.next - lvl.min)) * 100);
  const level = placement?.level || 'Beginner';

  return (
    <div
      style={{
        maxWidth: 440,
        margin: '0 auto',
        minHeight: '100vh',
        background: '#f0f7f4',
        fontFamily: "'Segoe UI',sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: G,
          color: '#fff',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>✍️ WriteUP UPGC</div>
          <div style={{ fontSize: 11, opacity: 0.75 }}>
            {user?.name} · {level}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>🔥{streak}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>streak</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>⭐{xp}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>XP</div>
          </div>
          <div
            style={{
              background: lvl.color,
              color: '#000',
              borderRadius: 8,
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {lvl.name}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 70 }}>
        {activeMod ? (
          <ModShell
            mod={activeMod}
            level={level}
            addXp={addXp}
            onBack={() => {
              setActiveMod(null);
              loadTodayProgress(user?.id);
            }}
          />
        ) : tab === 'home' ? (
          <Home
            setMod={setActiveMod}
            xp={xp}
            lvl={lvl}
            pct={pct}
            level={level}
            doneToday={doneToday}
          />
        ) : tab === 'profile' ? (
          <Profile
            user={user}
            xp={xp}
            lvl={lvl}
            pct={pct}
            level={level}
            badges={badges}
            streak={streak}
          />
        ) : tab === 'board' ? (
          <Board userId={user?.id} myXp={xp} />
        ) : (
          <Settings
            user={user}
            onLogout={async () => {
              await supabase.auth.signOut();
              setScreen('landing');
              setUser(null);
            }}
          />
        )}
      </div>

      {!activeMod && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 440,
            background: '#fff',
            borderTop: '1px solid #e8f5e9',
            display: 'flex',
          }}
        >
          {[
            ['home', '🏠', 'Home'],
            ['profile', '👤', 'Profile'],
            ['board', '🏆', 'Ranks'],
            ['settings', '⚙️', 'More'],
          ].map(([t, ic, lb]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '10px 0',
                cursor: 'pointer',
                color: tab === t ? G : '#aaa',
                fontWeight: tab === t ? 800 : 400,
                fontSize: 11,
              }}
            >
              <div style={{ fontSize: 22 }}>{ic}</div>
              {lb}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Home({ setMod, xp, lvl, pct, level, doneToday }) {
  const allDone = doneToday.length >= MODS.length;
  return (
    <div style={{ padding: 18 }}>
      <Card
        style={{
          marginBottom: 14,
          background: `linear-gradient(135deg,${DK},${G})`,
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
          📅 {todayStr()}
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
          {allDone ? '🎉 All done today!' : "Today's Daily Challenges"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {doneToday.length}/{MODS.length} completed · Level: {level}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {MODS.map((m) => (
            <div
              key={m.id}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: doneToday.includes(m.id)
                  ? '#fff'
                  : 'rgba(255,255,255,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              {doneToday.includes(m.id) ? m.icon : '·'}
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            marginBottom: 6,
          }}
        >
          <span style={{ fontWeight: 700, color: G }}>
            {lvl.name} · {level}
          </span>
          <span style={{ color: '#888' }}>
            {xp} / {lvl.next} XP
          </span>
        </div>
        <div style={{ background: '#e8f5e9', borderRadius: 99, height: 10 }}>
          <div
            style={{
              background: G,
              height: 10,
              borderRadius: 99,
              width: `${pct}%`,
              transition: 'width .5s',
            }}
          />
        </div>
        <p style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
          {lvl.next - xp} XP to next level
        </p>
      </Card>
      {MODS.map((m) => (
        <button
          key={m.id}
          onClick={() => !doneToday.includes(m.id) && setMod(m)}
          style={{
            width: '100%',
            background: doneToday.includes(m.id) ? '#f9f9f9' : '#fff',
            border: `1.5px solid ${doneToday.includes(m.id) ? '#e0e0e0' : LT}`,
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: doneToday.includes(m.id) ? 'default' : 'pointer',
            boxShadow: doneToday.includes(m.id) ? 'none' : '0 2px 8px #0001',
            textAlign: 'left',
            marginBottom: 10,
            opacity: doneToday.includes(m.id) ? 0.75 : 1,
          }}
        >
          <div
            style={{
              background: m.color,
              borderRadius: 12,
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {m.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: DK, fontSize: 14 }}>
              {m.name}
            </div>
            <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
              {m.sub}
            </div>
          </div>
          {doneToday.includes(m.id) ? (
            <span
              style={{
                background: '#e8f5e9',
                color: G,
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ✅ Done
            </span>
          ) : (
            <Tag>+{m.xp} XP</Tag>
          )}
        </button>
      ))}
    </div>
  );
}

function ModShell({ mod, level, addXp, onBack }) {
  const earnAndBack = async (xp) => {
    await addXp(xp, mod.id);
  };
  return (
    <div style={{ padding: 18 }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: G,
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back
      </button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            background: mod.color,
            borderRadius: 14,
            width: 52,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
          }}
        >
          {mod.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, color: DK, fontSize: 18 }}>{mod.name}</h2>
          <p style={{ margin: 0, color: '#888', fontSize: 12 }}>{mod.sub}</p>
        </div>
      </div>
      {mod.id === 'grammar' && (
        <DailyGrammar
          level={level}
          addXp={(n) => earnAndBack(n)}
          onBack={onBack}
        />
      )}
      {mod.id === 'vocabulary' && (
        <DailyVocab
          level={level}
          addXp={(n) => earnAndBack(n)}
          onBack={onBack}
        />
      )}
      {mod.id === 'peel' && (
        <DailyPeel
          level={level}
          addXp={(n) => earnAndBack(n)}
          onBack={onBack}
        />
      )}
      {mod.id === 'reading' && (
        <DailyReading
          level={level}
          addXp={(n) => earnAndBack(n)}
          onBack={onBack}
        />
      )}
      {mod.id === 'mistakes' && (
        <DailyMistakes
          level={level}
          addXp={(n) => earnAndBack(n)}
          onBack={onBack}
        />
      )}
      {mod.id === 'quiz' && (
        <DailyQuiz
          level={level}
          addXp={(n) => earnAndBack(n)}
          onBack={onBack}
        />
      )}
    </div>
  );
}

function DoneScreen({ xp, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
      <h2 style={{ color: G }}>Well done!</h2>
      <p style={{ color: '#666' }}>
        You earned <strong style={{ color: G, fontSize: 20 }}>+{xp} XP</strong>
      </p>
      <p style={{ color: '#888', fontSize: 13 }}>
        Progress saved to your account ✅
      </p>
      <Btn full onClick={onBack}>
        ← Back to Modules
      </Btn>
    </div>
  );
}
function ErrorState({ onBack }) {
  return (
    <Card style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
      <p style={{ color: '#666', fontSize: 14 }}>
        Could not load content. Check your connection.
      </p>
      <Btn full onClick={onBack}>
        ← Go Back
      </Btn>
    </Card>
  );
}

/* ── Daily Modules (Grammar, Vocab, Peel, Reading, Mistakes, Quiz) ── */
function DailyGrammar({ level, addXp, onBack }) {
  const { content: c, loading, error } = useDailyContent(level, 'grammar');
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(false);
  const confirmed = sel !== null;
  if (loading) return <Loader text="Generating today's grammar exercise…" />;
  if (error || !c) return <ErrorState onBack={onBack} />;
  if (done) return <DoneScreen xp={10} onBack={onBack} />;
  return (
    <div>
      <Card style={{ background: LT, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#888' }}>📅 Today's Topic</div>
        <div style={{ fontWeight: 800, color: DK, fontSize: 16 }}>
          {c.title}
        </div>
        <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
          {c.instruction}
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <p
          style={{ fontWeight: 600, color: DK, fontSize: 15, lineHeight: 1.7 }}
        >
          {c.question}
        </p>
      </Card>
      {c.opts.map((o, oi) => {
        const correct = oi === c.ans,
          picked = oi === sel;
        let bg = '#fff',
          border = '#e0e0e0';
        if (confirmed) {
          if (correct) {
            bg = '#e8f5e9';
            border = G;
          } else if (picked) {
            bg = '#ffebee';
            border = '#e53935';
          }
        } else if (picked) {
          bg = LT;
          border = G;
        }
        return (
          <button
            key={oi}
            onClick={() => !confirmed && setSel(oi)}
            style={{
              display: 'block',
              width: '100%',
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 10,
              cursor: confirmed ? 'default' : 'pointer',
              textAlign: 'left',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            {confirmed && correct
              ? '✅ '
              : confirmed && picked && !correct
              ? '❌ '
              : ''}
            {o}
          </button>
        );
      })}
      {confirmed && (
        <>
          <Card style={{ background: '#e8f5e9', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: DK, lineHeight: 1.7 }}>
              💡 {c.explanation}
            </p>
          </Card>
          <Card style={{ background: '#e3f2fd', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1565c0' }}>
              📐 {c.tip}
            </p>
          </Card>
          <Btn full onClick={() => setDone(true)}>
            Earn +10 XP →
          </Btn>
        </>
      )}
    </div>
  );
}

function DailyVocab({ level, addXp, onBack }) {
  const { content: c, loading, error } = useDailyContent(level, 'vocabulary');
  const [phase, setPhase] = useState('learn');
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState(false);
  const confirmed = sel !== null;
  if (loading) return <Loader text="Generating today's word…" />;
  if (error || !c) return <ErrorState onBack={onBack} />;
  if (done) return <DoneScreen xp={5} onBack={onBack} />;
  if (phase === 'learn')
    return (
      <div>
        <Card style={{ borderLeft: `4px solid ${G}`, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
            📅 Word of the Day
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <h2 style={{ color: G, margin: '0 0 2px', fontSize: 26 }}>
                {c.word}
              </h2>
              <div style={{ color: '#999', fontSize: 12 }}>
                {c.phonetic} · <em>{c.partOfSpeech}</em>
              </div>
            </div>
            <Tag color="#fff3e0">{c.french}</Tag>
          </div>
          <div
            style={{
              background: '#f9fbe7',
              borderRadius: 10,
              padding: 12,
              margin: '12px 0 0',
            }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              📖 Definition
            </div>
            <p
              style={{
                color: '#333',
                fontSize: 14,
                margin: 0,
                lineHeight: 1.7,
              }}
            >
              {c.definition}
            </p>
          </div>
          <div
            style={{
              background: '#e8f5e9',
              borderRadius: 10,
              padding: 12,
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              🧠 Memory Tip
            </div>
            <p style={{ color: DK, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {c.memory_tip}
            </p>
          </div>
        </Card>
        <Btn full onClick={() => setPhase('practice')}>
          Practice this word →
        </Btn>
      </div>
    );
  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
          Complete the sentence:
        </div>
        <p
          style={{ fontWeight: 600, color: DK, fontSize: 15, lineHeight: 1.7 }}
        >
          {c.example}
        </p>
      </Card>
      {c.opts.map((o, oi) => {
        const correct = oi === c.ans,
          picked = oi === sel;
        let bg = '#fff',
          border = '#e0e0e0';
        if (confirmed) {
          if (correct) {
            bg = '#e8f5e9';
            border = G;
          } else if (picked) {
            bg = '#ffebee';
            border = '#e53935';
          }
        } else if (picked) {
          bg = LT;
          border = G;
        }
        return (
          <button
            key={oi}
            onClick={() => !confirmed && setSel(oi)}
            style={{
              display: 'block',
              width: '100%',
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 10,
              cursor: confirmed ? 'default' : 'pointer',
              textAlign: 'left',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            {confirmed && correct
              ? '✅ '
              : confirmed && picked && !correct
              ? '❌ '
              : ''}
            {o}
          </button>
        );
      })}
      {confirmed && (
        <Btn full onClick={() => setDone(true)}>
          Earn +5 XP →
        </Btn>
      )}
    </div>
  );
}

function DailyPeel({ level, addXp, onBack }) {
  const { content: c, loading, error } = useDailyContent(level, 'peel');
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({
    point: '',
    explanation: '',
    evidence: '',
    link: '',
  });
  const [feedback, setFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [done, setDone] = useState(false);
  const keys = ['point', 'explanation', 'evidence', 'link'];
  const labels = ['📌 Point', '💬 Explanation', '📚 Evidence', '🔗 Link'];
  if (loading) return <Loader text="Generating today's writing topic…" />;
  if (error || !c) return <ErrorState onBack={onBack} />;
  if (done) return <DoneScreen xp={50} onBack={onBack} />;
  const getAI = async () => {
    setAiLoading(true);
    try {
      const txt = await callAI(
        `You are a warm English writing tutor for ${level} students in Côte d'Ivoire. Review this PEEL paragraph:\nTopic: "${c.prompt}"\nPoint: ${vals.point}\nExplanation: ${vals.explanation}\nEvidence: ${vals.evidence}\nLink: ${vals.link}\n\nGive feedback in 4 sentences: (1) praise a strength, (2) identify one grammar issue with correction, (3) suggest improvement for one PEEL section, (4) encouraging closing.`
      );
      setFeedback(txt);
    } catch {
      setFeedback(
        'Great effort! Your paragraph structure is developing well. Keep practising!'
      );
    }
    setAiLoading(false);
  };
  if (feedback)
    return (
      <div>
        <Card style={{ borderLeft: `4px solid ${G}`, marginBottom: 14 }}>
          <h4 style={{ color: G, marginBottom: 10 }}>🤖 AI Tutor Feedback</h4>
          <p style={{ color: '#444', lineHeight: 1.8, fontSize: 14 }}>
            {feedback}
          </p>
        </Card>
        <Card style={{ background: '#f9fbe7', marginBottom: 14 }}>
          <h5 style={{ color: DK, margin: '0 0 8px' }}>📄 Your Paragraph</h5>
          {keys.map(
            (k) =>
              vals[k] && (
                <p
                  key={k}
                  style={{
                    fontSize: 13,
                    color: '#555',
                    margin: '4px 0',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: G }}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}:
                  </strong>{' '}
                  {vals[k]}
                </p>
              )
          )}
        </Card>
        <Btn full onClick={() => setDone(true)}>
          Earn +50 XP 🎉
        </Btn>
      </div>
    );
  return (
    <div>
      <Card style={{ background: LT, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#888' }}>📅 Today's Topic</div>
        <div style={{ fontWeight: 800, color: DK, fontSize: 15, marginTop: 2 }}>
          {c.title}
        </div>
        <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
          {c.prompt}
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {keys.map((k, idx) => (
          <div key={k} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: 5,
                borderRadius: 99,
                background: vals[k] ? G : idx === step ? '#81c784' : '#e0e0e0',
                marginBottom: 4,
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: idx <= step ? G : '#bbb',
                fontWeight: idx === step ? 700 : 400,
              }}
            >
              {k.charAt(0).toUpperCase()}
            </div>
          </div>
        ))}
      </div>
      <h4 style={{ color: G, margin: '0 0 4px' }}>{labels[step]}</h4>
      <p style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
        {c.guidance?.[keys[step]]}
      </p>
      <div
        style={{
          background: '#f0f7f4',
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
          fontSize: 12,
          color: '#555',
          lineHeight: 1.6,
        }}
      >
        <strong>Example:</strong> {c.example?.[keys[step]]}
      </div>
      <textarea
        value={vals[keys[step]]}
        onChange={(e) =>
          setVals((p) => ({ ...p, [keys[step]]: e.target.value }))
        }
        placeholder={`Write your ${keys[step]}…`}
        rows={4}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `1.5px solid ${G}`,
          borderRadius: 12,
          padding: 12,
          fontSize: 14,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <Btn
        full
        disabled={!vals[keys[step]] || aiLoading}
        onClick={() => {
          if (step < 3) setStep((s) => s + 1);
          else getAI();
        }}
      >
        {aiLoading
          ? 'Getting AI Feedback…'
          : step < 3
          ? `Next: ${labels[step + 1]} →`
          : '🤖 Get AI Feedback'}
      </Btn>
    </div>
  );
}

function DailyReading({ level, addXp, onBack }) {
  const { content: c, loading, error } = useDailyContent(level, 'reading');
  const [phase, setPhase] = useState('read');
  const [ans, setAns] = useState([null, null, null]);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  if (loading) return <Loader text="Generating today's reading passage…" />;
  if (error || !c) return <ErrorState onBack={onBack} />;
  if (done) return <DoneScreen xp={20} onBack={onBack} />;
  const score = ans.filter((a, i) => a === c.questions?.[i]?.ans).length;
  if (phase === 'read')
    return (
      <div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            📅 Today's Text · {c.topic}
          </div>
          <h3 style={{ color: G, margin: '0 0 12px' }}>{c.title}</h3>
          <p style={{ lineHeight: 1.9, fontSize: 14, color: '#333' }}>
            {c.passage}
          </p>
        </Card>
        {c.glossary?.length > 0 && (
          <Card style={{ background: '#fff8e1', marginBottom: 14 }}>
            <div
              style={{
                fontWeight: 700,
                color: '#e65100',
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              📖 Glossary
            </div>
            {c.glossary.map((g) => (
              <div
                key={g.word}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 6,
                  fontSize: 13,
                }}
              >
                <strong style={{ color: DK, minWidth: 90 }}>{g.word}</strong>
                <span style={{ color: '#555' }}>{g.definition}</span>
              </div>
            ))}
          </Card>
        )}
        <Btn full onClick={() => setPhase('quiz')}>
          Answer Questions →
        </Btn>
      </div>
    );
  return (
    <div>
      {c.questions?.map((q, qi) => (
        <Card key={qi} style={{ marginBottom: 14 }}>
          <p
            style={{
              fontWeight: 600,
              color: DK,
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            {qi + 1}. {q.q}
          </p>
          {q.opts.map((o, oi) => {
            const correct = oi === q.ans,
              picked = oi === ans[qi];
            let bg = '#f9f9f9',
              border = '#e0e0e0';
            if (checked) {
              if (correct) {
                bg = '#e8f5e9';
                border = G;
              } else if (picked) {
                bg = '#ffebee';
                border = '#e53935';
              }
            } else if (picked) {
              bg = LT;
              border = G;
            }
            return (
              <button
                key={oi}
                onClick={() => {
                  if (!checked)
                    setAns((a) => {
                      const n = [...a];
                      n[qi] = oi;
                      return n;
                    });
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  background: bg,
                  border: `1.5px solid ${border}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 8,
                  cursor: checked ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              >
                {checked && correct
                  ? '✅ '
                  : checked && picked && !correct
                  ? '❌ '
                  : ''}
                {o}
              </button>
            );
          })}
        </Card>
      ))}
      {!checked ? (
        <Btn
          full
          disabled={ans.includes(null)}
          onClick={() => setChecked(true)}
        >
          Check Answers
        </Btn>
      ) : (
        <div>
          <Card
            style={{ background: LT, textAlign: 'center', marginBottom: 14 }}
          >
            <strong style={{ color: G, fontSize: 16 }}>
              {score}/3 correct!
            </strong>
          </Card>
          <Btn full onClick={() => setDone(true)}>
            Earn +20 XP
          </Btn>
        </div>
      )}
    </div>
  );
}

function DailyMistakes({ level, addXp, onBack }) {
  const { content: c, loading, error } = useDailyContent(level, 'mistakes');
  const [done, setDone] = useState(false);
  if (loading) return <Loader text="Generating today's mistake lesson…" />;
  if (error || !c) return <ErrorState onBack={onBack} />;
  if (done) return <DoneScreen xp={10} onBack={onBack} />;
  return (
    <div>
      <Card style={{ borderLeft: `4px solid #ff9800`, marginBottom: 14 }}>
        <Tag color="#fff3e0">{c.title}</Tag>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>🇫🇷</span>
          <span style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
            French: <strong>{c.french_pattern}</strong>
          </span>
        </div>
      </Card>
      <Card style={{ background: '#ffebee', marginBottom: 10 }}>
        <div
          style={{
            fontSize: 12,
            color: '#c62828',
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          ❌ Common Error
        </div>
        <p style={{ color: '#333', fontSize: 14, margin: 0 }}>
          "{c.wrong_english}"
        </p>
      </Card>
      <Card style={{ background: '#e8f5e9', marginBottom: 10 }}>
        <div
          style={{ fontSize: 12, color: G, fontWeight: 700, marginBottom: 6 }}
        >
          ✅ Correct English
        </div>
        <p style={{ color: '#333', fontSize: 14, margin: 0 }}>
          "{c.correct_english}"
        </p>
      </Card>
      <Card style={{ background: '#e3f2fd', marginBottom: 14 }}>
        <div
          style={{
            fontSize: 12,
            color: '#1565c0',
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          📐 Rule
        </div>
        <p style={{ color: '#333', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          {c.rule}
        </p>
      </Card>
      {c.extra_examples?.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: DK,
              marginBottom: 10,
            }}
          >
            More examples:
          </div>
          {c.extra_examples.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: '#c62828' }}>❌ {e.wrong}</div>
              <div style={{ fontSize: 13, color: G }}>✅ {e.right}</div>
            </div>
          ))}
        </Card>
      )}
      <Btn full onClick={() => setDone(true)}>
        Got it! Earn +10 XP
      </Btn>
    </div>
  );
}

function DailyQuiz({ level, addXp, onBack }) {
  const { content: c, loading, error } = useDailyContent(level, 'quiz');
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState(false);
  const [done, setDone] = useState(false);
  if (loading) return <Loader text="Generating today's quiz…" />;
  if (error || !c) return <ErrorState onBack={onBack} />;
  if (done) return <DoneScreen xp={30} onBack={onBack} />;
  const qs = c.questions || [];
  const q = qs[i];
  const confirmed = sel !== null;
  if (review)
    return (
      <div>
        <Card style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 52 }}>
            {score >= 4 ? '🏆' : score >= 2 ? '👏' : '💪'}
          </div>
          <h3 style={{ color: G, margin: '8px 0 4px' }}>Quiz Complete!</h3>
          <p style={{ color: '#666', fontSize: 14 }}>
            Score:{' '}
            <strong style={{ color: G, fontSize: 20 }}>
              {score}/{qs.length}
            </strong>
          </p>
        </Card>
        <Btn full onClick={() => setDone(true)}>
          Claim +30 XP →
        </Btn>
      </div>
    );
  if (!q) return <ErrorState onBack={onBack} />;
  const next = () => {
    if (i < qs.length - 1) {
      setI((p) => p + 1);
      setSel(null);
    } else setReview(true);
  };
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#888',
          marginBottom: 8,
        }}
      >
        <span>
          Q {i + 1}/{qs.length}
        </span>
        <span style={{ color: G, fontWeight: 700 }}>Score: {score}</span>
      </div>
      <div
        style={{
          background: '#e8f5e9',
          borderRadius: 8,
          height: 6,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: G,
            height: 6,
            borderRadius: 8,
            width: `${(i / qs.length) * 100}%`,
            transition: 'width .4s',
          }}
        />
      </div>
      <Card style={{ marginBottom: 14 }}>
        <p
          style={{
            fontWeight: 700,
            color: DK,
            fontSize: 15,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {q.q}
        </p>
      </Card>
      {q.opts.map((o, oi) => {
        const correct = oi === q.ans,
          picked = oi === sel;
        let bg = '#fff',
          border = '#e0e0e0';
        if (confirmed) {
          if (correct) {
            bg = '#e8f5e9';
            border = G;
          } else if (picked) {
            bg = '#ffebee';
            border = '#e53935';
          }
        } else if (picked) {
          bg = LT;
          border = G;
        }
        return (
          <button
            key={oi}
            onClick={() =>
              !confirmed && (setSel(oi), correct && setScore((s) => s + 1))
            }
            style={{
              display: 'block',
              width: '100%',
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 10,
              cursor: confirmed ? 'default' : 'pointer',
              textAlign: 'left',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            {confirmed && correct
              ? '✅ '
              : confirmed && picked && !correct
              ? '❌ '
              : ''}
            {o}
          </button>
        );
      })}
      {confirmed && (
        <>
          <Card style={{ background: '#e8f5e9', marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: DK, lineHeight: 1.7 }}>
              💡 {q.exp}
            </p>
          </Card>
          <Btn full onClick={next}>
            {i < qs.length - 1 ? 'Next →' : 'See Results'}
          </Btn>
        </>
      )}
    </div>
  );
}

function Profile({ user, xp, lvl, pct, level, badges, streak }) {
  return (
    <div style={{ padding: 18 }}>
      <div
        style={{
          background: `linear-gradient(135deg,${DK},${G})`,
          borderRadius: 20,
          padding: 24,
          color: '#fff',
          textAlign: 'center',
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 8 }}>👤</div>
        <div style={{ fontWeight: 900, fontSize: 20 }}>{user?.name}</div>
        <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 6 }}>
          {user?.email}
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,.15)',
            borderRadius: 10,
            padding: '6px 16px',
            display: 'inline-block',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          🎯 {level}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
          {[
            ['⭐', xp, 'XP'],
            ['🔥', streak, 'Streak'],
            ['🏅', lvl.name, 'Level'],
          ].map(([ic, v, lb]) => (
            <div key={lb}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{v}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>{lb}</div>
            </div>
          ))}
        </div>
      </div>
      <h3 style={{ color: DK, marginBottom: 12 }}>🏅 Badges</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {BADGES_DEF.map((b) => {
          const earned = badges.includes(b.name);
          return (
            <div
              key={b.name}
              style={{
                background: earned ? '#fff' : '#f5f5f5',
                borderRadius: 14,
                padding: 14,
                opacity: earned ? 1 : 0.55,
                boxShadow: earned ? '0 2px 8px #0002' : 'none',
              }}
            >
              <div style={{ fontSize: 28 }}>{b.icon}</div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: DK,
                  marginTop: 4,
                }}
              >
                {b.name}
              </div>
              <div style={{ fontSize: 11, color: '#777' }}>{b.desc}</div>
              {!earned && (
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
                  🔒 Locked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Board({ userId, myXp }) {
  const [lb, setLb] = useState([]);
  useEffect(() => {
    supabase
      .from('users')
      .select('id,name,xp')
      .order('xp', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setLb(data);
      });
  }, []);
  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ color: DK, marginBottom: 4 }}>🏆 Leaderboard</h3>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        Top students — Real time
      </p>
      {lb.length === 0 && <Loader text="Loading leaderboard…" />}
      {lb.map((l, idx) => {
        const isMe = l.id === userId;
        const medals = ['🥇', '🥈', '🥉'];
        return (
          <div
            key={l.id}
            style={{
              background: isMe ? LT : '#fff',
              border: isMe ? `2px solid ${G}` : '1px solid #eee',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 22, width: 30, textAlign: 'center' }}>
              {medals[idx] || `#${idx + 1}`}
            </span>
            <div
              style={{
                flex: 1,
                fontWeight: isMe ? 800 : 600,
                color: isMe ? G : DK,
              }}
            >
              {l.name}
              {isMe ? ' (You)' : ''}
            </div>
            <span style={{ fontWeight: 700, color: G }}>
              ⭐ {isMe ? myXp : l.xp}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Settings({ user, onLogout }) {
  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ color: DK, marginBottom: 16 }}>⚙️ Settings</h3>
      <Card style={{ marginBottom: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
          Logged in as
        </div>
        <div style={{ fontWeight: 700, color: DK }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: '#888' }}>{user?.email}</div>
      </Card>
      {[
        ['🔔 Notifications', 'Daily reminder at 8:00 AM'],
        ['📴 Offline Mode', "Download today's content"],
        ['🌐 Language', 'English / Français'],
        ['🔒 Privacy', 'ARTCI compliance n°2013-450'],
      ].map(([t, d]) => (
        <Card
          key={t}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
            padding: '14px 16px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: DK, fontSize: 14 }}>{t}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{d}</div>
          </div>
          <span style={{ color: '#ccc', fontSize: 20 }}>›</span>
        </Card>
      ))}
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          marginTop: 12,
          background: '#ffebee',
          color: '#c62828',
          border: '1.5px solid #ffcdd2',
          borderRadius: 12,
          padding: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Log Out
      </button>
    </div>
  );
}
